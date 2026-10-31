/**
 * GitHub API Fetch & Dynamic DOM Rendering Utility
 * Fetches public repositories for Abu Musa Rohan (@lEVI2889)
 * Maps repository models into frosted-glass HTML grid cards dynamically.
 * Supports caching, parameter customization, data normalization, and fallback resilience.
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.GitHubAPI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_CONFIG = {
    username: 'lEVI2889',
    baseUrl: 'https://api.github.com',
    perPage: 6,
    sort: 'updated',
    direction: 'desc',
    cacheTtlMs: 5 * 60 * 1000 // 5 minutes cache
  };

  /**
   * Escape HTML entities to prevent XSS injection.
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Map language name to decorative emoji icon.
   * @param {string} language
   * @returns {string}
   */
  function getLanguageIcon(language) {
    if (!language) return '📁';
    const normalized = String(language).toLowerCase().trim();
    const map = {
      javascript: '⚡',
      typescript: '🔷',
      python: '🐍',
      c: '⚙️',
      'c++': '⚙️',
      cpp: '⚙️',
      java: '☕',
      kotlin: '📱',
      php: '🐘',
      html: '🎨',
      css: '🎨',
      shell: '🐚',
      bash: '🐚',
      rust: '🦀',
      go: '🐹'
    };
    return map[normalized] || '📦';
  }

  /**
   * Format ISO date string into human-readable Month Year.
   * @param {string} dateString
   * @returns {string}
   */
  function formatDate(dateString) {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch (_) {
      return '';
    }
  }

  /**
   * Normalize and format a single raw GitHub repository item.
   * @param {Object} repo - Raw repository payload from GitHub REST API
   * @returns {Object} Cleaned repository model
   */
  function formatRepoData(repo) {
    if (!repo || typeof repo !== 'object') return null;

    return {
      id: repo.id || Math.floor(Math.random() * 100000),
      name: repo.name || 'Unnamed Repository',
      fullName: repo.full_name || '',
      description: repo.description || 'No description provided.',
      url: repo.html_url || repo.url || `https://github.com/lEVI2889/${repo.name || ''}`,
      homepage: repo.homepage || null,
      stars: typeof repo.stargazers_count === 'number' ? repo.stargazers_count : (repo.stars || 0),
      forks: typeof repo.forks_count === 'number' ? repo.forks_count : (repo.forks || 0),
      language: repo.language || 'Plain Text',
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      updatedAt: repo.updated_at || repo.updatedAt || null,
      pushedAt: repo.pushed_at || repo.pushedAt || null,
      createdAt: repo.created_at || repo.createdAt || null,
      isFork: Boolean(repo.fork || repo.isFork),
      openIssues: repo.open_issues_count || repo.openIssues || 0
    };
  }

  /**
   * Helper to read cached data from sessionStorage (browser-only).
   * @param {string} key
   * @returns {Array|null}
   */
  function getCachedData(key) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (Date.now() - entry.timestamp < entry.ttl) {
          return entry.data;
        }
        window.sessionStorage.removeItem(key);
      }
    } catch (_) {
      // Ignore sessionStorage errors
    }
    return null;
  }

  /**
   * Helper to write cache entry to sessionStorage (browser-only).
   * @param {string} key
   * @param {Array} data
   * @param {number} ttl
   */
  function setCachedData(key, data, ttl) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, JSON.stringify({
          timestamp: Date.now(),
          ttl: ttl,
          data: data
        }));
      }
    } catch (_) {
      // Ignore sessionStorage quota exceeded or storage disabled
    }
  }

  /**
   * Fetches public repositories from the GitHub API.
   *
   * @param {string} [username] - GitHub handle (defaults to 'lEVI2889')
   * @param {Object} [options] - Optional query and filtering options
   * @param {number} [options.perPage=6] - Number of repositories to fetch
   * @param {string} [options.sort='updated'] - Sort field: 'created' | 'updated' | 'pushed' | 'full_name'
   * @param {string} [options.direction='desc'] - Sort order: 'asc' | 'desc'
   * @param {boolean} [options.filterForks=true] - Exclude forked repositories
   * @param {boolean} [options.useCache=true] - Enable sessionStorage caching
   * @returns {Promise<Array<Object>>} Resolves to normalized repository array
   */
  async function fetchGitHubRepos(username, options = {}) {
    const targetUser = username || DEFAULT_CONFIG.username;
    const perPage = options.perPage || DEFAULT_CONFIG.perPage;
    const sort = options.sort || DEFAULT_CONFIG.sort;
    const direction = options.direction || DEFAULT_CONFIG.direction;
    const filterForks = options.filterForks !== undefined ? options.filterForks : true;
    const useCache = options.useCache !== undefined ? options.useCache : true;
    const ttl = options.cacheTtlMs || DEFAULT_CONFIG.cacheTtlMs;

    const cacheKey = `gh_repos_${targetUser}_${perPage}_${sort}_${direction}_${filterForks}`;

    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const queryParams = new URLSearchParams({
      type: 'owner',
      sort: sort,
      direction: direction,
      per_page: String(perPage)
    });

    const endpoint = `${DEFAULT_CONFIG.baseUrl}/users/${encodeURIComponent(targetUser)}/repos?${queryParams.toString()}`;

    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const status = response.status;
      let errorBody = '';
      try {
        const errJson = await response.json();
        errorBody = errJson.message || '';
      } catch (_) {
        errorBody = response.statusText;
      }

      if (status === 403) {
        throw new Error(`GitHub API rate limit exceeded: ${errorBody}`);
      } else if (status === 404) {
        throw new Error(`GitHub user not found: ${targetUser}`);
      } else {
        throw new Error(`GitHub API error (${status}): ${errorBody}`);
      }
    }

    const rawList = await response.json();
    if (!Array.isArray(rawList)) {
      return [];
    }

    let results = rawList;
    if (filterForks) {
      results = results.filter(item => !item.fork);
    }

    const formattedList = results.map(formatRepoData).filter(Boolean);

    if (useCache && formattedList.length > 0) {
      setCachedData(cacheKey, formattedList, ttl);
    }

    return formattedList;
  }

  /**
   * Static fallback repository dataset for offline or rate-limited environments.
   * Matches live portfolio and CV specifications.
   * @returns {Array<Object>}
   */
  function getFallbackRepos() {
    return [
      {
        id: 101,
        name: "FixSquad",
        fullName: "lEVI2889/FixSquad",
        description: "Full-Stack Maintenance & Operations Platform with provider dashboards, automated invoicing, and custom cryptography (ARX hashing, TOTP 2FA, AES-256-GCM, RSA).",
        url: "https://github.com/lEVI2889/FixSquad",
        homepage: null,
        stars: 12,
        forks: 3,
        language: "JavaScript",
        topics: ["react", "nodejs", "mysql", "cryptography"],
        updatedAt: "2026-10-15T12:00:00Z",
        pushedAt: "2026-10-15T12:00:00Z",
        createdAt: "2024-03-01T10:00:00Z",
        isFork: false,
        openIssues: 0
      },
      {
        id: 102,
        name: "Cadence",
        fullName: "lEVI2889/Cadence",
        description: "Native Android music theory and ear-training application with interactive Circle of Fifths and real-time synchronized piano sheet notation rendering.",
        url: "https://github.com/lEVI2889/Cadence",
        homepage: null,
        stars: 9,
        forks: 2,
        language: "Kotlin",
        topics: ["kotlin", "jetpack-compose", "android", "audio-engine"],
        updatedAt: "2026-10-24T18:00:00Z",
        pushedAt: "2026-10-24T18:00:00Z",
        createdAt: "2024-08-10T11:00:00Z",
        isFork: false,
        openIssues: 0
      },
      {
        id: 103,
        name: "EventNexus",
        fullName: "lEVI2889/EventNexus",
        description: "Indoor event management platform with admin/host/customer roles, automated venue clash detection, dynamic PDF ticket issuance, and SQL injection protection.",
        url: "https://github.com/lEVI2889/EventNexus",
        homepage: null,
        stars: 7,
        forks: 1,
        language: "PHP",
        topics: ["php", "mysql", "rbac", "pdf-generation"],
        updatedAt: "2026-09-18T14:20:00Z",
        pushedAt: "2026-09-18T14:20:00Z",
        createdAt: "2024-01-15T09:00:00Z",
        isFork: false,
        openIssues: 0
      },
      {
        id: 104,
        name: "The-Final-Tackle-3D",
        fullName: "lEVI2889/The-Final-Tackle-3D",
        description: "Football-themed arcade game built in Python alongside real-time 3D graphics rendering implementations utilizing OpenGL and matrix transformations.",
        url: "https://github.com/lEVI2889/The-Final-Tackle-3D",
        homepage: null,
        stars: 15,
        forks: 4,
        language: "Python",
        topics: ["python", "opengl", "3d-graphics", "game-dev"],
        updatedAt: "2026-10-02T16:45:00Z",
        pushedAt: "2026-10-02T16:45:00Z",
        createdAt: "2024-06-12T13:30:00Z",
        isFork: false,
        openIssues: 0
      },
      {
        id: 105,
        name: "CryptoSec-Toolkit",
        fullName: "lEVI2889/CryptoSec-Toolkit",
        description: "Pure C/Python Cryptography Suite implementing AES, RSA, SHA hashing, and secure key exchanges from scratch.",
        url: "https://github.com/lEVI2889/CryptoSec-Toolkit",
        homepage: null,
        stars: 18,
        forks: 5,
        language: "C",
        topics: ["cryptography", "security", "algorithms", "c"],
        updatedAt: "2026-09-20T15:30:00Z",
        pushedAt: "2026-09-20T15:30:00Z",
        createdAt: "2024-05-12T08:00:00Z",
        isFork: false,
        openIssues: 1
      },
      {
        id: 106,
        name: "Portfolio-Abu-Musa-Rohan",
        fullName: "lEVI2889/Portfolio-Abu-Musa-Rohan",
        description: "Frosted Glass CS Portfolio & dynamic CV print engine with native zero-dependency design.",
        url: "https://github.com/lEVI2889/Portfolio-Abu-Musa-Rohan",
        homepage: null,
        stars: 24,
        forks: 4,
        language: "JavaScript",
        topics: ["portfolio", "glassmorphism", "resume-engine", "css3"],
        updatedAt: "2026-10-31T22:00:00Z",
        pushedAt: "2026-10-31T22:00:00Z",
        createdAt: "2026-10-20T17:00:00Z",
        isFork: false,
        openIssues: 0
      }
    ];
  }

  /**
   * Generates the semantic HTML markup for a single repository card.
   * Matches the `.repo-card` frosted-glass design tokens.
   * @param {Object} repo - Normalized repository data object
   * @returns {string} HTML markup string
   */
  function createRepoCardHTML(repo) {
    if (!repo) return '';

    const icon = getLanguageIcon(repo.language);
    const title = escapeHTML(repo.name);
    const url = escapeHTML(repo.url || `https://github.com/lEVI2889/${repo.name}`);
    const lang = escapeHTML(repo.language || 'Code');
    const desc = escapeHTML(repo.description || 'Public GitHub repository');
    const dateFormatted = repo.updatedAt ? formatDate(repo.updatedAt) : '';

    const topics = Array.isArray(repo.topics) && repo.topics.length > 0
      ? repo.topics.slice(0, 4)
      : [lang];

    const topicsHtml = topics
      .map(topic => `<span class="tech-tag">${escapeHTML(topic)}</span>`)
      .join('');

    const cloneCommand = repo.url ? `git clone ${escapeHTML(repo.url)}.git` : `git clone https://github.com/lEVI2889/${title}.git`;

    return `
      <article class="glass-panel glass-panel-interactive repo-card" data-repo-id="${escapeHTML(repo.id)}">
        <div class="repo-card-header">
          <div class="repo-name-group">
            <span class="repo-icon">${icon}</span>
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="repo-title">${title}</a>
          </div>
          <span class="repo-lang-pill">${lang}</span>
        </div>
        <p class="repo-desc">${desc}</p>
        <div class="repo-code-preview">
          <code>${cloneCommand}</code>
        </div>
        <div class="repo-footer">
          <div class="repo-metrics">
            <span class="metric-item" title="Stars">⭐ ${repo.stars}</span>
            <span class="metric-item" title="Forks">🍴 ${repo.forks}</span>
            ${dateFormatted ? `<span class="metric-item" title="Updated">🕒 ${dateFormatted}</span>` : ''}
          </div>
          <div class="timeline-chips">
            ${topicsHtml}
          </div>
        </div>
      </article>
    `.trim();
  }

  /**
   * Maps fetched repository data into the DOM grid container dynamically.
   *
   * @param {string|HTMLElement} [target='#github-repos-grid'] - Selector or container element
   * @param {Array<Object>} [customRepos=null] - Optional pre-fetched repositories
   * @returns {Promise<Array<Object>>} Resolves with rendered repository models
   */
  async function renderGitHubRepos(target = '#github-repos-grid', customRepos = null) {
    if (typeof document === 'undefined') return [];

    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) {
      console.warn(`[GitHubAPI] Target grid container "${target}" not found.`);
      return [];
    }

    const telemetryEl = document.getElementById('repo-telemetry') || document.getElementById('projects-telemetry');
    if (telemetryEl) {
      telemetryEl.textContent = 'Syncing GitHub API...';
    }

    let repos = customRepos;
    let isFallback = false;

    if (!repos) {
      try {
        repos = await fetchGitHubRepos('lEVI2889', { perPage: 6, sort: 'updated' });
      } catch (err) {
        console.warn('[GitHubAPI] API request failed; falling back to curated repo dataset:', err.message);
        repos = getFallbackRepos();
        isFallback = true;
      }
    }

    if (!Array.isArray(repos) || repos.length === 0) {
      repos = getFallbackRepos();
      isFallback = true;
    }

    // Map repository data into DOM cards dynamically
    const cardsHtml = repos.map(createRepoCardHTML).join('\n');
    container.innerHTML = cardsHtml;

    // Update live telemetry badge
    if (telemetryEl) {
      telemetryEl.textContent = isFallback
        ? `Offline Cache • ${repos.length} Repositories`
        : `Live GitHub Synced • ${repos.length} Repositories`;
    }

    return repos;
  }

  /**
   * Initialize dynamic rendering upon DOM readiness.
   */
  function initGitHubRepos() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const run = () => {
      renderGitHubRepos('#github-repos-grid');
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }

  // Auto-initialize when running in browser
  if (typeof window !== 'undefined') {
    initGitHubRepos();
  }

  return {
    DEFAULT_CONFIG,
    escapeHTML,
    getLanguageIcon,
    formatDate,
    formatRepoData,
    fetchGitHubRepos,
    getFallbackRepos,
    createRepoCardHTML,
    renderGitHubRepos,
    initGitHubRepos
  };
});

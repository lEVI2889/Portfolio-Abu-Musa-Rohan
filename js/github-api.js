/**
 * GitHub API Fetch Utility
 * Fetches public repositories for Abu Musa Rohan (@lEVI2889)
 * Supports caching, parameter customization, and data normalization.
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
   * Normalize and format a single raw GitHub repository item.
   * @param {Object} repo - Raw repository payload from GitHub REST API
   * @returns {Object} Cleaned repository model
   */
  function formatRepoData(repo) {
    if (!repo || typeof repo !== 'object') return null;

    return {
      id: repo.id,
      name: repo.name || 'Unnamed Repository',
      fullName: repo.full_name || '',
      description: repo.description || 'No description provided.',
      url: repo.html_url || '',
      homepage: repo.homepage || null,
      stars: typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0,
      forks: typeof repo.forks_count === 'number' ? repo.forks_count : 0,
      language: repo.language || 'Plain Text',
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      updatedAt: repo.updated_at || null,
      pushedAt: repo.pushed_at || null,
      createdAt: repo.created_at || null,
      isFork: Boolean(repo.fork),
      openIssues: repo.open_issues_count || 0
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
   * @returns {Array<Object>}
   */
  function getFallbackRepos() {
    return [
      {
        id: 101,
        name: "FixSquad",
        fullName: "lEVI2889/FixSquad",
        description: "Full-Stack Maintenance & Operations Platform built with React, Node.js, Express, and MySQL.",
        url: "https://github.com/lEVI2889",
        homepage: null,
        stars: 12,
        forks: 3,
        language: "JavaScript",
        topics: ["react", "nodejs", "mysql", "fullstack"],
        updatedAt: "2026-10-15T12:00:00Z",
        pushedAt: "2026-10-15T12:00:00Z",
        createdAt: "2024-03-01T10:00:00Z",
        isFork: false,
        openIssues: 0
      },
      {
        id: 102,
        name: "CryptoSec-Toolkit",
        fullName: "lEVI2889/CryptoSec-Toolkit",
        description: "Pure C/Python Cryptography Suite implementing AES, RSA, SHA hashing, and secure key exchanges from scratch.",
        url: "https://github.com/lEVI2889",
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
        id: 103,
        name: "Portfolio-Abu-Musa-Rohan",
        fullName: "lEVI2889/Portfolio-Abu-Musa-Rohan",
        description: "Frosted Glass CS Portfolio & dynamic CV print engine with native zero-dependency design.",
        url: "https://github.com/lEVI2889/Portfolio-Abu-Musa-Rohan",
        homepage: null,
        stars: 24,
        forks: 4,
        language: "JavaScript",
        topics: ["portfolio", "glassmorphism", "resume-engine", "css3"],
        updatedAt: "2026-10-30T22:00:00Z",
        pushedAt: "2026-10-30T22:00:00Z",
        createdAt: "2026-10-20T17:00:00Z",
        isFork: false,
        openIssues: 0
      }
    ];
  }

  return {
    DEFAULT_CONFIG,
    formatRepoData,
    fetchGitHubRepos,
    getFallbackRepos
  };
});

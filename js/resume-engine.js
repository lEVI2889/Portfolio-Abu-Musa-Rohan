/**
 * Resume Engine - Decoupled Data Parser & Dynamic DOM Template Injector
 * Parses raw portfolio data into structured models and injects them into
 * the CV template DOM (#cv-print-template) for print and screen rendering.
 *
 * Supports browser (window.ResumeEngine) and Node.js environments.
 */

(function (global) {
  'use strict';

  /**
   * Helper: safely retrieves source data object.
   * Checks passed argument first, falls back to global portfolioData.
   * @param {Object} [customData]
   * @returns {Object}
   */
  function resolveSourceData(customData) {
    if (customData && typeof customData === 'object') {
      return customData;
    }
    if (typeof portfolioData !== 'undefined' && portfolioData) {
      return portfolioData;
    }
    if (typeof global !== 'undefined' && global.portfolioData) {
      return global.portfolioData;
    }
    return {};
  }

  /**
   * Helper: safe string sanitization and fallback.
   * @param {*} val
   * @param {string} [fallback='']
   * @returns {string}
   */
  function safeString(val, fallback = '') {
    if (val === null || val === undefined) return fallback;
    return String(val).trim();
  }

  /**
   * Helper: escape HTML characters to prevent XSS.
   * @param {*} val
   * @returns {string}
   */
  function escapeHtml(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Helper: cleans phone string for tel: href.
   * @param {string} phone
   * @returns {string}
   */
  function formatTelHref(phone) {
    if (!phone) return '';
    return 'tel:' + phone.replace(/[^\d+]/g, '');
  }

  /**
   * Helper: cleans email string for mailto: href.
   * @param {string} email
   * @returns {string}
   */
  function formatMailtoHref(email) {
    if (!email) return '';
    return 'mailto:' + email.trim();
  }

  /**
   * Parses Identity information from source data.
   * @param {Object} [source]
   * @returns {Object} Normalized identity model
   */
  function parseIdentity(source) {
    const data = resolveSourceData(source);
    const p = data.personal || {};

    const fullName = safeString(p.name, 'Abu Musa Rohan');
    const nameParts = fullName.split(' ');
    const firstName = safeString(p.firstName, nameParts.slice(0, -1).join(' ').toUpperCase() || 'ABU MUSA');
    const lastName = safeString(p.lastName, nameParts.slice(-1).join(' ').toUpperCase() || 'ROHAN');

    return {
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      title: safeString(p.title, 'Generative AI Executive · Full-Stack Developer'),
      headline: safeString(p.headline, p.title || 'Generative AI Executive & Full-Stack Developer'),
      location: safeString(p.location || p.address, 'Dhaka, Bangladesh'),
      phone: safeString(p.phone),
      phoneHref: formatTelHref(p.phone),
      email: safeString(p.email),
      emailHref: formatMailtoHref(p.email),
      github: safeString(p.github, 'github.com/lEVI2889'),
      githubUrl: safeString(p.githubUrl, 'https://github.com/lEVI2889'),
      linkedin: safeString(p.linkedin, 'linkedin.com/in/abumusarohan'),
      linkedinUrl: safeString(p.linkedinUrl, 'https://linkedin.com/in/abumusarohan'),
      freelancer: safeString(p.freelancer, 'freelancer.com/u/rohan5689'),
      freelancerUrl: safeString(p.freelancerUrl, 'https://www.freelancer.com/u/rohan5689'),
      twitter: safeString(p.twitter, '@levi_ack89'),
      twitterUrl: safeString(p.twitterUrl, 'https://x.com/levi_ack89'),
      profileImage: safeString(p.profileImage, 'assets/Professional Pic Rohan_org shirt.png'),
      bio: safeString(p.bio)
    };
  }

  /**
   * Parses Work Experience items from source data.
   * @param {Object} [source]
   * @returns {Array<Object>} Normalized array of experience entries
   */
  function parseExperience(source) {
    const data = resolveSourceData(source);
    const expList = Array.isArray(data.experience) ? data.experience : [];

    return expList.map((item, index) => {
      const bullets = Array.isArray(item.bullets)
        ? item.bullets.map(b => safeString(b)).filter(Boolean)
        : [];

      return {
        id: `exp-${index + 1}`,
        role: safeString(item.role),
        company: safeString(item.company),
        type: safeString(item.type),
        period: safeString(item.period),
        location: safeString(item.location),
        bullets: bullets
      };
    });
  }

  /**
   * Parses Education entries from source data.
   * @param {Object} [source]
   * @returns {Array<Object>} Normalized array of education entries
   */
  function parseEducation(source) {
    const data = resolveSourceData(source);
    const eduList = Array.isArray(data.education) ? data.education : [];

    return eduList.map((item, index) => {
      return {
        id: `edu-${index + 1}`,
        degree: safeString(item.degree),
        institution: safeString(item.institution),
        period: safeString(item.period),
        location: safeString(item.location),
        details: safeString(item.details)
      };
    });
  }

  /**
   * Parses Skills from source data.
   * @param {Object} [source]
   * @returns {Array<string>} Clean array of technical skills
   */
  function parseSkills(source) {
    const data = resolveSourceData(source);
    const skillsList = Array.isArray(data.skills) ? data.skills : [];

    return skillsList
      .map(s => safeString(s))
      .filter(Boolean);
  }

  /**
   * Parses Featured Projects from source data.
   * @param {Object} [source]
   * @returns {Array<Object>} Normalized projects array
   */
  function parseProjects(source) {
    const data = resolveSourceData(source);
    const projList = Array.isArray(data.projects) ? data.projects : [];

    return projList.map((item, index) => {
      const bullets = Array.isArray(item.bullets)
        ? item.bullets.map(b => safeString(b)).filter(Boolean)
        : [];

      return {
        id: `proj-${index + 1}`,
        name: safeString(item.name),
        technologies: safeString(item.technologies),
        period: safeString(item.period),
        details: safeString(item.details),
        bullets: bullets
      };
    });
  }

  /**
   * Parses Spoken Languages from source data.
   * @param {Object} [source]
   * @returns {Array<Object>} Normalized languages array [{ name, level }]
   */
  function parseLanguages(source) {
    const data = resolveSourceData(source);
    const langList = Array.isArray(data.languages) ? data.languages : [];

    return langList.map(item => ({
      name: safeString(item.name),
      level: safeString(item.level, 'Fluent')
    })).filter(l => Boolean(l.name));
  }

  /**
   * Master Parser: extracts and returns all resume sections.
   * @param {Object} [source]
   * @returns {Object} Complete structured resume model
   */
  function parseResumeData(source) {
    const data = resolveSourceData(source);
    return {
      identity: parseIdentity(data),
      experience: parseExperience(data),
      education: parseEducation(data),
      skills: parseSkills(data),
      projects: parseProjects(data),
      languages: parseLanguages(data),
      meta: {
        parsedAt: new Date().toISOString(),
        version: '1.1.0'
      }
    };
  }

  /* ==========================================================================
     DOM Template Injection & Mapping Functions (#cv-print-template)
     ========================================================================== */

  /**
   * Generates Header region HTML.
   * @param {Object} identity
   * @returns {string}
   */
  function generateHeaderHTML(identity) {
    return `
      <header class="cv-header-area">
        <div class="cv-name-block">
          <h1 class="cv-name-row">${escapeHtml(identity.firstName)}</h1>
          <h1 class="cv-name-sub">${escapeHtml(identity.lastName)}</h1>
          <p class="cv-tagline-text">${escapeHtml(identity.title)}</p>
        </div>
        <div class="top-right-navy-curve" aria-hidden="true"></div>
        <div class="avatar-arch-container">
          <img src="${escapeHtml(identity.profileImage)}" alt="${escapeHtml(identity.name)}" class="avatar-arch-img">
        </div>
      </header>
    `.trim();
  }

  /**
   * Generates Dark Navy Sidebar region HTML.
   * @param {Object} identity
   * @param {Array<string>} skills
   * @param {Array<Object>} languages
   * @returns {string}
   */
  function generateSidebarHTML(identity, skills, languages) {
    const contactRows = [];

    if (identity.phone) {
      contactRows.push(`
        <a href="${escapeHtml(identity.phoneHref)}" class="contact-row" title="Phone">
          <span class="contact-icon-pill">📞</span>
          <span class="contact-text">${escapeHtml(identity.phone)}</span>
        </a>
      `);
    }

    if (identity.email) {
      contactRows.push(`
        <a href="${escapeHtml(identity.emailHref)}" class="contact-row" title="Email">
          <span class="contact-icon-pill">✉</span>
          <span class="contact-text">${escapeHtml(identity.email)}</span>
        </a>
      `);
    }

    if (identity.github) {
      contactRows.push(`
        <a href="${escapeHtml(identity.githubUrl)}" target="_blank" rel="noopener noreferrer" class="contact-row" title="GitHub">
          <span class="contact-icon-pill">⌥</span>
          <span class="contact-text">${escapeHtml(identity.github)}</span>
        </a>
      `);
    }

    if (identity.linkedin) {
      contactRows.push(`
        <a href="${escapeHtml(identity.linkedinUrl)}" target="_blank" rel="noopener noreferrer" class="contact-row" title="LinkedIn">
          <span class="contact-icon-pill">⌘</span>
          <span class="contact-text">${escapeHtml(identity.linkedin)}</span>
        </a>
      `);
    }

    if (identity.freelancer) {
      contactRows.push(`
        <a href="${escapeHtml(identity.freelancerUrl)}" target="_blank" rel="noopener noreferrer" class="contact-row" title="Freelancer.com">
          <span class="contact-icon-pill">⚡</span>
          <span class="contact-text">${escapeHtml(identity.freelancer)}</span>
        </a>
      `);
    }

    if (identity.location) {
      contactRows.push(`
        <div class="contact-row" title="Location">
          <span class="contact-icon-pill">📍</span>
          <span class="contact-text">${escapeHtml(identity.location)}</span>
        </div>
      `);
    }

    const skillsItems = (skills || [])
      .map(s => `<li>${escapeHtml(s)}</li>`)
      .join('\n              ');

    const languageItems = (languages || [])
      .map(l => `
        <div class="language-text-item">
          <span class="language-name">${escapeHtml(l.name)}</span>
          <span class="language-level">${escapeHtml(l.level)}</span>
        </div>
      `).join('');

    return `
      <aside class="cv-sidebar">
        <section class="sidebar-section">
          <h2 class="sidebar-title">About Me</h2>
          <p class="sidebar-body-text">
            ${escapeHtml(identity.bio)}
          </p>
        </section>

        <section class="sidebar-section">
          <h2 class="sidebar-title">Contact</h2>
          <div class="contact-items-list">
            ${contactRows.join('\n            ')}
          </div>
        </section>

        <section class="sidebar-section">
          <h2 class="sidebar-title">Skills</h2>
          <ul class="skills-bullet-list">
            ${skillsItems}
          </ul>
        </section>

        <section class="sidebar-section" style="margin-top: auto;">
          <h2 class="sidebar-title">Languages</h2>
          <div class="languages-text-list">
            ${languageItems}
          </div>
        </section>
      </aside>
    `.trim();
  }

  /**
   * Generates White Main Content region HTML.
   * @param {Array<Object>} experience
   * @param {Array<Object>} projects
   * @param {Array<Object>} education
   * @returns {string}
   */
  function generateMainContentHTML(experience, projects, education) {
    const expBlocks = (experience || []).map(exp => {
      const typeHtml = exp.type
        ? `<div style="font-family: var(--font-cv-display); font-size: 0.675rem; font-weight: 600; color: #475569; margin-top: -0.1rem; margin-bottom: 0.15rem;">${escapeHtml(exp.type)}</div>`
        : '';
      const bulletsHtml = (exp.bullets && exp.bullets.length)
        ? `<ul class="cv-entry-bullets">${exp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';

      return `
        <div class="cv-entry-block">
          <h3 class="cv-entry-subheading">${escapeHtml(exp.role)}</h3>
          <div class="cv-entry-meta-row">
            <span class="cv-entry-org">${escapeHtml(exp.company)}</span>
            <span class="cv-entry-date">${escapeHtml(exp.period)}</span>
          </div>
          ${typeHtml}
          ${bulletsHtml}
        </div>
      `;
    }).join('');

    const projectCards = (projects || []).slice(0, 3).map(proj => {
      const desc = proj.details || (proj.bullets && proj.bullets[0]) || '';
      return `
        <div class="project-column-item">
          <h3 class="project-title">${escapeHtml(proj.name)}</h3>
          <span class="project-role-tech">${escapeHtml(proj.technologies)}</span>
          <span style="font-family: var(--font-cv-display); font-size: 0.64rem; font-weight: 600; color: #64748b; margin-bottom: 0.15rem;">${escapeHtml(proj.period)}</span>
          <p class="project-desc-text">
            ${escapeHtml(desc)}
          </p>
        </div>
      `;
    }).join('');

    const eduBlocks = (education || []).map(edu => {
      const detailsHtml = edu.details
        ? `<ul class="cv-entry-bullets"><li>${escapeHtml(edu.details)}</li></ul>`
        : '';

      return `
        <div class="cv-entry-block">
          <h3 class="cv-entry-subheading">${escapeHtml(edu.degree)}</h3>
          <div class="cv-entry-meta-row">
            <span class="cv-entry-org">${escapeHtml(edu.institution)}</span>
            <span class="cv-entry-date">${escapeHtml(edu.period)}</span>
          </div>
          ${detailsHtml}
        </div>
      `;
    }).join('');

    return `
      <main class="cv-main-content">
        <section>
          <div class="pill-header-row">
            <h2 class="pill-header-badge">Experience</h2>
            <div class="pill-header-line" aria-hidden="true"></div>
          </div>
          ${expBlocks}
        </section>

        <section>
          <div class="pill-header-row">
            <h2 class="pill-header-badge">Featured Projects</h2>
            <div class="pill-header-line" aria-hidden="true"></div>
          </div>
          <div class="projects-grid-3col">
            ${projectCards}
          </div>
        </section>

        <section>
          <div class="pill-header-row">
            <h2 class="pill-header-badge">Education</h2>
            <div class="pill-header-line" aria-hidden="true"></div>
          </div>
          ${eduBlocks}
        </section>
      </main>
    `.trim();
  }

  /**
   * Generates the complete CV A4 sheet markup.
   * @param {Object} [source]
   * @returns {string}
   */
  function generateCVHTML(source) {
    const data = parseResumeData(source);
    const headerHtml = generateHeaderHTML(data.identity);
    const sidebarHtml = generateSidebarHTML(data.identity, data.skills, data.languages);
    const mainHtml = generateMainContentHTML(data.experience, data.projects, data.education);

    return `
      <article class="resume-sheet" aria-label="Curriculum Vitae Document">
        ${headerHtml}
        <div class="cv-body-grid">
          ${sidebarHtml}
          ${mainHtml}
        </div>
      </article>
    `.trim();
  }

  /**
   * Maps parsed resume data into the DOM of the target container (#cv-print-template).
   * Supports both selector strings and direct DOM Element references.
   * Handles empty wrapper containers as well as pre-existing .resume-sheet articles.
   *
   * @param {string|HTMLElement} [target='#cv-print-template']
   * @param {Object} [sourceData]
   * @returns {Object|null} Result object { success: boolean, target: HTMLElement, data: Object }
   */
  function mapToDOM(target = '#cv-print-template', sourceData) {
    if (typeof document === 'undefined') {
      return null;
    }

    let element = null;
    if (typeof target === 'string') {
      element = document.querySelector(target);
    } else if (target && target.nodeType === 1) {
      element = target;
    }

    if (!element) {
      return null;
    }

    const data = parseResumeData(sourceData);
    const headerHtml = generateHeaderHTML(data.identity);
    const sidebarHtml = generateSidebarHTML(data.identity, data.skills, data.languages);
    const mainHtml = generateMainContentHTML(data.experience, data.projects, data.education);

    if (element.classList && element.classList.contains('resume-sheet')) {
      // Direct article.resume-sheet: inject header and grid inside
      element.innerHTML = `
        ${headerHtml}
        <div class="cv-body-grid">
          ${sidebarHtml}
          ${mainHtml}
        </div>
      `.trim();
    } else {
      // Wrapper container (e.g. #cv-print-template div): inject full sheet article
      element.innerHTML = `
        <article class="resume-sheet" aria-label="Curriculum Vitae Document">
          ${headerHtml}
          <div class="cv-body-grid">
            ${sidebarHtml}
            ${mainHtml}
          </div>
        </article>
      `.trim();
    }

    // Set telemetry attribute for inspection / testing
    element.setAttribute('data-cv-rendered-at', data.meta.parsedAt);
    element.setAttribute('data-cv-version', data.meta.version);

    return {
      success: true,
      target: element,
      data: data
    };
  }

  /**
   * Binds click listener to "Download Resume" buttons across the application.
   * Triggers native window.print() and ensures the CV print template is mounted.
   */
  function bindPrintTrigger() {
    if (typeof document === 'undefined') return;

    const triggers = document.querySelectorAll(
      '#download-resume-btn, [data-action="download-resume"], .btn-download-resume'
    );

    triggers.forEach(btn => {
      btn.addEventListener('click', function (e) {
        const templateNode = document.querySelector('#cv-print-template');
        if (templateNode && (!templateNode.children || templateNode.children.length === 0)) {
          mapToDOM(templateNode);
        }
        e.preventDefault();
        window.print();
      });
    });
  }

  /**
   * Auto-initialization helper: mounts to #cv-print-template if present in DOM.
   */
  function init() {
    if (typeof document === 'undefined') return;

    function runMount() {
      const templateNode = document.querySelector('#cv-print-template');
      if (templateNode) {
        mapToDOM(templateNode);
      }
      bindPrintTrigger();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runMount);
    } else {
      runMount();
    }
  }

  // Public API
  const ResumeEngine = {
    parseIdentity,
    parseExperience,
    parseEducation,
    parseSkills,
    parseProjects,
    parseLanguages,
    parseResumeData,
    resolveSourceData,
    generateHeaderHTML,
    generateSidebarHTML,
    generateMainContentHTML,
    generateCVHTML,
    mapToDOM,
    injectTemplate: mapToDOM,
    bindPrintTrigger,
    init
  };

  // Environment bindings
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResumeEngine;
  }
  if (typeof global !== 'undefined') {
    global.ResumeEngine = ResumeEngine;
  }

  // Auto-run in browser environment
  if (typeof window !== 'undefined') {
    ResumeEngine.init();
  }
})(typeof window !== 'undefined' ? window : globalThis);

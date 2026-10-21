/**
 * Resume Engine - Decoupled Data Parser
 * Parses raw portfolio data into structured models for resume and CV rendering.
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
        version: '1.0.0'
      }
    };
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
    resolveSourceData
  };

  // Environment bindings
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResumeEngine;
  }
  if (typeof global !== 'undefined') {
    global.ResumeEngine = ResumeEngine;
  }
})(typeof window !== 'undefined' ? window : globalThis);

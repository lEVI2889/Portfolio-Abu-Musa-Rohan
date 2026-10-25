/**
 * Navigation Module - Smooth Scrolling & IntersectionObserver Scroll Tracking
 * Automatically tracks which section is in the viewport and updates the active
 * navigation pill link accordingly.
 */

(function () {
  'use strict';

  function initScrollSpy() {
    if (typeof document === 'undefined') return;

    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    if (!navLinks || navLinks.length === 0) return;

    // Collect all in-page anchor links and their target sections
    const sectionMap = new Map();
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        const targetId = href.substring(1);
        const section = document.getElementById(targetId);
        if (section) {
          sectionMap.set(section, link);
        }
      }
    });

    if (sectionMap.size === 0) return;

    function setActiveLink(activeLink) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          link.classList.remove('active');
        }
      });
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }

    // Use IntersectionObserver to track section visibility
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0]
    };

    const visibleSections = new Map();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target, entry.intersectionRatio);
        } else {
          visibleSections.delete(entry.target);
        }
      });

      if (visibleSections.size > 0) {
        let bestSection = null;
        let maxRatio = -1;

        visibleSections.forEach((ratio, section) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            bestSection = section;
          }
        });

        if (bestSection && sectionMap.has(bestSection)) {
          setActiveLink(sectionMap.get(bestSection));
        }
      } else if (window.scrollY < 120) {
        const firstLink = navLinks[0];
        if (firstLink && firstLink.getAttribute('href') === '#about') {
          setActiveLink(firstLink);
        }
      }
    }, observerOptions);

    sectionMap.forEach((_, section) => {
      observer.observe(section);
    });

    // Enhanced smooth scroll click handler with header offset
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        link.addEventListener('click', (e) => {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            const header = document.querySelector('.site-header');
            const headerHeight = header ? header.offsetHeight + 16 : 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            setActiveLink(link);
          }
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollSpy);
  } else {
    initScrollSpy();
  }
})();

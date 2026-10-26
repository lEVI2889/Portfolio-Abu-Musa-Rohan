/**
 * Navigation Module - Smooth Scrolling, Scroll Spy & Vanilla Mobile Drawer
 * Provides IntersectionObserver scroll tracking for desktop and mobile navigation,
 * smooth scrolling with sticky header offset, and responsive vanilla JS mobile nav drawer
 * with hamburger toggle for viewports < 768px.
 */

(function () {
  'use strict';

  function initNavigation() {
    if (typeof document === 'undefined') return;

    // --- 1. Common Scroll Spy & Active Link Sync ---
    const desktopLinks = document.querySelectorAll('.nav-links .nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links .mobile-nav-link');

    // Collect all in-page anchor links and their target sections
    const sectionMap = new Map();
    const allAnchorLinks = [...desktopLinks, ...mobileLinks];

    allAnchorLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        const targetId = href.substring(1);
        const section = document.getElementById(targetId);
        if (section && !sectionMap.has(section)) {
          sectionMap.set(section, href);
        }
      }
    });

    function setActiveSectionHref(targetHref) {
      desktopLinks.forEach(link => {
        if (targetHref && link.getAttribute('href') === targetHref) {
          link.classList.add('active');
        } else if (link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
          link.classList.remove('active');
        }
      });

      mobileLinks.forEach(link => {
        if (targetHref && link.getAttribute('href') === targetHref) {
          link.classList.add('active');
        } else if (link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
          link.classList.remove('active');
        }
      });
    }

    if (sectionMap.size > 0) {
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
            setActiveSectionHref(sectionMap.get(bestSection));
          }
        } else if (window.scrollY < 120) {
          setActiveSectionHref('#about');
        }
      }, observerOptions);

      sectionMap.forEach((_, section) => {
        observer.observe(section);
      });
    }

    // Smooth scroll helper with sticky header offset
    function scrollToTarget(targetElement) {
      if (!targetElement) return;
      const header = document.querySelector('.site-header');
      const headerHeight = header ? header.offsetHeight + 16 : 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }

    // Attach desktop click handlers
    desktopLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        link.addEventListener('click', (e) => {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            scrollToTarget(target);
            setActiveSectionHref(href);
          }
        });
      }
    });

    // --- 2. Mobile Nav Drawer & Hamburger Toggle (< 768px) ---
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const closeBtn = document.getElementById('mobile-nav-close');
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');

    if (!toggleBtn || !drawer || !backdrop) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      toggleBtn.classList.add('is-active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.classList.add('drawer-open');

      if (closeBtn) {
        closeBtn.focus();
      }
    }

    function closeDrawer(restoreFocus = true) {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggleBtn.classList.remove('is-active');
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('drawer-open');

      if (restoreFocus && toggleBtn) {
        toggleBtn.focus();
      }
    }

    function toggleDrawer() {
      const isOpen = drawer.classList.contains('is-open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    }

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleDrawer();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeDrawer();
      });
    }

    backdrop.addEventListener('click', () => {
      closeDrawer();
    });

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });

    // Auto-close on viewport resize to desktop (> 768px)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && drawer.classList.contains('is-open')) {
        closeDrawer(false);
      }
    });

    // Mobile nav link click handling
    mobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            setActiveSectionHref(href);
            closeDrawer(false);

            // Small delay to allow drawer slide-out transition before scroll begins
            setTimeout(() => {
              scrollToTarget(target);
            }, 120);
          }
        } else {
          // Standard page navigation (e.g. resume.html)
          closeDrawer(false);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})();

/**
 * GameEngine - Interactive HTML5 Canvas Engine
 * Targets the 'Interactive Game Area' on the portfolio,
 * initializes the HTML5 <canvas> rendering context (2D/WebGL),
 * and binds dynamic resize listeners for responsive, HiDPI-crisp rendering.
 *
 * Part of the 21-Day Antigravity Portfolio Streak (Day 15).
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.GameEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Default engine configuration.
   */
  const DEFAULT_OPTIONS = {
    target: '#interactive-game-area',
    canvasSelector: '#game-canvas',
    contextType: '2d', // '2d' | 'webgl' | 'webgl2'
    contextAttributes: {
      alpha: true,
      desynchronized: true
    },
    retinaScaling: true,
    autoInit: true,
    telemetryBufferSelector: '#canvas-buffer-badge',
    telemetryFpsSelector: '#canvas-fps-badge'
  };

  class GameEngine {
    /**
     * @param {Object} [options={}] Configuration overrides
     */
    constructor(options = {}) {
      this.options = Object.assign({}, DEFAULT_OPTIONS, options);
      this.container = null;
      this.canvas = null;
      this.ctx = null;
      this.contextType = null;
      this.dpr = 1;
      this.width = 0;
      this.height = 0;
      this.cssWidth = 0;
      this.cssHeight = 0;
      this.isInitialized = false;

      // Bound event handler references for clean listener unbinding
      this._onResize = this._onResize.bind(this);
      this._resizeObserver = null;
      this._resizeRafId = null;
    }

    /**
     * Initialize canvas container, context, and resize bindings.
     * @returns {boolean} True if successfully initialized
     */
    init() {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        // Safe no-op in headless/SSR environments
        return false;
      }

      if (this.isInitialized) {
        console.warn('[GameEngine] Already initialized.');
        return true;
      }

      // 1. Locate the target container
      const targetQuery = this.options.target;
      this.container = typeof targetQuery === 'string'
        ? document.querySelector(targetQuery)
        : targetQuery;

      if (!this.container) {
        console.warn(`[GameEngine] Target container "${targetQuery}" not found in DOM.`);
        return false;
      }

      // If the target is the section (#interactive-game-area), prefer the inner canvas panel
      const innerPanel = this.container.querySelector('.interactive-game-canvas');
      const mountParent = innerPanel || this.container;

      // 2. Locate or create HTML5 <canvas> element
      let canvasEl = mountParent.querySelector('canvas') || document.querySelector(this.options.canvasSelector);
      if (!canvasEl) {
        canvasEl = document.createElement('canvas');
        canvasEl.id = 'game-canvas';
        canvasEl.className = 'game-engine-canvas';
        canvasEl.setAttribute('aria-label', 'Interactive Game Canvas Viewport');
        canvasEl.setAttribute('role', 'img');

        // Insert as first child or append into the viewport
        if (mountParent.firstChild) {
          mountParent.insertBefore(canvasEl, mountParent.firstChild);
        } else {
          mountParent.appendChild(canvasEl);
        }
      }

      this.canvas = canvasEl;

      // 3. Set up rendering context (2D with WebGL support / fallback)
      this._setupContext();

      if (!this.ctx) {
        console.error('[GameEngine] Failed to acquire a rendering context.');
        return false;
      }

      // 4. Initial viewport sizing and HiDPI scaling
      this.resize();

      // 5. Bind dynamic resize listeners
      this._bindResizeListeners(mountParent);

      this.isInitialized = true;
      console.info(
        `[GameEngine] Canvas context initialized (${this.contextType}) at ${this.width}x${this.height} (CSS: ${this.cssWidth}x${this.cssHeight}, DPR: ${this.dpr})`
      );

      return true;
    }

    /**
     * Set up the requested canvas context with fallback resilience.
     * @private
     */
    _setupContext() {
      const preferred = this.options.contextType.toLowerCase();
      const attrs = this.options.contextAttributes;

      if (preferred === 'webgl' || preferred === 'webgl2') {
        try {
          this.ctx = this.canvas.getContext(preferred, attrs) ||
                     this.canvas.getContext('experimental-webgl', attrs);
          if (this.ctx) {
            this.contextType = preferred;
            return;
          }
        } catch (e) {
          console.warn(`[GameEngine] Failed to create ${preferred} context:`, e);
        }
        // Fallback to 2d if WebGL is unavailable
        console.warn('[GameEngine] Falling back to 2D canvas context.');
      }

      try {
        this.ctx = this.canvas.getContext('2d', attrs);
        this.contextType = '2d';
      } catch (err) {
        console.error('[GameEngine] Error creating 2D context:', err);
        this.ctx = null;
        this.contextType = null;
      }
    }

    /**
     * Recalculates canvas buffer dimensions relative to container layout and DPR.
     */
    resize() {
      if (!this.canvas) return;

      const mountParent = this.canvas.parentElement || this.container || document.body;
      const rect = mountParent.getBoundingClientRect();

      this.dpr = this.options.retinaScaling && window.devicePixelRatio ? window.devicePixelRatio : 1;

      // Determine CSS layout dimensions
      const cssWidth = Math.max(Math.floor(rect.width), 320);
      const cssHeight = Math.max(Math.floor(rect.height), 240);

      this.cssWidth = cssWidth;
      this.cssHeight = cssHeight;

      // Determine physical buffer resolution (HiDPI scaling)
      const bufferWidth = Math.floor(cssWidth * this.dpr);
      const bufferHeight = Math.floor(cssHeight * this.dpr);

      // Only update buffer if dimensions actually changed (prevents canvas context resets)
      if (this.canvas.width !== bufferWidth || this.canvas.height !== bufferHeight) {
        this.canvas.width = bufferWidth;
        this.canvas.height = bufferHeight;
        this.width = bufferWidth;
        this.height = bufferHeight;

        // Apply 2D scale factor so drawing coordinates match CSS pixels
        if (this.contextType === '2d' && this.dpr !== 1) {
          this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        }

        // Update telemetry status badge in UI if present
        this._updateTelemetry();

        // Optional custom resize callback hook
        if (typeof this.options.onResize === 'function') {
          this.options.onResize({
            width: this.width,
            height: this.height,
            cssWidth: this.cssWidth,
            cssHeight: this.cssHeight,
            dpr: this.dpr
          });
        }
      }
    }

    /**
     * Updates buffer resolution text in telemetry status badges.
     * @private
     */
    _updateTelemetry() {
      const bufferBadge = document.querySelector(this.options.telemetryBufferSelector);
      if (bufferBadge) {
        bufferBadge.textContent = `BUFFER: ${this.width}x${this.height}`;
      }
    }

    /**
     * Binds window resize and ResizeObserver listeners.
     * @param {HTMLElement} observedElement
     * @private
     */
    _bindResizeListeners(observedElement) {
      window.addEventListener('resize', this._onResize, { passive: true });

      // Support ResizeObserver for element container resizing without window resize
      if (typeof ResizeObserver !== 'undefined' && observedElement) {
        this._resizeObserver = new ResizeObserver(() => {
          this._onResize();
        });
        this._resizeObserver.observe(observedElement);
      }
    }

    /**
     * Throttled resize event handler utilizing requestAnimationFrame.
     * @private
     */
    _onResize() {
      if (this._resizeRafId) {
        cancelAnimationFrame(this._resizeRafId);
      }
      this._resizeRafId = requestAnimationFrame(() => {
        this.resize();
        this._resizeRafId = null;
      });
    }

    /**
     * Returns the active rendering context.
     * @returns {CanvasRenderingContext2D|WebGLRenderingContext|null}
     */
    getContext() {
      return this.ctx;
    }

    /**
     * Returns the context type ('2d' or 'webgl').
     * @returns {string|null}
     */
    getContextType() {
      return this.contextType;
    }

    /**
     * Returns the canvas DOM element.
     * @returns {HTMLCanvasElement|null}
     */
    getCanvas() {
      return this.canvas;
    }

    /**
     * Returns current viewport and buffer dimensions.
     * @returns {{width: number, height: number, cssWidth: number, cssHeight: number, dpr: number}}
     */
    getDimensions() {
      return {
        width: this.width,
        height: this.height,
        cssWidth: this.cssWidth,
        cssHeight: this.cssHeight,
        dpr: this.dpr
      };
    }

    /**
     * Cleans up observers, event listeners, and animation frames.
     */
    destroy() {
      window.removeEventListener('resize', this._onResize);

      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }

      if (this._resizeRafId) {
        cancelAnimationFrame(this._resizeRafId);
        this._resizeRafId = null;
      }

      this.isInitialized = false;
      this.ctx = null;
      this.canvas = null;
    }
  }

  // Auto-initialize when running in browser environment
  if (typeof window !== 'undefined') {
    const autoInit = () => {
      if (!window.gameEngine) {
        window.gameEngine = new GameEngine();
        window.gameEngine.init();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit);
    } else {
      autoInit();
    }
  }

  return GameEngine;
});

/**
 * GameEngine - Interactive HTML5 Canvas Engine
 * Targets the 'Interactive Game Area' on the portfolio,
 * initializes the HTML5 <canvas> rendering context (2D/WebGL),
 * binds dynamic resize listeners for responsive, HiDPI-crisp rendering,
 * and maintains the core requestAnimationFrame render loop that clears the screen each frame.
 *
 * Part of the 21-Day Antigravity Portfolio Streak (Day 17).
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
    autoStart: true,
    clearColor: 'transparent',
    enableInput: true,
    inputOptions: {},
    telemetryBufferSelector: '#canvas-buffer-badge',
    telemetryFpsSelector: '#canvas-fps-badge',
    telemetryStatusSelector: '#canvas-status-badge',
    telemetryInputSelector: '#canvas-input-badge'
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
      this.input = null;
      this.dpr = 1;
      this.width = 0;
      this.height = 0;
      this.cssWidth = 0;
      this.cssHeight = 0;
      this.isInitialized = false;

      // Render loop state
      this.isRunning = false;
      this._loopRafId = null;
      this._lastTimestamp = 0;
      this.frameCount = 0;
      this._renderCallbacks = new Set();
      this._updateCallbacks = new Set();

      // Bound event handler references for clean listener unbinding
      this._onResize = this._onResize.bind(this);
      this._loop = this._loop.bind(this);
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
        canvasEl.className = 'game-canvas game-viewport-canvas game-engine-canvas';
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

      // 6. Initialize input handler if enabled
      if (this.options.enableInput) {
        this._setupInputHandler(mountParent);
      }

      // 7. Start core render loop if configured
      if (this.options.autoStart) {
        this.start();
      }

      return true;
    }

    /**
     * Resolves and attaches the InputHandler instance.
     * @param {HTMLElement} mountParent
     * @private
     */
    _setupInputHandler(mountParent) {
      let HandlerClass = typeof InputHandler !== 'undefined' ? InputHandler : null;
      if (!HandlerClass && typeof require === 'function') {
        try {
          HandlerClass = require('./input-handler');
        } catch (e) {
          // No-op
        }
      }

      if (HandlerClass) {
        this.input = new HandlerClass(this.canvas || mountParent, this.options.inputOptions);
        this.input.init();
        console.info('[GameEngine] InputHandler initialized (WASD, Arrows, Touch).');
      } else {
        console.warn('[GameEngine] InputHandler class not found. Ensure js/input-handler.js is loaded.');
      }
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
     * Starts the core game render loop via requestAnimationFrame.
     * @returns {boolean} True if loop started
     */
    start() {
      if (!this.isInitialized || !this.ctx) {
        console.warn('[GameEngine] Cannot start render loop: engine not initialized.');
        return false;
      }

      if (this.isRunning) {
        return true;
      }

      this.isRunning = true;
      this._lastTimestamp = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      this._updateStatus('ACTIVE // RENDER LOOP');

      if (typeof requestAnimationFrame !== 'undefined') {
        this._loopRafId = requestAnimationFrame(this._loop);
      }
      console.info('[GameEngine] Core render loop started.');
      return true;
    }

    /**
     * Stops the render loop.
     * @returns {boolean}
     */
    stop() {
      if (!this.isRunning) {
        return false;
      }

      this.isRunning = false;
      if (this._loopRafId && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this._loopRafId);
      }
      this._loopRafId = null;

      this._updateStatus('STANDBY');
      console.info('[GameEngine] Core render loop stopped.');
      return true;
    }

    /**
     * Core requestAnimationFrame render loop.
     * Clears the screen each frame and triggers update and render passes.
     * @param {DOMHighResTimeStamp} [timestamp]
     * @private
     */
    _loop(timestamp) {
      if (!this.isRunning) return;

      const now = (typeof timestamp === 'number')
        ? timestamp
        : ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
      const dt = this._lastTimestamp ? Math.min(Math.max((now - this._lastTimestamp) / 1000, 0), 0.1) : 0;
      this._lastTimestamp = now;
      this.frameCount++;

      // 1. Clear the screen each frame
      this.clear();

      // 2. Update input state frame transitions (justPressed buffers, touch states)
      if (this.input && typeof this.input.update === 'function') {
        this.input.update(dt);
      }
      this._updateInputTelemetry();

      // 3. Execute update passes (game logic / physics hooks)
      this._update(dt);

      // 4. Execute render passes (custom draw hooks)
      this._render(dt);

      // 5. Request the next animation frame
      if (this.isRunning && typeof requestAnimationFrame !== 'undefined') {
        this._loopRafId = requestAnimationFrame(this._loop);
      }
    }

    /**
     * Clears the entire canvas viewport / screen each frame.
     */
    clear() {
      if (!this.ctx || !this.canvas) return;

      if (this.contextType === '2d') {
        this.ctx.save();
        // Reset matrix to 1:1 screen pixel coordinates to cleanly clear physical buffer
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // If a solid clear color was configured, fill it
        if (this.options.clearColor && this.options.clearColor !== 'transparent') {
          this.ctx.fillStyle = this.options.clearColor;
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.restore();
      } else if (this.contextType === 'webgl' || this.contextType === 'webgl2') {
        const gl = this.ctx;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }
    }

    /**
     * Internal update pass for registered update hooks.
     * Passes delta time and current input state to subscribers.
     * @param {number} dt Delta time in seconds
     * @private
     */
    _update(dt) {
      const inputState = this.input ? this.input.getState() : null;
      if (typeof this.options.onUpdate === 'function') {
        try {
          this.options.onUpdate(dt, inputState);
        } catch (err) {
          console.error('[GameEngine] Error in onUpdate callback:', err);
        }
      }
      for (const cb of this._updateCallbacks) {
        try {
          cb(dt, inputState);
        } catch (err) {
          console.error('[GameEngine] Error in update callback:', err);
        }
      }
    }

    /**
     * Internal render pass for registered render hooks.
     * @param {number} dt Delta time in seconds
     * @private
     */
    _render(dt) {
      if (typeof this.options.onRender === 'function') {
        try {
          this.options.onRender(this.ctx, dt);
        } catch (err) {
          console.error('[GameEngine] Error in onRender callback:', err);
        }
      }
      for (const cb of this._renderCallbacks) {
        try {
          cb(this.ctx, dt);
        } catch (err) {
          console.error('[GameEngine] Error in render callback:', err);
        }
      }
    }

    /**
     * Register a callback to be called every frame during the render pass.
     * @param {Function} cb Function receiving (ctx, dt)
     * @returns {Function} Unsubscribe function
     */
    onRender(cb) {
      if (typeof cb === 'function') {
        this._renderCallbacks.add(cb);
        return () => this._renderCallbacks.delete(cb);
      }
      return () => {};
    }

    /**
     * Register a callback to be called every frame during the update pass.
     * @param {Function} cb Function receiving (dt)
     * @returns {Function} Unsubscribe function
     */
    onUpdate(cb) {
      if (typeof cb === 'function') {
        this._updateCallbacks.add(cb);
        return () => this._updateCallbacks.delete(cb);
      }
      return () => {};
    }

    /**
     * Updates buffer resolution text in telemetry status badges.
     * @private
     */
    _updateTelemetry() {
      if (typeof document === 'undefined') return;
      const bufferBadge = document.querySelector(this.options.telemetryBufferSelector);
      if (bufferBadge) {
        bufferBadge.textContent = `BUFFER: ${this.width}x${this.height}`;
      }
    }

    /**
     * Updates status text in telemetry status badges.
     * @param {string} statusText
     * @private
     */
    _updateStatus(statusText) {
      const statusBadge = document.querySelector(this.options.telemetryStatusSelector);
      if (statusBadge) {
        statusBadge.textContent = `STATUS: ${statusText}`;
      }
    }

    /**
     * Updates input status text in telemetry badges if available.
     * @private
     */
    _updateInputTelemetry() {
      if (typeof document === 'undefined') return;
      const inputBadge = document.querySelector(this.options.telemetryInputSelector);
      if (inputBadge && this.input) {
        const state = this.input.getState();
        if (state.lastInputType) {
          const typeStr = state.lastInputType === 'touch' ? 'TOUCH' : 'WASD/ARROWS';
          const isInteracting = state.up || state.down || state.left || state.right || state.action || state.shift;
          inputBadge.textContent = isInteracting
            ? `INPUT: ${typeStr} (ACTIVE)`
            : `INPUT: ${typeStr} (STANDBY)`;
        }
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
     * Returns the active InputHandler instance.
     * @returns {InputHandler|null}
     */
    getInput() {
      return this.input;
    }

    /**
     * Returns the current consolidated input state object.
     * @returns {Object|null}
     */
    getInputState() {
      return this.input ? this.input.getState() : null;
    }

    /**
     * Cleans up observers, event listeners, and animation frames.
     */
    destroy() {
      this.stop();
      this._renderCallbacks.clear();
      this._updateCallbacks.clear();

      if (this.input) {
        this.input.destroy();
        this.input = null;
      }

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

  // Bind InputHandler reference if available
  if (typeof InputHandler !== 'undefined') {
    GameEngine.InputHandler = InputHandler;
  } else if (typeof require === 'function') {
    try {
      GameEngine.InputHandler = require('./input-handler');
    } catch (e) {
      // Standalone
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

/**
 * GameEngine - Interactive HTML5 Canvas Engine
 * Targets the 'Interactive Game Area' on the portfolio,
 * initializes the HTML5 <canvas> rendering context (2D/WebGL),
 * binds dynamic resize listeners for responsive, HiDPI-crisp rendering,
 * maintains the core requestAnimationFrame render loop that clears the screen each frame,
 * provides a finite state machine (INIT, PLAYING, PAUSED, GAME_OVER) to manage what the loop renders,
 * and calculates live Delta Time (dt) and Frames Per Second (FPS) engine telemetry.
 *
 * Part of the 21-Day Antigravity Portfolio Streak (Day 19).
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
   * Game Engine State Machine Enumeration.
   * Manages engine lifecycle states and loop rendering modes.
   */
  const GameStates = Object.freeze({
    INIT: 'INIT',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
  });

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
    initialState: GameStates.INIT,
    enableStateOverlays: true,
    enableStateControls: true,
    clearColor: 'transparent',
    enableInput: true,
    inputOptions: {},
    fpsSampleInterval: 0.25, // Sampling window (seconds) for FPS averaging & telemetry updates
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

      // Telemetry & Timing metrics
      this.dt = 0;              // Current frame delta time in seconds
      this.dtMs = 0;            // Current frame delta time in milliseconds
      this.fps = 60;            // Smoothed frames per second (live display)
      this.instantFps = 60;     // Instantaneous frames per second (1 / dt)
      this.minFps = 60;
      this.maxFps = 60;
      this._fpsFrameCount = 0;
      this._fpsTimeAccumulator = 0;

      // State machine state
      this.States = GameStates;
      this.state = (this.options.initialState && GameStates[this.options.initialState.toUpperCase()])
        ? this.options.initialState.toUpperCase()
        : GameStates.INIT;
      this.previousState = null;
      this.stateTimer = 0;
      this._gameOverData = null;
      this._stateChangeCallbacks = new Set();
      this._stateRenderers = new Map();
      this._stateUpdaters = new Map();

      // Ambient player avatar position for default interactive testbed
      this._playerPos = { x: 0, y: 0 };
      this._ambientParticles = [];

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

      // 6. Initialize ambient background particles for visual polish
      this._initAmbientParticles();

      // 7. Center player position in viewport
      this._playerPos = {
        x: this.cssWidth / 2,
        y: this.cssHeight / 2
      };

      this.isInitialized = true;
      console.info(
        `[GameEngine] Canvas context initialized (${this.contextType}) at ${this.width}x${this.height} (CSS: ${this.cssWidth}x${this.cssHeight}, DPR: ${this.dpr})`
      );

      // 8. Initialize input handler if enabled
      if (this.options.enableInput) {
        this._setupInputHandler(mountParent);
      }

      // 9. Update telemetry badge with initial state
      this._updateStatus(this.state);
      this._updateTelemetry();
      this._updateFpsTelemetry();

      // 10. Hide HTML placeholder if engine handles interactive overlays
      const placeholder = mountParent.querySelector('.canvas-center-placeholder');
      if (placeholder) {
        placeholder.classList.add('is-hidden');
      }
      mountParent.classList.add('has-active-engine');

      // 11. Start core render loop if configured
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
      let HandlerClass = (typeof globalThis !== 'undefined' && globalThis.InputHandler)
        ? globalThis.InputHandler
        : ((typeof window !== 'undefined' && window.InputHandler) ? window.InputHandler : null);
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
        console.info('[GameEngine] InputHandler initialized (WASD, Arrows, Touch, Mouse).');
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

        // Keep player centered if resizing
        if (this._playerPos.x === 0 && this._playerPos.y === 0) {
          this._playerPos = { x: cssWidth / 2, y: cssHeight / 2 };
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

    // ==========================================
    // STATE MACHINE MANAGEMENT
    // ==========================================

    /**
     * Returns the active game state (INIT | PLAYING | PAUSED | GAME_OVER).
     * @returns {string}
     */
    getState() {
      return this.state;
    }

    /**
     * Checks if the engine is currently in the specified state.
     * @param {string} state
     * @returns {boolean}
     */
    isState(state) {
      return this.state === (state || '').toUpperCase();
    }

    /**
     * Transitions the state machine to a new state.
     * @param {string} newState (INIT | PLAYING | PAUSED | GAME_OVER)
     * @param {Object} [payload={}] Contextual data (e.g. score, trigger cause)
     * @returns {boolean} True if state changed successfully
     */
    setState(newState, payload = {}) {
      if (!newState || typeof newState !== 'string') return false;
      const upperState = newState.toUpperCase();

      if (!GameStates[upperState]) {
        console.warn(`[GameEngine] Invalid state "${newState}". Valid states:`, Object.values(GameStates));
        return false;
      }

      if (this.state === upperState) {
        return false;
      }

      const prevState = this.state;
      this.previousState = prevState;
      this.state = upperState;
      this.stateTimer = 0;

      if (upperState === GameStates.GAME_OVER) {
        this._gameOverData = payload;
      }

      // Update telemetry badge
      this._updateStatus(upperState);
      this._updateFpsTelemetry();

      // Notify external subscribers
      this._notifyStateChange(upperState, prevState, payload);

      console.info(`[GameEngine] State transition: ${prevState} -> ${upperState}`);
      return true;
    }

    /**
     * Transitions state to PLAYING.
     * @returns {boolean}
     */
    play() {
      return this.setState(GameStates.PLAYING, { trigger: 'play' });
    }

    /**
     * Transitions state to PAUSED (only if currently PLAYING).
     * @returns {boolean}
     */
    pause() {
      if (this.state !== GameStates.PLAYING) return false;
      return this.setState(GameStates.PAUSED, { trigger: 'pause' });
    }

    /**
     * Resumes state from PAUSED to PLAYING.
     * @returns {boolean}
     */
    resume() {
      if (this.state !== GameStates.PAUSED) return false;
      return this.setState(GameStates.PLAYING, { trigger: 'resume' });
    }

    /**
     * Toggles between PLAYING and PAUSED states.
     * @returns {boolean}
     */
    togglePause() {
      if (this.state === GameStates.PLAYING) {
        return this.pause();
      } else if (this.state === GameStates.PAUSED) {
        return this.resume();
      }
      return false;
    }

    /**
     * Transitions state to GAME_OVER.
     * @param {Object} [data={}] Optional outcome data (e.g. score, reason)
     * @returns {boolean}
     */
    gameOver(data = {}) {
      return this.setState(GameStates.GAME_OVER, data);
    }

    /**
     * Restarts the engine to INIT (or immediately to PLAYING).
     * @param {boolean} [immediate=false] If true, skips INIT and starts PLAYING
     * @returns {boolean}
     */
    restart(immediate = false) {
      this._gameOverData = null;
      this._playerPos = { x: this.cssWidth / 2, y: this.cssHeight / 2 };
      return this.setState(immediate ? GameStates.PLAYING : GameStates.INIT, { trigger: 'restart' });
    }

    /**
     * Registers a callback to be called on state changes.
     * @param {Function} cb Function receiving (newState, prevState, payload)
     * @returns {Function} Unsubscribe function
     */
    onStateChange(cb) {
      if (typeof cb === 'function') {
        this._stateChangeCallbacks.add(cb);
        return () => this._stateChangeCallbacks.delete(cb);
      }
      return () => {};
    }

    /**
     * Registers a dedicated renderer for a specific state.
     * @param {string} state (INIT | PLAYING | PAUSED | GAME_OVER)
     * @param {Function} cb Function receiving (ctx, dt, stateTimer)
     */
    registerStateRenderer(state, cb) {
      const upper = (state || '').toUpperCase();
      if (typeof cb === 'function' && GameStates[upper]) {
        this._stateRenderers.set(upper, cb);
      }
    }

    /**
     * Registers a dedicated updater for a specific state.
     * @param {string} state (INIT | PLAYING | PAUSED | GAME_OVER)
     * @param {Function} cb Function receiving (dt, inputState)
     */
    registerStateUpdater(state, cb) {
      const upper = (state || '').toUpperCase();
      if (typeof cb === 'function' && GameStates[upper]) {
        this._stateUpdaters.set(upper, cb);
      }
    }

    /**
     * Notifies all state change subscribers.
     * @private
     */
    _notifyStateChange(newState, prevState, payload) {
      if (typeof this.options.onStateChange === 'function') {
        try {
          this.options.onStateChange(newState, prevState, payload);
        } catch (err) {
          console.error('[GameEngine] Error in options.onStateChange:', err);
        }
      }

      for (const cb of this._stateChangeCallbacks) {
        try {
          cb(newState, prevState, payload);
        } catch (err) {
          console.error('[GameEngine] Error in state change callback:', err);
        }
      }
    }

    /**
     * Evaluates input state transitions for engine states.
     * @private
     */
    _handleStateTransitions() {
      if (!this.options.enableStateControls || !this.input) return;

      const input = this.input;
      const isAction = input.isJustPressed('action') || (input.state.touch && input.state.touch.isTap);
      const isPause = input.isJustPressed('pause') || input.isJustPressed('escape');
      const isRestart = input.isJustPressed('restart');

      switch (this.state) {
        case GameStates.INIT:
          if (isAction) {
            this.play();
          }
          break;

        case GameStates.PLAYING:
          if (isPause) {
            this.pause();
          }
          break;

        case GameStates.PAUSED:
          if (isPause || isAction) {
            this.resume();
          } else if (isRestart) {
            this.restart();
          }
          break;

        case GameStates.GAME_OVER:
          if (isRestart || isAction) {
            this.restart();
          }
          break;
      }
    }

    // ==========================================
    // RENDER LOOP & FRAME LIFECYCLE
    // ==========================================

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
      this._updateStatus(this.state);

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
      this._updateFpsTelemetry();
      console.info('[GameEngine] Core render loop stopped.');
      return true;
    }

    /**
     * Core requestAnimationFrame render loop.
     * Clears the screen each frame and triggers state-managed update and render passes.
     * @param {DOMHighResTimeStamp} [timestamp]
     * @private
     */
    _loop(timestamp) {
      if (!this.isRunning) return;

      // 1. Calculate Delta Time (dt) and Frames Per Second (FPS)
      const dt = this.calculateDeltaTime(timestamp);
      this.calculateFps(dt, timestamp);
      this.frameCount++;
      this.stateTimer += dt;

      // 2. Clear the screen each frame
      this.clear();

      // 2. Update input state frame transitions (justPressed buffers, touch states)
      if (this.input && typeof this.input.update === 'function') {
        this.input.update(dt);
      }
      this._updateInputTelemetry();

      // 3. Process state machine transitions from user input
      this._handleStateTransitions();

      // 4. Update ambient background particles
      this._updateAmbientParticles(dt);

      // 5. Execute state-driven update and render routines
      switch (this.state) {
        case GameStates.INIT:
          this._updateInit(dt);
          this._renderInit(dt);
          break;

        case GameStates.PLAYING:
          this._update(dt);
          this._render(dt);
          break;

        case GameStates.PAUSED:
          this._updatePaused(dt);
          // Frozen render pass of underlying game world
          this._render(0);
          // Frosted pause HUD overlay
          this._renderPaused(dt);
          break;

        case GameStates.GAME_OVER:
          this._updateGameOver(dt);
          // Underlying game world
          this._render(0);
          // Crimson game over HUD overlay
          this._renderGameOver(dt);
          break;
      }

      // 6. Request the next animation frame
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

    // ==========================================
    // STATE-SPECIFIC UPDATE & RENDER ROUTINES
    // ==========================================

    /**
     * Update pass for INIT state.
     * @param {number} dt Delta time
     * @private
     */
    _updateInit(dt) {
      const customUpdater = this._stateUpdaters.get(GameStates.INIT);
      if (typeof customUpdater === 'function') {
        customUpdater(dt, this.input ? this.input.getState() : null);
      }
    }

    /**
     * Render pass for INIT state.
     * @param {number} dt Delta time
     * @private
     */
    _renderInit(dt) {
      if (this.contextType !== '2d') return;

      const customRenderer = this._stateRenderers.get(GameStates.INIT);
      if (typeof customRenderer === 'function') {
        customRenderer(this.ctx, dt, this.stateTimer);
        return;
      }

      if (!this.options.enableStateOverlays) return;

      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;

      // 1. Render ambient grid and particles
      this._renderAmbientBackground(ctx, w, h);

      // 2. Center HUD card
      const cardW = Math.min(480, w - 40);
      const cardH = 170;
      const cardX = (w - cardW) / 2;
      const cardY = (h - cardH) / 2;

      // Panel background
      ctx.save();
      ctx.fillStyle = 'rgba(11, 17, 33, 0.82)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 1;
      this._roundRect(ctx, cardX, cardY, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      // Technical HUD corner brackets
      this._drawHudBrackets(ctx, cardX, cardY, cardW, cardH, 'rgba(6, 182, 212, 0.8)');

      // Top badge: Pulse dot + telemetry
      ctx.font = '600 11px "Space Mono", monospace';
      ctx.fillStyle = '#06B6D4';
      ctx.textAlign = 'center';
      ctx.fillText('CANVAS ENGINE // STANDBY', w / 2, cardY + 36);

      // Title: READY TO LAUNCH
      ctx.font = '700 20px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('INTERACTIVE GAME ENGINE', w / 2, cardY + 68);

      // Pulsing start prompt
      const pulseAlpha = 0.5 + 0.5 * Math.sin(this.stateTimer * 4.5);
      ctx.font = '600 13px "Space Mono", monospace';
      ctx.fillStyle = `rgba(6, 182, 212, ${pulseAlpha})`;
      ctx.fillText('[ PRESS SPACE / ENTER OR CLICK TO START ]', w / 2, cardY + 110);

      // Controls hint
      ctx.font = '500 10px "Space Mono", monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.fillText('WASD / ARROWS : MOVE   •   P / ESC : PAUSE', w / 2, cardY + 142);

      ctx.restore();
    }

    /**
     * Update pass for PLAYING state (game logic & physics).
     * @param {number} dt Delta time
     * @private
     */
    _update(dt) {
      const inputState = this.input ? this.input.getState() : null;

      // Update ambient testbed player avatar if active
      if (inputState && this.state === GameStates.PLAYING) {
        const speed = 240 * dt;
        this._playerPos.x += inputState.axes.x * speed;
        this._playerPos.y += inputState.axes.y * speed;

        // Clamp to viewport
        this._playerPos.x = Math.max(20, Math.min(this.cssWidth - 20, this._playerPos.x));
        this._playerPos.y = Math.max(20, Math.min(this.cssHeight - 20, this._playerPos.y));
      }

      if (typeof this.options.onUpdate === 'function') {
        try {
          this.options.onUpdate(dt, inputState, this.state);
        } catch (err) {
          console.error('[GameEngine] Error in onUpdate callback:', err);
        }
      }

      for (const cb of this._updateCallbacks) {
        try {
          cb(dt, inputState, this.state);
        } catch (err) {
          console.error('[GameEngine] Error in update callback:', err);
        }
      }
    }

    /**
     * Render pass for PLAYING state.
     * @param {number} dt Delta time
     * @private
     */
    _render(dt) {
      // 1. Custom registered render callbacks
      if (typeof this.options.onRender === 'function') {
        try {
          this.options.onRender(this.ctx, dt, this.state);
        } catch (err) {
          console.error('[GameEngine] Error in onRender callback:', err);
        }
      }

      for (const cb of this._renderCallbacks) {
        try {
          cb(this.ctx, dt, this.state);
        } catch (err) {
          console.error('[GameEngine] Error in render callback:', err);
        }
      }

      // 2. If no custom renderers are registered yet, render interactive testbed
      if (this._renderCallbacks.size === 0 && !this.options.onRender && this.contextType === '2d') {
        this._renderDefaultPlaying(dt);
      }
    }

    /**
     * Default interactive testbed rendered during PLAYING before custom game logic is attached.
     * @param {number} dt
     * @private
     */
    _renderDefaultPlaying(dt) {
      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;

      // Ambient background
      this._renderAmbientBackground(ctx, w, h);

      // Render player reticle/avatar
      ctx.save();
      const px = this._playerPos.x;
      const py = this._playerPos.y;

      // Reticle glow
      ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
      ctx.shadowBlur = 12;

      // Reticle circle
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(px - 22, py); ctx.lineTo(px - 16, py);
      ctx.moveTo(px + 16, py); ctx.lineTo(px + 22, py);
      ctx.moveTo(px, py - 22); ctx.lineTo(px, py - 16);
      ctx.moveTo(px, py + 16); ctx.lineTo(px, py + 22);
      ctx.stroke();

      // Coordinate telemetry
      ctx.shadowBlur = 0;
      ctx.font = '500 10px "Space Mono", monospace';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(`X:${Math.round(px)} Y:${Math.round(py)}`, px + 18, py - 10);

      // Watermark HUD badge in corner
      ctx.font = '600 10px "Space Mono", monospace';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.textAlign = 'right';
      ctx.fillText(`STATE: PLAYING // LIVE ${Math.round(this.fps)} FPS`, w - 16, h - 16);

      ctx.restore();
    }

    /**
     * Update pass for PAUSED state.
     * @param {number} dt
     * @private
     */
    _updatePaused(dt) {
      const customUpdater = this._stateUpdaters.get(GameStates.PAUSED);
      if (typeof customUpdater === 'function') {
        customUpdater(dt, this.input ? this.input.getState() : null);
      }
    }

    /**
     * Render pass for PAUSED overlay.
     * @param {number} dt
     * @private
     */
    _renderPaused(dt) {
      if (this.contextType !== '2d') return;

      const customRenderer = this._stateRenderers.get(GameStates.PAUSED);
      if (typeof customRenderer === 'function') {
        customRenderer(this.ctx, dt, this.stateTimer);
        return;
      }

      if (!this.options.enableStateOverlays) return;

      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;

      ctx.save();

      // 1. Frosted glass dark overlay with subtle scanlines
      ctx.fillStyle = 'rgba(10, 15, 29, 0.78)';
      ctx.fillRect(0, 0, w, h);

      // Subtle scanline pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }

      // 2. Pause HUD card
      const cardW = Math.min(420, w - 40);
      const cardH = 150;
      const cardX = (w - cardW) / 2;
      const cardY = (h - cardH) / 2;

      ctx.fillStyle = 'rgba(17, 24, 39, 0.88)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1;
      this._roundRect(ctx, cardX, cardY, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      this._drawHudBrackets(ctx, cardX, cardY, cardW, cardH, 'rgba(245, 158, 11, 0.85)');

      // Top badge
      ctx.font = '600 11px "Space Mono", monospace';
      ctx.fillStyle = '#F59E0B';
      ctx.textAlign = 'center';
      ctx.fillText('ENGINE SUSPENDED', w / 2, cardY + 34);

      // Title
      ctx.font = '700 20px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('SYSTEM PAUSED', w / 2, cardY + 66);

      // Pulsing resume prompt
      const pulseAlpha = 0.6 + 0.4 * Math.sin(this.stateTimer * 5);
      ctx.font = '600 12px "Space Mono", monospace';
      ctx.fillStyle = `rgba(245, 158, 11, ${pulseAlpha})`;
      ctx.fillText('[ PRESS P / ESC OR CLICK TO RESUME ]', w / 2, cardY + 104);

      // Subtext
      ctx.font = '500 10px "Space Mono", monospace';
      ctx.fillStyle = 'rgba(156, 163, 175, 0.75)';
      ctx.fillText('PRESS R TO RETURN TO TITLE', w / 2, cardY + 130);

      ctx.restore();
    }

    /**
     * Update pass for GAME_OVER state.
     * @param {number} dt
     * @private
     */
    _updateGameOver(dt) {
      const customUpdater = this._stateUpdaters.get(GameStates.GAME_OVER);
      if (typeof customUpdater === 'function') {
        customUpdater(dt, this.input ? this.input.getState() : null);
      }
    }

    /**
     * Render pass for GAME_OVER overlay.
     * @param {number} dt
     * @private
     */
    _renderGameOver(dt) {
      if (this.contextType !== '2d') return;

      const customRenderer = this._stateRenderers.get(GameStates.GAME_OVER);
      if (typeof customRenderer === 'function') {
        customRenderer(this.ctx, dt, this.stateTimer);
        return;
      }

      if (!this.options.enableStateOverlays) return;

      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;

      ctx.save();

      // 1. Crimson vignette overlay
      ctx.fillStyle = 'rgba(28, 10, 18, 0.82)';
      ctx.fillRect(0, 0, w, h);

      // Horizontal chromatic aberration accents
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(0, h * 0.35, w, 2);
      ctx.fillRect(0, h * 0.65, w, 2);

      // 2. Game Over HUD card
      const cardW = Math.min(440, w - 40);
      const cardH = 160;
      const cardX = (w - cardW) / 2;
      const cardY = (h - cardH) / 2;

      ctx.fillStyle = 'rgba(24, 12, 18, 0.9)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.lineWidth = 1;
      this._roundRect(ctx, cardX, cardY, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      this._drawHudBrackets(ctx, cardX, cardY, cardW, cardH, 'rgba(239, 68, 68, 0.9)');

      // Top badge
      ctx.font = '600 11px "Space Mono", monospace';
      ctx.fillStyle = '#EF4444';
      ctx.textAlign = 'center';
      ctx.fillText('STATUS: CRITICAL // ABORTED', w / 2, cardY + 34);

      // Title
      ctx.font = '700 20px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('SIMULATION TERMINATED', w / 2, cardY + 66);

      // Score / details if provided
      if (this._gameOverData && this._gameOverData.score !== undefined) {
        ctx.font = '600 12px "Space Mono", monospace';
        ctx.fillStyle = '#FCA5A5';
        ctx.fillText(`FINAL SCORE: ${this._gameOverData.score}`, w / 2, cardY + 92);
      }

      // Pulsing restart prompt
      const pulseAlpha = 0.6 + 0.4 * Math.sin(this.stateTimer * 5);
      ctx.font = '600 12px "Space Mono", monospace';
      ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
      ctx.fillText('[ PRESS R / SPACE OR CLICK TO RESTART ]', w / 2, cardY + 120);

      ctx.restore();
    }

    // ==========================================
    // VISUAL POLISH & HELPER ROUTINES
    // ==========================================

    /**
     * Initializes ambient particles for background canvas life.
     * @private
     */
    _initAmbientParticles() {
      this._ambientParticles = [];
      const count = 28;
      for (let i = 0; i < count; i++) {
        this._ambientParticles.push({
          x: Math.random() * (this.cssWidth || 600),
          y: Math.random() * (this.cssHeight || 400),
          size: 1 + Math.random() * 2,
          speedX: (Math.random() - 0.5) * 15,
          speedY: (Math.random() - 0.5) * 15,
          alpha: 0.2 + Math.random() * 0.4
        });
      }
    }

    /**
     * Updates ambient background particles.
     * @private
     */
    _updateAmbientParticles(dt) {
      const w = this.cssWidth;
      const h = this.cssHeight;
      for (const p of this._ambientParticles) {
        p.x += p.speedX * dt;
        p.y += p.speedY * dt;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }
    }

    /**
     * Renders ambient perspective grid and glowing floating particles.
     * @private
     */
    _renderAmbientBackground(ctx, w, h) {
      // Subtle background grid
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;

      ctx.beginPath();
      for (let x = 0; x <= w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Floating particles
      for (const p of this._ambientParticles) {
        ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    /**
     * Draws technical HUD corner brackets for cyberpunk aesthetic.
     * @private
     */
    _drawHudBrackets(ctx, x, y, w, h, color) {
      const bLen = 10;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      // Top-left
      ctx.moveTo(x, y + bLen); ctx.lineTo(x, y); ctx.lineTo(x + bLen, y);
      // Top-right
      ctx.moveTo(x + w - bLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + bLen);
      // Bottom-left
      ctx.moveTo(x, y + h - bLen); ctx.lineTo(x, y + h); ctx.lineTo(x + bLen, y + h);
      // Bottom-right
      ctx.moveTo(x + w - bLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - bLen);
      ctx.stroke();

      ctx.restore();
    }

    /**
     * Helper to draw rounded rectangle paths.
     * @private
     */
    _roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    // ==========================================
    // TELEMETRY & EVENT BINDINGS
    // ==========================================

    /**
     * Register a callback to be called every frame during the render pass.
     * @param {Function} cb Function receiving (ctx, dt, state)
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
     * @param {Function} cb Function receiving (dt, inputState, state)
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
      if (typeof document === 'undefined') return;
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
          const typeStr = state.lastInputType === 'touch' ? 'TOUCH' : (state.lastInputType === 'mouse' ? 'MOUSE' : 'WASD/ARROWS');
          const isInteracting = state.up || state.down || state.left || state.right || state.action || state.shift || state.pause;
          inputBadge.textContent = isInteracting
            ? `INPUT: ${typeStr} (ACTIVE)`
            : `INPUT: ${typeStr} (STANDBY)`;
        }
      }
    }

    /**
     * Updates the 60 FPS UI text badge (#canvas-fps-badge) with live FPS telemetry.
     * Replaces the static '60 FPS' placeholder with dynamic, live measured frame rates.
     * @param {string} [overrideText]
     * @private
     */
    _updateFpsTelemetry(overrideText) {
      if (typeof document === 'undefined') return;
      const fpsBadge = document.querySelector(this.options.telemetryFpsSelector);
      if (!fpsBadge) return;

      if (overrideText) {
        fpsBadge.textContent = overrideText;
        return;
      }

      const displayFps = Math.round(this.fps);
      const statusPrefix = (!this.isRunning || this.state === GameStates.INIT)
        ? 'READY'
        : (this.state === GameStates.PLAYING ? 'ACTIVE' : this.state);

      fpsBadge.textContent = `CANVAS ${statusPrefix} // ${displayFps} FPS`;
    }

    // ==========================================
    // ENGINE TELEMETRY & FPS CALCULATION
    // ==========================================

    /**
     * Calculates Delta Time (dt in seconds and dtMs in milliseconds) from a high-res timestamp.
     * Clamps maximum dt to 0.1s (100ms) to prevent simulation explosions when tab focus is regained.
     * @param {DOMHighResTimeStamp|number} [timestamp]
     * @returns {number} Delta time in seconds
     */
    calculateDeltaTime(timestamp) {
      const now = (typeof timestamp === 'number')
        ? timestamp
        : ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());

      if (!this._lastTimestamp) {
        this._lastTimestamp = now;
        this.dt = 0;
        this.dtMs = 0;
        return 0;
      }

      const rawDt = (now - this._lastTimestamp) / 1000;
      // Clamp between 0 and 0.1s (10 FPS floor)
      this.dt = Math.min(Math.max(rawDt, 0), 0.1);
      this.dtMs = this.dt * 1000;
      this._lastTimestamp = now;

      return this.dt;
    }

    /**
     * Calculates instantaneous and smoothed frames per second (FPS),
     * accumulates sample frames, and updates the 60 FPS UI text with live data.
     * @param {number} dt Delta time in seconds
     * @param {number} [timestamp] High-res timestamp
     * @returns {number} Current smoothed frames per second
     */
    calculateFps(dt, timestamp) {
      if (dt > 0) {
        this.instantFps = Math.min(Math.round(1 / dt), 1000);
      }

      this._fpsFrameCount++;
      this._fpsTimeAccumulator += dt;

      const sampleInterval = this.options.fpsSampleInterval || 0.25;
      if (this._fpsTimeAccumulator >= sampleInterval) {
        const calculated = this._fpsFrameCount / this._fpsTimeAccumulator;
        // Exponential moving average for smooth, jitter-free live UI display
        this.fps = this.fps === 0 ? calculated : (this.fps * 0.7 + calculated * 0.3);
        this.minFps = Math.min(this.minFps, this.fps);
        this.maxFps = Math.max(this.maxFps, this.fps);

        this._fpsFrameCount = 0;
        this._fpsTimeAccumulator = 0;

        // Update the 60 FPS UI text with live data
        this._updateFpsTelemetry();
      }

      return this.fps;
    }

    /**
     * Unified calculation function: computes both Delta Time (dt) and FPS,
     * updates engine telemetry metrics, and refreshes the live UI badge.
     * @param {DOMHighResTimeStamp|number} [timestamp]
     * @returns {{ dt: number, dtMs: number, fps: number, instantFps: number }}
     */
    calculateDeltaAndFps(timestamp) {
      const dt = this.calculateDeltaTime(timestamp);
      const fps = this.calculateFps(dt, timestamp);
      return {
        dt: this.dt,
        dtMs: this.dtMs,
        fps: this.fps,
        instantFps: this.instantFps
      };
    }

    /**
     * Returns current smoothed frames per second.
     * @returns {number}
     */
    getFps() {
      return this.fps;
    }

    /**
     * Returns current instantaneous frames per second (1 / dt).
     * @returns {number}
     */
    getInstantFps() {
      return this.instantFps;
    }

    /**
     * Returns current Delta Time in seconds.
     * @returns {number}
     */
    getDeltaTime() {
      return this.dt;
    }

    /**
     * Returns current Delta Time in milliseconds.
     * @returns {number}
     */
    getDeltaTimeMs() {
      return this.dtMs;
    }

    /**
     * Returns complete real-time engine telemetry snapshot.
     * @returns {{dt: number, dtMs: number, fps: number, instantFps: number, minFps: number, maxFps: number, frameCount: number, buffer: string, state: string}}
     */
    getTelemetry() {
      return {
        dt: this.dt,
        dtMs: this.dtMs,
        fps: Math.round(this.fps),
        instantFps: this.instantFps,
        minFps: Math.round(this.minFps),
        maxFps: Math.round(this.maxFps),
        frameCount: this.frameCount,
        buffer: `${this.width}x${this.height}`,
        state: this.state
      };
    }

    /**
     * Manually triggers an update of the FPS telemetry UI badge.
     * @param {string} [overrideText]
     */
    updateFpsDisplay(overrideText) {
      this._updateFpsTelemetry(overrideText);
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
      this._stateChangeCallbacks.clear();
      this._stateRenderers.clear();
      this._stateUpdaters.clear();

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

  // Expose States enum directly on constructor
  GameEngine.States = GameStates;

  // Bind InputHandler reference if available
  if (typeof globalThis !== 'undefined' && globalThis.InputHandler) {
    GameEngine.InputHandler = globalThis.InputHandler;
  } else if (typeof window !== 'undefined' && window.InputHandler) {
    GameEngine.InputHandler = window.InputHandler;
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

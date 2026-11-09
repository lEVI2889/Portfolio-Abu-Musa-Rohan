/**
 * InputHandler - Generic Input Handler Logic for Game Engine
 * Manages event listener system for WASD / Arrow keys and basic touch inputs,
 * normalizing directional and action states into a consolidated input object.
 *
 * Part of the 21-Day Antigravity Portfolio Streak (Day 17).
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.InputHandler = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Action mappings for keyboard codes and keys.
   */
  const DEFAULT_KEY_MAP = {
    // Up
    KeyW: 'up',
    ArrowUp: 'up',
    w: 'up',
    W: 'up',

    // Down
    KeyS: 'down',
    ArrowDown: 'down',
    s: 'down',
    S: 'down',

    // Left
    KeyA: 'left',
    ArrowLeft: 'left',
    a: 'left',
    A: 'left',

    // Right
    KeyD: 'right',
    ArrowRight: 'right',
    d: 'right',
    D: 'right',

    // Action (jump/fire/interact)
    Space: 'action',
    ' ': 'action',
    Enter: 'action',

    // Modifier / Utility
    ShiftLeft: 'shift',
    ShiftRight: 'shift',
    Shift: 'shift',
    Escape: 'escape',

    // Engine State Controls
    KeyP: 'pause',
    p: 'pause',
    P: 'pause',
    KeyR: 'restart',
    r: 'restart',
    R: 'restart'
  };

  /**
   * Keys to prevent default browser behavior for (e.g. scrolling page on space / arrows).
   */
  const DEFAULT_PREVENT_KEYS = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Space',
    ' '
  ]);

  /**
   * Default configuration options.
   */
  const DEFAULT_OPTIONS = {
    target: null, // If null, touch listeners bind to window/target passed to constructor
    listenKeyboardOn: 'window', // 'window' | 'target'
    swipeThreshold: 20, // Pixels before touch drag triggers directional state
    tapThreshold: 15, // Max movement in px to still qualify as a tap
    tapMaxDuration: 300, // Max ms to qualify as a tap
    preventDefault: true, // Prevent default on navigation/space keys when target is active
    preventDefaultTouch: true, // Prevent default scrolling on canvas touch
    keyMap: DEFAULT_KEY_MAP
  };

  class InputHandler {
    /**
     * @param {HTMLElement|string} [target] DOM element or selector for touch / scoped events
     * @param {Object} [options={}] Configuration overrides
     */
    constructor(target = null, options = {}) {
      this.options = Object.assign({}, DEFAULT_OPTIONS, options);
      this.keyMap = Object.assign({}, DEFAULT_KEY_MAP, this.options.keyMap || {});
      this.target = typeof target === 'string' && typeof document !== 'undefined'
        ? document.querySelector(target)
        : target;

      // Consolidated Input State Object
      this.state = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
        restart: false,
        shift: false,
        escape: false,

        // Normalized 2D axis vector: x in [-1, 1], y in [-1, 1]
        axes: {
          x: 0,
          y: 0
        },

        // Raw map of currently held keys: { 'KeyW': true, ... }
        keys: {},

        // Detailed touch telemetry
        touch: {
          active: false,
          identifier: null,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          deltaX: 0,
          deltaY: 0,
          distance: 0,
          angle: 0,
          isTap: false
        },

        // Input telemetry
        lastInputType: null, // 'keyboard' | 'touch' | null
        lastActiveTimestamp: 0
      };

      // Frame-level transition tracking for one-frame triggers
      this._justPressed = new Set();
      this._justReleased = new Set();
      this._previousActions = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
        restart: false,
        shift: false,
        escape: false
      };

      // Internal touch timing
      this._touchStartTime = 0;
      this._tapPending = false;

      // Bound listener references
      this._onKeyDown = this._onKeyDown.bind(this);
      this._onKeyUp = this._onKeyUp.bind(this);
      this._onBlur = this._onBlur.bind(this);
      this._onTouchStart = this._onTouchStart.bind(this);
      this._onTouchMove = this._onTouchMove.bind(this);
      this._onTouchEnd = this._onTouchEnd.bind(this);
      this._onTouchCancel = this._onTouchCancel.bind(this);
      this._onPointerDown = this._onPointerDown.bind(this);

      this.isBound = false;
    }

    /**
     * Initialize event listeners on target and window.
     * @returns {boolean} True if successfully bound
     */
    init() {
      if (typeof window === 'undefined') return false;
      if (this.isBound) return true;

      const keyboardTarget = this.options.listenKeyboardOn === 'target' && this.target
        ? this.target
        : window;

      keyboardTarget.addEventListener('keydown', this._onKeyDown);
      keyboardTarget.addEventListener('keyup', this._onKeyUp);
      window.addEventListener('blur', this._onBlur);

      const touchTarget = this.target || window;
      if (touchTarget) {
        touchTarget.addEventListener('touchstart', this._onTouchStart, { passive: !this.options.preventDefaultTouch });
        touchTarget.addEventListener('touchmove', this._onTouchMove, { passive: !this.options.preventDefaultTouch });
        touchTarget.addEventListener('touchend', this._onTouchEnd, { passive: true });
        touchTarget.addEventListener('touchcancel', this._onTouchCancel, { passive: true });

        if (typeof window.PointerEvent !== 'undefined') {
          touchTarget.addEventListener('pointerdown', this._onPointerDown);
        } else {
          touchTarget.addEventListener('mousedown', this._onPointerDown);
        }
      }

      this.isBound = true;
      return true;
    }

    /**
     * Handles pointer/mouse down on target element to trigger click/action state.
     * @param {PointerEvent|MouseEvent} e
     * @private
     */
    _onPointerDown(e) {
      if (e.pointerType && e.pointerType !== 'mouse') return; // Handled by touch listeners
      if (e.button !== 0) return; // Primary button only

      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      this._tapPending = true;
      this._justPressed.add('action');
      this.state.action = true;
      this.state.lastInputType = 'mouse';
      this.state.lastActiveTimestamp = now;
      this._updateDerivedState();
    }

    /**
     * Handles keydown events, recording raw keys and mapping to actions.
     * @param {KeyboardEvent} e
     * @private
     */
    _onKeyDown(e) {
      const code = e.code || e.key;
      const key = e.key;
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      // Check if this key maps to an action
      const action = this.keyMap[code] || this.keyMap[key];

      // Prevent scroll on game keys if enabled
      if (this.options.preventDefault && (DEFAULT_PREVENT_KEYS.has(code) || DEFAULT_PREVENT_KEYS.has(key))) {
        // Prevent default only if event originated from or relates to active game canvas
        const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
        const isCanvasFocused = activeEl && (activeEl === this.target || this.target?.contains(activeEl));
        if (isCanvasFocused || this.options.listenKeyboardOn === 'window') {
          e.preventDefault();
        }
      }

      // Record raw keys
      if (!this.state.keys[code]) {
        this._justPressed.add(code);
        if (action) this._justPressed.add(action);
      }
      this.state.keys[code] = true;
      this.state.keys[key] = true;

      this.state.lastInputType = 'keyboard';
      this.state.lastActiveTimestamp = now;

      // Re-evaluate consolidated action state and axes
      this._updateDerivedState();
    }

    /**
     * Handles keyup events, clearing raw keys and updating actions.
     * @param {KeyboardEvent} e
     * @private
     */
    _onKeyUp(e) {
      const code = e.code || e.key;
      const key = e.key;
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      const action = this.keyMap[code] || this.keyMap[key];

      delete this.state.keys[code];
      delete this.state.keys[key];

      this._justReleased.add(code);
      if (action) this._justReleased.add(action);

      this.state.lastActiveTimestamp = now;
      this._updateDerivedState();
    }

    /**
     * Handles window blur to clear stuck keys when focus leaves the tab.
     * @private
     */
    _onBlur() {
      this.reset();
    }

    /**
     * Handles touchstart events for mobile touch controls.
     * @param {TouchEvent} e
     * @private
     */
    _onTouchStart(e) {
      if (e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      const coords = this._getTouchCoordinates(touch);

      this.state.touch.active = true;
      this.state.touch.identifier = touch.identifier;
      this.state.touch.startX = coords.x;
      this.state.touch.startY = coords.y;
      this.state.touch.currentX = coords.x;
      this.state.touch.currentY = coords.y;
      this.state.touch.deltaX = 0;
      this.state.touch.deltaY = 0;
      this.state.touch.distance = 0;
      this.state.touch.angle = 0;
      this.state.touch.isTap = false;

      this._touchStartTime = now;
      this.state.lastInputType = 'touch';
      this.state.lastActiveTimestamp = now;

      if (this.options.preventDefaultTouch && e.cancelable) {
        e.preventDefault();
      }

      this._updateDerivedState();
    }

    /**
     * Handles touchmove events, updating virtual swipe/drag directions.
     * @param {TouchEvent} e
     * @private
     */
    _onTouchMove(e) {
      if (!this.state.touch.active) return;

      let touch = null;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.state.touch.identifier) {
          touch = e.changedTouches[i];
          break;
        }
      }
      if (!touch) return;

      const coords = this._getTouchCoordinates(touch);
      const deltaX = coords.x - this.state.touch.startX;
      const deltaY = coords.y - this.state.touch.startY;
      const distance = Math.hypot(deltaX, deltaY);
      const angle = Math.atan2(deltaY, deltaX);

      this.state.touch.currentX = coords.x;
      this.state.touch.currentY = coords.y;
      this.state.touch.deltaX = deltaX;
      this.state.touch.deltaY = deltaY;
      this.state.touch.distance = distance;
      this.state.touch.angle = angle;

      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      this.state.lastActiveTimestamp = now;

      if (this.options.preventDefaultTouch && e.cancelable) {
        e.preventDefault();
      }

      this._updateDerivedState();
    }

    /**
     * Handles touchend events, checking for tap triggers and clearing drag.
     * @param {TouchEvent} e
     * @private
     */
    _onTouchEnd(e) {
      if (!this.state.touch.active) return;

      let touch = null;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.state.touch.identifier) {
          touch = e.changedTouches[i];
          break;
        }
      }
      if (!touch) return;

      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const duration = now - this._touchStartTime;
      const isTap = (duration <= this.options.tapMaxDuration) &&
                    (this.state.touch.distance <= this.options.tapThreshold);

      if (isTap) {
        this.state.touch.isTap = true;
        this._tapPending = true;
        this._justPressed.add('action');
      }

      this.state.touch.active = false;
      this.state.touch.identifier = null;
      this.state.touch.deltaX = 0;
      this.state.touch.deltaY = 0;
      this.state.touch.distance = 0;

      this.state.lastActiveTimestamp = now;
      this._updateDerivedState();
    }

    /**
     * Handles touchcancel events cleanly.
     * @param {TouchEvent} e
     * @private
     */
    _onTouchCancel() {
      this.state.touch.active = false;
      this.state.touch.identifier = null;
      this.state.touch.deltaX = 0;
      this.state.touch.deltaY = 0;
      this.state.touch.distance = 0;
      this.state.touch.isTap = false;
      this._updateDerivedState();
    }

    /**
     * Converts touch screen position to normalized target-relative coordinates.
     * @param {Touch} touch
     * @returns {{x: number, y: number}}
     * @private
     */
    _getTouchCoordinates(touch) {
      if (!this.target || typeof this.target.getBoundingClientRect !== 'function') {
        return { x: touch.clientX, y: touch.clientY };
      }
      const rect = this.target.getBoundingClientRect();
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    /**
     * Recomputes normalized directional booleans and axis vectors.
     * Combines keyboard keys (WASD / Arrows) and touch gestures.
     * @private
     */
    _updateDerivedState() {
      const keys = this.state.keys;

      // 1. Keyboard directional states
      const keyUp = Boolean(keys.KeyW || keys.ArrowUp || keys.w || keys.W);
      const keyDown = Boolean(keys.KeyS || keys.ArrowDown || keys.s || keys.S);
      const keyLeft = Boolean(keys.KeyA || keys.ArrowLeft || keys.a || keys.A);
      const keyRight = Boolean(keys.KeyD || keys.ArrowRight || keys.d || keys.D);
      const keyAction = Boolean(keys.Space || keys[' '] || keys.Enter);
      const keyPause = Boolean(keys.KeyP || keys.p || keys.P);
      const keyRestart = Boolean(keys.KeyR || keys.r || keys.R);
      const keyShift = Boolean(keys.ShiftLeft || keys.ShiftRight || keys.Shift);
      const keyEscape = Boolean(keys.Escape);

      // 2. Touch directional states (swipe / drag threshold)
      let touchUp = false;
      let touchDown = false;
      let touchLeft = false;
      let touchRight = false;
      let touchAxisX = 0;
      let touchAxisY = 0;

      if (this.state.touch.active && this.state.touch.distance > this.options.swipeThreshold) {
        const dx = this.state.touch.deltaX;
        const dy = this.state.touch.deltaY;
        const threshold = this.options.swipeThreshold;

        if (dy < -threshold) touchUp = true;
        if (dy > threshold) touchDown = true;
        if (dx < -threshold) touchLeft = true;
        if (dx > threshold) touchRight = true;

        // Continuous normalized touch vector clamped between -1 and 1
        const maxDist = Math.max(threshold * 3, 100);
        touchAxisX = Math.max(-1, Math.min(1, dx / maxDist));
        touchAxisY = Math.max(-1, Math.min(1, dy / maxDist));
      }

      // 3. Consolidated action states
      this.state.up = keyUp || touchUp;
      this.state.down = keyDown || touchDown;
      this.state.left = keyLeft || touchLeft;
      this.state.right = keyRight || touchRight;
      this.state.action = keyAction || this._tapPending;
      this.state.pause = keyPause;
      this.state.restart = keyRestart;
      this.state.shift = keyShift;
      this.state.escape = keyEscape;

      // 4. Consolidated continuous axes vector (-1 to +1)
      let axisX = 0;
      let axisY = 0;

      if (this.state.left) axisX -= 1;
      if (this.state.right) axisX += 1;
      if (this.state.up) axisY -= 1;
      if (this.state.down) axisY += 1;

      // If keyboard is neutral but touch drag is active, use smooth touch vector
      if (axisX === 0 && axisY === 0 && (touchAxisX !== 0 || touchAxisY !== 0)) {
        axisX = touchAxisX;
        axisY = touchAxisY;
      }

      this.state.axes.x = axisX;
      this.state.axes.y = axisY;
    }

    /**
     * Per-frame update hook called by the game loop.
     * Clears one-frame triggers like justPressed and justReleased buffers.
     * @param {number} [dt=0] Delta time in seconds
     */
    update(/* dt */) {
      // Clear tap pending flag after one frame
      if (this._tapPending) {
        this._tapPending = false;
        this._updateDerivedState();
      }

      // Flush one-frame transitions
      this._justPressed.clear();
      this._justReleased.clear();

      // Snapshot actions for change detection
      this._previousActions.up = this.state.up;
      this._previousActions.down = this.state.down;
      this._previousActions.left = this.state.left;
      this._previousActions.right = this.state.right;
      this._previousActions.action = this.state.action;
      this._previousActions.pause = this.state.pause;
      this._previousActions.restart = this.state.restart;
      this._previousActions.shift = this.state.shift;
      this._previousActions.escape = this.state.escape;
    }

    /**
     * Checks if a key code or action name is currently held down.
     * @param {string} actionOrKey e.g. 'up', 'action', 'KeyW', 'ArrowLeft'
     * @returns {boolean}
     */
    isDown(actionOrKey) {
      if (actionOrKey in this.state) {
        return Boolean(this.state[actionOrKey]);
      }
      return Boolean(this.state.keys[actionOrKey]);
    }

    /**
     * Checks if a key code or action name is currently released (up).
     * @param {string} actionOrKey
     * @returns {boolean}
     */
    isUp(actionOrKey) {
      return !this.isDown(actionOrKey);
    }

    /**
     * Returns true only during the frame that the action or key was pressed down.
     * @param {string} actionOrKey
     * @returns {boolean}
     */
    isJustPressed(actionOrKey) {
      return this._justPressed.has(actionOrKey);
    }

    /**
     * Returns true only during the frame that the action or key was released.
     * @param {string} actionOrKey
     * @returns {boolean}
     */
    isJustReleased(actionOrKey) {
      return this._justReleased.has(actionOrKey);
    }

    /**
     * Returns current continuous axis vector { x, y } clamped between -1 and 1.
     * @returns {{x: number, y: number}}
     */
    getAxes() {
      return {
        x: this.state.axes.x,
        y: this.state.axes.y
      };
    }

    /**
     * Returns the full consolidated input state object.
     * @returns {Object}
     */
    getState() {
      return this.state;
    }

    /**
     * Resets all input states, keys, and touch buffers.
     */
    reset() {
      this.state.up = false;
      this.state.down = false;
      this.state.left = false;
      this.state.right = false;
      this.state.action = false;
      this.state.pause = false;
      this.state.restart = false;
      this.state.shift = false;
      this.state.escape = false;
      this.state.axes.x = 0;
      this.state.axes.y = 0;
      this.state.keys = {};
      this.state.touch.active = false;
      this.state.touch.identifier = null;
      this.state.touch.deltaX = 0;
      this.state.touch.deltaY = 0;
      this.state.touch.distance = 0;
      this.state.touch.isTap = false;
      this._tapPending = false;
      this._justPressed.clear();
      this._justReleased.clear();
    }

    /**
     * Unbinds all listeners and cleans up resources.
     */
    destroy() {
      if (!this.isBound || typeof window === 'undefined') return;

      const keyboardTarget = this.options.listenKeyboardOn === 'target' && this.target
        ? this.target
        : window;

      keyboardTarget.removeEventListener('keydown', this._onKeyDown);
      keyboardTarget.removeEventListener('keyup', this._onKeyUp);
      window.removeEventListener('blur', this._onBlur);

      const touchTarget = this.target || window;
      if (touchTarget) {
        touchTarget.removeEventListener('touchstart', this._onTouchStart);
        touchTarget.removeEventListener('touchmove', this._onTouchMove);
        touchTarget.removeEventListener('touchend', this._onTouchEnd);
        touchTarget.removeEventListener('touchcancel', this._onTouchCancel);
        touchTarget.removeEventListener('pointerdown', this._onPointerDown);
        touchTarget.removeEventListener('mousedown', this._onPointerDown);
      }

      this.reset();
      this.isBound = false;
      this.target = null;
    }
  }

  return InputHandler;
});

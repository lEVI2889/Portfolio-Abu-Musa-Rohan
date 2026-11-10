/**
 * Entity - Base Generic Entity Class for Game Engine
 * Establishes a foundational JavaScript class for game entities with
 * x, y, width, height properties and extensible empty update/draw methods.
 *
 * Part of the 21-Day Antigravity Portfolio Streak (Day 20).
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.Entity = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let _entityIdCounter = 0;

  /**
   * Base Generic Entity Class.
   * Encapsulates spatial dimensions (x, y, width, height), velocity,
   * lifecycle state, and empty lifecycle hooks for frame update and canvas rendering.
   */
  class Entity {
    /**
     * Creates a new generic Entity instance.
     * @param {Object} [options={}] Configuration options for the entity
     * @param {number} [options.x=0] Horizontal position in canvas coordinate space
     * @param {number} [options.y=0] Vertical position in canvas coordinate space
     * @param {number} [options.width=0] Width dimension of the entity
     * @param {number} [options.height=0] Height dimension of the entity
     * @param {number} [options.vx=0] Horizontal velocity
     * @param {number} [options.vy=0] Vertical velocity
     * @param {string} [options.id] Unique entity identifier (auto-generated if omitted)
     * @param {string} [options.type='generic'] Entity type classification
     * @param {string} [options.tag=''] Optional categorization tag
     * @param {boolean} [options.active=true] Whether entity receives update calls
     * @param {boolean} [options.visible=true] Whether entity receives draw calls
     * @param {number} [options.zIndex=0] Rendering layer order
     */
    constructor(options = {}) {
      // Primary spatial coordinates and bounding dimensions
      this.x = typeof options.x === 'number' ? options.x : 0;
      this.y = typeof options.y === 'number' ? options.y : 0;
      this.width = typeof options.width === 'number' ? options.width : 0;
      this.height = typeof options.height === 'number' ? options.height : 0;

      // Velocity vectors
      this.vx = typeof options.vx === 'number' ? options.vx : 0;
      this.vy = typeof options.vy === 'number' ? options.vy : 0;

      // Metadata & identification
      this.id = options.id || `entity_${++_entityIdCounter}_${Math.random().toString(36).substr(2, 6)}`;
      this.type = options.type || 'generic';
      this.tag = options.tag || '';

      // Lifecycle flags
      this.active = options.active !== undefined ? Boolean(options.active) : true;
      this.visible = options.visible !== undefined ? Boolean(options.visible) : true;
      this.isDestroyed = false;
      this.zIndex = typeof options.zIndex === 'number' ? options.zIndex : 0;

      // Host engine reference (set when attached to GameEngine)
      this.engine = null;
    }

    /**
     * Updates entity state for the current frame.
     * Empty stub method designed to be overridden by subclasses or custom game logic.
     * @param {number} [dt=0] Delta time in seconds since the previous frame
     */
    update(dt = 0) {
      // Base generic entity update stub - override in subclasses or instances
    }

    /**
     * Renders entity visuals onto the canvas context.
     * Empty stub method designed to be overridden by subclasses or custom renderers.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D rendering context
     */
    draw(ctx) {
      // Base generic entity draw stub - override in subclasses or instances
    }

    /**
     * Semantic alias for draw(ctx) to support render-oriented engines.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D rendering context
     */
    render(ctx) {
      this.draw(ctx);
    }

    /**
     * Returns an Axis-Aligned Bounding Box (AABB) object for spatial queries.
     * @returns {{x: number, y: number, width: number, height: number, left: number, top: number, right: number, bottom: number}}
     */
    getBounds() {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        left: this.x,
        top: this.y,
        right: this.x + this.width,
        bottom: this.y + this.height
      };
    }

    /**
     * Simple AABB collision detection against another bounding box or entity.
     * @param {Entity|{x: number, y: number, width: number, height: number}} other
     * @returns {boolean}
     */
    collidesWith(other) {
      if (!other) return false;
      const b1 = this.getBounds();
      const b2 = typeof other.getBounds === 'function' ? other.getBounds() : other;
      return (
        b1.left < b2.x + b2.width &&
        b1.right > b2.x &&
        b1.top < b2.y + b2.height &&
        b1.bottom > b2.y
      );
    }

    /**
     * Sets position coordinates.
     * @param {number} x
     * @param {number} y
     * @returns {Entity} this
     */
    setPosition(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }

    /**
     * Sets entity dimensions.
     * @param {number} width
     * @param {number} height
     * @returns {Entity} this
     */
    setSize(width, height) {
      this.width = width;
      this.height = height;
      return this;
    }

    /**
     * Marks entity as destroyed and unlinks from parent engine if attached.
     */
    destroy() {
      this.isDestroyed = true;
      this.active = false;
      this.visible = false;
      if (this.engine && typeof this.engine.removeEntity === 'function') {
        this.engine.removeEntity(this);
      }
    }
  }

  return Entity;
});

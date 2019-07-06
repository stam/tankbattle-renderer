const WallRenderer = window.WallRenderer;

class _EventBus {
  constructor() {
    this.bus = document.createElement('_event-bus');
  }

  addEventListener(event, callback) {
    this.bus.addEventListener(event, callback);
  }

  removeEventListener(event, callback) {
    this.bus.removeEventListener(event, callback);
  }

  dispatchEvent(event, detail = {}) {
    this.bus.dispatchEvent(new CustomEvent(event, { detail }));
  }
}

/**
 * Reads the world state.
 * Determines the changes since last state
 * Fires the relevant updates (create, update, delete) to its respective renderers
 */
class _WorldStateManager {
  constructor(data, scene) {
    this.bus = new _EventBus();
    this.wallRenderer = new WallRenderer(scene, this.bus);
  }

  parse() {
    this.bus.dispatchEvent('henk');
    // parseTankChanges
  }
}

window.WorldStateManager = _WorldStateManager;

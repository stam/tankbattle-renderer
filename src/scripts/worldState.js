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
  constructor() {
    this.bus = new _EventBus();
    
    this.walls = {};
    this.trees = {};
    this.tanks = {};
    this.lasers = {};
    this.explosions = {};
  }

  initialize(initialWorld) {
    this.parseStatics(initialWorld);
  }

  parseStatics(initialWorld) {
    initialWorld.staticObjects
      .filter(object => object.type === 'wall')
      .map(wall => {
        this.walls[wall.id] = wall;
        this.bus.dispatchEvent('WALL_CREATE', wall);
      });
  }

  parse() {
    // this.bus.dispatchEvent('henk');
    // parseTankChanges
  }
}

window.WorldStateManager = _WorldStateManager;

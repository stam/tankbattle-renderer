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
      .forEach(wall => {
        this.walls[wall.id] = wall;
        this.bus.dispatchEvent('WALL_CREATE', wall);
      });
  }

  parse(worldData) {
    const newIds = worldData.tanks.map(t => t.id);
    const existingTanks = Object.values(this.tanks);

    // Find which tanks are deleted:
    // Existed in previous state but are not in current state
    existingTanks.forEach((existingTank) => {
      const id = existingTank.id;

      if (!newIds.includes(id)) {
        this.bus.dispatchEvent('TANK_DELETE', this.tanks[id]);
        delete this.tanks[id];
      }
    });

    worldData.tanks.forEach(updatedTank => {
      if (this.tanks[updatedTank.id] === undefined) {
        this.tanks[updatedTank.id] = updatedTank;

        this.bus.dispatchEvent('TANK_CREATE', updatedTank);
        return;
      }
      this.bus.dispatchEvent('TANK_UPDATE', updatedTank);
    });
  }
}

window.WorldStateManager = _WorldStateManager;

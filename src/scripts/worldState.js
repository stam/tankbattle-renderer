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
    initialWorld.walls
      .forEach(wall => {
        this.walls[wall.uuid] = wall;
        this.bus.dispatchEvent('WALL_CREATE', wall);
      });
  }

  parse(worldData) {
    this.diff(this.tanks, worldData.tanks, 'TANK');

    this.diff(this.trees, worldData.trees, 'TREE');
    this.diff(this.lasers, worldData.lasers, 'LASER');
  }

  diff(oldStateDict, newStateArray, eventPrefix) {
    const newIds = newStateArray.map(t => t.uuid);
    const existingAssets = Object.values(oldStateDict);

    // Find which tanks are deleted:
    // Existed in previous state but are not in current state
    existingAssets.forEach((existingAsset) => {
      const id = existingAsset.uuid;

      if (!newIds.includes(id)) {
        this.bus.dispatchEvent(`${eventPrefix}_DELETE`, oldStateDict[id]);
        delete oldStateDict[id];
      }
    });

    newStateArray.forEach(updatedAsset => {
      const oldState = oldStateDict[updatedAsset.uuid];
      if (oldState === undefined) {
        oldStateDict[updatedAsset.uuid] = updatedAsset;
        
        this.bus.dispatchEvent(`${eventPrefix}_CREATE`, updatedAsset);
        return;
      }
      oldStateDict[updatedAsset.uuid] = updatedAsset;

      if (updatedAsset.position) {
        if (oldState.position[0] !== updatedAsset.position[0] || oldState.position[1] !== updatedAsset.position[1]) {
          this.bus.dispatchEvent(`${eventPrefix}_UPDATE`, updatedAsset);
        }
      }
    });
  }
}

window.WorldStateManager = _WorldStateManager;

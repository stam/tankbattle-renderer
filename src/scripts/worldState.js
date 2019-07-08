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
    this.diff(this.tanks, worldData.tanks, 'TANK');

    const newTrees = worldData.staticObjects.filter(obj => obj.type === 'tree');
    this.diff(this.trees, newTrees, 'TREE');
    this.diff(this.lasers, worldData.lasers, 'LASER');
  }

  diff(oldStateDict, newStateArray, eventPrefix) {
    const newIds = newStateArray.map(t => t.id);
    const existingAssets = Object.values(oldStateDict);

    // Find which tanks are deleted:
    // Existed in previous state but are not in current state
    existingAssets.forEach((existingAsset) => {
      const id = existingAsset.id;

      if (!newIds.includes(id)) {
        this.bus.dispatchEvent(`${eventPrefix}_DELETE`, oldStateDict[id]);
        delete oldStateDict[id];
      }
    });

    newStateArray.forEach(updatedAsset => {
      const oldState = oldStateDict[updatedAsset.id];
      if (oldState === undefined) {
        oldStateDict[updatedAsset.id] = updatedAsset;
        
        this.bus.dispatchEvent(`${eventPrefix}_CREATE`, updatedAsset);
        return;
      }
      oldStateDict[updatedAsset.id] = updatedAsset;

      if (updatedAsset.position) {
        if (oldState.position[0] !== updatedAsset.position[0] || oldState.position[1] !== updatedAsset.position[1]) {
          this.bus.dispatchEvent(`${eventPrefix}_UPDATE`, updatedAsset);
        }
      }
    });
  }
}

window.WorldStateManager = _WorldStateManager;

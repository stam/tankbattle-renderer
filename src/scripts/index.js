const ThreeRenderer = window.ThreeRenderer;
const PlayerListRenderer = window.PlayerListRenderer;
const TreeRenderer = window.TreeRenderer;
const LaserRenderer = window.LaserRenderer;
const WallRenderer = window.WallRenderer;
const TankRenderer = window.TankRenderer;
const WorldStateManager = window.WorldStateManager;

class Controller {
  constructor() {
    this.threeRenderer = new ThreeRenderer(document.querySelector('.grid'));
    this.playerRenderer = new PlayerListRenderer(document.querySelector('.player-list'));
    this.worldStateManager = new WorldStateManager();
    this._interval = setInterval(() => this.tick(), 100);
  }

  async initialize() {
    const data = await this.fetchWorld();
    this.threeRenderer.initialize(data);

    this.wallRenderer = new WallRenderer(this.threeRenderer);
    this.laserRenderer = new LaserRenderer(this.threeRenderer);
    this.tankRenderer = new TankRenderer(this.threeRenderer);
    this.treeRenderer = new TreeRenderer(this.threeRenderer);

    this.bindRenderers();

    this.worldStateManager.initialize(data);
    this.updateViews(data);
    // this.test(data);
  }

  bindRenderers() {
    this.wallRenderer.bind(this.worldStateManager.bus);
    this.treeRenderer.bind(this.worldStateManager.bus);
    this.laserRenderer.bind(this.worldStateManager.bus);
    this.tankRenderer.bind(this.worldStateManager.bus);
  }

  test(data) {
    const updateData = JSON.parse(JSON.stringify(data));
    const deleteData = JSON.parse(JSON.stringify(data));

    setTimeout(() => {
      updateData.tanks[0].position = [10, 6];
      this.updateViews(updateData);
    }, 1000);

    setTimeout(() => {
      updateData.tanks[0].position = [9, 6];
      this.updateViews(updateData);
    }, 2000);

    setTimeout(() => {
      updateData.tanks[0].position = [8, 6];
      this.updateViews(updateData);
    }, 3000);

    setTimeout(() => {
      updateData.tanks[0].position = [8, 7];
      this.updateViews(updateData);
    }, 4000);

    
    setTimeout(() => {
      deleteData.tanks = [];
      this.updateViews(deleteData);
    }, 5000);
  }

  async fetchWorld() {
    // const response = await fetch('http://localhost:3000/world');
    // const data = await response.json();
    // return data;

    return window._world;
  }

  async tick() {
    const data = await this.fetchWorld();
    // this.updateViews(data);
  }

  async updateViews(data) {
    this.worldStateManager.parse(data);
    this.playerRenderer.render(data.tanks);
  }
}


window.onload = async () => {
  const controller = new Controller();
  await controller.initialize();
};

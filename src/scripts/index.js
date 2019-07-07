const ThreeRenderer = window.ThreeRenderer;
const PlayerListRenderer = window.PlayerListRenderer;
const TreeRenderer = window.TreeRenderer;
const LaserRenderer = window.LaserRenderer;
const WallRenderer = window.WallRenderer;
const TankRenderer = window.TankRenderer;
const ModelLoader = window.ModelLoader;
const WorldStateManager = window.WorldStateManager;


class Controller {
  constructor() {
    this.threeRenderer = new ThreeRenderer(document.querySelector('.grid'));
    this.playerRenderer = new PlayerListRenderer(document.querySelector('.player-list'));
    this.worldStateManager = new WorldStateManager();
    this.modelLoader = new ModelLoader();
  }

  async initialize() {
    const data = await this.fetchWorld();
    this.threeRenderer.initialize(data);

    await this.modelLoader.load();

    this.wallRenderer = new WallRenderer(this.threeRenderer);
    this.laserRenderer = new LaserRenderer(this.threeRenderer);
    this.tankRenderer = new TankRenderer(this.threeRenderer, this.modelLoader.tankModel);
    this.treeRenderer = new TreeRenderer(this.threeRenderer);

    this.bindRenderers();

    this.worldStateManager.initialize(data);
    this.updateViews(data);

    this._interval = setInterval(() => this.tick(), 100);
  }

  bindRenderers() {
    this.wallRenderer.bind(this.worldStateManager.bus);
    this.treeRenderer.bind(this.worldStateManager.bus);
    this.laserRenderer.bind(this.worldStateManager.bus);
    this.tankRenderer.bind(this.worldStateManager.bus);
  }


  async fetchWorld() {
    const response = await fetch('/world');
    const data = await response.json();
    return data;
  }

  async tick() {
    const data = await this.fetchWorld();
    this.updateViews(data);
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

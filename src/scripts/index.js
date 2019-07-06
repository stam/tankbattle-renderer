const ThreeRenderer = window.ThreeRenderer;
const PlayerListRenderer = window.PlayerListRenderer;
const WallRenderer = window.WallRenderer;
const TankRenderer = window.TankRenderer;
const WorldStateManager = window.WorldStateManager;

class Controller {
  constructor() {
    this.threeRenderer = new ThreeRenderer(document.querySelector('.grid'));
    this.playerRenderer = new PlayerListRenderer(document.querySelector('.player-list'));
    this.worldStateManager = new WorldStateManager();
    this._interval = setInterval(() => this.tick(), 1000);
  }
  
  async initialize() {
    const data = await this.fetchWorld();
    this.threeRenderer.initialize(data);

    this.wallRenderer = new WallRenderer(this.threeRenderer);
    this.tankRenderer = new TankRenderer(this.threeRenderer);

    this.bindRenderers();
    
    this.worldStateManager.initialize(data);
    this.updateViews(data);
    this.test(data);
  }

  test(data) {
    const newData = JSON.parse(JSON.stringify(data));

    this.updateViews(newData);
    newData.tanks = [];
    this.updateViews(newData);
  }

  bindRenderers() {
    this.wallRenderer.bind(this.worldStateManager.bus);
    this.tankRenderer.bind(this.worldStateManager.bus);
  }

  async fetchWorld() {
    // const response = await fetch('/world');
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

// function renderWorld(data) {
//   const worldRenderer = new ThreeRenderer(document.querySelector('.grid'));
//   const playerRenderer = new PlayerListRenderer(document.querySelector('.player-list'));

//   worldRenderer.render(data);
//   playerRenderer.render(data.tanks);
// }

// async function tick() {
//   const response = await fetch('/world');
//   const data = await response.json();
//   renderWorld(data);
// }

// function startGameloop() {
//   setInterval(tick, 100);
// }

window.onload = async () => {
  const controller = new Controller();
  await controller.initialize();
  // controller.start();
  // renderWorld(window._world);
};

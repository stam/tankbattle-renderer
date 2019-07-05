const TILE_EMPTY = 'empty';
const TILE_TANK = 'tank';
const TILE_TREE = 'tree';
const TILE_WALL = 'wall';
const TILE_SIZE = 50;
const THREE = window.THREE;

class World {
  parse(worldData) {
    this.grid = this.createGrid(worldData.dimensions.width, worldData.dimensions.width);
    this.players = [];

    this.addLasers(worldData.lasers);
    this.addAssets(worldData.staticObjects);
    this.addTanks(worldData.tanks);
  }

  createGrid(width, height) {
    const grid = [];
    for (let x = 0; x < width; x++) {
      const row = [];

      for (let y = 0; y < height; y++) {
        row.push({
          type: TILE_EMPTY,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  addAssets(objects) {
    objects.forEach(object => {
      const [x, y] = object.position;

      this.grid[x][y] = object;
    });
  }

  addTanks(tanks) {
    tanks.forEach(tank => {
      const [x, y] = tank.position;

      this.grid[x][y] = tank;
      this.grid[x][y].type = TILE_TANK;

      this.players.push(tank);
    });
  }

  addLasers(laserData) {
    this.lasers = laserData;
  }
}

function abortChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

class GridRenderer {
  constructor(domTarget) {
    this.domTarget = domTarget;
    abortChildren(this.domTarget);
  }

  render(world) {
    world.grid.forEach(column => {
      let element = document.createElement('div');
      element.setAttribute('class', 'column');

      column.forEach(entity => {
        const tileElement = this.renderTile(entity);
        element.appendChild(tileElement);
      });
      this.domTarget.appendChild(element);
    });
    this.renderLasers(world.lasers);
  }

  renderTile(entity) {
    const element = document.createElement('div');
    element.classList.add('tile');

    switch (entity.type) {
      case TILE_EMPTY:
        break;
      case TILE_TANK:
        element.classList.add('tank');
        element.classList.add(entity.orientation);
        element.setAttribute('style', `background-color: ${entity.color}`);
        break;
      case TILE_TREE:
        element.classList.add('tree');
        break;
      case TILE_WALL:
        element.classList.add('wall');
        break;
    }
    return element;
  }

  renderLasers(lasers) {
    lasers.forEach(laser => {
      const element = document.createElement('div');
      element.classList.add('laser');
      const [startX, startY] = laser.startPos;
      const [endX, endY] = laser.endPos;

      let width;
      let height;
      let left = startX;
      let top = startY;

      if (['north', 'south'].includes(laser.direction)) {
        // vertical
        width = TILE_SIZE;
        height = (Math.abs(endY - startY) + 1) * TILE_SIZE;
        top = Math.min(startY, endY);
      } else {
        // horizontal
        height = TILE_SIZE;
        width = (Math.abs(endX - startX) + 1) * TILE_SIZE;
        left = Math.min(startX, endX);
      }

      element.setAttribute(
        'style',
        `left: ${left * TILE_SIZE}px; top: ${top *
          TILE_SIZE}px; width: ${width}px; height: ${height}px;`,
      );
      this.domTarget.append(element);
    });
  }
}

class WorldRenderer3d {
  constructor(container) {
    this.container = container;
  }

  createScene() {
    const { width, height } = this.container.getBoundingClientRect();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( width, height );
    this.container.appendChild( this.renderer.domElement );
  }

  addLighting() {
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 50, 0 );
    this.scene.add( hemiLight );
    const hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 );
    this.scene.add( hemiLightHelper );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( - 1, 1.75, 1 );
    dirLight.position.multiplyScalar( 30 );
    this.scene.add( dirLight );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    var d = 50;
    dirLight.shadow.camera.left = - d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = - d;
    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = - 0.0001;
    const dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 10 );
    this.scene.add( dirLightHeper );
  }
  
  createMap() {
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
    this.cube = new THREE.Mesh( geometry, material );
    this.scene.add( this.cube );
    this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
    this.camera.position.z = 5;
  }

  render() {
    this.createScene();
    this.addLighting();
    this.createMap();

    this.animate();
  }
  
  animate() {
    this.controls.update();
    // this.cube.rotation.x += 0.01;
    // this.cube.rotation.y += 0.01;
    window.requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera );
  }
}

class PlayerListRenderer {
  constructor(domTarget) {
    this.domTarget = domTarget;
    abortChildren(this.domTarget);
  }

  render(players) {
    players.forEach(player => {
      this.renderPlayer(player);
    });
  }

  renderPlayer(player) {
    const element = document.createElement('div');
    element.classList.add('player');

    const color = document.createElement('div');
    color.classList.add('color-indicator');
    color.setAttribute('style', `background-color: ${player.color}`);
    element.appendChild(color);

    const name = document.createElement('p');
    name.classList.add('player-name');
    name.innerHTML = player.name;
    element.appendChild(name);

    const life = document.createElement('p');
    life.classList.add('player-life');
    const hearts = new Array(player.energy).fill('&#10084;');
    life.innerHTML = hearts.join('');
    element.appendChild(life);

    this.domTarget.appendChild(element);
  }
}

function renderWorld(data) {
  const worldRenderer = new WorldRenderer3d(document.querySelector('.grid'));
  const playerRenderer = new PlayerListRenderer(document.querySelector('.player-list'));
  const world = new World();

  world.parse(data);
  worldRenderer.render(world);
  playerRenderer.render(world.players);
}

async function tick() {
  const response = await fetch('/world');
  const data = await response.json();
  renderWorld(data);
}

function startGameloop() {
  setInterval(tick, 100);
}

window.onload = () => {
  renderWorld(window._world);
};

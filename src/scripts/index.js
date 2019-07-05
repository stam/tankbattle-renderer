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

const SIZE = 3;
const MAP_SIZE = 12;

class WorldRenderer3d {
  constructor(container) {
    this.container = container;
  }

  createScene() {
    const { width, height } = this.container.getBoundingClientRect();
    this.scene = new THREE.Scene();
    
    const aspect = width / height;
    const d = 20;
    this.camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000  );
    this.camera.position.set( 20, 20, 20 );
    this.camera.lookAt( this.scene.position );
    
    
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(0xFFFFFF, 1);
    this.renderer.setSize( width, height );
    this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
    this.container.appendChild( this.renderer.domElement );
  }

  addLighting() {
    const hemisphere = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    this.scene.add( hemisphere );

    const sun = new THREE.PointLight( 0xffffff, 0.8 );
    sun.position.set( 0, 50, 50 );
    this.scene.add( sun );
  }
  
  createMap() {
    const geometry = new THREE.PlaneGeometry( MAP_SIZE * SIZE, MAP_SIZE * SIZE, 32 );
    const material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
    const plane = new THREE.Mesh( geometry, material );
    plane.rotateX( - Math.PI / 2);

    this.scene.add( plane );
    this.scene.add( new THREE.AxisHelper( 40 ) );
  }

  render(data) {
    this.createScene();
    this.addLighting();
    this.createMap();
    
    const walls = data.staticObjects.filter(obj => obj.type === 'wall');
    this.createWalls(walls);
    this.createTanks(data.tanks);

    const trees = data.staticObjects.filter(obj => obj.type === 'tree');
    this.createTrees(trees);

    this.createLasers(data.lasers);

    this.animate();
  }

  convertFromGridToWold(x, y) {
    // WIDTH 1 in grid size is SIZE in threejs.
    // Then the center is at the center of the map instead of 0,0
    const worldX = (SIZE * y) - (SIZE * (0.5 * MAP_SIZE - 0.5));
    const worldZ = (SIZE * (0.5 * MAP_SIZE - 0.5)) - (SIZE * x);

    return [worldX, worldZ];
  }

  createWalls(walls) {
    walls.forEach(wall => {
      this.createWall(wall.position[0], wall.position[1]);
    });
  }

  createTanks(tanks) {
    const geometry = new THREE.BoxGeometry(SIZE, 2, SIZE);

    const material = new THREE.MeshStandardMaterial();
    material.color.setHex(0x1A560A);

    tanks.map(tank => {
      const [x, y] = tank.position;
      const mesh = new THREE.Mesh( geometry, material );
      this.scene.add( mesh );
      mesh.position.y = 1;
  
      const [worldX, worldZ] = this.convertFromGridToWold(x, y);
  
      mesh.position.x = worldX;
      mesh.position.z = worldZ;
    });
  }

  createTrees(trees) {
    const geometry = new THREE.BoxGeometry(1, 4, 1);

    const material = new THREE.MeshStandardMaterial();
    material.color.setHex(0x4E2D04);

    trees.map(tree => {
      const [x, y] = tree.position;
      const mesh = new THREE.Mesh( geometry, material );
      this.scene.add( mesh );
      mesh.position.y = 2;
  
      const [worldX, worldZ] = this.convertFromGridToWold(x, y);
  
      mesh.position.x = worldX;
      mesh.position.z = worldZ;
    });
  }

  createWall(x, y) {
    const geometry = new THREE.BoxGeometry( SIZE, 1, SIZE);

    const material = new THREE.MeshStandardMaterial();
    material.color.setHex(0xffffff);

    const mesh = new THREE.Mesh( geometry, material );
    this.scene.add( mesh );
    mesh.position.y = 0.5;

    const [worldX, worldZ] = this.convertFromGridToWold(x, y);

    mesh.position.x = worldX;
    mesh.position.z = worldZ;
  }

  createLasers(lasers) {
    const geometry = new THREE.BoxGeometry(3, 1, 1);

    const material = new THREE.MeshNormalMaterial();
    // material.color.setHex(0xFE69B4);

    lasers.forEach(laser => {
      const [xStart, yStart] = laser.startPos;
      this.createObjectAtPosition(geometry, material, xStart, yStart, 1.5);
      
      const [xEnd, yEnd] = laser.endPos;
      this.createObjectAtPosition(geometry, material, xEnd, yEnd, 1.5);

      for (let yIntermediate = yStart; yIntermediate <= yEnd; yIntermediate++) {
        this.createObjectAtPosition(geometry, material, 1, yIntermediate, 1.5);
      }
    });
  }

  createObjectAtPosition(geometry, material, x, y, height) {
    const [worldX, worldZ] = this.convertFromGridToWold(x, y);
    const mesh = new THREE.Mesh( geometry, material);

    mesh.position.y = height;
    mesh.position.x = worldX;
    mesh.position.z = worldZ;
    this.scene.add( mesh );
  }
  
  animate() {
    this.controls.update();
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
  worldRenderer.render(data);
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

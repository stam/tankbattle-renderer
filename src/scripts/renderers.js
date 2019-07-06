const SIZE = 3;
const THREE = window.THREE;


function getValuesBetween(start, end) {
  const output = [];
  let value = start;

  while (value <= end) {
    output.push(value);
    value++;
  }
  return output;
}

function getIntermediatePositions(startPosition, endPosition) {
  const [startX, startY] = startPosition;
  const [endX, endY] = endPosition;
  const output = [];
  const xIntermediate = getValuesBetween(startX, endX);
  const yIntermediate = getValuesBetween(startY, endY);

  xIntermediate.forEach(x => {
    yIntermediate.forEach(y => {
      if (x === startX && y === startY || x === endX && y === endY ) {
        return;
      }
      output.push([x, y]);
    });
  });

  return output;
}

class _WallRenderer {
  constructor(threeRenderer) {
    this.threeRenderer = threeRenderer;
  }

  bind(bus) {
    bus.addEventListener('WALL_CREATE', this.createWall.bind(this));
  }

  createWall(wallCreatedEvent) {
    const { detail: wall } = wallCreatedEvent;
    const [x, y] = wall.position;
    const geometry = new THREE.BoxGeometry( SIZE, 1, SIZE);

    const material = new THREE.MeshStandardMaterial();
    material.color.setHex(0xffffff);

    const mesh = new THREE.Mesh( geometry, material );
    this.threeRenderer.addToScene(mesh);
    this.threeRenderer.setPosition(mesh, x, y);
    mesh.position.y = 0.5;
  }
}

class _ThreeRenderer {
  constructor(container) {
    this.container = container;
  }

  initialize(worldData) {
    const { width, height } = worldData.dimensions;
    this.width = width;
    this.height = height;

    this.createScene();
    this.addLighting();
    this.createMap(width, height);
    this.animate();
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

  addToScene(mesh) {
    this.scene.add(mesh);
  }

  setPosition(mesh, x, y) {
    const [worldX, worldZ] = this.convertFromGridToWold(x, y);

    mesh.position.x = worldX;
    mesh.position.z = worldZ;
  }

  addLighting() {
    const hemisphere = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    this.scene.add( hemisphere );

    const sun = new THREE.PointLight( 0xffffff, 0.8 );
    sun.position.set( 0, 50, 50 );
    this.scene.add( sun );
  }
  
  createMap(width, height) {
    const geometry = new THREE.PlaneGeometry( width * SIZE, height * SIZE, 32 );
    const material = new THREE.MeshBasicMaterial( {color: 0xFFFFFF, side: THREE.DoubleSide} );
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
    const worldX = (SIZE * y) - (SIZE * (0.5 * this.width - 0.5));
    const worldZ = (SIZE * (0.5 * this.height - 0.5)) - (SIZE * x);

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

      const intermediatePositions = getIntermediatePositions(laser.startPos, laser.endPos);

      intermediatePositions.forEach(position => {
        this.createObjectAtPosition(geometry, material, position[0], position[1], 1.5);
      });
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
    window.requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera );
  }
}

window.WallRenderer = _WallRenderer;
window.ThreeRenderer = _ThreeRenderer;
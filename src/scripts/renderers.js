const SIZE = 3;
const THREE = window.THREE;

function getValuesBetween(start, end) {
  const output = [];

  const min = Math.min(start, end);
  const max = Math.max(start, end);
  let value = min;

  while (value <= max) {
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
      if ((x === startX && y === startY) || (x === endX && y === endY)) {
        return;
      }
      output.push([x, y]);
    });
  });

  return output;
}

class _BaseRenderer {
  constructor(threeRenderer) {
    this.meshes = {};
    this.threeRenderer = threeRenderer;
  }

  create(assetEvent) {
    const { detail: asset } = assetEvent;
    const [x, y] = asset.position;
    const mesh = this.threeRenderer.createObjectAtPosition(
      this.geometry,
      this.material,
      x,
      y,
      this.zPosition,
    );
    mesh.castShadow = true;
    this.threeRenderer.addToScene(mesh);

    this.meshes[asset.id] = mesh;
  }

  delete(assetEvent) {
    const { detail: asset } = assetEvent;

    const mesh = this.meshes[asset.id];
    this.threeRenderer.removeFromScene(mesh);
    delete this.meshes[asset.id];
  }
}

class _LaserRenderer extends _BaseRenderer {
  constructor(...args) {
    super(...args);

    this.zPosition = 2;
    this.geometry = new THREE.BoxGeometry(1.25, 0.5, 0.5);
    this.material = new THREE.MeshNormalMaterial();
  }

  bind(bus) {
    bus.addEventListener('LASER_CREATE', this.create.bind(this));
    bus.addEventListener('LASER_DELETE', this.delete.bind(this));
  }

  create(assetEvent) {
    const { detail: laser } = assetEvent;

    const group = new THREE.Group();

    const [xStart, yStart] = laser.startPos;
    const startMesh = this.threeRenderer.createObjectAtPosition(
      this.geometry,
      this.material,
      xStart,
      yStart,
      this.zPosition,
    );
    group.add(startMesh);

    const [xEnd, yEnd] = laser.endPos;
    const endMesh = this.threeRenderer.createObjectAtPosition(
      this.geometry,
      this.material,
      xEnd,
      yEnd,
      this.zPosition,
    );
    group.add(endMesh);

    const intermediatePositions = getIntermediatePositions(laser.startPos, laser.endPos);
    intermediatePositions.forEach(position => {
      const intermediateMesh = this.threeRenderer.createObjectAtPosition(
        this.geometry,
        this.material,
        position[0],
        position[1],
        this.zPosition,
      );
      group.add(intermediateMesh);
    });

    if (['east', 'west'].includes(laser.direction)) {
      group.children.forEach(mesh => {
        mesh.rotation.y = 0.5 * Math.PI;
      });
    }

    this.threeRenderer.addToScene(group);
    this.meshes[laser.id] = group;
  }
}

class _TreeRenderer extends _BaseRenderer {
  constructor(renderer, treeMesh) {
    super(renderer);

    this.treeMesh = treeMesh;
    this.zPosition = 2;
    this.geometry = new THREE.BoxGeometry(1, 4, 1);
    this.material = new THREE.MeshStandardMaterial();
    this.material.color.setHex(0x4e2d04);
  }

  create(assetEvent) {
    const { detail: asset } = assetEvent;
    const [x, y] = asset.position;


    const mesh = this.treeMesh.clone();
    mesh.position.y = 1.65;
    mesh.castShadow = true;

    this.threeRenderer.setPosition(mesh, x, y);
    this.threeRenderer.addToScene(mesh);

    this.meshes[asset.id] = mesh;
  }

  bind(bus) {
    bus.addEventListener('TREE_CREATE', this.create.bind(this));
    // Trees don't need updates
    bus.addEventListener('TREE_DELETE', this.delete.bind(this));
  }
}

class _TankRenderer extends _BaseRenderer {
  constructor(renderer, tankMesh) {
    super(renderer);

    this.tankMesh = tankMesh;
  }

  update(tankEvent) {
    const { detail: tank } = tankEvent;
    const [x, y] = tank.position;
    const mesh = this.meshes[tank.id];
    this.threeRenderer.setPosition(mesh, x, y);
    this.threeRenderer.setRotation(mesh, tank.orientation);

    return mesh;
  }


  create(assetEvent) {
    const { detail: asset } = assetEvent;
    const [x, y] = asset.position;


    const mesh = this.tankMesh.clone();
    mesh.position.y = 1.65;
    mesh.children[0].castShadow = true;

    this.threeRenderer.setPosition(mesh, x, y);
    this.threeRenderer.setRotation(mesh, asset.orientation);
    this.threeRenderer.addToScene(mesh);

    this.meshes[asset.id] = mesh;
  }

  bind(bus) {
    bus.addEventListener('TANK_CREATE', this.create.bind(this));
    bus.addEventListener('TANK_UPDATE', this.update.bind(this));
    bus.addEventListener('TANK_DELETE', this.delete.bind(this));
  }
}

class _WallRenderer extends _BaseRenderer {
  constructor(...args) {
    super(...args);

    this.zPosition = 0.5;
    this.geometry = new THREE.BoxGeometry(SIZE, 1, SIZE);
    this.material = new THREE.MeshStandardMaterial();
    this.material.color.setHex(0xffffff);
  }

  bind(bus) {
    bus.addEventListener('WALL_CREATE', this.create.bind(this));
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
    this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(this.scene.position);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;

    const backgroundColor = new THREE.Color(document.body.style.background);
    this.renderer.setClearColor(backgroundColor, 1);

    this.renderer.setSize(width, height);
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.container.appendChild(this.renderer.domElement);
  }

  addToScene(mesh) {
    this.scene.add(mesh);
  }

  removeFromScene(mesh) {
    this.scene.remove(mesh);
  }

  setPosition(mesh, x, y) {
    const [worldX, worldZ] = this.convertFromGridToWorld(x, y);

    mesh.position.x = worldX;
    mesh.position.z = worldZ;
  }

  setRotation(mesh, orientation) {
    switch (orientation) {
      case 'north':
        mesh.rotation.y = 0;
        return;
      case 'east':
        mesh.rotation.y = -0.5 * Math.PI;
        return;
      case 'south':
        mesh.rotation.y = Math.PI;
        return;
      case 'west':
        mesh.rotation.y = 0.5 * Math.PI;
        return;
      default:
        throw new Error(`Unsupported orientation found: ${orientation}`)
    }
  }

  addLighting() {
    var ambientLight = new THREE.AmbientLight( 0x330000 );
    this.scene.add( ambientLight );

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8);
    this.scene.add(hemisphere);

    const height = 10.75;
    const dirLight = new THREE.DirectionalLight( 0xFFFFFF, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -10, 1 * height, 10 );
    this.scene.add( dirLight );
    dirLight.castShadow = true;
    dirLight.position.multiplyScalar(5);
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;

    var d = 20;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    
    const light2 = new THREE.DirectionalLight( 0x36FEFF, 1 );
    light2.color.setHSL( 0.1, 1, 0.95 );
    light2.position.set( 10, height, -10 );
    this.scene.add( light2 );    
  }

  createMap(width, height) {
    const geometry = new THREE.PlaneGeometry(width * SIZE, height * SIZE, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x47a91f, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotateX(-Math.PI / 2);
    plane.receiveShadow = true;

    this.scene.add(plane);
  }

  convertFromGridToWorld(x, y) {
    // WIDTH 1 in grid size is SIZE in threejs.
    // Then the center is at the center of the map instead of 0,0
    const worldX = SIZE * y - SIZE * (0.5 * this.width - 0.5);
    const worldZ = SIZE * (0.5 * this.height - 0.5) - SIZE * x;

    return [worldX, worldZ];
  }

  createObjectAtPosition(geometry, material, x, y, height) {
    const [worldX, worldZ] = this.convertFromGridToWorld(x, y);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.y = height;
    mesh.position.x = worldX;
    mesh.position.z = worldZ;

    return mesh;
  }

  animate() {
    window.requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}

window.LaserRenderer = _LaserRenderer;
window.TankRenderer = _TankRenderer;
window.TreeRenderer = _TreeRenderer;
window.WallRenderer = _WallRenderer;
window.ThreeRenderer = _ThreeRenderer;

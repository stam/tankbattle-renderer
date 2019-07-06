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
    const mesh = this.threeRenderer.createObjectAtPosition(this.geometry, this.material, x, y, this.zPosition);
    this.threeRenderer.addToScene(mesh);

    this.meshes[asset.id] = mesh;
  }

  update(assetEvent) {
    const { detail: asset } = assetEvent;
    const [x, y] = asset.position;
    const mesh = this.meshes[asset.id];
    this.threeRenderer.setPosition(mesh, x, y);
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

    this.zPosition = 1.5;
    this.geometry = new THREE.BoxGeometry(3, 1, 1);
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
    const startMesh = this.threeRenderer.createObjectAtPosition(this.geometry, this.material, xStart, yStart, 1.5);
    group.add(startMesh);
    
    const [xEnd, yEnd] = laser.endPos;
    const endMesh = this.threeRenderer.createObjectAtPosition(this.geometry, this.material, xEnd, yEnd, 1.5);
    group.add(endMesh);
    
    const intermediatePositions = getIntermediatePositions(laser.startPos, laser.endPos);
    intermediatePositions.forEach(position => {
      const intermediateMesh = this.threeRenderer.createObjectAtPosition(this.geometry, this.material, position[0], position[1], 1.5);
      group.add(intermediateMesh);
    });

    this.threeRenderer.addToScene(group);
    this.meshes[laser.id] = group;
  }
}

class _TreeRenderer extends _BaseRenderer {
  constructor(...args) {
    super(...args);

    this.zPosition = 2;
    this.geometry = new THREE.BoxGeometry(1, 4, 1);
    this.material = new THREE.MeshStandardMaterial();
    this.material.color.setHex(0x4e2d04);
  }

  bind(bus) {
    bus.addEventListener('TREE_CREATE', this.create.bind(this));
    // Trees don't need updates
    bus.addEventListener('TREE_DELETE', this.delete.bind(this));
  }
}


class _TankRenderer extends _BaseRenderer {
  constructor(...args) {
    super(...args);

    this.zPosition = 1;
    this.geometry = new THREE.BoxGeometry(SIZE, 2, SIZE);
    this.material = new THREE.MeshStandardMaterial();
    this.material.color.setHex(0x1a560a);
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
    this.renderer.setClearColor(0xffffff, 1);
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

  addLighting() {
    const hemisphere = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    this.scene.add(hemisphere);

    const sun = new THREE.PointLight(0xffffff, 0.8);
    sun.position.set(0, 50, 50);
    this.scene.add(sun);
  }

  createMap(width, height) {
    const geometry = new THREE.PlaneGeometry(width * SIZE, height * SIZE, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotateX(-Math.PI / 2);

    this.scene.add(plane);
    this.scene.add(new THREE.AxisHelper(40));
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

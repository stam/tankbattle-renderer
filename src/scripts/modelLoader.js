class Es6Loader {
  constructor() {
    this._loader = new window.THREE.GLTFLoader();
  }

  load(url) {
    return new Promise((resolve, reject) => {
      this._loader.load(url, resolve, () => {}, reject);
    });
  }
}

class _ModelLoader {
  constructor() {
    this.es6Loader = new Es6Loader();
  }
  async load() {
    this.tankModel = await this.es6Loader.load('assets/tank_01.gltf').then(gltf => {
      const mesh = gltf.scene.children[0];
      const group = new window.THREE.Group();
      mesh.material.side = window.THREE.DoubleSide;
      
      // The exported model is wayyy too big and rotated west
      mesh.rotation.y = 0.5 * Math.PI;
      mesh.scale.set(0.1, 0.1, 0.1);
      group.add(mesh);
      return group;
    });
  }
}

window.ModelLoader = _ModelLoader;

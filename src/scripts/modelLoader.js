const SCALE = 3 / 32;

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
    this.colors = ['blue', 'purple', 'red', 'yellow']
    this.tankModels = {}
    const promises = this.colors.map(async color => {
      this.tankModels[color] = await this.es6Loader.load(`assets/tank_${color}.gltf`).then(gltf => {
        const mesh = gltf.scene.children[0];
        const group = new window.THREE.Group();
        mesh.material.side = window.THREE.DoubleSide;
        
        // The exported model is wayyy too big and rotated west
        mesh.rotation.y = 0.5 * Math.PI;
        mesh.scale.set(SCALE, SCALE, SCALE);
        group.add(mesh);
        return group;
      }); 
    });
    await Promise.all(promises);
    this.treeModel = await this.es6Loader.load('assets/tree_01.gltf').then(gltf => {
      const mesh = gltf.scene.children[0];
      mesh.material.side = window.THREE.DoubleSide;      
      mesh.scale.set(SCALE, SCALE, SCALE);
      return mesh;
    });
  }
}

window.ModelLoader = _ModelLoader;

import * as THREE from "three";

export class BasicThreeDemo {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  clock: THREE.Clock;
  assets: {};
  disposed: boolean;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas,
    });

    this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.offsetWidth / canvas.offsetHeight,
      0.1,
      10000
    );
    this.scene = new THREE.Scene();

    this.clock = new THREE.Clock();
    this.assets = {};
    this.disposed = false;
    this.tick = this.tick.bind(this);
    this.init = this.init.bind(this);
  }

  loadAssets() {
    return new Promise((resolve, reject) => {
      // const manager = new THREE.LoadingManager(resolve);
      // this.text.load(manager);
    });
  }

  init() {
    this.tick();
  }
  getViewSizeAtDepth(depth = 0) {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(
      (this.camera.position.z - depth) * Math.tan(fovInRadians / 2) * 2
    );
    return { width: height * this.camera.aspect, height };
  }

  dispose() {
    this.disposed = true;
  }

  onResize() {}

  update(_delta: number) {}

  render(_delta: number) {
    this.renderer.render(this.scene, this.camera);
  }

  tick() {
    if (this.disposed) return;
    if (resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
      this.onResize();
    }
    const delta = this.clock.getDelta();
    this.render(delta);
    this.update(delta);
    requestAnimationFrame(this.tick);
  }
}

function resizeRendererToDisplaySize(renderer: THREE.WebGLRenderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

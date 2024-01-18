import {
  EffectComposer,
  OverrideMaterialManager,
  RenderPass,
} from "postprocessing";
import * as THREE from "three";

const n8ao = require("n8ao");
const N8AOPostPass = n8ao.N8AOPostPass;

interface Viewport {
  canvas: {
    width: number;
    height: number;
    dpr: number;
  };
  scene: {
    width: number;
    height: number;
  };
  screen: {
    width: number;
    height: number;
  };
}

class Rendering {
  canvas: HTMLCanvasElement;
  vp: Viewport;
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  scene: THREE.Scene;
  clock: THREE.Clock;
  disposed: boolean;
  composer!: EffectComposer;
  usePostProcess: boolean;

  constructor(canvas: HTMLCanvasElement, usePostProcess: boolean = false) {
    this.canvas = canvas;

    this.vp = {
      canvas: {
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        dpr: Math.min(window.devicePixelRatio, 1.5),
      },
      scene: {
        width: 1,
        height: 1,
      },
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      canvas,
      stencil: false,
    });

    this.renderer.setSize(this.vp.canvas.width, this.vp.canvas.height, false);
    this.renderer.setPixelRatio(this.vp.canvas.dpr);

    let size = 4;
    let ratio = this.vp.canvas.width / this.vp.canvas.height;
    let ratioW = this.vp.canvas.height / this.vp.canvas.width;

    if (ratio > ratioW) {
      ratioW = 1;
    } else {
      ratio = 1;
    }

    this.camera = new THREE.OrthographicCamera(
      -size * ratio,
      size * ratio,
      size * ratioW,
      -size * ratioW,
      0.001,
      1000
    );

    this.scene = new THREE.Scene();

    this.clock = new THREE.Clock();

    this.disposed = false;

    OverrideMaterialManager.workaroundEnabled = true;

    if (usePostProcess) {
      const composer = new EffectComposer(this.renderer);
      composer.addPass(new RenderPass(this.scene, this.camera));

      const n8aopass = new N8AOPostPass(
        this.scene,
        this.camera,
        this.vp.canvas.width,
        this.vp.canvas.height
      );
      n8aopass.configuration.aoRadius = 0.2;
      n8aopass.configuration.distanceFalloff = 0.5;
      n8aopass.configuration.intensity = 20.0;
      n8aopass.configuration.color = new THREE.Color(0, 0, 0);
      n8aopass.configuration.aoSamples = 8;
      n8aopass.configuration.denoiseSamples = 4;
      n8aopass.configuration.denoiseRadius = 12;
      n8aopass.configuration.halfRes = true;
      n8aopass.setQualityMode("Medium");

      n8aopass.configuration.halfRes = true;

      n8aopass.screenSpaceRadius = true;
      composer.addPass(n8aopass);

      this.composer = composer;
    }

    this.usePostProcess = usePostProcess;

    this.addEvents();
  }

  addEvents() {
    window.addEventListener("resize", this.onResize);
  }
  dispose() {}

  init() {}

  render() {
    if (this.usePostProcess) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onResize = () => {
    let canvas = this.canvas;
    this.vp.canvas.width = canvas.offsetWidth;
    this.vp.canvas.height = canvas.offsetHeight;
    this.vp.canvas.dpr = Math.min(window.devicePixelRatio, 2);

    this.vp.scene.width = window.innerWidth;
    this.vp.scene.height = window.innerHeight;

    this.renderer.setSize(this.vp.canvas.width, this.vp.canvas.height, false);

    let size = 4;
    let ratio = this.vp.canvas.width / this.vp.canvas.height;
    let ratioW = this.vp.canvas.height / this.vp.canvas.width;

    if (ratio > ratioW) {
      ratioW = 1;
    } else {
      ratio = 1;
    }

    this.camera.left = -size * ratio;
    this.camera.right = size * ratio;
    this.camera.top = size * ratioW;
    this.camera.bottom = -size * ratioW;

    // this.camera.aspect = this.vp.canvas.width / this.vp.canvas.height;
    this.camera.updateProjectionMatrix();

    this.vp.scene = {
      width: 0,
      height: 0,
    };
  };
}

export default Rendering;

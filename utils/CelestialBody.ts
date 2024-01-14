import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Pane } from "tweakpane";
import { initialBlobs } from "./blogConfig";
import Blob from "./Blob";

import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  VignetteEffect,
} from "postprocessing";

const CELESTIAL_BODY_PARAMS = {
  clearColor: "#07001c",
};

class CelestialBody {
  canvas: HTMLCanvasElement;
  renderer!: THREE.WebGLRenderer;
  clearColor!: THREE.Color;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  composer!: EffectComposer;
  renderPass!: RenderPass;
  bloomEffect!: BloomEffect;
  vignetteEffect!: VignetteEffect;
  effectPass!: EffectPass;
  blobs: Array<any>;
  gui!: Pane;
  guiBlobFolder: any;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initPostProcessing();
    this.initGUI();

    this.onResize = this.onResize.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.animate = this.animate.bind(this);

    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKeyDown);

    this.blobs = [];

    initialBlobs.forEach((options) => {
      this.addBlob(options);
    });
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      powerPreference: "high-performance",
      antialias: false,
      stencil: false,
      depth: false,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.clearColor = new THREE.Color(CELESTIAL_BODY_PARAMS.clearColor);
    this.renderer.setClearColor(this.clearColor);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      1,
      5000
    );
    this.camera.position.z = 2000;
    new OrbitControls(this.camera, this.renderer?.domElement);
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);

    this.bloomEffect = new BloomEffect({
      luminanceThreshold: 0.18,
      luminanceSmoothing: 0.087,
      resolutionScale: 0.5,
      intensity: 1.0,
    });

    this.vignetteEffect = new VignetteEffect({
      offset: 0,
      darkness: 0.35,
    });

    this.effectPass = new EffectPass(
      this.camera,
      this.vignetteEffect,
      this.bloomEffect
    );

    this.composer.addPass(this.renderPass);
    // this.composer.addPass(this.effectPass);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  initGUI() {
    this.gui = new Pane();

    this.gui
      .addBinding(CELESTIAL_BODY_PARAMS, "clearColor", {
        view: "background",
      })
      .on("change", (ev) => {
        this.clearColor.set(ev.value);
        this.renderer.setClearColor(this.clearColor);
      });

    const fxFolder = this.gui.addFolder({
      title: "Post Processing",
      expanded: false,
    });

    const bloomFolder = fxFolder.addFolder({
      title: "Bloom",
      expanded: false,
    });

    bloomFolder.addBinding(this.bloomEffect, "intensity", {
      min: 0,
      max: 5,
    });

    bloomFolder.addBinding(this.bloomEffect.luminanceMaterial, "threshold", {
      min: 0,
      max: 1,
    });
    bloomFolder.addBinding(this.bloomEffect.luminanceMaterial, "smoothing", {
      min: 0,
      max: 1,
    });

    this.guiBlobFolder = this.gui.addFolder({
      title: "Blobs",
      expanded: false,
    });

    this.guiBlobFolder
      .addButton({
        title: "Add Blob",
      })
      .on("click", () => {
        this.addBlob();
      });

    this.guiBlobFolder
      .addButton({
        title: "Remove all blobs",
      })
      .on("click", () => {
        this.blobs.forEach((blob) => {
          blob.killBlob();
        });
      });
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.code === "KeyH") {
      this.gui.hidden = !this.gui.hidden;
    }
  }

  hideGUI() {
    this.gui.hidden = !this.gui.hidden;
  }

  animate() {
    requestAnimationFrame(this.animate);

    this.blobs.forEach((blob, i) => {
      blob.update();
      if (blob.isDead) {
        this.blobs.splice(i, 1);
      }
    });

    this.composer.render();
  }

  addBlob(options?: any) {
    const blob = new Blob({
      gui: this.guiBlobFolder,
      id: this.blobs.length + 1,
      ...options,
    });

    this.scene.add(blob);
    this.blobs.push(blob);
  }
}

export default CelestialBody;

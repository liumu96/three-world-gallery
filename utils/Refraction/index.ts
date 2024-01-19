import * as THREE from "three";
import loadTexture from "./texture-loader";
import loadModel from "./model-loader";
import RefractionMaterial from "./refractionMaterial";
import BackfaceMaterial from "./backfaceMaterial";
import { Pane } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);

class RefractionEffect {
  canvas: HTMLCanvasElement;
  vp: { width: number; height: number; dpr: number };
  velocity: { x: number; y: number };
  pointerDown: boolean;
  pointer: { x: number; y: number };
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  orthoCamera!: THREE.OrthographicCamera;
  renderer!: THREE.WebGLRenderer;
  envFbo!: THREE.WebGLRenderTarget<THREE.Texture>;
  backfaceFbo!: THREE.WebGLRenderTarget<THREE.Texture>;
  quad:
    | THREE.Mesh<
        THREE.PlaneGeometry,
        THREE.MeshBasicMaterial,
        THREE.Object3DEventMap
      >
    | undefined;
  refractionMaterial!: RefractionMaterial;
  backfaceMaterial: BackfaceMaterial | undefined;
  model: THREE.Object3D<THREE.Object3DEventMap> | undefined;
  modelPath: string = "";
  bgImgPath: string = "";
  PARAMS: {
    x: number;
    y: number;
    ior: number;
    posX: number;
    posY: number;
    posZ: number;
    scale: number;
  } = {
    x: 0.005,
    y: 0.0,
    ior: 0.98,
    posX: 0.0,
    posY: -0.2,
    posZ: 0.0,
    scale: 1.0,
  };

  constructor(canvas: HTMLCanvasElement, modelPath: string, bgImgPath: string) {
    this.canvas = canvas;
    this.modelPath = modelPath;
    this.bgImgPath = bgImgPath;

    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    this.vp = {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: Math.min(devicePixelRatio, 2 || 1),
    };

    this.velocity = {
      x: 0.005,
      y: 0.005,
    };
    this.pointerDown = false;
    this.pointer = {
      x: 0,
      y: 0,
    };

    this.addTweakPane();
    this.setup();
  }

  addTweakPane() {
    const pane = new Pane();

    pane.registerPlugin(EssentialsPlugin);

    pane.addBinding(this.PARAMS, "x", {
      min: 0.0,
      max: 0.1,
    });
    pane.addBinding(this.PARAMS, "y", {
      min: 0.0,
      max: 0.1,
    });
    pane.addBinding(this.PARAMS, "ior", {
      min: 0.0,
      max: 10.0,
    });

    pane.addBinding(this.PARAMS, "posX", {
      min: -10.0,
      max: 10.0,
    });
    pane.addBinding(this.PARAMS, "posY", {
      min: -10.0,
      max: 10.0,
    });
    pane.addBinding(this.PARAMS, "posZ", {
      min: -10.0,
      max: 10.0,
    });

    pane.addBinding(this.PARAMS, "scale", {
      min: 0.01,
      max: 10.0,
    });
  }

  addEvents() {
    if ("ontouchmove" in window) {
      window.addEventListener("touchstart", this.handleMouseDown);
      window.addEventListener("touchmove", this.handleMouseMove);
      window.addEventListener("touchend", this.handleMouseUp);
    } else {
      window.addEventListener("mousedown", this.handleMouseDown);
      window.addEventListener("mousemove", this.handleMouseMove);
      window.addEventListener("mouseup", this.handleMouseUp);
    }
  }

  async setup() {
    this.createScene();

    this.envFbo = new THREE.WebGLRenderTarget(
      this.vp.width * this.vp.dpr,
      this.vp.height * this.vp.dpr
    );
    this.backfaceFbo = new THREE.WebGLRenderTarget(
      this.vp.width * this.vp.dpr,
      this.vp.height * this.vp.dpr
    );

    this.quad = await this.createBackground();
    this.scene.add(this.quad);

    this.model = await this.createModel();
    this.scene.add(this.model);

    this.camera.position.z = 5;
    this.orthoCamera.position.z = 5;

    window.addEventListener("resize", this.resize);
    this.addEvents();
    this.render();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.vp.width / this.vp.height,
      0.1,
      1000
    );
    this.orthoCamera = new THREE.OrthographicCamera(
      this.vp.width / -2,
      this.vp.width / 2,
      this.vp.height / 2,
      this.vp.height / -2,
      1,
      1000
    );

    this.orthoCamera.layers.set(1);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setSize(this.vp.width, this.vp.height);
    this.renderer.setPixelRatio(this.vp.dpr);
    this.renderer.autoClear = false;
  }

  async createBackground() {
    const tex = await loadTexture(this.bgImgPath);
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    quad.layers.set(1);
    quad.scale.set(this.vp.height * 2, this.vp.height, 1);
    return quad;
  }

  async createModel() {
    this.refractionMaterial = new RefractionMaterial({
      envMap: this.envFbo?.texture,
      backfaceMap: this.backfaceFbo?.texture,
      resolution: [this.vp.width * this.vp.dpr, this.vp.height * this.vp.dpr],
      ior: this.PARAMS.ior,
    });

    this.backfaceMaterial = new BackfaceMaterial();

    let { model } = await loadModel(this.modelPath);
    return model.children[0];
  }

  render() {
    requestAnimationFrame(this.render);

    this.renderer.clear();
    this.velocity.x *= 0.87;
    this.velocity.y *= 0.87;

    if (this.model) {
      this.model.rotation.y +=
        this.velocity.y +
        Math.sign(this.velocity.y) *
          this.PARAMS.x *
          (1 - Number(this.pointerDown));

      this.model.rotation.x +=
        this.velocity.x +
        Math.sign(this.velocity.x) *
          this.PARAMS.y *
          (1 - Number(this.pointerDown));
    }

    this.refractionMaterial.uniforms.ior.value = this.PARAMS.ior;
    if (this.model) {
      this.model.position.set(
        this.PARAMS.posX,
        this.PARAMS.posY,
        this.PARAMS.posZ
      );
      this.model.scale.set(
        this.PARAMS.scale,
        this.PARAMS.scale,
        this.PARAMS.scale
      );
    }

    this.renderer.setRenderTarget(this.envFbo);
    this.renderer.render(this.scene, this.orthoCamera);

    if (this.model && this.model instanceof THREE.Mesh) {
      this.model.material = this.backfaceMaterial;
    }
    this.renderer.setRenderTarget(this.backfaceFbo);
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.orthoCamera);
    this.renderer.clearDepth();

    if (this.model && this.model instanceof THREE.Mesh) {
      this.model.material = this.refractionMaterial;
    }
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.vp.width = window.innerWidth;
    this.vp.height = window.innerHeight;

    this.renderer.setSize(this.vp.width, this.vp.height);
    this.envFbo?.setSize(
      this.vp.width * this.vp.dpr,
      this.vp.height * this.vp.dpr
    );
    this.backfaceFbo?.setSize(
      this.vp.width * this.vp.dpr,
      this.vp.height * this.vp.dpr
    );

    this.quad?.scale.set(this.vp.height * 2, this.vp.height, 1);

    if (this.model && this.model instanceof THREE.Mesh) {
      this.model.material.uniforms.resolution.value = [
        this.vp.width * this.vp.dpr,
        this.vp.height * this.vp.dpr,
      ];
    }

    this.camera.aspect = this.vp.width / this.vp.height;
    this.camera.updateProjectionMatrix();

    this.orthoCamera.left = this.vp.width / -2;
    this.orthoCamera.right = this.vp.width / 2;
    this.orthoCamera.top = this.vp.height / 2;
    this.orthoCamera.bottom = this.vp.height / -2;
    this.orthoCamera.updateProjectionMatrix();
  }

  handleMouseDown(e: TouchEvent | MouseEvent) {
    this.pointerDown = true;
    this.pointer.x = (e as TouchEvent).touches
      ? (e as TouchEvent).touches[0].clientX
      : (e as MouseEvent).clientX;
  }

  handleMouseMove(e: TouchEvent | MouseEvent) {
    if (!this.pointerDown) return;

    const x = (e as TouchEvent).touches
      ? (e as TouchEvent).touches[0].clientX
      : (e as MouseEvent).clientX;

    this.velocity.y += (x - this.pointer.x) * 0.001;
    this.pointer.x = x;

    const y = (e as TouchEvent).touches
      ? (e as TouchEvent).touches[0].clientY
      : (e as MouseEvent).clientY;
    this.velocity.x += (y - this.pointer.y) * 0.001;

    this.pointer.y = y;
  }

  handleMouseUp() {
    this.pointerDown = false;
  }
}

export default RefractionEffect;

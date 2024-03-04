import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/Addons.js";
import vertex from "@/public/shaders/sketch/vertex.glsl";
import fragment from "@/public/shaders/sketch/fragment.glsl";

export default class Sketch {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  time: number;
  paused: boolean;
  imageAspect: number = 853 / 1280;
  material: THREE.ShaderMaterial | undefined;
  geometry: THREE.PlaneGeometry | undefined;
  plane:
    | THREE.Mesh<
        THREE.PlaneGeometry,
        THREE.ShaderMaterial,
        THREE.Object3DEventMap
      >
    | undefined;
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.paused = false;

    this.setupResize();

    this.addObjects();
    this.resize();
    this.render();
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    // image cover
    let a1, a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }
  }

  addObjects() {
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector4() },
        uvRate1: {
          value: new THREE.Vector2(1, 1),
        },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }
  render() {
    if (this.paused) return;
    this.time += 0.05;
    if (this.material) {
      this.material.uniforms.time.value = this.time;
    }
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}
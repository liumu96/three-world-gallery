import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

class PhysicalTransmission {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;

  renderer: THREE.WebGLRenderer;

  params = {
    color: 0xffffff,
    transmission: 1,
    opacity: 1,
    metalness: 0,
    roughness: 0,
    ior: 1.5,
    thickness: 0.01,
    specularIntensity: 1,
    specularColor: 0xffffff,
    envMapIntensity: 1,
    lightIntensity: 1,
    exposure: 1,
  };
  hdrEquirect: THREE.DataTexture;
  mesh: THREE.Mesh<
    THREE.SphereGeometry,
    THREE.MeshPhysicalMaterial,
    THREE.Object3DEventMap
  >;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.params.exposure;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      2000
    );
    this.camera.position.set(0, 0, 120);

    this.hdrEquirect = new RGBELoader()
      .setPath("/textures/equirectangular/")
      .load("royal_esplanade_1k.hdr", () => {
        this.hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = this.hdrEquirect;
        this.render();
      });

    const geometry = new THREE.SphereGeometry(20, 64, 32);

    const texture = new THREE.CanvasTexture(this.generateTexture());
    texture.magFilter = THREE.NearestFilter;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(1, 3.5);

    const material = new THREE.MeshPhysicalMaterial({
      color: this.params.color,
      metalness: this.params.metalness,
      roughness: this.params.roughness,
      ior: this.params.ior,
      alphaMap: texture,
      envMap: this.hdrEquirect,
      envMapIntensity: this.params.envMapIntensity,
      transmission: this.params.transmission, // use material.transmission for glass materials
      specularIntensity: this.params.specularIntensity,
      specularColor: this.params.specularColor,
      opacity: this.params.opacity,
      side: THREE.DoubleSide,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.render = this.render.bind(this);
    const controls = new OrbitControls(this.camera, canvas);
    controls.addEventListener("change", this.render);
    controls.minDistance = 10;
    controls.maxDistance = 150;

    const gui = new GUI();

    gui.addColor(this.params, "color").onChange(() => {
      material.color.set(this.params.color);
      this.render();
    });

    gui.add(this.params, "transmission", 0, 1, 0.01).onChange(() => {
      material.transmission = this.params.transmission;
      this.render();
    });

    gui.add(this.params, "opacity", 0, 1, 0.01).onChange(() => {
      material.opacity = this.params.opacity;
      this.render();
    });

    gui.add(this.params, "metalness", 0, 1, 0.01).onChange(() => {
      material.metalness = this.params.metalness;
      this.render();
    });

    gui.add(this.params, "roughness", 0, 1, 0.01).onChange(() => {
      material.roughness = this.params.roughness;
      this.render();
    });

    gui.add(this.params, "ior", 1, 2, 0.01).onChange(() => {
      material.ior = this.params.ior;
      this.render();
    });

    gui.add(this.params, "thickness", 0, 5, 0.01).onChange(() => {
      material.thickness = this.params.thickness;
      this.render();
    });

    gui.add(this.params, "specularIntensity", 0, 1, 0.01).onChange(() => {
      material.specularIntensity = this.params.specularIntensity;
      this.render();
    });

    gui.addColor(this.params, "specularColor").onChange(() => {
      material.specularColor.set(this.params.specularColor);
      this.render();
    });

    gui
      .add(this.params, "envMapIntensity", 0, 1, 0.01)
      .name("envMap intensity")
      .onChange(() => {
        material.envMapIntensity = this.params.envMapIntensity;
        this.render();
      });

    gui.add(this.params, "exposure", 0, 1, 0.01).onChange(() => {
      this.renderer.toneMappingExposure = this.params.exposure;
      this.render();
    });

    gui.open();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.render();
  }

  generateTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;

    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "white";
      context.fillRect(0, 1, 2, 1);
    }

    return canvas;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

export default PhysicalTransmission;

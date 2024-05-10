import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import vertex from "@/public/shaders/EarthPlanet/vertex.glsl";
import fragment from "@/public/shaders/EarthPlanet/fragment.glsl";

export default class EarthPlanetSketch {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  time: number;
  isPlaying: boolean;
  imageAspect: number = 853 / 1280;
  material: THREE.MeshBasicMaterial | undefined;
  geometry: THREE.SphereGeometry | undefined;
  planet:
    | THREE.Mesh<
        THREE.SphereGeometry,
        THREE.MeshBasicMaterial,
        THREE.Object3DEventMap
      >
    | undefined;
  gltfLoader: GLTFLoader;
  dracoLoader: DRACOLoader;
  materialShader: THREE.ShaderMaterial | undefined;
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(2, 0, -2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    // todo dracoLoader && gltfLoader
    this.gltfLoader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath("/draco/");
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.isPlaying = true;

    let axesHelper = new THREE.AxesHelper(10);
    this.scene.add(axesHelper);

    this.setupResize();
    // this.addLights();
    this.addObjects();
    this.resize();
    this.render();
  }

  addLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(0.5, 0, 0.866);
    this.scene.add(light2);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    this.material = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load("/assets/textures/earth.jpg"),
    });
    this.geometry = new THREE.SphereGeometry(1, 30, 30);
    this.planet = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.planet);

    this.materialShader = new THREE.ShaderMaterial({
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

    // add pin
    const point1 = {
      // Beijing
      lat: 39.916668,
      lng: 116.383331,
    };

    const point2 = {
      // Zurich
      lat: 47.36667,
      lng: 8.55,
    };

    const point3 = {
      // Los Angels
      lat: 34.052235,
      lng: -118.243683,
    };

    const flights = [point1, point2, point3];

    const convertLatlngToCartesian = (p: { lat: number; lng: number }) => {
      let phi = (p.lat * Math.PI) / 180;
      let theta = ((p.lng - 180) * Math.PI) / 180;

      let x = -Math.cos(phi) * Math.cos(theta);
      let y = Math.sin(phi);
      let z = Math.cos(phi) * Math.sin(theta);
      return {
        x,
        y,
        z,
      };
    };

    for (let i = 0; i < flights.length; i++) {
      const pos = convertLatlngToCartesian(flights[i]);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      mesh.position.set(pos.x, pos.y, pos.z);
      this.scene.add(mesh);
      if (i < flights.length - 1) {
        const pos1 = convertLatlngToCartesian(flights[i + 1]);
        this.getCurve(pos, pos1);
      }
    }
  }

  getCurve(p1: { x: any; y: any; z: any }, p2: { x: any; y: any; z: any }) {
    let v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
    let v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
    let points = [];
    for (let i = 0; i <= 20; i++) {
      let p = new THREE.Vector3().lerpVectors(v1, v2, i / 20);
      p.normalize();
      p.multiplyScalar(1 + 0.1 * Math.sin((Math.PI * i) / 20));
      points.push(p);
    }
    let path = new THREE.CatmullRomCurve3(points);

    const geometry = new THREE.TubeGeometry(path, 20, 0.005, 8, false);
    const material = this.materialShader;
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  stop() {
    this.isPlaying = false;
  }
  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    if (this.materialShader) {
      this.materialShader.uniforms.time.value = this.time;
    }
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

import vertex from "@/public/shaders/flameterrain/vertex.glsl";
import fragment from "@/public/shaders/flameterrain/fragment.glsl";

import vertex1 from "@/public/shaders/flameterrain/vertex1.glsl";
import fragment1 from "@/public/shaders/flameterrain/fragment1.glsl";

// import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import Delaunator from "delaunator";
import PoissonDiskSampling from "poisson-disk-sampling";
import VirtualScroll from "virtual-scroll";

import {
  EffectComposer,
  RenderPass,
  ShaderPass,
  RGBShiftShader,
  DotScreenShader,
  OutputPass,
} from "three/examples/jsm/Addons.js";
import { CustomPost } from "./CustomPass";

const SIZE = 5;

const p = new PoissonDiskSampling({
  shape: [SIZE, SIZE * 2],
  minDistance: 0.1,
  maxDistance: 0.3,
  tries: 10,
});
const points = p.fill();

let points3D = points.map((p) => {
  return new THREE.Vector3(p[0], 0, p[1]);
});

let indexDelaunay = Delaunator.from(
  points.map((p) => {
    return [p[0], p[1]];
  })
);

export default class FlameTerrainSketch {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  camera: THREE.PerspectiveCamera;
  //   controls: OrbitControls;
  time: number;
  isPlaying: boolean;
  imageAspect: number = 853 / 1280;
  material: THREE.ShaderMaterial | undefined;
  geometry: THREE.BufferGeometry | undefined;
  mesh!: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.ShaderMaterial,
    THREE.Object3DEventMap
  >;
  gltfLoader: GLTFLoader;
  dracoLoader: DRACOLoader;
  progress: number = 0;
  scroller: VirtualScroll;
  material1: THREE.ShaderMaterial | undefined;
  composer: EffectComposer | undefined;
  mesh1!: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.ShaderMaterial,
    THREE.Object3DEventMap
  >;
  mesh2!: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.ShaderMaterial,
    THREE.Object3DEventMap
  >;
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 1, 0.5);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.scroller = new VirtualScroll();
    this.scroller.on((event) => {
      this.progress = event.y / 1000;
    });

    this.gltfLoader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath("/draco/");
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.isPlaying = true;

    this.initPost();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
  }
  initPost() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const effect1 = new ShaderPass(CustomPost);
    this.composer.addPass(effect1);
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

    this.composer?.setSize(this.width, this.height);
  }

  addObjects() {
    // matcap
    let t1 = new THREE.TextureLoader().load("/assets/matcap/matcap1.jpg");
    t1.colorSpace = THREE.SRGBColorSpace;
    let t2 = new THREE.TextureLoader().load("/assets/matcap/matcap2.png");
    t2.colorSpace = THREE.SRGBColorSpace;

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: true,
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0.0 },
        uTexture: { value: t1 },
        uTexture1: { value: t2 },
        resolution: { value: new THREE.Vector4(this.width, this.height, 1, 1) },
      },
      //   wireframe: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry = new THREE.BufferGeometry().setFromPoints(points3D);
    let meshIndex = [];

    for (let i = 0; i < indexDelaunay.triangles.length; i++) {
      meshIndex.push(indexDelaunay.triangles[i]);
    }
    this.geometry.computeVertexNormals();

    this.geometry.setIndex(meshIndex);

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh1 = new THREE.Mesh(this.geometry, this.material);
    this.mesh2 = new THREE.Mesh(this.geometry, this.material);

    this.mesh.position.x = -SIZE / 2;
    this.mesh1.position.x = -SIZE / 2;
    this.mesh2.position.x = -SIZE / 2;
    this.mesh.position.z = -SIZE;
    this.mesh1.position.z = -SIZE * 3;
    this.mesh2.position.z = SIZE * 3;
    this.scene.add(this.mesh);
    this.scene.add(this.mesh1);
    this.scene.add(this.mesh2);

    // flame
    this.material1 = new THREE.ShaderMaterial({
      extensions: {
        derivatives: true,
      },
      side: THREE.FrontSide,
      uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector4(this.width, this.height, 1, 1) },
      },
      //   wireframe: true,
      vertexShader: vertex1,
      fragmentShader: fragment1,
      transparent: true,
    });

    let points = [];

    points.push(new THREE.Vector3(-2.5, 0, -19));
    points.push(new THREE.Vector3(1.5, 0, 10));
    let curve = new THREE.CatmullRomCurve3(points);
    let tube = new THREE.TubeGeometry(curve, 600, 0.1, 2, false);

    let flame = new THREE.Mesh(tube, this.material1);
    flame.position.y = 0.1;
    this.scene.add(flame);

    // background
    let backgroundMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: true,
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(this.width, this.height) },
      },
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        uniform vec2 resolution;
        void main() {
            vec2 screenUV = gl_FragCoord.xy / resolution.xy;

            float divide = step(0.5, screenUV.x + (screenUV.y - 0.5) * 0.15);

            gl_FragColor = vec4(vec3(divide), 1.0);
        }
        `,
    });

    let backgroundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 10, 10),
      backgroundMaterial
    );

    // backgroundMesh.rotation.x = Math.PI / 2;
    backgroundMesh.position.z = -10;
    backgroundMesh.position.y = 0;
    this.scene.add(backgroundMesh);
  }

  addLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(0.5, 0, 0.866);
    this.scene.add(light2);
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
    this.camera.position.z = 2 + (this.progress % 5);
    this.camera.rotation.x = -0.3;
    if (this.material) {
      this.material.uniforms.time.value = this.time;
    }
    if (this.material1) {
      this.material1.uniforms.time.value = this.time;
    }
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer?.render();
  }
}

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/Addons.js";
// import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import vertex from "@/public/shaders/TravellingParticles/vertexParticles.glsl";
import fragment from "@/public/shaders/TravellingParticles/fragment.glsl";

export default class TravellingParticles {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  time: number;
  isPlaying: boolean;
  imageAspect: number = 853 / 1280;
  material!: THREE.ShaderMaterial;
  geometry!: THREE.BufferGeometry;
  plane: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | undefined;
  svg: Array<SVGPathElement> | undefined;
  lines: Array<{
    id: number;
    path: SVGPathElement;
    length: number;
    number: number;
    points: Array<THREE.Vector3>;
    currentPos: number;
    speed: number;
  }> = [];
  positions: Float32Array = new Float32Array();
  opacity: Float32Array = new Float32Array();
  max: number = 0;
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x111111, 1);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      100,
      10000
    );

    this.camera.position.set(0, 0, 600);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    // todo dracoLoader && gltfLoader

    this.isPlaying = true;

    this.getData();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
  }

  getData() {
    this.svg = [
      ...document.querySelectorAll(".cls-1"),
    ] as Array<SVGPathElement>;
    this.lines = [];

    this.svg.forEach((path, j) => {
      let len = path.getTotalLength();
      let numberOfPoints = Math.floor(len / 5);

      let points = [];

      for (let i = 0; i < numberOfPoints; i++) {
        let pointAt = (len * i) / numberOfPoints;
        let p = path.getPointAtLength(pointAt);
        let randX = (Math.random() - 0.5) * 5;
        let randY = (Math.random() - 0.5) * 5;
        points.push(
          new THREE.Vector3(p.x - 1024 + randX, p.y - 512 + randY, 0)
        );
      }

      this.lines.push({
        id: j,
        path,
        length: len,
        number: numberOfPoints,
        points,
        currentPos: 0,
        speed: 1,
      });
    });
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
      extensions: {
        derivatives: true,
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
      },
      transparent: true,
      depthTest: true,
      depthWrite: true,
      blending: THREE.AdditiveBlending,
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    this.geometry = new THREE.BufferGeometry();

    this.max = this.lines.length * 100;
    this.positions = new Float32Array(this.max * 3);
    this.opacity = new Float32Array(this.max);

    // this.lines.forEach((line) => {
    //   line.points.forEach((p) => {
    //     this.positions.push(p.x, p.y, p.z);
    //     this.opacity.push(Math.random() / 5);
    //   });
    // });

    for (let i = 0; i < this.max; i++) {
      this.opacity.set([Math.random() / 5], i);
      this.positions.set([Math.random() * 100, Math.random() * 1000, 0], i * 3);
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3)
    );

    this.geometry.setAttribute(
      "opacity",
      new THREE.BufferAttribute(this.opacity, 1)
    );

    this.plane = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.plane);

    let texture = new THREE.TextureLoader().load(
      "/assets/particles/travelling-map.jpg"
    );
    texture.flipY = false;
    let map = new THREE.Mesh(
      new THREE.PlaneGeometry(2048, 1024, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0x000066,
        map: texture,
      })
    );
    this.scene.add(map);
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
  updateThings() {
    let j = 0;

    this.lines.forEach((line) => {
      line.currentPos += line.speed;
      line.currentPos = line.currentPos % line.number;

      for (let i = 0; i < 100; i++) {
        let index = (line.currentPos + i) % line.number;
        let p = line.points[index];
        this.positions.set([p.x, p.y, p.z], j * 3);
        this.opacity.set([Math.pow(i / 1000, 1.3)], j);
        j++;
      }
    });

    this.geometry.attributes.position.array.set(this.positions);
    this.geometry.attributes.position.needsUpdate = true;
  }
  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.updateThings();
    if (this.material) {
      this.material.uniforms.time.value = this.time;
    }
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

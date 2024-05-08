import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/Addons.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// console.log(MeshSurfaceSampler);

import * as dat from "dat.gui";

import vertex from "@/public/shaders/sketch/vertex.glsl";
import fragment from "@/public/shaders/sketch/fragment.glsl";

export default class SunFlowersSketch {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  time: number;
  isPlaying: boolean;
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
  guiParams: { progress: number } | undefined;
  gui!: dat.GUI;
  loader: GLTFLoader;
  dracoLoader: DRACOLoader;
  tank!: THREE.Group<THREE.Object3DEventMap>;
  light2!: THREE.DirectionalLight;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  intersects!: THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[];
  count: number;
  ages: Float32Array;
  scales: Float32Array;
  dummy: THREE.Object3D<THREE.Object3DEventMap>;
  _position: THREE.Vector3;
  _normal: THREE.Vector3;
  _scale: THREE.Vector3;

  sampler!: MeshSurfaceSampler;
  finalMesh!: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.MeshNormalMaterial,
    THREE.Object3DEventMap
  >;
  currentPoint: THREE.Vector3;
  sunflower!: THREE.Mesh;
  flowers!: THREE.InstancedMesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.Material | THREE.Material[]
  >;
  growthSpeed: Float32Array;
  positions: Array<THREE.Vector3> = [];
  normals: Array<THREE.Vector3> = [];
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 2);

    this.currentPoint = new THREE.Vector3();
    this.count = 5000;
    this.ages = new Float32Array(this.count);
    this.growthSpeed = new Float32Array(this.count);
    this.scales = new Float32Array(this.count);
    this.dummy = new THREE.Object3D();

    this._position = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._scale = new THREE.Vector3();

    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath("/draco/");
    this.loader.setDRACOLoader(this.dracoLoader);

    let gms: Array<THREE.BufferGeometry> = [];
    this.loader.load("/models/tank.glb", (gltf) => {
      this.tank = gltf.scene;
      let iteration = 0;
      this.tank.traverse((m: THREE.Object3D) => {
        if (m instanceof THREE.Mesh) {
          m.castShadow = m.receiveShadow = true;
          m.geometry.computeVertexNormals();
          iteration++;
          if (iteration % 2 === 0)
            m.material = new THREE.MeshStandardMaterial({
              wireframe: true,
              color: 0x00ffff,
            });
          gms.push(m.geometry);
        }
      });

      let finalGM = mergeGeometries(gms);

      this.finalMesh = new THREE.Mesh(finalGM, new THREE.MeshNormalMaterial());
      //   this.scene.add(finalMesh);
      this.scene.add(this.tank);

      this.loader.load("/models/sunflowers.glb", (gltf) => {
        this.sunflower = gltf.scene.children[0] as THREE.Mesh;

        this.addObjects();
        this.resize();
        this.render();
        this.setupResize();
        this.addLight();
        this.event();
      });
    });

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;
  }

  event() {
    window.addEventListener("mousemove", (event) => {
      this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      this.intersects = this.raycaster.intersectObjects(
        this.tank.children[0].children
      );

      if (this.intersects.length > 0) {
        this.currentPoint = this.intersects[0].point;
        // console.log(this.intersects[0].point);
      }
    });
  }

  addLight() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(light1);

    this.light2 = new THREE.DirectionalLight(0xffffff, 0.8 * Math.PI);
    this.light2.castShadow = true;
    this.light2.shadow.camera.near = 0.1;
    this.light2.shadow.camera.far = 20;
    this.light2.shadow.bias = -0.01;
    this.light2.shadow.camera.right = 10;
    this.light2.shadow.camera.left = -10;
    this.light2.shadow.camera.top = 10;
    this.light2.shadow.camera.bottom = -10;

    this.light2.shadow.mapSize.width = 2048;
    this.light2.shadow.mapSize.height = 2048;
    this.light2.position.set(2.7, 3, 0); // ~60
    this.scene.add(this.light2);
  }

  settings() {
    this.guiParams = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.guiParams, "progress", 0, 1, 0.01);
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
    let m = new THREE.MeshStandardMaterial({
      color: 0xffffff,
    });
    // this.sunflower.material.map.encoding = THREE.sRGBEncoding;
    m.map = (this.sunflower.material as THREE.MeshStandardMaterial).map;
    m.emissive = new THREE.Color("#aaa");
    m.emissiveIntensity = 1;
    m.side = THREE.DoubleSide;
    m.emissiveMap = (this.sunflower.material as THREE.MeshStandardMaterial).map;

    this.sampler = new MeshSurfaceSampler(this.finalMesh)
      .setWeightAttribute("uv")
      .build();

    let s = 0.004;
    this.sunflower.geometry.rotateX(Math.PI / 2);
    this.sunflower.geometry.scale(s, s, s);

    this.flowers = new THREE.InstancedMesh(
      //   new THREE.BoxGeometry(0.01, 0.01, 1),
      this.sunflower.geometry,
      //   new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
      //   this.sunflower.material,
      m,
      this.count
    );

    this.flowers.receiveShadow = this.flowers.castShadow = true;

    for (let i = 0; i < this.count; i++) {
      this.ages[i] = 0.1;
      this.scales[i] = this.ages[i];
      this.growthSpeed[i] = 0;

      this.positions.push(this._position.clone());
      this.normals.push(this._normal.clone());

      this.sampler.sample(this._position, this._normal);
      this._normal.add(this._position);

      this.dummy.position.copy(this._position);
      this.dummy.scale.set(this.scales[i], this.scales[i], this.scales[i]);
      this.dummy.lookAt(this._normal);
      this.dummy.updateMatrix();

      this.flowers.setMatrixAt(i, this.dummy.matrix);
    }

    this.flowers.instanceMatrix.needsUpdate = true;
    this.scene.add(this.flowers);
  }

  rescale(i: number) {
    this.dummy.position.copy(this.positions[i]);

    let d = this.currentPoint.distanceTo(this.positions[i]);

    if (d < 1) {
      this.growthSpeed[i] += 0.005;
    } else {
      this.growthSpeed[i] *= 0.9;
    }
    this.scales[i] += this.growthSpeed[i];
    this.scales[i] = Math.min(1, this.scales[i]);

    this.dummy.scale.set(this.scales[i], this.scales[i], this.scales[i]);

    this.dummy.lookAt(this.normals[i]);
    this.dummy.updateMatrix();

    this.flowers.setMatrixAt(i, this.dummy.matrix);
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

    for (let i = 0; i < this.count; i++) {
      this.rescale(i);
    }
    this.flowers.instanceMatrix.needsUpdate = true;

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/Addons.js";

import vertex from "@/public/shaders/Particles/vertex.glsl";
import fragment from "@/public/shaders/Particles/fragment.glsl";
import gsap from "gsap";
import * as dat from "dat.gui";

export default class ParticlesSketch {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  camera: THREE.PerspectiveCamera;
  //   controls: OrbitControls;
  time: number;
  //   isPlaying: boolean;
  imageAspect: number = 853 / 1280;
  material!: THREE.ShaderMaterial;
  geometry: THREE.BufferGeometry | undefined;
  plane:
    | THREE.Mesh<
        THREE.PlaneGeometry,
        THREE.ShaderMaterial,
        THREE.Object3DEventMap
      >
    | undefined;
  mesh!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  positions!: THREE.BufferAttribute;
  textures: THREE.Texture[];
  coordinates!: THREE.BufferAttribute;
  mask: THREE.Texture;
  speeds!: THREE.BufferAttribute;
  offset!: THREE.BufferAttribute;
  move: number;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  direction!: THREE.BufferAttribute;
  press!: THREE.BufferAttribute;
  point: THREE.Vector2;
  guiParams!: { progress: number };
  gui!: dat.GUI;
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.point = new THREE.Vector2();

    this.textures = [
      new THREE.TextureLoader().load("/assets/particles/t1.png"),
      new THREE.TextureLoader().load("/assets/particles/t2.png"),
    ];
    (this.mask = new THREE.TextureLoader().load("/assets/particles/mask.jpg")),
      (this.camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        3000
      ));
    this.camera.position.set(0, 0, 1000);

    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;
    this.move = 0;

    this.settings();
    this.addMesh();
    this.mouseEffect();
    this.render();
  }

  settings() {
    this.guiParams = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.guiParams, "progress", 0, 1, 0.01);
  }

  mouseEffect() {
    const test = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshBasicMaterial()
    );

    window.addEventListener("mousedown", (e: MouseEvent) => {
      gsap.to(this.material.uniforms.mousePressed, {
        duration: 1,
        value: 1,
        ease: "elastic.out(1, 0.3)",
      });
    });

    window.addEventListener("mouseup", (e: MouseEvent) => {
      gsap.to(this.material.uniforms.mousePressed, {
        duration: 1,
        value: 0,
        ease: "elastic.out(1, 0.3)",
      });
    });

    window.addEventListener("wheel", (e: WheelEvent) => {
      this.move += e.deltaY / 4000;
    });

    window.addEventListener(
      "mousemove",
      (event) => {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        let intersects = this.raycaster.intersectObjects([test]);

        this.point.x = intersects[0].point.x;
        this.point.y = intersects[0].point.y;
      },
      false
    );
  }

  setupResize() {}
  resize() {}

  addMesh() {
    this.material = new THREE.ShaderMaterial({
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: {
        progress: { value: 0 },
        t1: { value: this.textures[0] },
        t2: { value: this.textures[1] },
        mask: { value: this.mask },
        mouse: { value: null },
        transition: { value: null },
        mousePressed: { value: 0 },
        move: { value: 0 },
        time: { value: 0 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    let number = 512 * 512;
    this.geometry = new THREE.BufferGeometry();
    this.positions = new THREE.BufferAttribute(new Float32Array(number * 3), 3);
    this.coordinates = new THREE.BufferAttribute(
      new Float32Array(number * 3),
      3
    );
    this.speeds = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.offset = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.direction = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.press = new THREE.BufferAttribute(new Float32Array(number), 1);

    const rand = (a: number, b: number) => {
      return a + (b - a) * Math.random();
    };

    let index = 0;
    for (let i = 0; i < 512; i++) {
      for (let j = 0; j < 512; j++) {
        this.positions.setXYZ(index, (i - 256) * 2, (j - 256) * 2, 0);
        this.coordinates.setXYZ(index, i, j, 0);
        this.offset.setX(index, rand(-1000, 1000));
        this.speeds.setX(index, rand(0.4, 1));
        this.direction.setX(index, Math.random() > 0.5 ? 1 : -1);
        this.press.setX(index, rand(0.4, 1));
        index++;
      }
    }
    this.geometry.setAttribute("position", this.positions);
    this.geometry.setAttribute("aCoordinates", this.coordinates);
    this.geometry.setAttribute("aOffset", this.offset);
    this.geometry.setAttribute("aSpeed", this.speeds);
    this.geometry.setAttribute("aDirection", this.direction);
    this.geometry.setAttribute("aPress", this.press);
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  play() {}

  stop() {}
  render() {
    this.time++;
    if (this.material) {
      let next = Math.floor(this.move + 40) % 2;
      let prev = (Math.floor(this.move) + 1 + 40) % 2;
      this.material.uniforms.t1.value = this.textures[prev];
      this.material.uniforms.t2.value = this.textures[next];

      this.material.uniforms.transition.value = this.guiParams.progress;
      this.material.uniforms.time.value = this.time;
      this.material.uniforms.move.value = this.move;
      this.material.uniforms.mouse.value = this.point;
    }

    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

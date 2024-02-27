import { EffectComposer, EffectPass, RenderPass } from "postprocessing";
import * as THREE from "three";
import WaterTexture from "./WaterTexture";

import { Planes } from "./Planes";
import { Text } from "./Text";
import WaterEffect from "./WaterEffect";

// const images = [
//   require("/public/assets/view-01.jpg"),
//   require("/public/assets/view-02.jpg"),
//   require("/public/assets/view-03.jpg"),
// ];

const images = [
  "/assets/view-01.jpg",
  "/assets/view-02.jpg",
  "/assets/view-03.jpg",
];

class WaterDistortion {
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  camera: THREE.PerspectiveCamera;
  disposed: boolean;
  scene: THREE.Scene;
  clock: THREE.Clock;
  assets: {};
  raycaster: THREE.Raycaster;
  hitObjects: Array<THREE.Mesh>;
  waterTexture: WaterTexture;
  data: { text: string[]; images: any[] };
  subjects: (Planes | Text)[];
  loader: Loader;
  waterEffect: WaterEffect | undefined;
  mouse: { x: number; y: number } | undefined;
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGL1Renderer({
      antialias: false,
      canvas,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.composer = new EffectComposer(this.renderer);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.z = 50;
    this.disposed = false;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfff6f6);

    this.clock = new THREE.Clock();

    this.assets = {};
    this.raycaster = new THREE.Raycaster();
    this.hitObjects = [];

    this.waterTexture = new WaterTexture();

    this.data = {
      text: ["DON'T", "LOOK", "BACK"],
      images,
    };

    this.subjects = [
      new Planes(this, images),
      new Text(this, this.data.text[1]),
    ];

    this.tick = this.tick.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

    this.init = this.init.bind(this);
    this.loader = new Loader();
    this.loadAssets().then(this.init);
  }

  loadAssets() {
    const loader = this.loader;
    return new Promise<void>((resolve, reject) => {
      this.subjects.forEach((subject) => {
        subject.load(loader);
      });

      loader.onComplete = () => {
        resolve();
      };
    });
  }

  initComposer() {
    const renderPass = new RenderPass(this.scene, this.camera);
    this.waterEffect = new WaterEffect({
      texture: this.waterTexture.texture,
    });
    const waterPass = new EffectPass(this.camera, this.waterEffect);
    waterPass.renderToScreen = true;
    renderPass.renderToScreen = false;

    this.composer.addPass(renderPass);
    this.composer.addPass(waterPass);
  }

  init() {
    this.waterTexture.initTexture();

    this.initTextPlane();
    this.addHitPlane();
    this.subjects.forEach((subject) => subject.init());

    this.initComposer();

    this.tick();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("touchmove", this.onTouchMove);
  }

  onTouchMove(ev: TouchEvent) {
    const touch = ev.targetTouches[0];
    this.onMouseMove({
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
  }

  onMouseMove(ev: { clientX: number; clientY: number }) {
    const raycaster = this.raycaster;
    this.mouse = {
      x: ev.clientX / window.innerWidth,
      y: 1 - ev.clientY / window.innerHeight,
    };
    this.waterTexture.addTouch(this.mouse);

    raycaster.setFromCamera(
      new THREE.Vector2(
        (ev.clientX / window.innerWidth) * 2 - 1,
        -(ev.clientY / window.innerHeight) * 2 + 1
      ),
      this.camera
    );
    this.subjects.forEach((subject: Planes | Text) => {
      if (subject instanceof Planes) {
        subject.onMouseMove();
      }
    });
  }

  addImagePlane() {
    // todo
  }

  initTextPlane() {
    const viewSize = this.getViewSize();

    const geometry = new THREE.PlaneGeometry(
      viewSize.width,
      viewSize.height,
      1,
      1
    );
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: new THREE.Uniform(this.waterTexture.texture),
        uLines: new THREE.Uniform(5),
        uLineWidth: new THREE.Uniform(0.01),
        uLineColor: new THREE.Uniform(new THREE.Color(0x99d2eb)),
      },
      transparent: true,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uLines;
        uniform float uLineWidth;
        uniform vec3 uLineColor;
        varying vec2 vUv;
        void main() {
            vec3 color = vec3(1.);
            color = vec3(0.);
            float line = step(0.5 - uLineWidth / 2., fract(vUv.x * uLines)) - step(0.50 + uLineWidth / 2., fract(vUv.x * uLines));
            color += line * uLineColor;
            gl_FragColor = vec4(uLineColor, line);
        }
      `,
      vertexShader: `
        varying vec2 vUv;

        void main() {
            vec3 pos = position.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
            vUv = uv;
        }
      `,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -0.001;
    this.scene.add(mesh);
  }

  addHitPlane() {
    const viewSize = this.getViewSize();
    const geometry = new THREE.PlaneGeometry(
      viewSize.width,
      viewSize.height,
      1,
      1
    );
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    this.hitObjects.push(mesh);
  }

  getViewSize() {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(
      this.camera.position.z * Math.tan(fovInRadians / 2) * 2
    );
    return { width: height * this.camera.aspect, height };
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("mousemove", this.onMouseMove);
    this.scene.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.dispose();
        child.geometry.dispose();
      }
    });
    if (this.waterTexture) this.waterTexture.texture?.dispose();
    // this.scene.dispose();
    this.renderer.dispose();
    this.composer.dispose();
  }

  update() {
    this.waterTexture.update();
    this.subjects.forEach((subject) => {
      subject.update();
    });
  }

  render() {
    this.composer.render(this.clock.getDelta());
  }

  tick() {
    if (this.disposed) return;
    this.render();
    this.update();
    requestAnimationFrame(this.tick);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.subjects.forEach((subject) => {
      subject.onResize(window.innerWidth, window.innerHeight);
    });
  }
}

export default WaterDistortion;

class Loader {
  items: string[];
  loaded: string[];
  constructor() {
    this.items = [];
    this.loaded = [];
  }
  begin(name: string) {
    this.items.push(name);
  }
  end(name: string) {
    this.loaded.push(name);
    if (this.loaded.length == this.items.length) {
      this.onComplete();
    }
  }
  onComplete() {}
}

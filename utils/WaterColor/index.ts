import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import vertex from "@/public/shaders/watercolor/vertex.glsl";
import fragment from "@/public/shaders/watercolor/fragment.glsl";
import fragmentFBO from "@/public/shaders/watercolor/fbo.glsl";
import { resolve } from "path";

export default class WaterColorSketch {
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
  gltfLoader: GLTFLoader;
  dracoLoader: DRACOLoader;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  pointerPos: THREE.Vector3;
  dummy:
    | THREE.Mesh<
        THREE.SphereGeometry,
        THREE.MeshBasicMaterial,
        THREE.Object3DEventMap
      >
    | undefined;
  sourceTarget!: THREE.WebGLRenderTarget<THREE.Texture>;
  fboScene!: THREE.Scene;
  fboMaterial!: THREE.ShaderMaterial;
  fboCamera!: THREE.OrthographicCamera;
  fboQuad!: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.ShaderMaterial,
    THREE.Object3DEventMap
  >;
  finalScene!: THREE.Scene;
  finalQuad!: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial,
    THREE.Object3DEventMap
  >;
  targetA!: THREE.WebGLRenderTarget<THREE.Texture>;
  targetB!: THREE.WebGLRenderTarget<THREE.Texture>;
  whiteScene: THREE.Scene;
  whitebg: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial,
    THREE.Object3DEventMap
  >;
  box: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshBasicMaterial,
    THREE.Object3DEventMap
  >;
  whiteTarget: THREE.WebGLRenderTarget<THREE.Texture>;
  raycasterPlane!: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial,
    THREE.Object3DEventMap
  >;
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xeeeeee, 1);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.gltfLoader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath("/draco/");
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerPos = new THREE.Vector3();

    this.whiteTarget = new THREE.WebGLRenderTarget(this.width, this.height);
    this.whiteScene = new THREE.Scene();
    this.whitebg = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    this.whiteScene.add(this.whitebg);
    this.whitebg.position.z = -1;

    this.box = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    this.whiteScene.add(this.box);

    this.isPlaying = true;

    this.setupPipeline();
    this.mouseEvents();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
  }

  mouseEvents() {
    this.raycasterPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({
        color: 0xff0000,

        side: THREE.DoubleSide,
      })
    );
    this.dummy = new THREE.Mesh(
      //   new THREE.PlaneGeometry(0.5, 0.5, 20, 20),
      new THREE.SphereGeometry(0.2, 30, 30),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        // map: new THREE.TextureLoader().load("/assets/textures/ball.png"),
        // transparent: true,
      })
    );
    this.scene.add(this.dummy);
    window.addEventListener("mousemove", (e) => {
      this.pointer.x = (e.clientX / this.width) * 2 - 1;
      this.pointer.y = -(e.clientY / this.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects([this.raycasterPlane]);

      if (intersects.length > 0) {
        this.dummy?.position.copy(intersects[0].point);
      }
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
    this.camera.updateProjectionMatrix();
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
    // this.scene.add(this.plane);
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

  setupPipeline() {
    this.sourceTarget = new THREE.WebGLRenderTarget(this.width, this.height);

    this.targetA = new THREE.WebGLRenderTarget(this.width, this.height);
    this.targetB = new THREE.WebGLRenderTarget(this.width, this.height);

    this.renderer.setRenderTarget(this.whiteTarget);
    this.renderer.render(this.whiteScene, this.camera);

    this.fboScene = new THREE.Scene();
    this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.fboMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        tDiffuse: { value: null },
        tPrev: { value: this.whiteTarget.texture },
        resolution: { value: new THREE.Vector4(this.width, this.height, 1, 1) },
      },
      vertexShader: vertex,
      fragmentShader: fragmentFBO,
    });
    this.fboQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.fboMaterial
    );
    this.fboScene.add(this.fboQuad);

    this.finalScene = new THREE.Scene();
    this.finalQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial({ map: this.targetA.texture })
    );
    this.finalScene.add(this.finalQuad);
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;

    requestAnimationFrame(this.render.bind(this));

    // RENDERING THE SOURCE
    this.renderer.setRenderTarget(this.sourceTarget);
    this.renderer.render(this.scene, this.camera);

    // running PING PONG
    this.renderer.setRenderTarget(this.targetA);
    this.renderer.render(this.fboScene, this.fboCamera);

    this.fboMaterial.uniforms.tDiffuse.value = this.sourceTarget.texture;
    this.fboMaterial.uniforms.tPrev.value = this.targetA.texture;
    this.fboMaterial.uniforms.time.value = this.time;

    // final output
    this.finalQuad.material.map = this.targetA.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.finalScene, this.fboCamera);

    // swap
    let temp = this.targetA;
    this.targetA = this.targetB;
    this.targetB = temp;
  }
}

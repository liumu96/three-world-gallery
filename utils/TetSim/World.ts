import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import TetSim from ".";

export default class World {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  draggableObjects: never[];
  controls: OrbitControls;
  viewDirty: boolean = false;
  raycaster: any;
  mat: THREE.Matrix4;
  vec: THREE.Vector3;
  zVec: THREE.Vector3;
  quat: THREE.Quaternion;
  color: THREE.Color;

  constructor(mainObject: TetSim) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x999db1);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    this.camera.position.set(0.0, 1, 4);
    this.camera.layers.enableAll();
    this.scene.add(this.camera);

    this.addLights();
    this.createGround();

    this.renderer = new THREE.WebGLRenderer({
      canvas: mainObject.canvas,
      antialias: true,
    }); //, alpha: true
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setAnimationLoop(mainObject.update.bind(mainObject));
    this.renderer.setClearColor(0x35363e, 0); // the default
    window.addEventListener("resize", this.onResize.bind(this), false);
    window.addEventListener(
      "orientationchange",
      this.onResize.bind(this),
      false
    );
    this.onResize();

    this.draggableObjects = [];
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.controls.panSpeed = 2;
    this.controls.zoomSpeed = 1;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.screenSpacePanning = true;
    this.controls.update();
    this.controls.addEventListener("change", () => (this.viewDirty = true));

    // raycaster
    this.raycaster = new THREE.Raycaster();
    this.raycaster.layers.set(0);

    // Temp variables to reduce allocations
    this.mat = new THREE.Matrix4();
    this.vec = new THREE.Vector3();
    this.zVec = new THREE.Vector3(0, 0, 1);
    this.quat = new THREE.Quaternion().identity();
    this.color = new THREE.Color();
  }

  addLights() {
    const spotLight = new THREE.SpotLight(0xffffff, Math.PI * 10.0);
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.2;
    spotLight.position.set(2, 3, 3);
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 20;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    this.scene.add(spotLight);

    const dirLight = new THREE.DirectionalLight(0x55505a, Math.PI * 10.0);
    dirLight.position.set(0, 3, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = -10;
    dirLight.shadow.camera.far = 10;

    dirLight.shadow.camera.right = 3;
    dirLight.shadow.camera.left = -3;
    dirLight.shadow.camera.top = 3;
    dirLight.shadow.camera.bottom = -3;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);
  }

  createGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20, 1, 1),
      new THREE.MeshPhongMaterial({ color: 0xa0adaf, shininess: 150 })
    );

    ground.rotation.x = -Math.PI / 2; // rotates X/Y to X/Z
    ground.receiveShadow = true;
    this.scene.add(ground);

    const helper = new THREE.GridHelper(20, 20);
    helper.material.opacity = 1.0;
    helper.material.transparent = true;
    helper.position.set(0, 0.002, 0);
    this.scene.add(helper);
  }

  onResize() {
    let width = window.innerWidth,
      height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

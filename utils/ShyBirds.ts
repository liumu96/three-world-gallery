import * as THREE from "three";
import Bird from "./Bird";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Position = {
  x: number;
  y: number;
};

class ShyBirds {
  canvas: HTMLCanvasElement;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  mousePos: Position = { x: 0, y: 0 };
  light!: THREE.HemisphereLight;
  shadowLight!: THREE.DirectionalLight;
  backLight!: THREE.DirectionalLight;
  bird1!: Bird;
  bird2!: Bird;
  bird3!: Bird;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.initRenderer();
    this.initScene();
    this.initCamera();

    this.animate = this.animate.bind(this);

    // Add event listener
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

    window.addEventListener("resize", this.onResize, false);
    document.addEventListener("mousemove", this.onMouseMove, false);
    document.addEventListener("touchstart", this.onTouchStart, false);
    document.addEventListener("touchend", this.onTouchEnd, false);
    document.addEventListener("touchmove", this.onTouchMove, false);

    this.createLights();
    this.createFloor();
    this.createBirds();
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      2000
    );
    this.camera.position.z = 1000;
    this.camera.position.y = 300;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    new OrbitControls(this.camera, this.renderer?.domElement);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      powerPreference: "high-performance",
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  createLights() {
    // TODO Shadow Effect
    this.light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);

    this.shadowLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.shadowLight.position.set(200, 200, 200);
    this.shadowLight.castShadow = true;
    this.shadowLight.shadow.bias = 0.2;
    this.shadowLight.shadow.mapSize.width = 1024;
    this.shadowLight.shadow.mapSize.height = 1024;
    this.shadowLight.shadow.camera.near = 1;
    this.shadowLight.shadow.camera.far = 1000;

    this.backLight = new THREE.DirectionalLight(0xffffff, 0.4);
    this.backLight.position.set(-100, 200, 50);
    this.backLight.shadow.bias = 0.1;
    this.backLight.castShadow = true;
    this.backLight.shadow.mapSize.width = 1024;
    this.backLight.shadow.mapSize.height = 1024;
    this.backLight.shadow.camera.near = 1;
    this.backLight.shadow.camera.far = 1000;

    this.scene.add(this.backLight);
    this.scene.add(this.light);
    this.scene.add(this.shadowLight);
    // const helper = new THREE.CameraHelper(this.shadowLight.shadow.camera);
    // this.scene.add(helper);
  }

  createFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshBasicMaterial({ color: 0xfffbec })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -33;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  createBirds() {
    this.bird1 = new Bird();
    this.bird1.threegroup.position.x = 0;
    this.scene.add(this.bird1.threegroup);

    this.bird2 = new Bird();
    this.bird2.threegroup.position.x = -250;
    this.bird2.side = "right";
    this.bird2.threegroup.scale.set(0.8, 0.8, 0.8);
    this.bird2.threegroup.position.y = -8;
    this.scene.add(this.bird2.threegroup);

    this.bird3 = new Bird();
    this.bird3.threegroup.position.x = 250;
    this.bird3.side = "left";
    this.bird3.threegroup.scale.set(0.8, 0.8, 0.8);
    this.bird3.threegroup.position.y = -8;
    this.scene.add(this.bird3.threegroup);
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
  onMouseMove(event: MouseEvent) {
    this.mousePos = {
      x: event.clientX,
      y: event.clientY,
    };
  }
  onTouchStart(event: TouchEvent) {
    if (event.touches.length > 1) {
      event.preventDefault();
      this.mousePos = {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY,
      };
    }
  }
  onTouchEnd(event: TouchEvent) {
    this.mousePos = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
  }
  onTouchMove(event: TouchEvent) {
    if (event.touches.length == 1) {
      event.preventDefault();
      this.mousePos = {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY,
      };
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    const { bird1, bird2, bird3 } = this;
    const tempHA = (this.mousePos.x - window.innerWidth / 2) / 200;
    const tempVA = (this.mousePos.y - window.innerHeight / 2) / 200;
    const userHAngle = Math.min(Math.max(tempHA, -Math.PI / 3), Math.PI / 3);
    const userVAngle = Math.min(Math.max(tempVA, -Math.PI / 3), Math.PI / 3);
    bird1.look(userHAngle, userVAngle);

    if (bird1.hAngle < -Math.PI / 5 && !bird2.intervalRunning) {
      bird2.lookAway(true);
      bird2.intervalRunning = true;
      bird2.behaviourInterval = setInterval(function () {
        bird2.lookAway(false);
      }, 1500);
    } else if (bird1.hAngle > 0 && bird2.intervalRunning) {
      bird2.stare();
      clearInterval(bird2.behaviourInterval);
      bird2.intervalRunning = false;
    } else if (bird1.hAngle > Math.PI / 5 && !bird3.intervalRunning) {
      bird3.lookAway(true);
      bird3.intervalRunning = true;
      bird3.behaviourInterval = setInterval(function () {
        bird3.lookAway(false);
      }, 1500);
    } else if (bird1.hAngle < 0 && bird3.intervalRunning) {
      bird3.stare();
      clearInterval(bird3.behaviourInterval);
      bird3.intervalRunning = false;
    }

    bird2.look(bird2.shyAngles.h, bird2.shyAngles.v);
    bird2.bodyBird.material.color.setRGB(
      bird2.color.r,
      bird2.color.g,
      bird2.color.b
    );

    bird3.look(bird3.shyAngles.h, bird3.shyAngles.v);
    bird3.bodyBird.material.color.setRGB(
      bird3.color.r,
      bird3.color.g,
      bird3.color.b
    );

    this.render();
    requestAnimationFrame(this.animate);
  }
}

export default ShyBirds;

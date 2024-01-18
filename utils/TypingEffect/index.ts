import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Particle from "./particle";

interface StringSize {
  wTexture: number;
  wScene: number;
  hTexture: number;
  hScene: number;
  caretPosScene: number[];
}

class TypingEffect {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  orbit: OrbitControls;
  dummy: THREE.Object3D<THREE.Object3DEventMap>;
  clock: THREE.Clock;
  cursorMesh!: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshBasicMaterial,
    THREE.Object3DEventMap
  >;
  private instancedMesh: THREE.InstancedMesh | undefined;
  particleGeometry: THREE.PlaneGeometry;
  particleMaterial: THREE.MeshBasicMaterial;
  particles: Array<Particle> = [];
  stringBox: StringSize = {
    wTexture: 0,
    wScene: 0,
    hTexture: 0,
    hScene: 0,
    caretPosScene: [],
  };
  textInputEl: HTMLTextAreaElement;

  constructor(canvas: HTMLCanvasElement, textInputEl: HTMLTextAreaElement) {
    this.canvas = canvas;
    this.textInputEl = textInputEl;

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 20;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xa6ccf2);

    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.enablePan = false;

    this.particleGeometry = new THREE.PlaneGeometry(1, 1);
    const texture = new THREE.TextureLoader().load("/assets/smoke.png");
    this.particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      alphaMap: texture,
      depthTest: false,
      opacity: 0.3,
      transparent: true,
    });

    this.dummy = new THREE.Object3D();
    this.clock = new THREE.Clock();

    this.createCursor();

    this.render = this.render.bind(this);
    this.refreshText = this.refreshText.bind(this);
  }

  createCursor() {
    const cursorGeometry = new THREE.BoxGeometry(0.15, 4.5, 0.03);
    cursorGeometry.translate(0.2, -2.7, 0);
    const cursorMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
    });
    this.cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);
    this.scene.add(this.cursorMesh);
  }

  render() {
    requestAnimationFrame(this.render);

    this.updateParticlesMatrices();
    this.updateCursorOpacity();

    this.renderer.render(this.scene, this.camera);
  }

  updateParticlesMatrices() {
    let idx = 0;
    this.particles.forEach((p) => {
      p.grow();
      this.dummy.quaternion.copy(this.camera.quaternion);
      this.dummy.rotation.z += p.rotationZ;
      this.dummy.scale.set(p.scale, p.scale, p.scale);
      this.dummy.position.set(p.x, this.stringBox.hScene - p.y, p.z);
      this.dummy.updateMatrix();
      this.instancedMesh?.setMatrixAt(idx, this.dummy.matrix);
      idx++;
    });

    this.instancedMesh &&
      (this.instancedMesh.instanceMatrix.needsUpdate = true);
  }

  updateCursorOpacity() {
    let roundPulse = (t: number) =>
      Math.sign(Math.sin(t * Math.PI)) *
      Math.pow(Math.sin((t % 1) * 3.14), 0.2);

    if (document.hasFocus() && document.activeElement === this.textInputEl) {
      this.cursorMesh.material.opacity =
        0.7 * roundPulse(2 * this.clock.getElapsedTime());
    } else {
      this.cursorMesh.material.opacity = 0;
    }
  }

  recreateInstancedMesh() {
    if (this.instancedMesh) {
      this.instancedMesh.visible = false; // 隐藏旧的 InstancedMesh
      this.scene.remove(this.instancedMesh);
    }
    this.instancedMesh = new THREE.InstancedMesh(
      this.particleGeometry,
      this.particleMaterial,
      this.particles.length
    );

    this.scene.add(this.instancedMesh);

    this.instancedMesh.position.x = -0.5 * this.stringBox.wScene;
    this.instancedMesh.position.y = -0.5 * this.stringBox.hScene;

    this.instancedMesh.visible = true;
  }

  makeTextFitScreen(): void {
    const fov = this.camera.fov * (Math.PI / 180);
    const fovH = 2 * Math.atan(Math.tan(fov / 2) * this.camera.aspect);
    const dx = Math.abs((0.7 * this.stringBox.wScene) / Math.tan(0.5 * fovH));
    const dy = Math.abs((0.6 * this.stringBox.hScene) / Math.tan(0.5 * fov));
    const factor = Math.max(dx, dy) / this.camera.position.length();
    if (factor > 1) {
      this.camera.position.x *= factor;
      this.camera.position.y *= factor;
      this.camera.position.z *= factor;
    }
  }

  updateCursorPosition() {
    this.cursorMesh.position.x =
      -0.5 * this.stringBox.wScene + this.stringBox.caretPosScene[0];
    this.cursorMesh.position.y = 0;
    // 0.4 * this.stringBox.hScene - this.stringBox.caretPosScene[1] ;
    console.log(this.cursorMesh.position, this.stringBox);
  }

  refreshText(particles: Array<Particle>, stringBox: StringSize) {
    this.particles = particles;

    this.stringBox = stringBox;
    this.recreateInstancedMesh();
    this.makeTextFitScreen();
    this.updateCursorPosition();
  }
}

export default TypingEffect;

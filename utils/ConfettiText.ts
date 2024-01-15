import * as THREE from "three";

class ConfettiText {
  canvas: HTMLCanvasElement;
  scene!: THREE.Scene;
  renderer!: THREE.WebGLRenderer;
  camera!: THREE.PerspectiveCamera;
  particles: Array<Particle> = [];
  mouseVector = new THREE.Vector3(0, 0, 0);
  mousePos = new THREE.Vector3(0, 0, 0);
  cameraLookAt = new THREE.Vector3(0, 0, 0);
  cameraTarget = new THREE.Vector3(0, 0, 800);
  input!: HTMLElement | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.initScene();
    // this.initCanvas();
    this.initCamera();
    this.createLights();

    this.animate = this.animate.bind(this);
    this.setParticles = this.setParticles.bind(this);

    this.onMouseMove = this.onMouseMove.bind(this);
    document.addEventListener("mousemove", this.onMouseMove, false);

    this.onResize = this.onResize.bind(this);
    // window.addEventListener("resize", this.onResize, false);
  }

  onMouseMove(e: MouseEvent) {
    const x = e.pageX - window.innerWidth / 2;
    const y = e.pageY - window.innerHeight / 2;

    this.cameraTarget.x = -x;
    this.cameraTarget.y = y;
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initCanvas() {
    const textCxt = this.canvas.getContext("2d");
    if (textCxt) {
      textCxt.font = "700 100px Arial";
      textCxt.fillStyle = "#555";
    }
  }

  initCamera() {
    const fieldOfView = 75;
    const aspectRatio = window.innerWidth / window.innerHeight;
    const nearPlane = 1;
    const farPlane = 3000;
    this.camera = new THREE.PerspectiveCamera(
      fieldOfView,
      aspectRatio,
      nearPlane,
      farPlane
    );
    this.camera.position.z = 800;
  }

  createLights() {
    // const shadowLight = new THREE.DirectionalLight(0xffffff, 2);
    // shadowLight.position.set(20, 0, 10);
    // shadowLight.castShadow = true;
    // shadowLight.shadow.bias = 0.01;
    // this.scene.add(shadowLight);

    const shadowLight = new THREE.DirectionalLight(0xffffff, 2);
    shadowLight.position.set(20, 0, 10);
    shadowLight.castShadow = true;

    // Set up shadow camera
    shadowLight.shadow.camera.left = -500;
    shadowLight.shadow.camera.right = 500;
    shadowLight.shadow.camera.top = 500;
    shadowLight.shadow.camera.bottom = -500;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 3000;

    // Set up shadow resolution
    shadowLight.shadow.mapSize.width = 1024;
    shadowLight.shadow.mapSize.height = 1024;

    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(-20, 0, 20);
    this.scene.add(light);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 0, -20);
    this.scene.add(backLight);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  updateParticles() {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].updateRotation();
      this.particles[i].updatePosition();
    }
  }

  setParticles(textPixels: Array<Position>) {
    for (let i = 0; i < textPixels.length; i++) {
      const position = {
        x: (textPixels[i].x - window.innerWidth / 2) * 4,
        y: textPixels[i].y * 5,
      };
      if (this.particles[i]) {
        this.particles[i].particle.userData.targetPosition.x = position.x;
        this.particles[i].particle.userData.targetPosition.y = position.y;
        this.particles[i].particle.userData.targetPosition.z =
          -10 * Math.random() + 20;
      } else {
        const p = new Particle(position);
        this.scene.add(p.particle);
        this.particles[i] = p;
      }
    }

    for (let i = textPixels.length; i < this.particles.length; i++) {
      randomPos(this.particles[i].particle.userData.targetPosition);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.updateParticles();
    this.camera.position.lerp(this.cameraTarget, 0.2);
    this.camera.lookAt(this.cameraLookAt);
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

export default ConfettiText;

const colors = ["#4F02DB", "#E575EB", "#EB75AE", "#BF75EB", "#B429EA"];

type Position = {
  x: number;
  y: number;
};

class Particle {
  vx = Math.random() * 0.05;
  vy = Math.random() * 0.05;

  particle: THREE.Object3D<THREE.Object3DEventMap>;

  constructor(position: Position) {
    const particle = new THREE.Object3D();
    const geometryCore = new THREE.BoxGeometry(20, 20, 20);
    const colorIndex = Math.floor(
      (Math.random() * colors.length) % colors.length
    );

    const materialCore = new THREE.MeshLambertMaterial({
      color: colors[colorIndex],
      flatShading: true,
    });
    const box = new THREE.Mesh(geometryCore, materialCore);
    box.geometry.attributes.position.needsUpdate = true;
    particle.userData.targetPosition = new THREE.Vector3(
      position.x,
      position.y,
      -10 * Math.random() + 20
    );
    particle.position.set(
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      -10 * Math.random() + 20
    );
    randomPos(particle.position);

    for (
      let i = 0;
      i < box.geometry.attributes.position.array.length / 3;
      i++
    ) {
      box.geometry.attributes.position.array[i] += -10 + Math.random() * 20;
      box.geometry.attributes.position.array[i + 1] += -10 + Math.random() * 20;
      box.geometry.attributes.position.array[i + 2] += -10 + Math.random() * 20;
    }

    particle.add(box);
    this.particle = particle;
  }

  updateRotation() {
    this.particle.rotation.x += this.vx;
    this.particle.rotation.y += this.vy;
  }

  updatePosition() {
    this.particle.position.lerp(this.particle.userData.targetPosition, 0.02);
  }
}

const randomPos = (vector: THREE.Vector3) => {
  const radius = window.innerWidth * 3;
  const centerX = 0;
  const centerY = 0;

  // ensure that p(r) ~ r instead of p(r) ~ constant
  const r = window.innerWidth + radius * Math.random();
  const angle = Math.random() * Math.PI * 2;

  // compute desired coordinates
  vector.x = centerX + r * Math.cos(angle);
  vector.y = centerY + r * Math.sin(angle);
};

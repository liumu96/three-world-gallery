import * as THREE from "three";
// import * as dat from "dat.gui";

import AudioManager from "./managers/AudioManager";
import BPMManager from "./managers/BPMManager";
import ReactiveParticles from "./entities/ReactiveParticles";

let dat: { GUI: any; default?: any };
const init = async () => {
  dat = await import("dat.gui");
  ParticleMusic.gui = new dat.GUI();
};

class ParticleMusic {
  static holder: THREE.Object3D = new THREE.Object3D();
  static gui: dat.GUI;

  static audioManager: AudioManager | null = null;
  static bpmManager: BPMManager | null = null;

  canvas: HTMLCanvasElement;

  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;

  private particles: ReactiveParticles | undefined;

  width: number = 1;
  height: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    init();
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.autoClear = false;
    this.renderer.sortObjects = false; // todo

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.z = 12;
    this.camera.frustumCulled = false;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    ParticleMusic.holder.name = "holder";
    this.scene.add(ParticleMusic.holder);

    // ParticleMusic.gui = new dat.GUI();

    this.createManagers();

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  async createManagers() {
    ParticleMusic.audioManager = new AudioManager();
    await ParticleMusic.audioManager.loadAudioBuffer();

    ParticleMusic.bpmManager = new BPMManager();
    if (ParticleMusic.bpmManager) {
      ParticleMusic.bpmManager.addEventListener("beat", () => {
        this.particles?.onBPMBeat();
      });

      await ParticleMusic.bpmManager.detectBPM(
        ParticleMusic.audioManager?.audio?.buffer!
      );

      document.querySelector(".user_interaction")?.remove();

      ParticleMusic.audioManager.play();

      this.particles = new ReactiveParticles();
      this.particles?.init();

      this.update();
    }
  }

  private update() {
    requestAnimationFrame(() => this.update());

    this.particles?.update();
    ParticleMusic.audioManager?.update();

    this.renderer.render(this.scene, this.camera);
  }

  play() {
    ParticleMusic.audioManager?.play();
  }

  pause() {
    ParticleMusic.audioManager?.pause();
  }

  stop() {
    // ParticleMusic.audioManager?.stop();
  }
}

export default ParticleMusic;

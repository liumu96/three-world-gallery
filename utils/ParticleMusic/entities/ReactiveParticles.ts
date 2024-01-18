import * as THREE from "three";
import gsap from "gsap";
import vertex from "@/public/shaders/audioParticleVertexShader.glsl";
import fragment from "@/public/shaders/audioParticleFragmentShader.glsl";

import ParticleMusic from "..";

interface Properties {
  startColor: number;
  endColor: number;
  autoMix: boolean;
  autoRotate: boolean;
}

export default class ReactiveParticles extends THREE.Object3D {
  private time: number;
  private properties: Properties;
  private holderObjects: THREE.Object3D = new THREE.Object3D();
  private geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  private pointsMesh: THREE.Points | null = null;
  private material!: THREE.ShaderMaterial;

  constructor() {
    super();
    this.name = "ReactiveParticles";
    this.time = 0;
    this.properties = {
      startColor: 0xff00ff,
      endColor: 0x00ffff,
      autoMix: true,
      autoRotate: true,
    };
  }

  init(): void {
    ParticleMusic.holder.add(this);

    this.add(this.holderObjects);

    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        offsetSize: { value: 2 },
        size: { value: 1.1 },
        frequency: { value: 2 },
        amplitude: { value: 1 },
        offsetGain: { value: 0 },
        maxDistance: { value: 1.8 },
        startColor: { value: new THREE.Color(this.properties.startColor) },
        endColor: { value: new THREE.Color(this.properties.endColor) },
      },
    });

    this.addGUI();
    this.resetMesh();
  }

  createBoxMesh() {
    // Randomly generate segment counts for width, height, and depth to create varied box geometries
    let widthSeg = Math.floor(THREE.MathUtils.randInt(5, 20));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(1, 40));
    let depthSeg = Math.floor(THREE.MathUtils.randInt(5, 80));
    this.geometry = new THREE.BoxGeometry(
      1,
      1,
      1,
      widthSeg,
      heightSeg,
      depthSeg
    );

    // Update shader material uniform for offset size with a random value
    this.material.uniforms.offsetSize.value = Math.floor(
      THREE.MathUtils.randInt(30, 60)
    );
    this.material.needsUpdate = true;

    // Create a container for the points mesh and set its orientation
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.rotateX(Math.PI / 2); // Rotate the mesh for better visual orientation
    this.holderObjects.add(this.pointsMesh);

    // Animate the rotation of the container
    gsap.to(this.pointsMesh.rotation, {
      duration: 3,
      x: Math.random() * Math.PI,
      z: Math.random() * Math.PI * 2,
      ease: "none",
    });

    gsap.to(this.position, {
      duration: 0.6,
      z: THREE.MathUtils.randInt(9, 11),
      ease: "elastic.out(0.8)",
    });
  }

  createCylinderMesh() {
    // Randomize radial and height segments for the cylinder geometry
    let radialSeg = Math.floor(THREE.MathUtils.randInt(1, 3));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(1, 5));
    this.geometry = new THREE.CylinderGeometry(
      1,
      1,
      4,
      64 * radialSeg,
      64 * heightSeg,
      true
    );

    // Update shader material uniforms for offset and size with random and fixed values
    this.material.uniforms.offsetSize.value = Math.floor(
      THREE.MathUtils.randInt(30, 60)
    );
    this.material.uniforms.size.value = 2; // Fixed size for uniform appearance
    this.material.needsUpdate = true;

    // Create a points mesh using the cylinder geometry and shader material
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.rotation.set(Math.PI / 2, 0, 0); // Rotate the mesh for better orientation
    this.holderObjects.add(this.pointsMesh);

    let rotY = 0;
    let posZ = THREE.MathUtils.randInt(9, 11);

    if (Math.random() < 0.2) {
      rotY = Math.PI / 2;
      posZ = THREE.MathUtils.randInt(10, 11.5);
    }

    gsap.to(this.holderObjects.rotation, {
      duration: 0.2,
      y: rotY,
      ease: "elastic.out(0.2)",
    });

    gsap.to(this.position, {
      duration: 0.6,
      z: posZ,
      ease: "elastic.out(0.8)",
    });
  }

  onBPMBeat() {
    const duration = ParticleMusic.bpmManager?.getBPMDuration()! / 1000;

    if (ParticleMusic.audioManager?.isPlaying) {
      if (Math.random() < 0.3 && this.properties.autoRotate) {
        gsap.to(this.holderObjects.rotation, {
          duration: Math.random() < 0.8 ? 15 : duration,
          z: Math.random() * Math.PI,
          ease: "elastic.out(0.2)",
        });
      }

      if (Math.random() < 0.3) {
        this.resetMesh();
      }
    }
  }

  resetMesh() {
    if (this.properties.autoMix) {
      this.destroyMesh();
      if (Math.random() < 0.5) {
        this.createCylinderMesh();
      } else {
        this.createBoxMesh();
      }

      gsap.to(this.material.uniforms.frequency, {
        duration: ParticleMusic.bpmManager
          ? (ParticleMusic.bpmManager.getBPMDuration() / 1000) * 2
          : 2,
        value: THREE.MathUtils.randFloat(0.5, 3),
        ease: "expo.easeInOut",
      });
    }
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
      this.pointsMesh.geometry?.dispose();
      // this.pointsMesh.material?.dispose();
      (this.pointsMesh.material as THREE.Material).dispose();
      this.pointsMesh = null;
    }
  }

  update() {
    if (ParticleMusic.audioManager?.isPlaying) {
      this.material.uniforms.amplitude.value =
        0.8 +
        THREE.MathUtils.mapLinear(
          ParticleMusic.audioManager.frequencyData.high,
          0,
          0.6,
          -0.1,
          0.2
        );

      this.material.uniforms.offsetGain.value =
        ParticleMusic.audioManager.frequencyData.mid * 0.6;

      const t = THREE.MathUtils.mapLinear(
        ParticleMusic.audioManager.frequencyData.low,
        0.6,
        1,
        0.2,
        0.5
      );
      this.time += THREE.MathUtils.clamp(t, 0.2, 0.5);
    } else {
      this.material.uniforms.frequency.value = 0.8;
      this.material.uniforms.amplitude.value = 1;
      this.time += 0.2;
    }

    this.material.uniforms.time.value = this.time;
  }

  addGUI() {
    const gui = ParticleMusic.gui;
    const particlesFolder = gui.addFolder("PARTICLES");
    particlesFolder
      .addColor(this.properties, "startColor")
      .listen()
      .name("Start Color")
      .onChange((e) => {
        this.material.uniforms.startColor.value = new THREE.Color(e);
      });
    particlesFolder
      .addColor(this.properties, "endColor")
      .listen()
      .name("End Color")
      .onChange((e) => {
        this.material.uniforms.endColor.value = new THREE.Color(e);
      });
    const visualizerFolder = gui.addFolder("VISUALIZER");
    visualizerFolder.add(this.properties, "autoMix").listen().name("Auto Mix");
    visualizerFolder
      .add(this.properties, "autoRotate")
      .listen()
      .name("Auto Rotate");
    const buttonShowBox = {
      showBox: () => {
        this.destroyMesh();
        this.createBoxMesh();
        this.properties.autoMix = false;
      },
    };
    visualizerFolder.add(buttonShowBox, "showBox").name("Show Box");
    const buttonShowCylinder = {
      showCylinder: () => {
        this.destroyMesh();
        this.createCylinderMesh();
        this.properties.autoMix = false;
      },
    };
    visualizerFolder
      .add(buttonShowCylinder, "showCylinder")
      .name("Show Cylinder");
  }
}

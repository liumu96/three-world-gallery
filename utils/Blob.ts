import * as THREE from "three";
import { defaultBlobOptions, maxParticlesCount } from "./blogConfig";
import vertexShader from "@/public/shaders/blobVertexShader.glsl";
import fragmentShader from "@/public/shaders/blobFragmentShader.glsl";
import { FolderApi, Pane } from "tweakpane";

class Blob extends THREE.Object3D {
  options: any;
  color1: THREE.Color;
  color2: THREE.Color;
  geometry!: THREE.InstancedBufferGeometry;
  material!: THREE.RawShaderMaterial;
  mesh!: THREE.Mesh<
    THREE.InstancedBufferGeometry,
    THREE.RawShaderMaterial,
    THREE.Object3DEventMap
  >;
  gui!: Pane;
  isDead!: boolean;

  constructor(options: any) {
    super();

    this.options = { ...defaultBlobOptions, ...options };

    this.color1 = new THREE.Color(this.options.color1);
    this.color2 = new THREE.Color(this.options.color2);

    this.initGeometry();
    this.initMaterial();
    this.initMesh();
    this.initGUI(options.id);
  }
  initGeometry() {
    const planeGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.index = planeGeometry.index;
    this.geometry.attributes = planeGeometry.attributes;

    const translateAttributeSize = 3;
    var translateArray = new Float32Array(maxParticlesCount * 3);

    const translate = new THREE.Vector3();
    for (let i = 0; i < maxParticlesCount; i++) {
      const phi = THREE.MathUtils.randFloat(0, Math.PI);
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      translate.setFromSphericalCoords(this.options.blobSize, phi, theta);
      translateArray.set(
        [translate.x, translate.y, translate.z],
        translateAttributeSize * i
      );
    }

    this.geometry.instanceCount = this.options.particlesCount;

    this.geometry.setAttribute(
      "translate",
      new THREE.InstancedBufferAttribute(translateArray, 3)
    );
  }
  initMaterial() {
    this.material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uScale: { value: this.options.scale },
        uScaleNoiseTime: { value: 0 },
        uScaleNoiseScale: { value: this.options.scaleNoiseScale },
        uScaleNoiseAmount: { value: this.options.scaleNoiseAmount },

        uTranslateNoiseTime: { value: 0 },
        uTranslateNoiseScale: { value: this.options.translateNoiseScale },
        uTranslateNoiseAmount: { value: this.options.translateNoiseAmount },

        uColor1: { value: this.color1 },
        uColor2: { value: this.color2 },
        uColorNoiseTime: { value: 100 }, // Voluntarily use a different starting value than uScaleNoiseTime
        uColorNoiseScale: { value: this.options.colorNoiseScale },
        uColorNoiseAmount: { value: this.options.colorNoiseAmount },

        uAlpha: { value: this.options.alpha },
        uAlphaNoiseTime: { value: 200 }, // Voluntarily use another different starting value
        uAlphaNoiseScale: { value: this.options.alphaNoiseScale },
        uAlphaNoiseAmount: { value: this.options.alphaNoiseAmount },
        uAlphaNoisePow: { value: this.options.alphaNoisePow },
      },
    });
  }
  initMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.scale.set(
      this.options.blobScale,
      this.options.blobScale,
      this.options.blobScale
    );
    this.add(this.mesh);
  }
  initGUI(id: any) {
    this.gui = this.options.gui.addFolder({
      title: `Blob #${id}`,
      expanded: false,
    });

    this.gui.addBinding(this.mesh, "visible");

    // BLOB SCALE
    this.gui
      .addBinding(this.scale, "x", {
        label: "scale",
        min: 0,
        max: 5,
      })
      .on("change", (ev) => {
        this.scale.x = ev.value;
        this.scale.y = ev.value;
        this.scale.z = ev.value;
      });

    // ROTATION SPEED
    this.gui.addBinding(this.options, "rotationSpeed", {
      label: "rotation",
      min: -0.01,
      max: 0.01,
    });

    this.initGUITranslateNoise(this.gui);
    this.initGUIParticles(this.gui);

    this.gui
      .addButton({
        title: "Remove",
      })
      .on("click", () => {
        this.killBlob();
      });
  }

  initGUITranslateNoise(root: Pane) {
    const folder = root.addFolder({
      title: "Distortion",
      expanded: false,
    });

    // POSITION NOISE AMOUNT
    folder.addBinding(this.material.uniforms.uTranslateNoiseAmount, "value", {
      label: "amount",
      min: 0,
      max: 200,
    });
    // POSITION NOISE SCALE
    folder.addBinding(this.material.uniforms.uTranslateNoiseScale, "value", {
      label: "scale",
      min: 0,
      max: 0.01,
      step: 0.0001,
    });

    // ROTATION SPEED
    folder.addBinding(this.options, "translateNoiseSpeed", {
      label: "speed",
      min: 0,
      max: 0.1,
      step: 0.0001,
    });
  }

  initGUIParticles(root: Pane) {
    const folder = root.addFolder({
      title: "Particles",
      expanded: false,
    });

    folder
      .addBinding(this.options, "particlesCount", {
        label: "count",
        min: 0,
        max: maxParticlesCount,
      })
      .on("change", (ev) => {
        this.geometry.instanceCount = ev.value;
      });

    this.initGUIParticlesScale(folder);
    this.initGUIParticlesColor(folder);
    this.initGUIParticlesAlpha(folder);
  }

  initGUIParticlesScale(root: FolderApi) {
    const scaleFolder = root.addFolder({
      title: "Scale",
      expanded: false,
    });

    scaleFolder.addBinding(this.mesh.material.uniforms.uScale, "value", {
      label: "scale",
      min: 0,
      max: 100,
    });

    const noiseFolder = scaleFolder.addFolder({
      title: "Noise",
      expanded: false,
    });
    noiseFolder.addBinding(
      this.mesh.material.uniforms.uScaleNoiseAmount,
      "value",
      {
        label: "amount",
        min: 0,
        max: 1,
        step: 0.0001,
      }
    );
    noiseFolder.addBinding(
      this.mesh.material.uniforms.uScaleNoiseScale,
      "value",
      {
        label: "scale",
        min: 0,
        max: 0.01,
        step: 0.0001,
      }
    );
    noiseFolder.addBinding(this.options, "scaleNoiseSpeed", {
      label: "speed",
      min: 0,
      max: 0.05,
      step: 0.0001,
    });
  }

  initGUIParticlesColor(root: FolderApi) {
    const folder = root.addFolder({
      title: "Color",
      expanded: false,
    });

    // Color 1
    folder.addBinding(this, "color1").on("change", (ev) => {
      this.mesh.material.uniforms.uColor1.value.r = ev.value.r / 255;
      this.mesh.material.uniforms.uColor1.value.g = ev.value.g / 255;
      this.mesh.material.uniforms.uColor1.value.b = ev.value.b / 255;

      this.color1.r = ev.value.r / 255;
      this.color1.g = ev.value.g / 255;
      this.color1.b = ev.value.b / 255;
    });

    // Color 2
    folder.addBinding(this, "color2").on("change", (ev) => {
      this.mesh.material.uniforms.uColor2.value.r = ev.value.r / 255;
      this.mesh.material.uniforms.uColor2.value.g = ev.value.g / 255;
      this.mesh.material.uniforms.uColor2.value.b = ev.value.b / 255;

      this.color2.r = ev.value.r / 255;
      this.color2.g = ev.value.g / 255;
      this.color2.b = ev.value.b / 255;
    });

    const noiseFolder = folder.addFolder({
      title: "Noise",
      expanded: false,
    });
    noiseFolder.addBinding(
      this.mesh.material.uniforms.uColorNoiseAmount,
      "value",
      {
        label: "amount",
        min: 0,
        max: 1,
        step: 0.0001,
      }
    );
    noiseFolder.addBinding(
      this.mesh.material.uniforms.uColorNoiseScale,
      "value",
      {
        label: "scale",
        min: 0,
        max: 0.01,
        step: 0.0001,
      }
    );
    noiseFolder.addBinding(this.options, "colorNoiseSpeed", {
      label: "speed",
      min: 0,
      max: 0.05,
      step: 0.0001,
    });
  }

  initGUIParticlesAlpha(root: FolderApi) {
    const folder = root.addFolder({
      title: "Alpha",
      expanded: false,
    });

    folder.addBinding(this.mesh.material.uniforms.uAlpha, "value", {
      label: "alpha",
      min: 0,
      max: 1,
    });

    const noiseFolder = folder.addFolder({
      title: "Noise",
      expanded: false,
    });
    noiseFolder.addBinding(
      this.mesh.material.uniforms.uAlphaNoiseAmount,
      "value",
      {
        label: "amount",
        min: 0,
        max: 1,
        step: 0.0001,
      }
    );
    noiseFolder.addBinding(
      this.mesh.material.uniforms.uAlphaNoiseScale,
      "value",
      {
        label: "scale",
        min: 0,
        max: 0.01,
        step: 0.0001,
      }
    );
    noiseFolder.addBinding(this.options, "alphaNoiseSpeed", {
      label: "speed",
      min: 0,
      max: 0.05,
      step: 0.0001,
    });
    noiseFolder.addBinding(
      this.mesh.material.uniforms.uAlphaNoisePow,
      "value",
      {
        label: "pow",
        min: 0,
        max: 10,
        step: 0.0001,
      }
    );
  }

  killBlob() {
    this.gui.dispose();
    this.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();

    // Add a isDead flag, so the CelestialBody class can know
    // if this particular blob can be deleted or not
    this.isDead = true;
  }

  update() {
    this.mesh.material.uniforms.uTranslateNoiseTime.value +=
      this.options.translateNoiseSpeed;
    this.mesh.material.uniforms.uScaleNoiseTime.value +=
      this.options.scaleNoiseSpeed;
    this.mesh.material.uniforms.uColorNoiseTime.value +=
      this.options.colorNoiseSpeed;
    this.mesh.material.uniforms.uAlphaNoiseTime.value +=
      this.options.alphaNoiseSpeed;
    this.rotation.y += this.options.rotationSpeed;
  }
}

export default Blob;

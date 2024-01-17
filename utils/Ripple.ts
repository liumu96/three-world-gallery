import * as THREE from "three";

import vertexShader from "@/public/shaders/rippleVertexShader.glsl";
import fragmentShader from "@/public/shaders/rippleFragmentShader.glsl";

class Ripple {
  canvas: HTMLCanvasElement;
  camera!: THREE.Camera;
  scene!: THREE.Scene;
  texture!: THREE.Texture;
  environment!: THREE.Texture;
  pooltex!: THREE.Texture;
  beta = Math.random() * -1000;

  divisor = 1 / 8;
  textureFraction = 1 / 1;
  rtTexture!: THREE.WebGLRenderTarget<THREE.Texture>;
  rtTexture2!: THREE.WebGLRenderTarget<THREE.Texture>;
  uniforms!: {
    u_time: { type: string; value: number };
    u_resolution: { type: string; value: THREE.Vector2 };
    u_noise: { type: string; value: THREE.Texture };
    u_buffer: { type: string; value: THREE.Texture };
    u_texture: { type: string; value: THREE.Texture };
    u_environment: { type: string; value: THREE.Texture };
    u_mouse: { type: string; value: THREE.Vector3 };
    u_frame: { type: string; value: number };
    u_renderpass: { type: string; value: boolean };
  };
  renderer!: THREE.WebGLRenderer;
  newmouse = {
    x: 0,
    y: 0,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.animate = this.animate.bind(this);

    this.loadTexture();
  }

  loadTexture() {
    const loader = new THREE.TextureLoader();
    // let texture, rtTexture, rtTexture2, environment, pooltex;
    loader.setCrossOrigin("anonymous");
    loader.load("/preview/noise.png", (tex) => {
      this.texture = tex;
      this.texture.wrapS = THREE.RepeatWrapping;
      this.texture.wrapT = THREE.RepeatWrapping;
      this.texture.minFilter = THREE.LinearFilter;

      loader.load("/preview/env_lat-lon.png", (tex) => {
        this.environment = tex;
        this.environment.wrapS = THREE.RepeatWrapping;
        this.environment.wrapT = THREE.RepeatWrapping;
        this.environment.minFilter = THREE.NearestMipMapNearestFilter;

        loader.load("/preview/tiling-mosaic.jpg", (tex) => {
          this.pooltex = tex;
          this.pooltex.wrapS = THREE.RepeatWrapping;
          this.pooltex.wrapT = THREE.RepeatWrapping;
          this.pooltex.minFilter = THREE.NearestMipMapNearestFilter;

          this.init();
          this.animate(0);
        });
      });
    });
  }

  init() {
    this.camera = new THREE.Camera();
    this.camera.position.z = 1;

    this.scene = new THREE.Scene();

    const geometry = new THREE.PlaneGeometry(2, 2);

    this.rtTexture = new THREE.WebGLRenderTarget(
      Math.floor(window.innerWidth * this.textureFraction),
      Math.floor(window.innerHeight * this.textureFraction),
      { type: THREE.FloatType, minFilter: THREE.NearestMipMapNearestFilter }
    );
    this.rtTexture2 = new THREE.WebGLRenderTarget(
      Math.floor(window.innerWidth * this.textureFraction),
      Math.floor(window.innerHeight * this.textureFraction),
      { type: THREE.FloatType, minFilter: THREE.NearestMipMapNearestFilter }
    );

    this.uniforms = {
      u_time: { type: "f", value: 1.0 },
      u_resolution: { type: "v2", value: new THREE.Vector2() },
      u_noise: { type: "t", value: this.texture },
      u_buffer: { type: "t", value: this.rtTexture.texture },
      u_texture: { type: "t", value: this.pooltex },
      u_environment: { type: "t", value: this.environment },
      u_mouse: { type: "v3", value: new THREE.Vector3() },
      u_frame: { type: "i", value: -1 },
      u_renderpass: { type: "b", value: false },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
    });
    material.extensions.derivatives = true;

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      powerPreference: "high-performance",
      antialias: false,
    });

    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize, false);
    this.onResize();

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    document.addEventListener("pointermove", this.onPointerMove, false);
    document.addEventListener("pointerdown", this.onPointerDown, false);
    document.addEventListener("pointerup", this.onPointerUp, false);
  }

  onPointerMove(e: PointerEvent) {
    e.preventDefault();
    const ratio = window.innerHeight / window.innerWidth;
    if (window.innerHeight > window.innerWidth) {
      this.newmouse.x = (e.pageX - window.innerWidth / 2) / window.innerWidth;
      this.newmouse.y =
        ((e.pageY - window.innerHeight / 2) / window.innerHeight) * -1 * ratio;
    } else {
      this.newmouse.x =
        (e.pageX - window.innerWidth / 2) / window.innerWidth / ratio;
      this.newmouse.y =
        ((e.pageY - window.innerHeight / 2) / window.innerHeight) * -1;
    }
  }

  onPointerDown() {
    this.uniforms.u_mouse.value.z = 1;
  }

  onPointerUp() {
    this.uniforms.u_mouse.value.z = 0;
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.uniforms.u_resolution.value.x = this.renderer.domElement.width;
    this.uniforms.u_resolution.value.y = this.renderer.domElement.height;

    this.rtTexture = new THREE.WebGLRenderTarget(
      window.innerWidth * this.textureFraction,
      window.innerHeight * this.textureFraction
    );

    this.rtTexture2 = new THREE.WebGLRenderTarget(
      window.innerWidth * this.textureFraction,
      window.innerHeight * this.textureFraction
    );

    this.uniforms.u_frame.value = -1;
  }

  animate(delta: any) {
    requestAnimationFrame(this.animate);
    this.render(delta);
  }

  render(delta: any) {
    this.uniforms.u_frame.value++;

    this.uniforms.u_mouse.value.x +=
      (this.newmouse.x - this.uniforms.u_mouse.value.x) * this.divisor;
    this.uniforms.u_mouse.value.y +=
      (this.newmouse.y - this.uniforms.u_mouse.value.y) * this.divisor;

    this.uniforms.u_time.value = this.beta + delta * 0.0005;
    this.renderer.render(this.scene, this.camera);
    this.renderTexture();
  }

  renderTexture() {
    const odims = this.uniforms.u_resolution.value.clone();

    this.uniforms.u_resolution.value.x =
      window.innerWidth * this.textureFraction;
    this.uniforms.u_resolution.value.y =
      window.innerHeight * this.textureFraction;

    this.uniforms.u_buffer.value = this.rtTexture2.texture;

    this.uniforms.u_renderpass.value = true;

    // window.rtTexture = this.rtTexture;

    this.renderer.setRenderTarget(this.rtTexture);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);

    const buffer = this.rtTexture;
    this.rtTexture = this.rtTexture2;
    this.rtTexture2 = buffer;

    this.uniforms.u_buffer.value = this.rtTexture.texture;
    this.uniforms.u_resolution.value = odims;
    this.uniforms.u_renderpass.value = false;
  }
}

export default Ripple;

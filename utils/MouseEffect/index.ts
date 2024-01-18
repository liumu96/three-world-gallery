import { gsap } from "gsap";

import Rendering from "./rendering";

import * as THREE from "three";
import RoundedBox from "./RoundedBox";

import VertexHead from "@/public/shaders/mouseVertexShader.glsl";
import ProjectVertex from "@/public/shaders/mouseProjectVertexShader.glsl";

const followers = [
  new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshPhysicalMaterial({
      emissive: 0x000000,
      color: "#2040bb",
      roughness: 0,
      metalness: 0.4,
    })
  ),
  new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshPhysicalMaterial({
      emissive: 0x000000,
      color: "#f2b31e",
      roughness: 0,
      metalness: 0.4,
    })
  ),
  new THREE.Mesh(
    new THREE.SphereGeometry(),
    new THREE.MeshPhysicalMaterial({
      emissive: 0x000000,
      color: "#cb0f40",
      roughness: 0,
      metalness: 0.4,
    })
  ),
];

const colors = [
  {
    color: "#1084ff",
    colorDegrade: 1.5,
  },
  {
    color: "#59c959",
    colorDegrade: 1,
  },
  {
    color: "#ddd",
    colorDegrade: 1,
  },
];

interface Options {
  speed: number;
  frequency: number;
  mouseSize: number;
  rotationSpeed: number;
  rotationAmmount?: number;
  mouseScaling?: number;
  mouseIndent?: number;
  color: string;
  colorDegrade: number;
  shape?: string;
}

class InstancedMouseEffect {
  canvas: HTMLCanvasElement;
  rendering: Rendering;
  animation: gsap.core.Timeline;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  hitplane: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial,
    THREE.Object3DEventMap
  >;
  uniforms: {
    uTime: { value: number };
    uPos0: { value: THREE.Vector2 };
    uPos1: { value: THREE.Vector2 };
    uAnimate: { value: number };
    uConfig: { value: THREE.Vector4 };
    uConfig2: { value: THREE.Vector4 };
  };
  mesh!: THREE.InstancedMesh<
    | RoundedBox
    | THREE.CylinderGeometry
    | THREE.TorusGeometry
    | THREE.IcosahedronGeometry,
    THREE.MeshPhysicalMaterial
  >;
  follower: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.Material | THREE.Material[],
    THREE.Object3DEventMap
  >;
  options: Options;
  constructor({
    canvas,
    opts,
    follower = followers[0],
  }: {
    canvas: HTMLCanvasElement;
    opts?: Options;
    follower?: THREE.Mesh;
  }) {
    const defaults: Options = {
      speed: 1,
      frequency: 1,
      mouseSize: 1,
      rotationSpeed: 1,
      rotationAmmount: 0,
      mouseScaling: 0,
      mouseIndent: 1,
      color: "#1084ff",
      colorDegrade: 1,
      shape: "square",
    };

    const mergedOpts: Options = { ...defaults, ...opts };
    this.options = mergedOpts;
    this.canvas = canvas;

    // Renderer up
    const rendering = new Rendering(canvas, false);
    rendering.renderer.shadowMap.enabled = true;
    rendering.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendering.camera.position.z = 40;
    rendering.camera.position.y = 40;
    rendering.camera.position.x = 40;
    rendering.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.rendering = rendering;

    rendering.scene.add(follower);
    this.follower = follower;

    let uTime = { value: 0 };

    // Light Setup
    rendering.scene.add(new THREE.HemisphereLight(0x9f9f9f, 0xffffff, 1));
    rendering.scene.add(new THREE.AmbientLight(0xffffff, 1));
    let d2 = new THREE.DirectionalLight(0x909090, 1);
    rendering.scene.add(d2);
    d2.position.set(-1, 0.5, 1);
    d2.position.multiplyScalar(10);

    let d1 = new THREE.DirectionalLight(0xffffff, 4);
    rendering.scene.add(d1);
    d1.position.set(1, 0.5, 1);
    d1.position.multiplyScalar(10);

    d1.castShadow = true;
    d1.shadow.camera.left = -10;
    d1.shadow.camera.right = 10;
    d1.shadow.camera.top = 10;
    d1.shadow.camera.bottom = -10;
    d1.shadow.camera.far = 40;

    d1.shadow.mapSize.width = 2048;
    d1.shadow.mapSize.height = 2048;

    let uniforms = {
      uTime: uTime,
      uPos0: { value: new THREE.Vector2() },
      uPos1: { value: new THREE.Vector2() },
      uAnimate: { value: 0 },
      uConfig: {
        value: new THREE.Vector4(
          mergedOpts.speed,
          mergedOpts.frequency,
          mergedOpts.mouseSize,
          mergedOpts.rotationSpeed
        ),
      },
      uConfig2: {
        value: new THREE.Vector4(
          mergedOpts.rotationAmmount,
          mergedOpts.mouseScaling,
          mergedOpts.mouseIndent
        ),
      },
    };
    this.uniforms = uniforms;

    // Geometry
    this.createGeometry(mergedOpts);

    let t1 = gsap.timeline();
    t1.to(
      uniforms.uAnimate,
      {
        value: 1,
        duration: 3.0,
        ease: "none",
      },
      0.0
    );

    if (this.follower) {
      t1.from(
        this.follower.scale,
        { x: 0, y: 0, z: 0, duration: 1, ease: "back.out" },
        1
      );
    }
    this.animation = t1;

    // Events
    const hitplane = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial()
    );
    hitplane.scale.setScalar(20);
    hitplane.rotation.x = -Math.PI / 2;
    hitplane.updateMatrix();
    hitplane.updateMatrixWorld();
    this.hitplane = hitplane;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.onMouseMove = this.onMouseMove.bind(this);
    window.addEventListener("mousemove", this.onMouseMove, false);

    let vel = new THREE.Vector2();
    const tick = (t: number) => {
      uTime.value = t;

      let v3 = new THREE.Vector2();
      v3.copy(this.mouse);
      v3.sub(uniforms.uPos0.value);
      v3.multiplyScalar(0.08);
      uniforms.uPos0.value.add(v3);

      // Calculate the change/velocity
      v3.copy(uniforms.uPos0.value);
      v3.sub(uniforms.uPos1.value);
      v3.multiplyScalar(0.05);

      // Lerp the change as well
      v3.sub(vel);
      v3.multiplyScalar(0.05);
      vel.add(v3);

      // Add the lerped velocity
      uniforms.uPos1.value.add(vel);

      if (this.follower) {
        this.follower.position.x = uniforms.uPos0.value.x;
        this.follower.position.z = uniforms.uPos0.value.y;
        this.follower.rotation.x = t;
        this.follower.rotation.y = t;
      }

      rendering.render();
    };

    gsap.ticker.add(tick);

    this.switchFollowers = this.switchFollowers.bind(this);
    this.switchColor = this.switchColor.bind(this);
  }

  onMouseMove(ev: MouseEvent) {
    let x = ev.clientX / window.innerWidth - 0.5;
    let y = ev.clientY / window.innerHeight - 0.5;
    let v2 = new THREE.Vector2();
    v2.x = x * 2;
    v2.y = -y * 2;
    this.raycaster.setFromCamera(v2, this.rendering.camera);

    let intersects = this.raycaster.intersectObject(this.hitplane);

    if (intersects.length > 0) {
      let first = intersects[0];
      this.mouse.x = first.point.x;
      this.mouse.y = first.point.z;
      // mouse.copy(first.point)
    }
  }

  createGeometry(mergedOpts: Options) {
    let grid = 55;
    let size = 0.5;
    let gridSize = grid * size;

    let geometry:
      | THREE.BoxGeometry
      | RoundedBox
      | THREE.CylinderGeometry
      | THREE.TorusGeometry
      | THREE.IcosahedronGeometry
      | undefined;

    if (typeof mergedOpts.shape == "string") {
      switch (mergedOpts.shape) {
        case "cylinder":
          geometry = new THREE.CylinderGeometry(size, size, size);
          break;
        case "torus":
          geometry = new THREE.TorusGeometry(size * 0.5, size * 0.3);
          break;
        case "icosahedron":
          geometry = new THREE.IcosahedronGeometry(size, 0);
          break;
        default:
          geometry = new RoundedBox(size, size, size, 0.1, 4);
      }
    } else {
      geometry = mergedOpts.shape;
    }
    let material = new THREE.MeshPhysicalMaterial({
      metalness: 0,
      roughness: 0.0,
    });

    let mesh = new THREE.InstancedMesh(geometry, material, grid * grid);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.mesh = mesh;

    this.rendering.scene.add(mesh);

    this.setMaterial(mergedOpts);
    this.setCustomMaterial();
  }

  setMaterial(opts: Options) {
    let grid = 55;
    let size = 0.5;
    let gridSize = grid * size;

    const material = this.mesh.material.clone();
    material.color.set(opts.color);
    const materialColor = material.color;

    this.mesh.material = material;
    this.mesh.instanceMatrix.needsUpdate = true;

    const totalColor = materialColor.r + materialColor.g + materialColor.b;
    const color = new THREE.Color();
    const weights = new THREE.Vector3();
    weights.x = materialColor.r;
    weights.y = materialColor.g;
    weights.z = materialColor.b;
    weights.divideScalar(totalColor);
    weights.multiplyScalar(-0.5);
    weights.addScalar(1);

    let dummy = new THREE.Object3D();

    let i = 0;
    for (let x = 0; x < grid; x++)
      for (let y = 0; y < grid; y++) {
        dummy.position.set(
          x * size - gridSize / 2 + size / 2,
          0,
          y * size - gridSize / 2 + size / 2
        );

        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);

        let center = 1 - dummy.position.length() * 0.12 * opts.colorDegrade;

        color.set(
          center * weights.x + (1 - weights.x),
          center * weights.y + (1 - weights.y),
          center * weights.z + (1 - weights.z)
        );

        this.mesh.setColorAt(i, color);

        i++;
      }
  }

  setCustomMaterial() {
    const { mesh } = this;
    mesh.material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        VertexHead
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        ProjectVertex
      );
      shader.uniforms = {
        ...shader.uniforms,
        ...this.uniforms,
      };
    };

    mesh.customDepthMaterial = new THREE.MeshDepthMaterial();
    mesh.customDepthMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        VertexHead
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        ProjectVertex
      );
      shader.uniforms = {
        ...shader.uniforms,
        ...this.uniforms,
      };
    };
    // mesh.customDepthMaterial.depthPacking = THREE.RGBADepthPacking;
    // this.rendering.scene.add(mesh);
    // this.mesh = mesh;
  }

  switchFollowers(index: number) {
    this.rendering.scene.remove(this.follower);
    this.rendering.scene.add(followers[index]);
    this.follower = followers[index];
    if (index == 2) {
      this.follower.scale.setScalar(0.4);
    }
  }

  /**
   * TODO switch the box material
   * @param index
   */
  switchColor(index: number) {
    this.setMaterial({
      ...this.options,
      ...colors[index],
    });
    this.setCustomMaterial();
  }
}

export default InstancedMouseEffect;

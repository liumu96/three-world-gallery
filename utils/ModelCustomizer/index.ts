import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface CustomMesh extends THREE.Mesh {
  nameID?: string;
}

class ModelCustomizer {
  private BACKGROUND_COLOR = 0xf1f1f1;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  loader: GLTFLoader;
  controls: OrbitControls;
  model: THREE.Group<THREE.Object3DEventMap> | null = null;
  private loaded: boolean = false;
  private initRotate: number = 0;
  private INITIAL_MTL = new THREE.MeshPhongMaterial({
    color: 0xf1f1f1,
    shininess: 10,
  });
  private INITIAL_MAP = [
    { childID: "back", mtl: this.INITIAL_MTL },
    { childID: "base", mtl: this.INITIAL_MTL },
    { childID: "cushions", mtl: this.INITIAL_MTL },
    { childID: "legs", mtl: this.INITIAL_MTL },
    { childID: "supports", mtl: this.INITIAL_MTL },
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.BACKGROUND_COLOR);
    this.scene.fog = new THREE.Fog(this.BACKGROUND_COLOR, 20, 100);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    this.camera.position.x = 0;
    this.camera.position.y = 1;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.minPolarAngle = Math.PI / 3;
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.dampingFactor = 0.1;
    this.controls.autoRotate = false; // Toggle this if you'd like the chair to automatically rotate
    this.controls.autoRotateSpeed = 0.2; // 30

    this.loader = new GLTFLoader();

    this.loadModel();
    this.addLights();
    this.createFloor();

    this.animate = this.animate.bind(this);
  }

  loadModel() {
    this.loader.load(
      "/assets/chair.glb",
      (gltf) => {
        const model = gltf.scene;

        model.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            // o.geometry.computeVertexNormals();
          }
        });

        model.scale.set(2, 2, 2);
        model.rotation.y = Math.PI;
        model.position.y = -1;
        for (let object of this.INITIAL_MAP) {
          this.initColor(model, object.childID, object.mtl);
        }
        this.model = model;

        this.scene.add(model);
      },
      undefined,
      (error) => {
        console.log(error);
      }
    );
  }

  initColor(
    parent: THREE.Group<THREE.Object3DEventMap>,
    type: string,
    mtl: THREE.MeshPhongMaterial
  ): void {
    parent.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const cutomMesh = o as CustomMesh;
        if (cutomMesh.name.includes(type)) {
          cutomMesh.material = mtl;
          cutomMesh.nameID = type;
        }
      }
    });
  }

  addLights() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xf1f1f1, 2);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(-8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    this.scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff);
    // this.scene.add(ambientLight);
  }

  createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: 0xeeeeee,
      shininess: 0,
      depthWrite: false,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -0.5 * Math.PI;
    floor.receiveShadow = true;
    floor.position.y = -1;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(40, 20, 0x000000, 0x000000);
    grid.material.opacity = 0;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);

    if (resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
    if (this.model != null && !this.loaded) {
      this.initialRotation();
    }
  }

  initialRotation() {
    this.initRotate++;
    if (this.model && this.initRotate <= 120) {
      this.model.rotation.y += Math.PI / 60;
    } else {
      this.loaded = true;
    }
  }

  selectMaterial(color: IColor, type: string) {
    let newMaterial;
    if (color.texture && color.size) {
      const txt = new THREE.TextureLoader().load(color.texture);

      txt.repeat.set(color.size[0], color.size[1]);
      txt.wrapS = THREE.RepeatWrapping;
      txt.wrapT = THREE.RepeatWrapping;

      newMaterial = new THREE.MeshPhongMaterial({
        map: txt,
        shininess: color.shininess ? color.shininess : 10,
      });
    } else {
      newMaterial = new THREE.MeshPhongMaterial({
        color: parseInt("0x" + color.color),
        shininess: color.shininess ? color.shininess : 10,
      });
    }
    console.log(type);
    this.setMaterial(newMaterial, type);
  }

  setMaterial(material: THREE.MeshPhongMaterial, type: string) {
    if (this.model) {
      this.model.traverse((o) => {
        const cutomMesh = o as CustomMesh;
        if (cutomMesh instanceof THREE.Mesh) {
          if (cutomMesh.nameID == type) {
            cutomMesh.material = material;
          }
        }
      });
    }
  }
}

const resizeRendererToDisplaySize = (
  renderer: THREE.WebGLRenderer
): boolean => {
  const canvas = renderer.domElement;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvasPixelWidth = canvas.width / window.devicePixelRatio;
  const canvasPixelHeight = canvas.height / window.devicePixelRatio;

  const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
};

export default ModelCustomizer;

import * as THREE from "three";
import { gsap, Strong } from "gsap";

class Bird {
  rSegments = 4;
  hSegments = 3;
  cylRay = 120;
  bodyBirdInitPositions: { x: number; y: number; z: number }[] = [];
  vAngle = 0;
  hAngle = 0;
  normalSkin = { r: 255 / 255, g: 222 / 255, b: 121 / 255 };
  shySkin = { r: 255 / 255, g: 157 / 255, b: 101 / 255 };
  color = {
    r: this.normalSkin.r,
    g: this.normalSkin.g,
    b: this.normalSkin.b,
  };

  side = "left";
  shyAngles = { h: 0, v: 0 };
  behaviourInterval: string | number | NodeJS.Timeout | undefined;
  intervalRunning = false;

  threegroup = new THREE.Group();

  // materials
  yellowMat = new THREE.MeshLambertMaterial({
    color: 0xffde79,
    flatShading: true,
  });
  whiteMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    flatShading: true,
  });
  blackMat = new THREE.MeshLambertMaterial({
    color: 0x000000,
    flatShading: true,
  });
  orangeMat = new THREE.MeshLambertMaterial({
    color: 0xff5535,
    flatShading: true,
  });

  wingLeftGroup!: THREE.Group<THREE.Object3DEventMap>;
  wingRightGroup!: THREE.Group<THREE.Object3DEventMap>;
  bodyBird!: THREE.Mesh<
    THREE.CylinderGeometry,
    THREE.MeshLambertMaterial,
    THREE.Object3DEventMap
  >;
  bodyVerticesLength!: number;
  face!: THREE.Group<THREE.Object3DEventMap>;
  leftEye!: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshLambertMaterial,
    THREE.Object3DEventMap
  >;
  leftIris!: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshLambertMaterial,
    THREE.Object3DEventMap
  >;
  rightEye!: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshLambertMaterial,
    THREE.Object3DEventMap
  >;
  rightIris!: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshLambertMaterial,
    THREE.Object3DEventMap
  >;
  beak!: THREE.Mesh<
    THREE.CylinderGeometry,
    THREE.MeshLambertMaterial,
    THREE.Object3DEventMap
  >;
  feather1!: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshLambertMaterial,
    THREE.Object3DEventMap
  >;
  feather2!: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshLambertMaterial,
    THREE.Object3DEventMap
  >;
  feather3!: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshLambertMaterial,
    THREE.Object3DEventMap
  >;

  constructor() {
    // create wings
    this.createWings();
    // create body
    this.createBodyGeometry();
    // create eyes
    this.createEyes();
    // create beak
    this.createBeak();
    // create feathers
    this.createFeathers();

    this.threegroup.traverse(function (object) {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }

  createWings() {
    this.wingLeftGroup = new THREE.Group();
    this.wingRightGroup = new THREE.Group();

    var wingGeom = new THREE.BoxGeometry(60, 60, 5);
    var wingLeft = new THREE.Mesh(wingGeom, this.yellowMat);
    this.wingLeftGroup.add(wingLeft);
    this.wingLeftGroup.position.x = 70;
    this.wingLeftGroup.position.z = 0;
    this.wingLeftGroup.rotation.y = Math.PI / 2;
    wingLeft.rotation.x = -Math.PI / 4;
    var wingRight = new THREE.Mesh(wingGeom, this.yellowMat);
    this.wingRightGroup.add(wingRight);
    this.wingRightGroup.position.x = -70;
    this.wingRightGroup.position.z = 0;
    this.wingRightGroup.rotation.y = -Math.PI / 2;
    wingRight.rotation.x = -Math.PI / 4;
  }

  createBodyGeometry() {
    const bodyGeom = new THREE.CylinderGeometry(
      40,
      70,
      200,
      this.rSegments,
      this.hSegments
    );

    this.bodyBird = new THREE.Mesh(bodyGeom, this.yellowMat);
    this.bodyBird.position.y = 70;

    this.bodyVerticesLength = (this.rSegments + 1) * this.hSegments;
    for (let i = 0; i < this.bodyVerticesLength; i++) {
      const tv = this.bodyBird.geometry.attributes.position.array.slice(
        i * 3,
        i * 3 + 3
      );
      this.bodyBirdInitPositions.push({ x: tv[0], y: tv[1], z: tv[2] });
    }

    this.threegroup.add(this.bodyBird);
    this.threegroup.add(this.wingLeftGroup);
    this.threegroup.add(this.wingRightGroup);
  }

  createEyes() {
    this.face = new THREE.Group();
    const eyeGeom = new THREE.BoxGeometry(60, 60, 10);
    const irisGeom = new THREE.BoxGeometry(10, 10, 10);

    this.leftEye = new THREE.Mesh(eyeGeom, this.whiteMat);
    this.leftEye.position.x = -30;
    this.leftEye.position.y = 120;
    this.leftEye.position.z = 35;
    this.leftEye.rotation.y = -Math.PI / 4;

    this.leftIris = new THREE.Mesh(irisGeom, this.blackMat);
    this.leftIris.position.x = -30;
    this.leftIris.position.y = 120;
    this.leftIris.position.z = 40;
    this.leftIris.rotation.y = -Math.PI / 4;

    this.rightEye = new THREE.Mesh(eyeGeom, this.whiteMat);
    this.rightEye.position.x = 30;
    this.rightEye.position.y = 120;
    this.rightEye.position.z = 35;
    this.rightEye.rotation.y = Math.PI / 4;

    this.rightIris = new THREE.Mesh(irisGeom, this.blackMat);
    this.rightIris.position.x = 30;
    this.rightIris.position.y = 120;
    this.rightIris.position.z = 40;
    this.rightIris.rotation.y = Math.PI / 4;
  }

  createBeak() {
    const beakGeom = new THREE.CylinderGeometry(0, 20, 20, 4, 1);
    this.beak = new THREE.Mesh(beakGeom, this.orangeMat);
    this.beak.position.z = 65;
    this.beak.position.y = 70;
    this.beak.rotation.x = Math.PI / 2;

    this.face.add(this.rightEye);
    this.face.add(this.rightIris);
    this.face.add(this.leftEye);
    this.face.add(this.leftIris);
    this.face.add(this.beak);
  }

  createFeathers() {
    const featherGeom = new THREE.BoxGeometry(10, 20, 5);
    this.feather1 = new THREE.Mesh(featherGeom, this.yellowMat);
    this.feather1.position.z = 55;
    this.feather1.position.y = 185;
    this.feather1.rotation.x = Math.PI / 4;
    this.feather1.scale.set(1.5, 1.5, 1);

    this.feather2 = new THREE.Mesh(featherGeom, this.yellowMat);
    this.feather2.position.z = 50;
    this.feather2.position.y = 180;
    this.feather2.position.x = 20;
    this.feather2.rotation.x = Math.PI / 4;
    this.feather2.rotation.z = -Math.PI / 8;

    this.feather3 = new THREE.Mesh(featherGeom, this.yellowMat);
    this.feather3.position.z = 50;
    this.feather3.position.y = 180;
    this.feather3.position.x = -20;
    this.feather3.rotation.x = Math.PI / 4;
    this.feather3.rotation.z = Math.PI / 8;

    this.face.add(this.feather1);
    this.face.add(this.feather2);
    this.face.add(this.feather3);
    this.threegroup.add(this.face);
  }

  look(hAngle: number, vAngle: number) {
    this.hAngle = hAngle;
    this.vAngle = vAngle;

    this.leftIris.position.y = 120 - this.vAngle * 30;
    this.leftIris.position.x = -30 + this.hAngle * 10;
    this.leftIris.position.z = 40 + this.hAngle * 10;

    this.rightIris.position.y = 120 - this.vAngle * 30;
    this.rightIris.position.x = 30 + this.hAngle * 10;
    this.rightIris.position.z = 40 - this.hAngle * 10;

    this.leftEye.position.y = this.rightEye.position.y = 120 - this.vAngle * 10;

    this.beak.position.y = 70 - this.vAngle * 20;
    this.beak.rotation.x = Math.PI / 2 + this.vAngle / 3;

    this.feather1.rotation.x = Math.PI / 4 + this.vAngle / 2;
    this.feather1.position.y = 185 - this.vAngle * 10;
    this.feather1.position.z = 55 + this.vAngle * 10;

    this.feather2.rotation.x = Math.PI / 4 + this.vAngle / 2;
    this.feather2.position.y = 180 - this.vAngle * 10;
    this.feather2.position.z = 50 + this.vAngle * 10;

    this.feather3.rotation.x = Math.PI / 4 + this.vAngle / 2;
    this.feather3.position.y = 180 - this.vAngle * 10;
    this.feather3.position.z = 50 + this.vAngle * 10;

    for (let i = 0; i < this.bodyVerticesLength; i++) {
      const line = Math.floor(i / (this.rSegments + 1));
      //   var tv = this.bodyBird.geometry.vertices[i];
      const tvInitPos = this.bodyBirdInitPositions[i];
      let a, dy;
      if (line >= this.hSegments - 1) {
        a = 0;
      } else {
        a = this.hAngle / (line + 1);
      }
      const tx = tvInitPos.x * Math.cos(a) + tvInitPos.z * Math.sin(a);
      const tz = -tvInitPos.x * Math.sin(a) + tvInitPos.z * Math.cos(a);
      this.bodyBird.geometry.attributes.position.array[i * 3] = tx;
      this.bodyBird.geometry.attributes.position.array[i * 3 + 2] = tz;
      //   tv.x = tx;
      //   tv.z = tz;
    }
    this.face.rotation.y = this.hAngle;
    this.bodyBird.geometry.attributes.position.needsUpdate = true;
  }

  lookAway(fastMove: boolean) {
    const speed = fastMove ? 0.4 : 2;
    const ease = fastMove ? Strong.easeOut : Strong.easeInOut;
    const delay = fastMove ? 0.2 : 0;
    const col = fastMove ? this.shySkin : this.normalSkin;
    const tv = ((-1 + Math.random() * 2) * Math.PI) / 3;
    const beakScaleX = 0.75 + Math.random() * 0.25;
    const beakScaleZ = 0.5 + Math.random() * 0.5;

    let th;
    if (this.side == "right") {
      th = ((-1 + Math.random()) * Math.PI) / 4;
    } else {
      th = (Math.random() * Math.PI) / 4;
    }

    gsap.killTweensOf(this.shyAngles);
    gsap.to(this.shyAngles, {
      duration: speed,
      v: tv,
      h: th,
      ease: ease,
      delay: delay,
    });
    gsap.to(this.color, {
      duration: speed,
      r: col.r,
      g: col.g,
      b: col.b,
      ease: ease,
      delay: delay,
    });
    gsap.to(this.beak.scale, {
      duration: speed,
      z: beakScaleZ,
      x: beakScaleX,
      ease: ease,
      delay: delay,
    });
  }

  stare() {
    const col = this.normalSkin;
    if (this.side == "right") {
      var th = Math.PI / 3;
    } else {
      var th = -Math.PI / 3;
    }
    gsap.to(this.shyAngles, {
      duration: 2,
      v: -0.5,
      h: th,
      ease: Strong.easeInOut,
    });
    gsap.to(this.color, {
      duration: 2,
      r: col.r,
      g: col.g,
      b: col.b,
      ease: Strong.easeInOut,
    });
    gsap.to(this.beak.scale, {
      duration: 2,
      z: 0.8,
      x: 1.5,
      ease: Strong.easeInOut,
    });
  }
}

export default Bird;

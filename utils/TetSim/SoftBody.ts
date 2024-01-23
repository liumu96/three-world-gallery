import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class SoftBody {
  physicsParams: IPhysicsParams;
  numParticles: number;
  numElems: number;
  pos: Float32Array;
  prevPos: Float32Array;
  vel: Float32Array;
  invMass: Float32Array;
  invRestPose: Float32Array;
  invRestVolume: Float32Array;
  tetIds: number[];
  volError: number;
  grabPos: Float32Array;
  grabId: number;
  P: Float32Array;
  F: Float32Array;
  dF: Float32Array;
  grads: Float32Array;
  edgeMesh: THREE.LineSegments<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.Material | THREE.Material[]
  >;
  visVerts: Float32Array;
  numVisVerts: number;
  visMesh: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.MeshPhysicalMaterial,
    THREE.Object3DEventMap
  >;

  constructor(
    vertices: Float32Array,
    tetIds: Array<number>,
    tetEdgeIds: Array<number>,
    physicsParams: IPhysicsParams,
    visVerts: Float32Array,
    visTriIds: Array<number>,
    visMaterial: THREE.MeshPhysicalMaterial
  ) {
    this.physicsParams = physicsParams;

    this.numParticles = vertices.length / 3;
    this.numElems = tetIds.length / 4;

    this.pos = vertices.slice(0);
    this.prevPos = vertices.slice(0);
    this.vel = new Float32Array(3 * this.numParticles);
    this.invMass = new Float32Array(this.numParticles);
    this.invRestPose = new Float32Array(9 * this.numElems);
    this.invRestVolume = new Float32Array(this.numElems);

    this.tetIds = tetIds;
    this.volError = 0.0;

    this.grabPos = new Float32Array();
    this.grabId = -1;

    // solve data: define here to avoid memory allocation during solve

    this.P = new Float32Array(9);
    this.F = new Float32Array(9);
    this.dF = new Float32Array(9);
    this.grads = new Float32Array(12);

    this.initPhysics(this.physicsParams.density);

    // visual edge mesh
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(tetEdgeIds);
    this.edgeMesh = new THREE.LineSegments(geometry);
    this.edgeMesh.userData = this;
    this.edgeMesh.visible = true;

    this.visVerts = visVerts;
    this.numVisVerts = visVerts.length / 4;
    const visGeometry = new THREE.BufferGeometry();
    visGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(3 * this.numVisVerts), 3)
    );
    visGeometry.setIndex(visTriIds);
    this.visMesh = new THREE.Mesh(visGeometry, visMaterial);
    this.visMesh.castShadow = true;
    this.visMesh.userData = this;
    this.visMesh.layers.enable(1);
    visGeometry.computeVertexNormals();
    this.updateVisMesh();
  }

  initPhysics(density: number) {
    for (let i = 0; i < this.numParticles; i++) {
      this.invMass[i] = 0.0;
    }

    for (let i = 0; i < this.numElems; i++) {
      let id0 = this.tetIds[4 * i];
      let id1 = this.tetIds[4 * i + 1];
      let id2 = this.tetIds[4 * i + 2];
      let id3 = this.tetIds[4 * i + 3];

      // Dm = [x1 - x0, x2 - x0, x3 - x0]
      this.vecSetDiff(this.invRestPose, 3 * i, this.pos, id1, this.pos, id0);
      this.vecSetDiff(
        this.invRestPose,
        3 * i + 1,
        this.pos,
        id2,
        this.pos,
        id0
      );
      this.vecSetDiff(
        this.invRestPose,
        3 * i + 2,
        this.pos,
        id3,
        this.pos,
        id0
      );
      // compute V_tet = 1 / 6 * V
      let V = this.matGetDeterminant(this.invRestPose, i) / 6.0;
      // compute Dm-1
      this.matSetInverse(this.invRestPose, i);
      // compute mass = V * density; each tetrahedron adds one-fourth of its mass to each adjacent particle
      let pm = (V / 4.0) * density;
      this.invMass[id0] += pm;
      this.invMass[id1] += pm;
      this.invMass[id2] += pm;
      this.invMass[id3] += pm;
      // compute V-1
      this.invRestVolume[i] = 1.0 / V;
    }
    for (let i = 0; i < this.numParticles; i++) {
      if (this.invMass[i] != 0.0) this.invMass[i] = 1.0 / this.invMass[i];
    }
  }

  // ----------------- begin solver -----------------------------------------------------
  solveElem(elemNr: number, dt: number) {
    let C = 0.0;
    let g = this.grads;
    let ir = this.invRestPose; // Dm-1

    let id0 = this.tetIds[4 * elemNr];
    let id1 = this.tetIds[4 * elemNr + 1];
    let id2 = this.tetIds[4 * elemNr + 2];
    let id3 = this.tetIds[4 * elemNr + 3];
    // compute Ds = [x1 - x0, x2 - x0, x3 - x0]
    this.vecSetDiff(this.P, 0, this.pos, id1, this.pos, id0);
    this.vecSetDiff(this.P, 1, this.pos, id2, this.pos, id0);
    this.vecSetDiff(this.P, 2, this.pos, id3, this.pos, id0);

    // compute the gradient of deformation F = Ds Dm-1
    this.matSetMatProduct(this.F, 0, this.P, 0, this.invRestPose, elemNr);

    // compute rs = sqrt(f1^2 + f2^2 + f3^2)
    let r_s = Math.sqrt(
      this.vecLengthSquared(this.F, 0) +
        this.vecLengthSquared(this.F, 1) +
        this.vecLengthSquared(this.F, 2)
    );
    let r_s_inv = 1.0 / r_s;

    // compute the gradient of deviatoric constraint C_D
    this.vecSetZero(g, 1);
    this.vecAdd(g, 1, this.F, 0, r_s_inv * this.matIJ(ir, elemNr, 0, 0));
    this.vecAdd(g, 1, this.F, 1, r_s_inv * this.matIJ(ir, elemNr, 0, 1));
    this.vecAdd(g, 1, this.F, 2, r_s_inv * this.matIJ(ir, elemNr, 0, 2));

    this.vecSetZero(g, 2);
    this.vecAdd(g, 2, this.F, 0, r_s_inv * this.matIJ(ir, elemNr, 1, 0));
    this.vecAdd(g, 2, this.F, 1, r_s_inv * this.matIJ(ir, elemNr, 1, 1));
    this.vecAdd(g, 2, this.F, 2, r_s_inv * this.matIJ(ir, elemNr, 1, 2));

    this.vecSetZero(g, 3);
    this.vecAdd(g, 3, this.F, 0, r_s_inv * this.matIJ(ir, elemNr, 2, 0));
    this.vecAdd(g, 3, this.F, 1, r_s_inv * this.matIJ(ir, elemNr, 2, 1));
    this.vecAdd(g, 3, this.F, 2, r_s_inv * this.matIJ(ir, elemNr, 2, 2));

    // C_D(F) = r_s
    C = r_s;

    // resolve the contraint C_D
    this.applyToElem(elemNr, C, this.physicsParams.devCompliance, dt);

    this.vecSetDiff(this.P, 0, this.pos, id1, this.pos, id0);
    this.vecSetDiff(this.P, 1, this.pos, id2, this.pos, id0);
    this.vecSetDiff(this.P, 2, this.pos, id3, this.pos, id0);

    this.matSetMatProduct(this.F, 0, this.P, 0, this.invRestPose, elemNr);

    // the gradient of hydrostatic constraint C_D = [f2 x f3, f3 x f1, f1 x f2] Q^T
    this.vecSetCross(this.dF, 0, this.F, 1, this.F, 2);
    this.vecSetCross(this.dF, 1, this.F, 2, this.F, 0);
    this.vecSetCross(this.dF, 2, this.F, 0, this.F, 1);

    this.vecSetZero(g, 1);
    this.vecAdd(g, 1, this.dF, 0, this.matIJ(ir, elemNr, 0, 0));
    this.vecAdd(g, 1, this.dF, 1, this.matIJ(ir, elemNr, 0, 1));
    this.vecAdd(g, 1, this.dF, 2, this.matIJ(ir, elemNr, 0, 2));

    this.vecSetZero(g, 2);
    this.vecAdd(g, 2, this.dF, 0, this.matIJ(ir, elemNr, 1, 0));
    this.vecAdd(g, 2, this.dF, 1, this.matIJ(ir, elemNr, 1, 1));
    this.vecAdd(g, 2, this.dF, 2, this.matIJ(ir, elemNr, 1, 2));

    this.vecSetZero(g, 3);
    this.vecAdd(g, 3, this.dF, 0, this.matIJ(ir, elemNr, 2, 0));
    this.vecAdd(g, 3, this.dF, 1, this.matIJ(ir, elemNr, 2, 1));
    this.vecAdd(g, 3, this.dF, 2, this.matIJ(ir, elemNr, 2, 2));

    const detF = this.matGetDeterminant(this.F, 0);

    C =
      detF -
      1.0 -
      this.physicsParams.volCompliance / this.physicsParams.devCompliance;

    this.volError += detF - 1.0;

    this.applyToElem(elemNr, C, this.physicsParams.volCompliance, dt);
  }

  applyToElem(elemNr: number, C: number, compliance: number, dt: number) {
    if (C == 0.0) return;
    let g = this.grads;

    this.vecSetZero(g, 0);
    this.vecAdd(g, 0, g, 1, -1.0);
    this.vecAdd(g, 0, g, 2, -1.0);
    this.vecAdd(g, 0, g, 3, -1.0);

    let w = 0.0;
    for (let i = 0; i < 4; i++) {
      const id = this.tetIds[4 * elemNr + i];
      w += this.vecLengthSquared(g, i) * this.invMass[id];
    }

    if (w == 0.0) return;
    const alpha = (compliance / dt / dt) * this.invRestVolume[elemNr];
    const dlambda = -C / (w + alpha);

    for (let i = 0; i < 4; i++) {
      const id = this.tetIds[4 * elemNr + i];
      this.vecAdd(this.pos, id, g, i, dlambda * this.invMass[id]);
    }
  }

  simulate(dt: number, physicsParams: IPhysicsParams) {
    // XPBD prediction
    for (let i = 0; i < this.numParticles; i++) {
      this.vecAdd(this.vel, i, [0.0, physicsParams.gravity, 0.0], 0, dt);
      this.vecCopy(this.prevPos, i, this.pos, i);
      this.vecAdd(this.pos, i, this.vel, i, dt);
    }

    // solve
    this.volError = 0.0;

    for (let i = 0; i < this.numElems; i++) {
      this.solveElem(i, dt);
    }
    this.volError /= this.numElems;

    // ground collision
    for (let i = 0; i < this.numParticles; i++) {
      this.vecSetClamped(
        this.pos,
        i,
        physicsParams.worldBounds,
        0,
        physicsParams.worldBounds,
        1
      );

      if (this.pos[3 * i + 1] < 0.0) {
        this.pos[3 * i + 1] = 0.0;

        // simple friction
        this.vecSetDiff(this.F, 0, this.prevPos, i, this.pos, i);

        this.pos[3 * i] +=
          this.F[0] * Math.min(1.0, dt * physicsParams.friction);
        this.pos[3 * i + 2] +=
          this.F[2] * Math.min(1.0, dt * physicsParams.friction);
      }
    }

    if (this.grabId >= 0) {
      this.vecCopy(this.pos, this.grabId, this.grabPos, 0);
    }

    // XPBD velocity update
    for (let i = 0; i < this.pos.length; i++)
      this.vecSetDiff(this.vel, i, this.pos, i, this.prevPos, i, 1.0 / dt);
  }

  // ----------------- end solver -----------------------------------------------------
  endFrame() {
    this.updateEdgeMesh();
    this.updateVisMesh();
  }

  updateEdgeMesh() {
    const positions = this.edgeMesh.geometry.attributes.position.array;
    for (let i = 0; i < this.pos.length; i++) positions[i] = this.pos[i];
    this.edgeMesh.geometry.attributes.position.needsUpdate = true;
    this.edgeMesh.geometry.computeBoundingSphere();
  }

  updateVisMesh() {
    const positions = this.visMesh.geometry.attributes.position.array;
    let nr = 0;
    for (let i = 0; i < this.numVisVerts; i++) {
      let tetNr = this.visVerts[nr++] * 4;
      let b0 = this.visVerts[nr++];
      let b1 = this.visVerts[nr++];
      let b2 = this.visVerts[nr++];
      let b3 = 1.0 - b0 - b1 - b2;
      this.vecSetZero(positions, i);
      this.vecAdd(positions, i, this.pos, this.tetIds[tetNr++], b0);
      this.vecAdd(positions, i, this.pos, this.tetIds[tetNr++], b1);
      this.vecAdd(positions, i, this.pos, this.tetIds[tetNr++], b2);
      this.vecAdd(positions, i, this.pos, this.tetIds[tetNr++], b3);
    }
    this.visMesh.geometry.computeVertexNormals();
    this.visMesh.geometry.attributes.position.needsUpdate = true;
    this.visMesh.geometry.computeBoundingSphere();
  }

  startGrab(pos: THREE.Vector3) {
    const p = new Float32Array([pos.x, pos.y, pos.z]);
    let minD2 = Number.MAX_VALUE;
    this.grabId = -1;
    for (let i = 0; i < this.numParticles; i++) {
      const d2 = this.vecDistSquared(p, 0, this.pos, i);
      if (d2 < minD2) {
        minD2 = d2;
        this.grabId = i;
      }
    }

    // this.vecCopy(this.grabPos, 0, p, 0);

    this.grabPos = p.slice(0);
  }

  moveGrabbed(pos: THREE.Vector3) {
    const p = new Float32Array([pos.x, pos.y, pos.z]);
    // this.vecCopy(this.grabPos, 0, p, 0);
    this.grabPos = p.slice(0);
  }

  endGrab() {
    this.grabId = -1;
  }
  // ----- vector math -------------------------------------------------------------
  vecSetZero(a: THREE.TypedArray, anr: number) {
    anr *= 3;
    a[anr++] = 0.0;
    a[anr++] = 0.0;
    a[anr] = 0.0;
  }

  vecCopy(a: Float32Array, anr: number, b: Float32Array, bnr: number) {
    anr *= 3;
    bnr *= 3;
    a[anr++] = b[bnr++];
    a[anr++] = b[bnr++];
    a[anr] = b[bnr];
  }

  vecAdd(
    a: THREE.TypedArray,
    anr: number,
    b: Float32Array | Array<number>,
    bnr: number,
    scale = 1.0
  ) {
    anr *= 3;
    bnr *= 3;
    a[anr++] += b[bnr++] * scale;
    a[anr++] += b[bnr++] * scale;
    a[anr] += b[bnr] * scale;
  }

  vecSetDiff(
    dst: Float32Array,
    dnr: number,
    a: Float32Array,
    anr: number,
    b: Float32Array,
    bnr: number,
    scale = 1.0
  ) {
    dnr *= 3;
    anr *= 3;
    bnr *= 3;
    dst[dnr++] = (a[anr++] - b[bnr++]) * scale;
    dst[dnr++] = (a[anr++] - b[bnr++]) * scale;
    dst[dnr] = (a[anr] - b[bnr]) * scale;
  }

  vecLengthSquared(a: Array<number> | Float32Array, anr: number) {
    anr *= 3;
    let a0 = a[anr],
      a1 = a[anr + 1],
      a2 = a[anr + 2];
    return a0 * a0 + a1 * a1 + a2 * a2;
  }

  vecDistSquared(
    a: Array<number> | Float32Array,
    anr: number,
    b: Float32Array,
    bnr: number
  ) {
    anr *= 3;
    bnr *= 3;
    let a0 = a[anr] - b[bnr],
      a1 = a[anr + 1] - b[bnr + 1],
      a2 = a[anr + 2] - b[bnr + 2];
    return a0 * a0 + a1 * a1 + a2 * a2;
  }

  /// a = b x c (nr = index)
  vecSetCross(
    a: Array<number> | Float32Array,
    anr: number,
    b: Array<number> | Float32Array,
    bnr: number,
    c: Array<number> | Float32Array,
    cnr: number
  ) {
    anr *= 3;
    bnr *= 3;
    cnr *= 3;
    a[anr++] = b[bnr + 1] * c[cnr + 2] - b[bnr + 2] * c[cnr + 1];
    a[anr++] = b[bnr + 2] * c[cnr + 0] - b[bnr + 0] * c[cnr + 2];
    a[anr] = b[bnr + 0] * c[cnr + 1] - b[bnr + 1] * c[cnr + 0];
  }

  vecSetClamped(
    dst: Array<number> | Float32Array,
    dnr: number,
    a: Array<number>,
    anr: number,
    b: Array<number>,
    bnr: number
  ) {
    dnr *= 3;
    anr *= 3;
    bnr *= 3;
    dst[dnr] = Math.max(a[anr++], Math.min(b[bnr++], dst[dnr++]));
    dst[dnr] = Math.max(a[anr++], Math.min(b[bnr++], dst[dnr++]));
    dst[dnr] = Math.max(a[anr++], Math.min(b[bnr++], dst[dnr++]));
  }

  // ----- matrix math ----------------------------------

  matIJ(A: Float32Array, anr: number, row: number, col: number) {
    return A[9 * anr + 3 * col + row];
  }

  matSetVecProduct(
    dst: Float32Array,
    dnr: number,
    A: Float32Array,
    anr: number,
    b: Float32Array,
    bnr: number
  ) {
    bnr *= 3;
    anr *= 3;
    let b0 = b[bnr++];
    let b1 = b[bnr++];
    let b2 = b[bnr];
    this.vecSetZero(dst, dnr);
    this.vecAdd(dst, dnr, A, anr++, b0);
    this.vecAdd(dst, dnr, A, anr++, b1);
    this.vecAdd(dst, dnr, A, anr, b2);
  }

  matSetMatProduct(
    Dst: Float32Array,
    dnr: number,
    A: Float32Array,
    anr: number,
    B: Float32Array,
    bnr: number
  ) {
    dnr *= 3;
    bnr *= 3;
    this.matSetVecProduct(Dst, dnr++, A, anr, B, bnr++);
    this.matSetVecProduct(Dst, dnr++, A, anr, B, bnr++);
    this.matSetVecProduct(Dst, dnr++, A, anr, B, bnr++);
  }

  matGetDeterminant(A: Float32Array, anr: number) {
    anr *= 9;
    let a11 = A[anr + 0],
      a12 = A[anr + 3],
      a13 = A[anr + 6];
    let a21 = A[anr + 1],
      a22 = A[anr + 4],
      a23 = A[anr + 7];
    let a31 = A[anr + 2],
      a32 = A[anr + 5],
      a33 = A[anr + 8];
    return (
      a11 * a22 * a33 +
      a12 * a23 * a31 +
      a13 * a21 * a32 -
      a13 * a22 * a31 -
      a12 * a21 * a33 -
      a11 * a23 * a32
    );
  }

  matSetInverse(A: Float32Array, anr: number) {
    let det = this.matGetDeterminant(A, anr);
    if (det == 0.0) {
      for (let i = 0; i < 9; i++) A[anr + i] = 0.0;
      return;
    }
    let invDet = 1.0 / det;
    anr *= 9;
    let a11 = A[anr + 0],
      a12 = A[anr + 3],
      a13 = A[anr + 6];
    let a21 = A[anr + 1],
      a22 = A[anr + 4],
      a23 = A[anr + 7];
    let a31 = A[anr + 2],
      a32 = A[anr + 5],
      a33 = A[anr + 8];
    A[anr + 0] = (a22 * a33 - a23 * a32) * invDet;
    A[anr + 3] = -(a12 * a33 - a13 * a32) * invDet;
    A[anr + 6] = (a12 * a23 - a13 * a22) * invDet;
    A[anr + 1] = -(a21 * a33 - a23 * a31) * invDet;
    A[anr + 4] = (a11 * a33 - a13 * a31) * invDet;
    A[anr + 7] = -(a11 * a23 - a13 * a21) * invDet;
    A[anr + 2] = (a21 * a32 - a22 * a31) * invDet;
    A[anr + 5] = -(a11 * a32 - a12 * a31) * invDet;
    A[anr + 8] = (a11 * a22 - a12 * a21) * invDet;
  }
}

export class Grabber {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  mousePos: THREE.Vector2;
  raycaster: THREE.Raycaster;
  mouseDown: boolean = false;
  active: any;
  controls: OrbitControls;
  grabDistance: number;
  physicsObject: null | SoftBody;
  constructor(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    // container: HTMLElement | undefined | null,
    controls: OrbitControls
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.mousePos = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.raycaster.layers.set(1);
    this.raycaster.params.Line.threshold = 0.1;
    this.grabDistance = 0.0;
    this.active = false;
    this.physicsObject = null;
    this.controls = controls;

    const container = this.renderer.domElement;
    if (container) {
      container.addEventListener(
        "pointerdown",
        this.onPointer.bind(this),
        true
      );
      container.addEventListener(
        "pointermove",
        this.onPointer.bind(this),
        true
      );
      container.addEventListener("pointerup", this.onPointer.bind(this), true);
      container.addEventListener("pointerout", this.onPointer.bind(this), true);
    }
  }

  updateRaycaster(x: number, y: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mousePos.x = ((x - rect.left) / rect.width) * 2 - 1;
    this.mousePos.y = -((y - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mousePos, this.camera);
  }

  start(x: number, y: number) {
    this.physicsObject = null;
    this.updateRaycaster(x, y);

    const intersects = this.raycaster.intersectObjects(this.scene.children);
    console.log(intersects);

    if (intersects.length > 0) {
      const obj = intersects[0].object.userData;
      if (obj instanceof SoftBody) {
        this.physicsObject = obj;
        this.grabDistance = intersects[0].distance;
        let hit = this.raycaster.ray.origin.clone();
        hit.addScaledVector(this.raycaster.ray.direction, this.grabDistance);
        this.physicsObject.startGrab(hit);
        this.active = true;
        this.controls.enabled = false;
      }
    }
  }

  move(x: number, y: number) {
    if (this.active) {
      this.updateRaycaster(x, y);
      const hit = this.raycaster.ray.origin.clone();
      hit.addScaledVector(this.raycaster.ray.direction, this.grabDistance);
      if (this.physicsObject != null) this.physicsObject.moveGrabbed(hit);
    }
  }

  end() {
    if (this.active) {
      if (this.physicsObject != null) {
        this.physicsObject.endGrab();
        this.physicsObject = null;
      }
      this.active = false;
      this.controls.enabled = true;
    }
  }

  onPointer(evt: PointerEvent): void {
    if (evt.type == "pointerdown") {
      this.start(evt.clientX, evt.clientY);
      this.mouseDown = true;
    } else if (evt.type == "pointermove" && this.mouseDown) {
      if (this.active) this.move(evt.clientX, evt.clientY);
    } else if (evt.type == "pointerup" /*|| evt.type == "pointerout"*/) {
      this.controls.enabled = true;
      this.end();
      this.mouseDown = false;
    }
  }
}

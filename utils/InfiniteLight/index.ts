import * as THREE from "three";

import { BasicThreeDemo } from "../BasicThreeDemo";
import { Road } from "./Road";
import { CarLights } from "./CarLights";

function lerp(current: number, target: number, speed = 0.1, limit = 0.001) {
  let change = (target - current) * speed;
  if (Math.abs(change) < limit) {
    change = target - current;
  }
  return change;
}

export class InfiniteLight extends BasicThreeDemo {
  mesh:
    | THREE.Mesh<
        THREE.BoxGeometry,
        THREE.MeshNormalMaterial,
        THREE.Object3DEventMap
      >
    | undefined;

  road: Road;
  leftLights: CarLights;
  rightLights: CarLights;
  options: any;
  speedUpTarget: number;
  speedUp: number;
  timeOffset: number;
  fovTarget: number;
  constructor(canvas: HTMLCanvasElement, options: any) {
    super(canvas);

    this.options = options;
    this.camera.position.z = -5;
    this.camera.position.y = 7;
    this.camera.position.x = 0;

    this.road = new Road(this, options);
    this.leftLights = new CarLights(this, options, 0xff102a, 60);
    this.rightLights = new CarLights(this, options, 0xfafafa, -60);

    this.speedUpTarget = 0;
    this.speedUp = 0;
    this.timeOffset = 0;
    this.fovTarget = 90;
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  loadAssets(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const manager = new THREE.LoadingManager();

      manager.onLoad = () => {
        console.log("All assets loaded");
        resolve(true);
      };

      manager.onError = (url) => {
        console.error(`There was an error loading ${url}`);
        reject(`There was an error loading ${url}`);
      };

      manager.itemStart("test");
      manager.itemEnd("test");
    });
  }

  init() {
    const options = this.options;

    this.road.init();
    this.leftLights.init();
    this.leftLights.mesh?.position.setX(
      -options.roadWidth / 2 - options.islandWidth / 2
    );

    this.rightLights.init();
    this.rightLights.mesh?.position.setX(
      options.roadWidth / 2 + options.islandWidth / 2
    );

    this.tick();

    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
    this.canvas.addEventListener("mouseout", this.onMouseUp);
  }

  onMouseDown() {
    this.fovTarget = 140;
    this.speedUpTarget = 0.1;
  }

  onMouseUp() {
    this.fovTarget = 90;
    this.speedUpTarget = 0;
  }

  update(delta: number) {
    let coefficient = -60 * Math.log2(1 - 0.1);
    let lerpT = Math.exp(-coefficient * delta);
    // Frame-dependent
    this.speedUp += lerp(
      this.speedUp,
      this.speedUpTarget,
      // 10% each frame
      lerpT,
      0.00001
    );

    // Also frame-dependent
    this.timeOffset += this.speedUp * delta;

    let time = this.clock.elapsedTime + this.timeOffset;
    this.leftLights.update(time);
    this.rightLights.update(time);
    this.road.update(time);

    let fovChange = lerp(this.camera.fov, this.fovTarget, lerpT);
    if (fovChange !== 0) {
      this.camera.fov += fovChange * delta * 6;
      this.camera.updateProjectionMatrix();
    }
  }
  dispose() {}
}

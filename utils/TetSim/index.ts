import * as THREE from "three";

import { Pane } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import World from "./World";
import { SoftBody, Grabber } from "./SoftBody";
import {
  dragonTetVerts,
  dragonTetIds,
  dragonTetEdgeIds,
  dragonAttachedVerts,
  dragonAttachedTriIds,
} from "./Dragon.js";
import { GPUGrabber, SoftBodyGPU } from "./SoftBodyGPU";

class TetSim {
  physicsParams: IPhysicsParams;
  cpuSim: boolean = false;
  world: World;
  canvas: HTMLCanvasElement;
  physicsScene: { softBodies: Array<SoftBody | SoftBodyGPU> };
  dragon!: SoftBody | SoftBodyGPU;
  grabber!: Grabber | GPUGrabber;
  pause: boolean = false;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.physicsParams = {
      gravity: -9.81,
      timeScale: 1.0,
      timeStep: 1.0 / 60.0,
      numSubsteps: this.cpuSim ? 5 : 20,
      dt: 1.0 / (60.0 * (this.cpuSim ? 5 : 20)),
      friction: 1000.0,
      density: 1000.0,
      devCompliance: 1.0 / 100000.0,
      volCompliance: 0.0,
      worldBounds: [-2.5, -1.0, -2.5, 2.5, 10.0, 2.5],
      computeNormals: true,
      ShowTetMesh: false,
      cpuSim: this.cpuSim,
    };

    this.addTweakPane();

    this.world = new World(this);

    this.physicsScene = { softBodies: [] };
    this.initSoftBody();
  }

  addTweakPane() {
    const pane = new Pane();

    pane.registerPlugin(EssentialsPlugin);

    pane.addBinding(this.physicsParams, "gravity", {
      min: -20.0,
      max: 0.0,
      interval: 1,
    });
    pane.addBinding(this.physicsParams, "timeScale", {
      min: 0.1,
      max: 2.0,
      interval: 0.01,
    });
    pane.addBinding(this.physicsParams, "numSubsteps", {
      min: 1,
      max: this.cpuSim ? 10 : 100,
      interval: 1,
    });

    pane.addBinding(this.physicsParams, "friction", {
      min: 0.0,
      max: 6000.0,
      interval: 100.0,
    });
    pane.addBinding(this.physicsParams, "ShowTetMesh");
  }

  initSoftBody(cpuSim = false) {
    this.physicsParams.cpuSim = cpuSim;
    this.cpuSim = cpuSim;
    this.physicsParams = {
      gravity: -9.81,
      timeScale: 1.0,
      timeStep: 1.0 / 60.0,
      numSubsteps: this.cpuSim ? 5 : 20,
      dt: 1.0 / (60.0 * (this.cpuSim ? 5 : 20)),
      friction: 1000.0,
      density: 1000.0,
      devCompliance: 1.0 / 100000.0,
      volCompliance: 0.0,
      worldBounds: [-2.5, -1.0, -2.5, 2.5, 10.0, 2.5],
      computeNormals: true,
      ShowTetMesh: false,
      cpuSim: this.cpuSim,
    };
    this.pause = true;
    if (this.dragon) {
      this.dragon.edgeMesh.visible = false;
      this.dragon.visMesh.visible = false;
      this.world.scene.remove(this.dragon.edgeMesh);
      this.world.scene.remove(this.dragon.visMesh);
    }
    if (this.physicsParams.cpuSim) {
      this.dragon = new SoftBody(
        dragonTetVerts,
        dragonTetIds,
        dragonTetEdgeIds,
        this.physicsParams,
        dragonAttachedVerts,
        dragonAttachedTriIds,
        new THREE.MeshPhysicalMaterial({ color: 0xf78a1d })
      );
      this.physicsScene.softBodies.push(this.dragon);

      this.grabber = new Grabber(
        this.world.scene,
        this.world.renderer,
        this.world.camera,
        // this.canvas.parentElement?.parentElement,
        this.world.controls
      );
    } else {
      this.dragon = new SoftBodyGPU(
        dragonTetVerts,
        dragonTetIds,
        dragonTetEdgeIds,
        this.physicsParams,
        dragonAttachedVerts,
        dragonAttachedTriIds,
        new THREE.MeshPhysicalMaterial({ color: 0xf78a1d, roughness: 0.4 }),
        this.world
      );
      this.physicsScene.softBodies.push(this.dragon);
      this.grabber = new GPUGrabber(
        this.world.scene,
        this.world.renderer,
        this.world.camera,
        this.world.controls
      );
    }

    this.world.scene.add(this.dragon.edgeMesh);
    this.world.scene.add(this.dragon.visMesh);
    this.pause = false;
  }

  update() {
    if (this.pause) return;
    let dt =
      (this.physicsParams.timeScale * this.physicsParams.timeStep) /
      this.physicsParams.numSubsteps;
    for (let step = 0; step < this.physicsParams.numSubsteps; step++) {
      for (let i = 0; i < this.physicsScene.softBodies.length; i++) {
        this.physicsScene.softBodies[i].simulate(dt, this.physicsParams);
      }
    }

    for (let i = 0; i < this.physicsScene.softBodies.length; i++) {
      this.physicsScene.softBodies[i].endFrame();
    }

    // Render the scene and update the framerate counter
    this.world.controls.update();
    this.world.renderer.render(this.world.scene, this.world.camera);
  }
}

export default TetSim;

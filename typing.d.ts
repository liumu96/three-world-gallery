declare module "*.glsl" {
  const content: string;
  export default content;
}

declare interface IColor {
  color?: string;
  texture?: string;
  shininess?: number;
  size?: Array<number>;
}

declare interface IPhysicsParams {
  gravity: number;
  timeScale: number;
  timeStep: number;
  numSubsteps: number;
  dt: number;
  friction: number;
  density: number;
  devCompliance: number;
  volCompliance: number;
  worldBounds: number[];
  computeNormals: boolean;
  ShowTetMesh: boolean;
  cpuSim: boolean;
}

declare interface IWorks {
  name?: string;
  routePath?: string;
  img?: string;
  textColor?: string;
  link?: string;
}

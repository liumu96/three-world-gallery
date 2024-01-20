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

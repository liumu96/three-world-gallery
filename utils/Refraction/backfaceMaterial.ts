import { ShaderMaterial, BackSide } from "three";

import vertexShader from "@/public/shaders/backfaceVertexShader.glsl";
import fragmentShader from "@/public/shaders/backfaceFragmentShader.glsl";

export default class BackfaceMaterial extends ShaderMaterial {
  constructor() {
    super({
      vertexShader,
      fragmentShader,
      side: BackSide,
    });
  }
}

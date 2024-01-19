import { ShaderMaterial } from "three";
import vertexShader from "@/public/shaders/refractionVertexShader.glsl";
import fragmentShader from "@/public/shaders/refractionFragmentShader.glsl";

export default class RefractionMaterial extends ShaderMaterial {
  constructor(options: {
    envMap: any;
    backfaceMap: any;
    resolution: any;
    ior: any;
  }) {
    super({
      vertexShader,
      fragmentShader,
    });

    this.uniforms = {
      envMap: { value: options.envMap },
      backfaceMap: { value: options.backfaceMap },
      resolution: { value: options.resolution },
      ior: { value: options.ior },
    };
  }
}

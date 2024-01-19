import { TextureLoader, MathUtils, Texture } from "three";

const tl = new TextureLoader();

export default function loadTexture(url: string): Promise<Texture> {
  return new Promise((resolve) => {
    tl.load(url, (data) => {
      if (
        !MathUtils.isPowerOfTwo(data.image.width) ||
        !MathUtils.isPowerOfTwo(data.image.height)
      ) {
        console.warn(`>>> "${url}" image size is not power of 2 <<<`);
      }

      data.needsUpdate = true;
      resolve(data);
    });
  });
}

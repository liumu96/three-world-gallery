import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

const loadModel = (url: string): Promise<{ model: THREE.Group }> => {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const result = { model: gltf.scene };
        resolve(result);
      },
      undefined,
      (error) => {
        console.error(`Error loading model "${url}":`, error);
        reject(error);
      }
    );
  });
};

export default loadModel;

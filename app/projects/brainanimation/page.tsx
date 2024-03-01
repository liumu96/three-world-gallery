"use client";

import * as THREE from "three";

import CanvasLayout from "@/components/Layout";
import { Canvas, ReactThreeFiber, extend, useFrame } from "@react-three/fiber";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import { data } from "./data";

import { Tubes } from "./BrainTubes";
import { BrainParticles } from "./BrainParticles";

const PATHS = data.economics[0].paths;

// const randomRange = (min: number, max: number) =>
//   Math.random() * (max - min) + min;

// let curves: THREE.CatmullRomCurve3[] = [];
// for (let i = 0; i < 100; i++) {
//   let points = [];
//   let length = randomRange(0.1, 1);
//   for (let j = 0; j < 100; j++) {
//     points.push(
//       new THREE.Vector3().setFromSphericalCoords(
//         1,
//         Math.PI - (j / 100) * Math.PI * length,
//         (i / 100) * Math.PI * 2
//       )
//     );
//     let tempcurve = new THREE.CatmullRomCurve3(points);
//     curves.push(tempcurve);
//   }
// }

let brainCurves: THREE.CatmullRomCurve3[] = [];
PATHS.forEach((path) => {
  let points = [];
  for (let i = 0; i < path.length; i += 3) {
    points.push(new THREE.Vector3(path[i], path[i + 1], path[i + 2]));
  }
  let tempcurve = new THREE.CatmullRomCurve3(points);
  brainCurves.push(tempcurve);
});

const BrainAnimationPage = () => {
  return (
    <CanvasLayout title="Brain Animation">
      <Canvas
        camera={{
          position: [0, 0, 0.3],
          near: 0.001,
          far: 5,
        }}
      >
        <color attach="background" args={["black"]} />
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Tubes allthecurve={brainCurves} />
        <BrainParticles allthecurves={brainCurves} />
        <OrbitControls />
      </Canvas>
    </CanvasLayout>
  );
};

export default BrainAnimationPage;

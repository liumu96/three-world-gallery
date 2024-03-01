import * as THREE from "three";
import { Canvas, ReactThreeFiber, extend, useFrame } from "@react-three/fiber";
import { OrbitControls, shaderMaterial } from "@react-three/drei";

import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { Ref } from "@react-three/fiber";

const randomRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const BrainParticleMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color(0.1, 0.3, 0.6) },
  // vertex shader
  /*glsl*/ `
        varying vec2 vUv;
        uniform float time;
        varying float vProgress;
        attribute float randoms;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = randoms * 2. * (1. / -mvPosition.z);
          // gl_PointSize = 50.0;
        }
      `,
  // fragment shader
  /*glsl*/ `
        uniform float time;
        void main() {
          float disc = length(gl_PointCoord.xy - vec2(0.5));
          float opacity = 0.3 * smoothstep(0.5, 0.4, disc);
          gl_FragColor = vec4(vec3(opacity), 1.);
        }
      `
);

extend({ BrainParticleMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      brainParticleMaterial: ReactThreeFiber.Object3DNode<
        typeof BrainParticleMaterial & JSX.IntrinsicElements["shaderMaterial"],
        typeof BrainParticleMaterial
      >;
    }
  }
}

export function BrainParticles({
  allthecurves,
}: {
  allthecurves: THREE.CatmullRomCurve3[];
}) {
  let density = 10;
  let numberOfPoints = density * allthecurves.length;
  const myPoints = useRef<
    Array<{
      currentOffset: number;
      speed: number;
      curve: THREE.CatmullRomCurve3;
      curPosition: number;
    }>
  >([]);
  const brainGeo: MutableRefObject<Ref<THREE.BufferGeometry>> = useRef();
  let positions = useMemo(() => {
    let positions = [];
    for (let i = 0; i < numberOfPoints; i++) {
      positions.push(
        randomRange(-1, 1),
        randomRange(-1, 1),
        randomRange(-1, 1)
      );
    }
    return new Float32Array(positions);
  }, []);

  let randoms = useMemo(() => {
    let randoms = [];
    for (let i = 0; i < numberOfPoints; i++) {
      randoms.push(randomRange(0.3, 1));
    }
    return new Float32Array(randoms);
  }, []);

  useEffect(() => {
    for (let i = 0; i < numberOfPoints; i++) {
      for (let j = 0; j < density; j++) {
        myPoints.current.push({
          currentOffset: Math.random(),
          speed: Math.random() * 0.01,
          curve: allthecurves[i],
          curPosition: Math.random(),
        });
      }
    }
    console.log(myPoints.current.length);
  }, []);

  useFrame((clock) => {
    if (brainGeo.current) {
      let currPositions = brainGeo.current.attributes.position.array;

      for (let i = 0; i < myPoints.current.length; i++) {
        myPoints.current[i].curPosition += myPoints.current[i].speed;
        myPoints.current[i].curPosition = myPoints.current[i].curPosition % 1;
        if (myPoints.current[i].curve) {
          let curPoint = myPoints.current[i].curve.getPoint(
            myPoints.current[i].curPosition
          );

          currPositions[i * 3] = curPoint.x;
          currPositions[i * 3 + 1] = curPoint.y;
          currPositions[i * 3 + 2] = curPoint.z;
        } else {
          // console.log(i, myPoints.current.length);
        }
      }

      brainGeo.current.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points>
      <bufferGeometry attach="geometry" ref={brainGeo}>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-randoms"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <brainParticleMaterial
        attach="material"
        depthTest={false}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

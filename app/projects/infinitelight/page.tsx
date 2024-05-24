"use client";
import React, { useEffect, useRef } from "react";

import { InfiniteLight } from "@/utils/InfiniteLight";
import * as THREE from "three";

const distortion_uniforms = {
  uDistortionX: new THREE.Uniform(new THREE.Vector2(80, 3)),
  uDistortionY: new THREE.Uniform(new THREE.Vector2(-40, 2.5)),
};

const distortion_vertex = `
#define PI 3.14159265358979
uniform vec2 uDistortionX;
uniform vec2 uDistortionY;

float nsin(float val) {
    return sin(val) * 0.5 + 0.5;
}

vec3 getDistortion(float progress) {
    progress = clamp(progress, 0., 1.);
    float xAmp = uDistortionX.r;
    float xFreq = uDistortionX.g;
    float yAmp = uDistortionY.r;
    float yFreq = uDistortionY.g;
    return vec3(
        xAmp * nsin(progress * PI * xFreq - PI / 2.),
        yAmp * nsin(progress * PI * yFreq - PI / 2.),
        0.
    );
}
`;

const myCustomDistortion = {
  uniforms: distortion_uniforms,
  getDistortion: distortion_vertex,
};

const options = {
  length: 400,
  width: 20,
  roadWidth: 9,
  islandWidth: 2,
  nPairs: 50,
  roadSections: 3,
  distortion: myCustomDistortion,
};

const InfiniteLightPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      const infinitelight = new InfiniteLight(canvasRef.current, options);
      infinitelight.loadAssets().then(infinitelight.init);
    }
  }, [canvasRef.current]);
  return (
    <div>
      <canvas
        ref={canvasRef}
        id="js-canvas"
        className="absolute top-0"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      ></canvas>
    </div>
  );
};

export default InfiniteLightPage;

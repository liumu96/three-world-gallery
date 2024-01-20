"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import Navigator from "@/components/Navigator";
import Title from "@/components/Title";
import RefractionEffect from "@/utils/Refraction";

const RefractionEffectPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelPath = "/assets/ore.glb";
  const bgImgPath = "/assets/water.jpg";

  useEffect(() => {
    if (canvasRef.current) {
      new RefractionEffect(canvasRef.current, modelPath, bgImgPath);
    }
  }, [canvasRef.current]);
  return (
    <div className="w-full h-screen relative">
      <Navigator title="Refraction Effect-2"></Navigator>
      {/* <Title title="Refraction Effect"></Title> */}
      <canvas
        ref={canvasRef}
        id="js-canvas"
        className="absolute top-0 cursor-grab"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      ></canvas>
    </div>
  );
};

export default RefractionEffectPage;

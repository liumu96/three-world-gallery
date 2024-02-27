"use client";

import CanvasLayout from "@/components/Layout";
import React, { useEffect, useRef } from "react";
import WaterDistortion from "@/utils/WaterDistortion";

const WaterDistortionPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      new WaterDistortion(canvasRef.current);
    }
  }, [canvasRef.current]);
  return (
    <CanvasLayout title="Water Distortion">
      <canvas
        ref={canvasRef}
        id="js-canvas"
        className="absolute top-0 cursor-grab"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      ></canvas>
    </CanvasLayout>
  );
};

export default WaterDistortionPage;

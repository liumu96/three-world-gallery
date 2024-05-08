"use client";
import React, { useEffect, useRef } from "react";
import SunFlowersSketch from "@/utils/SunFlowers";

const SunFlowersPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      new SunFlowersSketch(canvasRef.current);
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

export default SunFlowersPage;

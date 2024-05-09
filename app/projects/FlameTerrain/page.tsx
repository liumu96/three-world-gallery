"use client";
import React, { useEffect, useRef } from "react";
import FlameTerrainSketch from "@/utils/FlameTerrian";

const FlameTerrainPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      new FlameTerrainSketch(canvasRef.current);
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

export default FlameTerrainPage;

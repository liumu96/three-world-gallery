"use client";
import React, { useEffect, useRef } from "react";
import ParticlesSketch from "@/utils/ParticlesExplode";

const ParticlesPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      new ParticlesSketch(canvasRef.current);
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

export default ParticlesPage;

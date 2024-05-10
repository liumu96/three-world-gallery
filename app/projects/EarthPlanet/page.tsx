"use client";
import React, { useEffect, useRef } from "react";
import EarthPlanetSketch from "@/utils/EarthPlanet";

const EarthPlanetPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      new EarthPlanetSketch(canvasRef.current);
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

export default EarthPlanetPage;

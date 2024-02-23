"use client";
import React, { useEffect, useRef } from "react";
import Title from "@/components/Title";
import Navigator from "@/components/Navigator";

import Ripple from "@/utils/Ripple";

const RipplePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      new Ripple(canvasRef.current);
    }
  }, [canvasRef]);
  return (
    <div className="w-full h-screen relative bg-amber-50">
      <Navigator title="Ripple"></Navigator>
      <Title title="Ripple" textColor="text-blue-500"></Title>
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

export default RipplePage;

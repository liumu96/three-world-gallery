"use client";
import Title from "@/components/Title";
import React, { useEffect, useRef } from "react";
import ShyBirds from "@/utils/ShyBirds";
import Navigator from "@/components/Navigator";

const ShyBird = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      const shyBird = new ShyBirds(canvasRef.current);
      shyBird.animate();
    }
  }, []);
  return (
    <div className="w-full h-screen relative bg-amber-50">
      <Navigator title="ShyBirds"></Navigator>
      <Title title="ShyBird" textColor="text-orange-500"></Title>
      <canvas
        ref={canvasRef}
        id="js-canvas"
        className="absolute top-0"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      ></canvas>
      <div
        id="js-info"
        className="absolute w-full top-1/2 mt-52 m-auto text-orange-500 uppercase font-mono text-center"
      >
        ^<br />
        Move the head of this bird
        <br />
        <span className="text-amber-300">
          and watch how the 2 others
          <br />
          interact with him
        </span>
      </div>
    </div>
  );
};

export default ShyBird;

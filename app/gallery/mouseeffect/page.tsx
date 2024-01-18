"use client";

import React, { useEffect, useRef, useState } from "react";
import Title from "@/components/Title";
import Navigator from "@/components/Navigator";
import InstancedMouseEffect from "@/utils/MouseEffect";

const MouseEffectPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [effect, setEffect] = useState<InstancedMouseEffect | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      let effect = new InstancedMouseEffect({
        canvas: canvasRef.current,
        opts: {
          speed: 1,
          frequency: 1,
          mouseSize: 1,
          rotationSpeed: 1,
          color: "#1084ff",
          colorDegrade: 1.5,
          shape: "square", // cylinder, torus, icosahedron OR any THREE.Geometry
        },
      });
      setEffect(effect);
    }
  }, []);

  const handleClick = (index: number) => {
    if (effect) {
      switch (index) {
        case 1:
          effect.switchFollowers(0);
          effect.switchColor(0);
          break;
        case 2:
          effect.switchFollowers(1);
          effect.switchColor(1);
          break;
        case 3:
          effect.switchFollowers(2);
          effect.switchColor(2);
          break;
        default:
          break;
      }
    }
  };

  return (
    <div className="w-full h-screen relative">
      <Navigator title="mouseeffect"></Navigator>
      <Title title="Mouse Effect"></Title>
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
        className="fixed m-0 px-5 py-5 bottom-10 left-20 font-mono text-white "
      >
        Mouse Effect with Instancing in Three.js
        {/* TODO Different Demo */}
        <div className="grid grid-cols-3 text-left mt-4">
          <button onClick={() => handleClick(1)} className="text-left">
            Demo 1
          </button>
          <button onClick={() => handleClick(2)} className="text-left">
            Demo 2
          </button>
          <button onClick={() => handleClick(3)} className="text-left">
            Demo 3
          </button>
        </div>
      </div>
    </div>
  );
};

export default MouseEffectPage;

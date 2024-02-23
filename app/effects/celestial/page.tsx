"use client";

import Title from "@/components/Title";
import React, { useEffect, useRef, useState } from "react";
import CelestialBody from "@/utils/CelestialBody";
import Navigator from "@/components/Navigator";

const Celestial = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [show, setShow] = useState<boolean>(true);

  useEffect(() => {
    if (canvasRef.current) {
      const cb = new CelestialBody(canvasRef.current);
      cb?.animate();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "KeyH") {
      setShow((prevShow) => !prevShow);
    }
  };

  return (
    <div className="w-full h-screen relative">
      <Navigator title="Celestial"></Navigator>
      <Title title="Celestial"></Title>
      <canvas
        ref={canvasRef}
        id="js-canvas"
        className="absolute top-0"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      ></canvas>
      <p
        id="js-info"
        className={`fixed m-0 px-5 py-10 bottom-10 left-20 font-mono text-white ${
          show ? "visible" : "hidden"
        }`}
      >
        Press <i>H</i> to show/hide debug UI
      </p>
    </div>
  );
};

export default Celestial;

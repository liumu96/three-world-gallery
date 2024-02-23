"use client";
import React, { useEffect, useRef, useState } from "react";
import TetSim from "@/utils/TetSim";
import Navigator from "@/components/Navigator";

const TetSimPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cpuSim, setCPUSim] = useState(false);
  const [tetSim, setTetSim] = useState<TetSim>();
  useEffect(() => {
    if (canvasRef.current) {
      setTetSim(new TetSim(canvasRef.current));
    }
  }, []);
  useEffect(() => {
    if (tetSim) {
      tetSim.initSoftBody(cpuSim);
    }
  }, [cpuSim]);
  return (
    <div className="w-full h-screen relative bg-amber-50">
      <Navigator title="Celestial"></Navigator>
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
        className="fixed m-0 px-5 top-5 left-1/2 transform -translate-x-1/2 font-mono text-black"
      >
        Click to Drag -{" "}
        <button
          onClick={() => setCPUSim(true)}
          className={`${
            cpuSim ? "underline text-blue-500 " : "no-underline hover:underline"
          }`}
        >
          CPU Sim
        </button>{" "}
        -{" "}
        <button
          className={`${
            !cpuSim
              ? "underline text-blue-500 "
              : "no-underline hover:underline"
          }`}
          onClick={() => setCPUSim(false)}
        >
          GPU Sim
        </button>
      </p>
      <p
        id="js-info"
        className="fixed m-0 px-5 py-10 bottom-10 left-20 font-mono text-white"
      >
        Paper:{" "}
        <a
          target="_blank"
          href="http://blog.mmacklin.com/publications/#:~:text=A%20Constraint-based%20Formulation%20of%20Stable%20Neo-Hookean%20Materials"
        >
          A Constraint-based Formulation of Stable Neo-Hookean Materials
        </a>
      </p>
    </div>
  );
};

export default TetSimPage;

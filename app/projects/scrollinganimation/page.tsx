"use client";

import React from "react";
import CanvasLayout from "@/components/Layout";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./Experience";

const ScrollingAnimationPage = () => {
  return (
    <CanvasLayout
      title="Scrolling Animation"
      bgColor="bg-[#d9afd9] bg-gradient-to-b from-[#d9afd9] to-[#97d9e1]"
    >
      <Canvas
        camera={{
          fov: 64,
          position: [2.3, 1.5, 2.3],
        }}
      >
        <Experience />
      </Canvas>
    </CanvasLayout>
  );
};

export default ScrollingAnimationPage;

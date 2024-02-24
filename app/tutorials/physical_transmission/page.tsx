"use client";
import React, { useEffect, useRef } from "react";
import CanvasLayout from "@/components/Layout";
import PhysicalTransmission from "@/utils/tutorials/physicalTransmission";

const PhysicalTransmissionPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      new PhysicalTransmission(canvasRef.current);
    }
  }, [canvasRef.current]);
  return (
    <CanvasLayout title="Physical Transmission">
      <canvas
        ref={canvasRef}
        id="js-canvas"
        className="absolute top-0 cursor-grab"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      ></canvas>
    </CanvasLayout>
  );
};

export default PhysicalTransmissionPage;

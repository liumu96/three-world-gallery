"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import Navigator from "@/components/Navigator";
import ModelCustomizer from "@/utils/ModelCustomizer";
import ColorSwitcherComp from "@/components/ColorSwitcher";

const ModelCustomizerPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelCustomizer, setModelCustomizer] =
    useState<ModelCustomizer | null>(null);
  const options = ["legs", "cushions", "base", "supports", "back"];
  const [activeOption, setActiveOption] = useState<string>("legs");
  useEffect(() => {
    if (canvasRef.current) {
      const modelCustomizer = new ModelCustomizer(canvasRef.current);
      modelCustomizer.animate();
      setModelCustomizer(modelCustomizer);
    }
  }, [canvasRef.current]);

  const selectMaterial = (color: IColor) => {
    if (modelCustomizer) {
      modelCustomizer.selectMaterial(color, activeOption);
    }
  };

  return (
    <div className="w-full h-screen relative bg-white">
      <Navigator title="Model Customizer"></Navigator>
      <canvas
        ref={canvasRef}
        id="js-canvas"
        className="absolute top-0"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      ></canvas>
      {/* Loading */}

      {/* Toggle Different Parts */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
        {options.map((option, i) => {
          return (
            <div
              key={i}
              className={`bg-cover bg-white bg-center mb-0.5 p-2.5 h-14 w-14 flex justify-center items-center cursor-pointer ${
                activeOption == option
                  ? "border-r-red-500 border-solid border-r-2 cursor-default"
                  : "border-none"
              }`}
              onClick={() => {
                console.log(activeOption == option);
                setActiveOption(option);
              }}
            >
              <img
                className="h-full w-auto pointer-events-none"
                src={`/assets/${option}.svg`}
              />
            </div>
          );
        })}
      </div>

      {/* Material Customizer */}
      <ColorSwitcherComp selectMaterial={selectMaterial} />
      <p
        id="js-info"
        className="fixed m-0 px-5 py-10 bottom-10 right-10 font-mono text-blue-500"
      >
        <strong>&nbsp;Grab&nbsp;</strong> to rotate chair.
        <strong>&nbsp;Scroll&nbsp;</strong> to zoom.
        <strong>&nbsp;Drag&nbsp;</strong> swatches to view more.
      </p>
    </div>
  );
};

export default ModelCustomizerPage;

"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import Navigator from "@/components/Navigator";
import Title from "@/components/Title";
import ConfettiText from "@/utils/ConfettiText";

const Confetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const [textCanvasCtx, setTextCanvasCtx] =
    useState<CanvasRenderingContext2D>();

  const [confettiRef, setConfettiRef] = useState<ConfettiText>();
  const [textValue, setTextValue] = useState<string>("IDEA");

  useEffect(() => {
    if (confettiRef) {
      confettiRef.animate();

      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }
  }, [confettiRef]);

  const onResize = () => {
    confettiRef?.onResize();
    if (textCanvasRef.current) {
      textCanvasRef.current.style.width = window.innerWidth + "px";
      textCanvasRef.current.style.height = 200 + "px";
      textCanvasRef.current.width = window.innerWidth;
      textCanvasRef.current.height = 200;
    }
    updateText();
  };

  useEffect(() => {
    if (textCanvasRef.current) {
      textCanvasRef.current.style.width = window.innerWidth + "px";
      textCanvasRef.current.style.height = 200 + "px";
      textCanvasRef.current.width = window.innerWidth;
      textCanvasRef.current.height = 200;

      const textCanvasCtx = textCanvasRef.current.getContext("2d");

      if (textCanvasCtx) {
        textCanvasCtx.font = "700 100px Arial";
        textCanvasCtx.fillStyle = "#555";
      }
      setTextCanvasCtx(textCanvasCtx || undefined);
    }
  }, [textCanvasRef]);

  useEffect(() => {
    if (canvasRef.current) {
      const text = new ConfettiText(canvasRef.current);
      setConfettiRef(text);
    }
  }, [canvasRef]);

  useEffect(() => {
    if (textCanvasCtx) {
      const interval = setTimeout(() => {
        updateText();
      }, 40);
      return () => {
        clearTimeout(interval);
      };
    }
  }, [textCanvasCtx]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value);
  };

  const updateText = () => {
    const textLength = textValue.length || 1;
    let fontSize = window.innerWidth / (textLength * 1.3);
    if (fontSize > 120) fontSize = 120;
    if (textCanvasCtx) {
      textCanvasCtx.font = "700 " + fontSize + "px Arial";
      textCanvasCtx.clearRect(0, 0, window.innerWidth, 200);
      textCanvasCtx.textAlign = "center";
      textCanvasCtx.textBaseline = "middle";
      textCanvasCtx.fillText(
        textValue.toUpperCase() || "",
        window.innerWidth / 2,
        50
      );

      setTimeout(() => {
        const pix = textCanvasCtx.getImageData(
          0,
          0,
          window.innerWidth,
          200
        ).data;

        const textPixels = [];
        for (let i = pix.length; i >= 0; i -= 4) {
          if (pix[i] != 0) {
            const x = (i / 4) % window.innerWidth;
            const y = Math.floor(Math.floor(i / window.innerWidth) / 4);

            if (x && x % 6 == 0 && y && y % 6 == 0)
              textPixels.push({
                x: x,
                y: 200 - y + -150,
              });
          }
        }
        confettiRef?.setParticles(textPixels);
      }, 0);
    }
  };

  return (
    <div className="w-full h-screen relative bg-green-200">
      <Navigator title="Confetti Text"></Navigator>
      <Title title="Confetti Text" textColor="text-gray-900"></Title>
      <canvas
        ref={canvasRef}
        id="js-canvas"
        className="absolute top-0"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      ></canvas>
      <canvas
        className="z-30 hidden"
        ref={textCanvasRef}
        id="text-canvas"
      ></canvas>

      <input
        className="z-40 absolute uppercase bottom-20 w-full border-solid font-mono text-center bg-transparent outline-none border-b-gray-700 text-gray-900 font-bold text-4xl"
        id="input"
        type="text"
        value={textValue}
        onChange={handleChange}
        onKeyUp={updateText}
      />
    </div>
  );
};

export default Confetti;

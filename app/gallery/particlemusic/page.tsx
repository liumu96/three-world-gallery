"use client";
import React, { useRef, useEffect, useState } from "react";
import Title from "@/components/Title";
import Navigator from "@/components/Navigator";
import ParticleMusic from "@/utils/ParticleMusic";
import PlayCircleOutlineTwoToneIcon from "@mui/icons-material/PlayCircleOutlineTwoTone";
// todo How to stop the player
const ParticleMusicPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [play, setPlay] = useState<boolean>(false);
  const [start, setStart] = useState<boolean>(false);
  const [particleMusic, setParticleMusic] = useState<ParticleMusic | null>(
    null
  );
  useEffect(() => {
    return () => {
      particleMusic?.stop();
      setParticleMusic(null);
    };
  }, []);
  useEffect(() => {
    if (canvasRef.current && start) {
      const particleMusic = new ParticleMusic(canvasRef.current);
      setParticleMusic(particleMusic);
    }
  }, [start]);

  useEffect(() => {
    if (play) {
      particleMusic?.play();
    } else {
      particleMusic?.pause();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [play]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "KeyP") {
      setPlay((prevShow) => !prevShow);
    }
  };
  return (
    <div className="w-full h-screen relative">
      <Navigator title="Particle Music"></Navigator>
      <Title title="Particle Music"></Title>

      {start ? (
        <canvas
          ref={canvasRef}
          id="js-canvas"
          className="absolute top-0"
          style={{
            width: "100vw",
            height: "100vh",
          }}
        ></canvas>
      ) : (
        <div
          onClick={() => setStart(true)}
          className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50  z-50 flex justify-center items-center flex-col cursor-pointer text-white font-mono"
        >
          <PlayCircleOutlineTwoToneIcon />
          <p className="mt-4">Click to Start</p>
        </div>
      )}
      <p
        id="js-info"
        className="fixed m-0 px-5 py-10 bottom-10 left-20 font-mono text-white"
      >
        Press <i>P</i> to play/pause the audio
      </p>
    </div>
  );
};

export default ParticleMusicPage;

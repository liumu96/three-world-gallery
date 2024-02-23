"use client";

import Title from "@/components/Title";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";

import Navigator from "@/components/Navigator";
import Particle from "@/utils/TypingEffect/particle";
import TypingEffect from "@/utils/TypingEffect";

// todo 光标和文本位置

interface Coords {
  x: number;
  y: number;
  old: boolean;
  toDelete: boolean;
}

interface StringSize {
  wTexture: number;
  wScene: number;
  hTexture: number;
  hScene: number;
  caretPosScene: number[];
}

const fontName = "Verdana";
const textureFontSize = 60;
const fontScaleFactor = 0.08;

const stringBox: StringSize = {
  wTexture: 0,
  wScene: 0,
  hTexture: 0,
  hScene: 0,
  caretPosScene: [],
};

const isNewLine = (el: HTMLElement | null): boolean => {
  if (el) {
    if (
      el instanceof HTMLElement &&
      (el.tagName.toUpperCase() === "DIV" || el.tagName.toUpperCase() === "P")
    ) {
      if (el.innerHTML === "<br>" || el.innerHTML === "</br>") {
        return true;
      }
    }
  }
  return false;
};

const getCaretCoordinates = (): [number, number] => {
  const textarea = document.getElementById("text-input") as HTMLTextAreaElement;

  if (!textarea) {
    return [0, 0];
  }

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;

  const textBeforeCaret = textarea.value.substring(0, start);
  const dummyDiv = document.createElement("div");
  dummyDiv.style.position = "absolute";
  dummyDiv.style.left = "-9999px";
  dummyDiv.style.fontSize = window.getComputedStyle(textarea).fontSize;
  dummyDiv.textContent = textBeforeCaret;

  document.body.appendChild(dummyDiv);

  const rect = dummyDiv.getBoundingClientRect();
  const caretX = rect.width;
  const caretY = rect.height;

  document.body.removeChild(dummyDiv);

  return [caretX, caretY];
};

const setCaretToEndOfInput = () => {
  document.execCommand("selectAll", false);
  document.getSelection()?.collapseToEnd();
};

const TypingEffectPage = () => {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const [typingEffect, setTypingEffect] = useState<TypingEffect | null>(null);

  const [textCanvasCtx, setTextCanvasCtx] =
    useState<CanvasRenderingContext2D>();
  const [textureCoords, setTextureCoords] = useState<Array<Coords>>([]);
  const [particles, setParticles] = useState<Array<Particle>>([]);

  const [string, setString] = useState<string>("FLUFF");

  useEffect(() => {
    if (textCanvasRef.current) {
      textCanvasRef.current.width = 0;
      textCanvasRef.current.height = 0;

      const textCanvasCtx = textCanvasRef.current.getContext("2d");

      if (textCanvasCtx) {
        textCanvasCtx.font = "100 60px Verdana";
        textCanvasCtx.fillStyle = "#2a9d8f";
      }
      setTextCanvasCtx(textCanvasCtx || undefined);
    }
  }, [textCanvasRef]);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.fontSize = textureFontSize + "px";
      textRef.current.style.font = "100 " + textureFontSize + "px " + fontName;
      textRef.current.style.lineHeight = 1.1 * textureFontSize + "px";

      textRef.current.focus();
      textRef.current.setSelectionRange(
        textRef.current.value.length,
        textRef.current.value.length
      );
      setCaretToEndOfInput();
    }

    if (canvasRef.current && textRef.current) {
      const typingEffect = new TypingEffect(canvasRef.current, textRef.current);
      setTypingEffect(typingEffect);
    }
  }, []);

  useEffect(() => {
    if (typingEffect) {
      typingEffect.render();
      handleKeyUp();
      document.addEventListener("keyup", handleKeyUp);
      return () => {
        document.removeEventListener("keyup", handleKeyUp);
      };
    }
  }, [typingEffect]);

  const handleKeyUp = () => {
    handleInput();
    refreshText();
  };

  const handleInput = () => {
    const textInputEl = textRef.current;
    if (textInputEl) {
      const firstChild = textInputEl.firstChild as HTMLElement;
      if (isNewLine(firstChild)) {
        firstChild.remove();
      }
      const lastChild = textInputEl.firstChild as HTMLElement;
      if (isNewLine(lastChild)) {
        if (isNewLine(lastChild.previousSibling as HTMLElement)) {
          lastChild.remove();
        }
      }

      stringBox.wTexture = textInputEl.clientWidth;
      stringBox.wScene = stringBox.wTexture * fontScaleFactor;
      stringBox.hTexture = textInputEl.clientHeight;
      stringBox.hScene = stringBox.hTexture * fontScaleFactor;

      stringBox.caretPosScene = getCaretCoordinates().map(
        (c) => c * fontScaleFactor
      );
    }
  };

  const handFocus = () => {
    if (textRef.current) textRef.current.focus();
  };

  const refreshText = () => {
    sampleCoordinates();

    const tempParticles = textureCoords.map((c, cIdx) => {
      const x = c.x * fontScaleFactor;
      const y = c.y * fontScaleFactor;

      let p = c.old && particles[cIdx] ? particles[cIdx] : new Particle([x, y]);
      if (c.toDelete) {
        p.toDelete = true;
        p.scale = p.maxScale;
      }
      return p;
    });
    setParticles(tempParticles);
    typingEffect?.refreshText(tempParticles, stringBox);
  };

  const sampleCoordinates = () => {
    const currentString = textRef.current?.value || "";
    const lines = currentString.split(`\n`);
    const linesNumber = lines.length;
    console.log(lines, "lines");

    if (textCanvasCtx && textCanvasRef.current) {
      textCanvasRef.current.width = stringBox.wTexture;
      textCanvasRef.current.height = stringBox.hTexture;
      textCanvasCtx.font = "100 " + textureFontSize + "px " + fontName;
      textCanvasCtx.fillStyle = "#2a9d8f";
      textCanvasCtx.clearRect(
        0,
        0,
        textCanvasRef.current.width,
        textCanvasRef.current.height
      );

      for (let i = 0; i < linesNumber; i++) {
        textCanvasCtx.fillText(
          lines[i],
          0,
          ((i + 0.8) * stringBox.hTexture) / linesNumber
        );
      }

      if (stringBox.wTexture > 0) {
        const imageData = textCanvasCtx.getImageData(
          0,
          0,
          textCanvasRef.current.width,
          textCanvasRef.current.height
        );

        const imageMask = Array.from(
          Array(textCanvasRef.current.height),
          () => new Array(textCanvasRef.current?.width)
        );
        for (let i = 0; i < textCanvasRef.current.height!; i++) {
          for (let j = 0; j < textCanvasRef.current.width!; j++) {
            imageMask[i][j] =
              imageData.data[(j + i * textCanvasRef.current.width) * 4] > 0;
          }
        }

        if (textureCoords.length !== 0) {
          // Clean up: delete coordinates and particles which disappeared on the prev step
          // We need to keep same indexes for coordinates and particles to reuse old particles properly
          const tempTextureCoords = textureCoords.filter((c) => !c.toDelete);
          const tempParticles = particles.filter((c) => !c.toDelete);
          setParticles(tempParticles);

          // Go through existing coordinates (old to keep, toDelete for fade-out animation)
          tempTextureCoords.forEach((c) => {
            if (imageMask[c.y]) {
              if (imageMask[c.y][c.x]) {
                c.old = true;
                if (!c.toDelete) {
                  imageMask[c.y][c.x] = false;
                }
              } else {
                c.toDelete = true;
              }
            } else {
              c.toDelete = true;
            }
          });
          setTextureCoords(tempTextureCoords);
        }

        // Add new coordinates
        const tempTextureCoords = textureCoords;
        for (let i = 0; i < textCanvasRef.current.height; i++) {
          for (let j = 0; j < textCanvasRef.current.width; j++) {
            if (imageMask[i][j]) {
              tempTextureCoords.push({
                x: j,
                y: i,
                old: false,
                toDelete: false,
              });
            }
          }
        }
        setTextureCoords(tempTextureCoords);
      } else {
        setTextureCoords([]);
      }
    }
  };

  return (
    <div className="w-full h-screen relative">
      <Navigator title="Typing Effect"></Navigator>
      <Title title="Typing Effect"></Title>
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

      <textarea
        className="fixed z-50 opacity-0 bottom-0"
        id="text-input"
        ref={textRef}
        value={string}
        onChange={(e) => {
          setString(e.target.value);
        }}
        autoFocus
        onBlur={handFocus}
      />
    </div>
  );
};

export default TypingEffectPage;

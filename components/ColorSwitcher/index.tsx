import React from "react";
import { colors } from "@/utils/ModelCustomizer/ColorSwitcher";

const ColorSwitcherComp = ({
  selectMaterial,
}: {
  selectMaterial: (color: IColor) => void;
}) => {
  const handleClick = (i: number) => {
    const color = colors[i];
    selectMaterial(color);
  };
  return (
    <div className="absolute w-full flex left-0 overflow-auto bottom-0">
      {colors.map((color, i) => {
        if (color.texture) {
          return (
            <div
              className="transition-transform duration-100 ease-in h-12 min-w-12 flex flex-1 box-border shadow-md bg-cover bg-center cursor-pointer"
              key={i}
              style={{ backgroundImage: `url(${color.texture})` }}
              onClick={() => handleClick(i)}
            ></div>
          );
        } else {
          return (
            <div
              className="transition-transform duration-100 ease-in h-12 min-w-12 flex flex-1 box-border shadow-md bg-cover bg-center cursor-pointer"
              key={i}
              style={{ backgroundColor: `#${color.color}` }}
              onClick={() => handleClick(i)}
            ></div>
          );
        }
      })}
    </div>
  );
};

export default ColorSwitcherComp;

import React from "react";

type Title = {
  title: string;
  textColor?: string;
};

const Title = ({ title, textColor }: Title) => {
  return (
    <div className="pt-24 z-40 absolute w-full ">
      <h3
        className={`text-center font-mono text-4xl w-full flex items-center justify-center ${
          textColor || "text-white"
        }`}
      >
        {title}
      </h3>
    </div>
  );
};

export default Title;

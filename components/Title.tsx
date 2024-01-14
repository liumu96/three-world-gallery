import React from "react";

type Title = {
  title: string;
};

const Title = ({ title }: Title) => {
  return (
    <div className="pt-24">
      <h3 className="text-center font-mono text-4xl w-full flex items-center justify-center">
        {title}
      </h3>
    </div>
  );
};

export default Title;

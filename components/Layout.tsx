import React, { ReactNode } from "react";
import Navigator from "./Navigator";

const CanvasLayout = ({
  children,
  title,
  bgColor = "bg-amber-50",
}: {
  children: ReactNode;
  title: string;
  bgColor?: string;
}) => {
  return (
    <div className={`w-full h-screen relative ${bgColor}`}>
      <Navigator title={title}></Navigator>
      {children}
    </div>
  );
};

export default CanvasLayout;

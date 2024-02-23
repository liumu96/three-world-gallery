import React, { ReactNode } from "react";
import Navigator from "./Navigator";

const CanvasLayout = ({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) => {
  return (
    <div className="w-full h-screen relative bg-amber-50">
      <Navigator title={title}></Navigator>
      {children}
    </div>
  );
};

export default CanvasLayout;

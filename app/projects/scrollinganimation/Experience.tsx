import { extend } from "@react-three/fiber";
import { OrbitControls, ScrollControls } from "@react-three/drei";
import { Office } from "./Office";
import { Overlay } from "./Overlay";
extend({ OrbitControls });

export const Experience = () => {
  return (
    <>
      <ambientLight intensity={2} />
      <OrbitControls enableZoom={false} />
      <ScrollControls pages={3} damping={0.25}>
        <Overlay />
        <Office />
      </ScrollControls>
    </>
  );
};

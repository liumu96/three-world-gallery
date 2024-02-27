import { Scroll, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  JSXElementConstructor,
  PromiseLikeOfReactNode,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
} from "react";

const Section = (props: {
  right?: any;
  opacity: any;
  children: Array<ReactElement>;
}) => {
  return (
    <section
      className={`h-screen flex flex-col justify-center text-black p-10 ${
        props.right ? "items-end" : "items-start"
      }`}
      style={{ opacity: props.opacity }}
    >
      <div className="w-1/2 flex items-center justify-center">
        <div className="bg-white rounded-lg px-8 py-12">{props.children}</div>
      </div>
    </section>
  );
};

export const Overlay = () => {
  const scroll = useScroll();
  const [opacityFirstSection, setOpacityFirstSection] = useState(1);
  const [opacitySecondSection, setOpacitySecondSection] = useState(1);
  const [opacityLastSection, setOpacityLastSection] = useState(1);

  useFrame(() => {
    setOpacityFirstSection(1 - scroll.range(0, 1 / 3));
    setOpacitySecondSection(scroll.curve(1 / 3, 1 / 3));
    setOpacityLastSection(scroll.range(2 / 3, 1 / 3));
  });

  return (
    <Scroll html>
      <div className="w-screen text-black">
        <Section opacity={opacityFirstSection}>
          <h1 className="font-semibold font-serif text-2xl ">
            Hi there, and thanks for visiting!
          </h1>
          <p className="text-gray-500">Welcom to this beautiful room space!</p>
          <p>It has:</p>
          <ul className="leading-9">
            <li>👩🏻‍💻 an office</li>
            <li>📚 a library</li>
            <li>🍒 an attic</li>
          </ul>
        </Section>
        <Section right opacity={opacitySecondSection}>
          <h1 className="font-semibold font-serif text-2xl ">
            Hi there, and thanks for visiting!
          </h1>
          <p className="text-gray-500">Welcom to this beautiful room space!</p>
          <p>It has:</p>
          <ul className="leading-9">
            <li>👩🏻‍💻 an office</li>
            <li>📚 a library</li>
            <li>🍒 an attic</li>
          </ul>
        </Section>
        <Section opacity={opacityLastSection}>
          <h1 className="font-semibold font-serif text-2xl ">
            Hi there, and thanks for visiting!
          </h1>
          <p className="text-gray-500">Welcom to this beautiful room space!</p>
          <p>It has:</p>
          <ul className="leading-9">
            <li>👩🏻‍💻 an office</li>
            <li>📚 a library</li>
            <li>🍒 an attic</li>
          </ul>
        </Section>
      </div>
    </Scroll>
  );
};

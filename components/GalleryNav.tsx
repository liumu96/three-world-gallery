"use client";

import React from "react";
import { useState } from "react";

import ImageListComp from "@/components/ImageList";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  route: string;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: "PROJECTS",
    route: "/projects",
  },
  {
    label: "PAPERS",
    route: "/papers",
  },
  {
    label: "EFFECTS",
    route: "/effects",
  },
  {
    label: "TUTORIALS",
    route: "/tutorials",
  },
];

const GalleryComp = ({ works }: { works: Array<IWorks> }) => {
  const currentRoute = usePathname();
  const [navbar, setNavbar] = useState(false);

  return (
    <div className="z-10 max-w-5xl w-full font-mono">
      <Link href="/" className="scale-50">
        <h3 className="text-center font-mono text-4xl w-full flex items-center justify-center mb-10 text-orange-400">
          Gallery
        </h3>
      </Link>

      <div className="flex mb-4">
        {NAV_ITEMS.map((item, idx) => {
          return (
            <Link
              key={idx}
              href={item.route}
              onClick={() => setNavbar(!navbar)}
              className={`block lg:inline-block  hover:text-blue-500 px-3 py-2  ${
                currentRoute === item.route
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-500"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <ImageListComp works={works} />
    </div>
  );
};

export default GalleryComp;

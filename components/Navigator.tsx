"use client";
import React, { useEffect, useState } from "react";
import GalleryWorks from "@/utils/gallery";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const Navigator = ({ title }: { title: string }) => {
  const works = GalleryWorks.map((item) => item.routePath);
  const [lastWork, setLastWork] = useState<string>("");
  const [nextWork, setNextWork] = useState<string>("");
  const [index, setIndex] = useState<number>(0);
  useEffect(() => {
    const index = GalleryWorks.findIndex((item) => item.title === title);
    setIndex(index);

    let lastIndex = index - 1;
    let nextIndex = index + 1;
    if (lastIndex < 0) {
      lastIndex = works.length - 1;
    }
    if (nextIndex > works.length - 1) {
      nextIndex = 0;
    }
    setLastWork(`/gallery/${works[lastIndex]}`);
    setNextWork(`/gallery/${works[nextIndex]}`);
  }, []);

  return (
    <div
      className={`absolute left-0 z-50 p-4 grid grid-cols-2 gap-16 ${
        GalleryWorks[index]?.textColor || "text-black"
      }`}
    >
      <Link href="/" className="font-mono">
        3D Gallery
      </Link>
      <div className="grid grid-cols-2 gap-10">
        <Link href={lastWork}>
          <ArrowBackIcon />
        </Link>
        <Link href={nextWork}>
          <ArrowForwardIcon />
        </Link>
      </div>
    </div>
  );
};

export default Navigator;

import React from "react";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";

const ImageListComp = ({ works }: { works: Array<IWorks> }) => {
  return (
    <ImageList variant="masonry" cols={3} gap={8}>
      {/* {GalleryWorks.map((item) => ( */}
      {works.map((item) => (
        <ImageListItem key={item.img}>
          <Link href={item.link || "/gallery/celestial"} className="w-full">
            <img
              srcSet={`${item.img}?w=161&fit=crop&auto=format&dpr=2 2x`}
              src={`${item.img}?w=161&fit=crop&auto=format`}
              alt={item.name}
              loading="lazy"
              className="w-full"
            />
          </Link>

          <ImageListItemBar
            className="font-mono"
            title={item.name}
            // subtitle={item.author}
            actionIcon={
              <IconButton
                sx={{ color: "rgba(255, 255, 255, 0.54)" }}
                aria-label={`info about ${item.name}`}
              ></IconButton>
            }
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
};

export default ImageListComp;

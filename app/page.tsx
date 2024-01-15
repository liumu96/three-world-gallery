import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";
import GalleryWorks from "@/utils/gallery";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pt-12">
      <div className="z-10 max-w-5xl w-full font-mono">
        <h3 className="text-center font-mono text-4xl w-full flex items-center justify-center mb-10">
          Gallery
        </h3>

        <ImageList variant="masonry" cols={3} gap={8}>
          {GalleryWorks.map((item) => (
            <ImageListItem key={item.img}>
              <Link href={item.link || "/gallery/celestial"}>
                <img
                  srcSet={`${item.img}?w=161&fit=crop&auto=format&dpr=2 2x`}
                  src={`${item.img}?w=161&fit=crop&auto=format`}
                  alt={item.title}
                  loading="lazy"
                />
              </Link>

              <ImageListItemBar
                className="font-mono"
                title={item.title}
                // subtitle={item.author}
                actionIcon={
                  <IconButton
                    sx={{ color: "rgba(255, 255, 255, 0.54)" }}
                    aria-label={`info about ${item.title}`}
                  ></IconButton>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      </div>
    </main>
  );
}

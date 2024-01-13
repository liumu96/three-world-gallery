const itemData = [
  {
    img: "https://i.pinimg.com/736x/3e/3f/9a/3e3f9a309c76c20e41f5a0d6d4121235.jpg",
    title: "Plant",
  },
  {
    img: "https://i.pinimg.com/474x/c8/8b/a1/c88ba1b1f70f9d9281912f8dd7062b6d.jpg",
    title: "Plant",
  },
  {
    img: "https://i.pinimg.com/736x/20/52/aa/2052aad947d4ffb866a18a819d997bf9.jpg",
    title: "Plant",
  },
  {
    img: "https://i.pinimg.com/736x/64/4c/34/644c34259efbb80e3e85c9c8098d90f8.jpg",
    title: "Plant",
  },
  {
    img: "https://i.pinimg.com/736x/f6/1f/8c/f61f8c2e7f5e486073db0cef3a4dbeda.jpg",
    title: "Plant",
  },
  {
    img: "https://i.pinimg.com/736x/cb/65/8f/cb658fa5ba315bbb47a376675bd71776.jpg",
    title: "Plant",
  },
];

import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import ListSubheader from "@mui/material/ListSubheader";
import IconButton from "@mui/material/IconButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pt-24">
      <div className="z-10 max-w-5xl w-full font-mono">
        <h3 className="text-center font-mono text-4xl w-full flex items-center justify-center">
          Gallery
        </h3>
        {/* TODO DEMOS */}
        <ImageList variant="masonry" cols={3} gap={8}>
          {itemData.map((item) => (
            <ImageListItem key={item.img}>
              <img
                srcSet={`${item.img}?w=161&fit=crop&auto=format&dpr=2 2x`}
                src={`${item.img}?w=161&fit=crop&auto=format`}
                alt={item.title}
                loading="lazy"
              />
              <ImageListItemBar
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

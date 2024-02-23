import GalleryComp from "@/components/GalleryNav";
import { ProjectItems } from "@/utils/works";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pt-12 bg-orange-50">
      <GalleryComp works={ProjectItems} />
    </main>
  );
}

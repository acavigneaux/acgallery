"use client";

import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { downloadPhoto } from "@/lib/download";

interface Photo {
  id: string;
  originalUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  filename: string;
}

interface GalleryLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function GalleryLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
}: GalleryLightboxProps) {
  const slides = photos.map((photo) => ({
    src: photo.originalUrl,
    width: photo.width,
    height: photo.height,
    alt: photo.filename,
  }));

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      index={currentIndex}
      slides={slides}
      plugins={[Zoom, Slideshow, Counter, Download, Fullscreen, Thumbnails]}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      slideshow={{
        delay: 3000,
      }}
      download={{
        download: ({ slide }) => {
          const photo = photos.find((p) => p.originalUrl === slide.src);
          const filename = photo?.filename || slide.alt || "photo.jpg";
          downloadPhoto(slide.src, filename);
        },
      }}
      thumbnails={{
        position: "bottom",
        width: 80,
        height: 60,
      }}
      styles={{
        container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
      }}
    />
  );
}

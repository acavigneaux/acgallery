"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Download } from "lucide-react";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { downloadPhoto } from "@/lib/download";
import GalleryLightbox from "./GalleryLightbox";

interface Photo {
  id: string;
  filename: string;
  originalUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

interface PhotoGridProps {
  photos: Photo[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  function handleToggleFavorite(e: React.MouseEvent, photoId: string) {
    e.stopPropagation();
    toggleFavorite(photoId);
    setFavorites(getFavorites());
  }

  function handleDownload(e: React.MouseEvent, photo: Photo) {
    e.stopPropagation();
    downloadPhoto(photo.originalUrl, photo.filename);
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3"
      >
        {photos.map((photo, index) => {
          const isFav = favorites.includes(photo.id);
          return (
            <motion.div
              key={photo.id}
              variants={itemVariants}
              className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setLightboxIndex(index)}
            >
              <Image
                src={photo.thumbnailUrl}
                alt={photo.filename}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              {/* Overlay : toujours visible sur mobile, hover sur desktop */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200" />

              {/* Action buttons : toujours visibles sur mobile */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => handleToggleFavorite(e, photo.id)}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      isFav ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={(e) => handleDownload(e, photo)}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>

              {/* Always visible favorite indicator */}
              {isFav && (
                <div className="absolute top-2 right-2">
                  <Heart className="h-4 w-4 fill-red-500 text-red-500 drop-shadow-lg" />
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <GalleryLightbox
        photos={photos}
        currentIndex={lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
      />
    </>
  );
}

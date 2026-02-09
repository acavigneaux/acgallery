"use client";

import { useEffect, useState } from "react";
import { getFavorites } from "@/lib/favorites";
import PhotoGrid from "@/components/gallery/PhotoGrid";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Heart } from "lucide-react";

interface Photo {
  id: string;
  filename: string;
  originalUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export default function FavoritesPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      const favoriteIds = getFavorites();
      if (favoriteIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const fetchedPhotos = await Promise.all(
          favoriteIds.map(async (id) => {
            try {
              const res = await fetch(`/api/photos/${id}`);
              if (!res.ok) return null;
              return res.json();
            } catch {
              return null;
            }
          })
        );
        setPhotos(fetchedPhotos.filter(Boolean));
      } catch {
        console.error("Failed to fetch favorites");
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <Breadcrumbs items={[{ label: "Favoris" }]} />

      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
          <Heart className="h-8 w-8 text-red-500" />
          Mes favoris
        </h1>
        <p className="text-muted-foreground mt-1">
          {loading ? "Chargement..." : `${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-lg">Aucun favori pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cliquez sur le coeur sur une photo pour l&apos;ajouter à vos favoris
          </p>
        </div>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </div>
  );
}

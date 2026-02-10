"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Star, StarOff, GripVertical, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Photo {
  id: string;
  filename: string;
  thumbnailUrl: string;
  originalUrl: string;
  width: number;
  height: number;
  order: number;
}

interface PhotoManagerProps {
  photos: Photo[];
  coverPhotoId: string | null;
  competitionId: string;
  yearId: string;
  yearCoverPhotoId: string | null;
  onUpdate: () => void;
}

export default function PhotoManager({
  photos,
  coverPhotoId,
  competitionId,
  yearId,
  yearCoverPhotoId,
  onUpdate,
}: PhotoManagerProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  async function handleDelete(photoId: string) {
    setDeleting(photoId);
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Photo supprimée");
      onUpdate();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  }

  async function handleBulkDelete() {
    if (selectedPhotos.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedPhotos).map((id) =>
          fetch(`/api/photos/${id}`, { method: "DELETE" })
        )
      );
      toast.success(`${selectedPhotos.size} photo(s) supprimée(s)`);
      setSelectedPhotos(new Set());
      onUpdate();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  async function handleSetCover(photoId: string) {
    try {
      const res = await fetch(`/api/competitions/${competitionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhotoId: photoId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Photo de couverture mise à jour");
      onUpdate();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function handleSetYearCover(photoId: string) {
    try {
      const res = await fetch(`/api/years/${yearId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhotoId: photoId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Vignette de l'année mise à jour");
      onUpdate();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  function toggleSelect(photoId: string) {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucune photo pour le moment</p>
        <p className="text-sm mt-1">Utilisez la zone ci-dessus pour ajouter des photos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      {selectedPhotos.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedPhotos.size} photo{selectedPhotos.size > 1 ? "s" : ""} sélectionnée{selectedPhotos.size > 1 ? "s" : ""}
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer {selectedPhotos.size} photo(s) ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Les photos seront définitivement supprimées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="sm" onClick={() => setSelectedPhotos(new Set())}>
            Désélectionner tout
          </Button>
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo) => {
          const isCover = photo.id === coverPhotoId;
          const isYearCover = photo.id === yearCoverPhotoId;
          const isSelected = selectedPhotos.has(photo.id);

          return (
            <div
              key={photo.id}
              className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer border-2 transition-colors ${
                isSelected
                  ? "border-purple-500"
                  : isYearCover
                    ? "border-blue-400"
                    : isCover
                      ? "border-yellow-400"
                      : "border-transparent"
              }`}
              onClick={() => toggleSelect(photo.id)}
            >
              <Image
                src={photo.thumbnailUrl}
                alt={photo.filename}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />

              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {isCover && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-medium">
                    <Star className="h-3 w-3" />
                    Cover
                  </div>
                )}
                {isYearCover && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium">
                    <ImageIcon className="h-3 w-3" />
                    Année
                  </div>
                )}
              </div>

              {/* Selection indicator — visible sur mobile */}
              <div
                className={`absolute top-2 right-2 h-5 w-5 rounded-full border-2 transition-colors ${
                  isSelected
                    ? "bg-purple-500 border-purple-500"
                    : "border-white/80 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                }`}
              >
                {isSelected && (
                  <svg className="h-full w-full text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Actions overlay — visible sur mobile */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white/20"
                    onClick={() => handleSetYearCover(photo.id)}
                    title={isYearCover ? "Vignette de l'année actuelle" : "Définir comme vignette de l'année"}
                  >
                    <ImageIcon className={`h-4 w-4 ${isYearCover ? "text-blue-400" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white/20"
                    onClick={() => handleSetCover(photo.id)}
                    title={isCover ? "Photo de couverture actuelle" : "Définir comme couverture"}
                  >
                    {isCover ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:bg-red-500/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(photo.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

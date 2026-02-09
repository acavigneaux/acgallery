"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface Photo {
  originalUrl: string;
  filename: string;
}

interface BulkDownloadProps {
  photos: Photo[];
  albumName: string;
}

export default function BulkDownload({ photos, albumName }: BulkDownloadProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleDownload() {
    if (photos.length === 0) return;
    setDownloading(true);
    setProgress(0);

    try {
      const { downloadZip } = await import("client-zip");
      const { saveAs } = await import("file-saver");

      const total = photos.length;
      let completed = 0;

      const files = await Promise.all(
        photos.map(async (photo) => {
          const response = await fetch(photo.originalUrl);
          const blob = await response.blob();
          completed++;
          setProgress(Math.round((completed / total) * 100));
          return {
            name: photo.filename,
            input: blob,
          };
        })
      );

      const zipBlob = await downloadZip(files).blob();
      saveAs(zipBlob, `${albumName}.zip`);
      toast.success("Téléchargement terminé !");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  }

  if (photos.length === 0) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={downloading}
    >
      <Download className="h-4 w-4 mr-1.5" />
      {downloading
        ? `Téléchargement ${progress}%`
        : `Tout télécharger (${photos.length})`}
    </Button>
  );
}

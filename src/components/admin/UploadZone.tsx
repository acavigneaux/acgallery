"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface UploadZoneProps {
  competitionId: string;
  existingFilenames: string[];
  onUploadComplete: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "uploaded" | "confirming" | "done" | "error";
  progress: number;
  key?: string;
  filename?: string;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function UploadZone({ competitionId, existingFilenames, onUploadComplete }: UploadZoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filtrer les doublons (déjà uploadés ou déjà dans la file d'attente)
    const pendingNames = files.map((f) => f.file.name);
    const duplicates: string[] = [];
    const unique = acceptedFiles.filter((file) => {
      const isDuplicate =
        existingFilenames.includes(file.name) || pendingNames.includes(file.name);
      if (isDuplicate) duplicates.push(file.name);
      return !isDuplicate;
    });

    if (duplicates.length > 0) {
      toast.warning(
        `${duplicates.length} doublon${duplicates.length > 1 ? "s" : ""} ignoré${duplicates.length > 1 ? "s" : ""} : ${duplicates.slice(0, 3).join(", ")}${duplicates.length > 3 ? "…" : ""}`
      );
    }

    if (unique.length === 0) return;

    const newFiles = unique.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, [files, existingFilenames]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    disabled: uploading,
  });

  function removeFile(index: number) {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }

  async function uploadFiles() {
    if (files.length === 0) return;
    setUploading(true);
    setOverallProgress(0);

    try {
      // Step 1: Get presigned URLs
      const fileInfos = files.map((f) => ({
        filename: f.file.name,
        contentType: f.file.type,
      }));

      const uploadRes = await fetch("/api/photos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId, files: fileInfos }),
      });

      if (!uploadRes.ok) throw new Error("Failed to get upload URLs");
      const uploadInfos = await uploadRes.json();

      // Step 2: Upload each file directly to R2
      const totalFiles = files.length;
      let completedUploads = 0;

      const uploadPromises = files.map(async (fileWithPreview, index) => {
        const info = uploadInfos[index];

        setFiles((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: "uploading" };
          return updated;
        });

        // Upload using fetch (no progress for individual files with fetch, but simpler)
        await fetch(info.presignedUrl, {
          method: "PUT",
          body: fileWithPreview.file,
          headers: { "Content-Type": fileWithPreview.file.type },
        });

        completedUploads++;
        const progress = Math.round((completedUploads / totalFiles) * 80);
        setOverallProgress(progress);

        setFiles((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            status: "uploaded",
            progress: 100,
            key: info.key,
            filename: info.filename,
          };
          return updated;
        });
      });

      await Promise.all(uploadPromises);

      // Step 3: Confirm uploads (generates thumbnails)
      setOverallProgress(85);
      setFiles((prev) => prev.map((f) => ({ ...f, status: "confirming" })));

      const dimensions = await Promise.all(
        files.map((f) => getImageDimensions(f.file))
      );

      const confirmData = files.map((f, i) => ({
        key: uploadInfos[i].key,
        filename: uploadInfos[i].filename,
        width: dimensions[i].width,
        height: dimensions[i].height,
        size: f.file.size,
      }));

      const confirmRes = await fetch("/api/photos/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId, uploadedFiles: confirmData }),
      });

      if (!confirmRes.ok) throw new Error("Failed to confirm uploads");

      setOverallProgress(100);
      setFiles((prev) => prev.map((f) => ({ ...f, status: "done" })));

      // Clear after a moment
      setTimeout(() => {
        files.forEach((f) => URL.revokeObjectURL(f.preview));
        setFiles([]);
        setOverallProgress(0);
        onUploadComplete();
      }, 1500);
    } catch (error) {
      console.error("Upload failed:", error);
      setFiles((prev) => prev.map((f) => (f.status !== "done" ? { ...f, status: "error" } : f)));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-purple-500 bg-purple-50"
            : uploading
              ? "border-slate-200 bg-slate-50 cursor-not-allowed"
              : "border-slate-300 hover:border-purple-400 hover:bg-slate-50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        {isDragActive ? (
          <p className="text-purple-600 font-medium">Déposez les photos ici...</p>
        ) : (
          <>
            <p className="font-medium">Glissez-déposez des photos ici</p>
            <p className="text-sm text-muted-foreground mt-1">
              ou cliquez pour sélectionner (JPEG, PNG, WebP)
            </p>
          </>
        )}
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                <Image
                  src={f.preview}
                  alt={f.file.name}
                  fill
                  className="object-cover"
                  sizes="150px"
                />
                {/* Status overlay */}
                {f.status === "done" && (
                  <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                )}
                {f.status === "error" && (
                  <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                )}
                {(f.status === "uploading" || f.status === "confirming") && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {/* Remove button */}
                {f.status === "pending" && !uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Upload progress & button */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={overallProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {overallProgress < 80
                  ? `Upload en cours... ${overallProgress}%`
                  : overallProgress < 100
                    ? "Génération des miniatures..."
                    : "Terminé !"}
              </p>
            </div>
          )}

          {!uploading && files.some((f) => f.status === "pending") && (
            <div className="flex gap-3">
              <Button onClick={uploadFiles}>
                <Upload className="h-4 w-4 mr-2" />
                Uploader {files.filter((f) => f.status === "pending").length} photo{files.filter((f) => f.status === "pending").length > 1 ? "s" : ""}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  files.forEach((f) => URL.revokeObjectURL(f.preview));
                  setFiles([]);
                }}
              >
                Tout annuler
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

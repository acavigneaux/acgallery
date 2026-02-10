import { toast } from "sonner";

function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Télécharge une photo :
 * - Mobile : Web Share API → "Enregistrer l'image" dans la photothèque
 * - Desktop : téléchargement direct du fichier
 */
export async function downloadPhoto(url: string, filename: string) {
  const toastId = toast.loading("Préparation du téléchargement…");

  try {
    const proxyUrl = `/api/photos/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Erreur réseau");
    const blob = await response.blob();

    // Mobile uniquement : Web Share API → accès à "Enregistrer l'image"
    if (isMobileDevice()) {
      // Sortir du plein écran si actif (bloque le Web Share API)
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }

      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        toast.dismiss(toastId);
        try {
          await navigator.share({ files: [file] });
          return;
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") return;
          // Fallback ci-dessous
        }
      }
    }

    // Desktop ou fallback : téléchargement direct via blob URL
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    toast.success("Photo téléchargée", { id: toastId });
  } catch {
    toast.error("Impossible de télécharger la photo", { id: toastId });
  }
}

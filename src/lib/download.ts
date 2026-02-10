import { toast } from "sonner";

/**
 * Télécharge une photo en utilisant le Web Share API sur mobile
 * (permet "Enregistrer dans la photothèque" sur iOS/Android)
 * avec fallback blob download sur desktop.
 */
export async function downloadPhoto(url: string, filename: string) {
  const toastId = toast.loading("Préparation du téléchargement…");

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erreur réseau");
    const blob = await response.blob();

    // Sur mobile : Web Share API avec fichier → accès à "Enregistrer l'image"
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      toast.dismiss(toastId);
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        // Fallback si le partage échoue
      }
    }

    // Fallback : téléchargement via blob URL
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

"use client";

import { Button } from "@/components/ui/button";
import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
  text?: string;
}

export default function ShareButtons({ title, text }: ShareButtonsProps) {
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  async function handleShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title,
        text: text || title,
        url: window.location.href,
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Erreur lors du partage");
      }
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCopyLink}>
        <Link2 className="h-4 w-4 mr-1.5" />
        Copier le lien
      </Button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-1.5" />
          Partager
        </Button>
      )}
    </div>
  );
}

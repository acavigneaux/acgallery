"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { ExternalLink, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import UploadZone from "@/components/admin/UploadZone";
import PhotoManager from "@/components/admin/PhotoManager";
import Link from "next/link";

interface Competition {
  id: string;
  name: string;
  slug: string;
  date: string;
  location: string | null;
  description: string | null;
  coverPhotoId: string | null;
  year: { id: string; year: number };
  photos: Array<{
    id: string;
    filename: string;
    thumbnailUrl: string;
    originalUrl: string;
    width: number;
    height: number;
    order: number;
  }>;
}

export default function AlbumManagementPage() {
  const params = useParams();
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    location: "",
    description: "",
  });

  async function fetchCompetition() {
    try {
      const res = await fetch(`/api/competitions/${params.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompetition(data);
      setForm({
        name: data.name,
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
        location: data.location || "",
        description: data.description || "",
      });
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCompetition();
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/competitions/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          date: form.date,
          location: form.location || null,
          description: form.description || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Compétition mise à jour");
      fetchCompetition();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/competitions/${params.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Compétition supprimée");
      router.push("/admin");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!competition) {
    return <p className="text-muted-foreground">Compétition introuvable</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{competition.name}</h1>
          <p className="text-muted-foreground">
            {competition.year.year} · {competition.photos.length} photo{competition.photos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/${competition.year.year}/${competition.slug}`}
          target="_blank"
          className="inline-flex"
        >
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir sur le site
          </Button>
        </Link>
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer la compétition
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer {competition.name} ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Toutes les photos seront définitivement supprimées. Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Upload zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ajouter des photos</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadZone
            competitionId={competition.id}
            onUploadComplete={fetchCompetition}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Photo manager */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Photos ({competition.photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoManager
            photos={competition.photos}
            coverPhotoId={competition.coverPhotoId}
            competitionId={competition.id}
            onUpdate={fetchCompetition}
          />
        </CardContent>
      </Card>
    </div>
  );
}

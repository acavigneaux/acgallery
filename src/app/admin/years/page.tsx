"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PlusCircle, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Year {
  id: string;
  year: number;
  competitionCount: number;
  photoCount: number;
}

export default function AdminYearsPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function fetchYears() {
    try {
      const res = await fetch("/api/years");
      const data = await res.json();
      setYears(data);
    } catch {
      toast.error("Erreur lors du chargement des années");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchYears();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: parseInt(newYear) }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la création");
        return;
      }
      toast.success(`Année ${newYear} créée`);
      setNewYear(new Date().getFullYear().toString());
      fetchYears();
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, year: number) {
    try {
      const res = await fetch(`/api/years/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`Année ${year} supprimée`);
      fetchYears();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestion des années</h1>

      {/* Create new year */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ajouter une année</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-3">
            <Input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              placeholder="2024"
              className="w-32"
              min={2000}
              max={2100}
            />
            <Button type="submit" disabled={creating}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {creating ? "Création..." : "Ajouter"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Years list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Années existantes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : years.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Aucune année créée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {years.map((y) => (
                <div
                  key={y.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="text-lg font-semibold">{y.year}</p>
                    <p className="text-sm text-muted-foreground">
                      {y.competitionCount} compétition{y.competitionCount !== 1 ? "s" : ""} · {y.photoCount} photo{y.photoCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer {y.year} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cela supprimera toutes les compétitions et photos de cette année. Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(y.id, y.year)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Year {
  id: string;
  year: number;
}

export default function NewCompetitionPage() {
  const router = useRouter();
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    location: "",
    description: "",
    yearId: "",
    newYear: "",
  });

  useEffect(() => {
    fetch("/api/years")
      .then((res) => res.json())
      .then(setYears)
      .catch(() => toast.error("Erreur lors du chargement des années"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let yearId = form.yearId;

      // Create new year if needed
      if (form.yearId === "new" && form.newYear) {
        const yearRes = await fetch("/api/years", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year: parseInt(form.newYear) }),
        });
        if (!yearRes.ok) {
          const data = await yearRes.json();
          toast.error(data.error || "Erreur lors de la création de l'année");
          return;
        }
        const newYearData = await yearRes.json();
        yearId = newYearData.id;
      }

      if (!yearId || yearId === "new") {
        toast.error("Sélectionnez une année");
        return;
      }

      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          date: form.date,
          location: form.location || null,
          description: form.description || null,
          yearId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la création");
        return;
      }

      const competition = await res.json();
      toast.success("Compétition créée !");
      router.push(`/admin/albums/${competition.id}`);
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nouvelle compétition</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la compétition *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Championnat régional"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Année *</Label>
                <select
                  id="year"
                  value={form.yearId}
                  onChange={(e) => setForm({ ...form, yearId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.year}
                    </option>
                  ))}
                  <option value="new">+ Nouvelle année</option>
                </select>
              </div>
            </div>

            {form.yearId === "new" && (
              <div className="space-y-2">
                <Label htmlFor="newYear">Nouvelle année</Label>
                <Input
                  id="newYear"
                  type="number"
                  value={form.newYear}
                  onChange={(e) => setForm({ ...form, newYear: e.target.value })}
                  placeholder="2024"
                  min={2000}
                  max={2100}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Gymnase Jean Moulin, Lyon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Détails de la compétition..."
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer la compétition"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

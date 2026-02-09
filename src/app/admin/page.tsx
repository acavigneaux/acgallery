"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Image, Trophy, PlusCircle } from "lucide-react";

interface Stats {
  years: number;
  competitions: number;
  photos: number;
}

interface Competition {
  id: string;
  name: string;
  date: string;
  photoCount: number;
  coverUrl: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ years: 0, competitions: 0, photos: 0 });
  const [recentCompetitions, setRecentCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [yearsRes, compsRes] = await Promise.all([
          fetch("/api/years"),
          fetch("/api/competitions"),
        ]);
        const yearsData = await yearsRes.json();
        const compsData = await compsRes.json();

        const totalPhotos = compsData.reduce(
          (acc: number, c: any) => acc + (c.photoCount || 0),
          0
        );

        setStats({
          years: yearsData.length,
          competitions: compsData.length,
          photos: totalPhotos,
        });

        setRecentCompetitions(compsData.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { label: "Années", value: stats.years, icon: Calendar, color: "text-blue-600 bg-blue-50" },
    { label: "Compétitions", value: stats.competitions, icon: Trophy, color: "text-purple-600 bg-purple-50" },
    { label: "Photos", value: stats.photos, icon: Image, color: "text-pink-600 bg-pink-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/admin/competitions/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvelle compétition
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {loading ? "—" : stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent competitions */}
      <Card>
        <CardHeader>
          <CardTitle>Compétitions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : recentCompetitions.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Aucune compétition pour le moment</p>
              <Link href="/admin/competitions/new">
                <Button variant="outline" className="mt-3">
                  Créer la première
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCompetitions.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/admin/albums/${comp.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{comp.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(comp.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Image className="h-4 w-4" />
                    {comp.photoCount}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

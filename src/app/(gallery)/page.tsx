import { db } from "@/lib/db";
import { years, competitions, photos } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Camera, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

async function getYears() {
  const result = await db
    .select({
      id: years.id,
      year: years.year,
      competitionCount: count(competitions.id),
    })
    .from(years)
    .leftJoin(competitions, eq(competitions.yearId, years.id))
    .groupBy(years.id)
    .orderBy(desc(years.year));

  const withCovers = await Promise.all(
    result.map(async (y) => {
      const coverPhoto = await db
        .select({ thumbnailUrl: photos.thumbnailUrl })
        .from(photos)
        .innerJoin(competitions, eq(photos.competitionId, competitions.id))
        .where(eq(competitions.yearId, y.id))
        .orderBy(competitions.order, photos.order)
        .limit(1);

      return { ...y, coverUrl: coverPhoto[0]?.thumbnailUrl || null };
    })
  );

  return withCovers;
}

export default async function HomePage() {
  const yearsData = await getYears();

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">
      {/* Hero */}
      <div className="text-center mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium mb-4">
          <Camera className="h-4 w-4" />
          Galerie Gymnastique
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
          ACgallery
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Retrouvez toutes les photos de compétitions de gymnastique
        </p>
      </div>

      {/* Years grid */}
      {yearsData.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-lg">
            Aucune photo pour le moment
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Les photos des prochaines compétitions arriveront bientôt !
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {yearsData.map((y, index) => (
            <Link
              key={y.id}
              href={`/${y.year}`}
              className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[4/3] relative bg-slate-100">
                {y.coverUrl ? (
                  <Image
                    src={y.coverUrl}
                    alt={`Saison ${y.year}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Camera className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h2 className="text-3xl font-bold">{y.year}</h2>
                <p className="text-white/80 text-sm mt-1">
                  {y.competitionCount} compétition{y.competitionCount !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

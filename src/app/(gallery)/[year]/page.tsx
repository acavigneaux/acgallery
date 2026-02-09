import { db } from "@/lib/db";
import { years, competitions, photos } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Calendar, MapPin, Camera } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `Saison ${year}`,
    description: `Photos des compétitions de gymnastique - Saison ${year}`,
  };
}

async function getYearData(yearNumber: number) {
  const [yearRecord] = await db
    .select()
    .from(years)
    .where(eq(years.year, yearNumber));

  if (!yearRecord) return null;

  const comps = await db
    .select({
      id: competitions.id,
      name: competitions.name,
      slug: competitions.slug,
      date: competitions.date,
      location: competitions.location,
      coverPhotoId: competitions.coverPhotoId,
      order: competitions.order,
      photoCount: count(photos.id),
    })
    .from(competitions)
    .leftJoin(photos, eq(photos.competitionId, competitions.id))
    .where(eq(competitions.yearId, yearRecord.id))
    .groupBy(competitions.id)
    .orderBy(desc(competitions.date));

  const withCovers = await Promise.all(
    comps.map(async (comp) => {
      let coverUrl: string | null = null;
      if (comp.coverPhotoId) {
        const [cover] = await db
          .select({ thumbnailUrl: photos.thumbnailUrl })
          .from(photos)
          .where(eq(photos.id, comp.coverPhotoId));
        coverUrl = cover?.thumbnailUrl || null;
      }
      if (!coverUrl) {
        const [firstPhoto] = await db
          .select({ thumbnailUrl: photos.thumbnailUrl })
          .from(photos)
          .where(eq(photos.competitionId, comp.id))
          .orderBy(photos.order)
          .limit(1);
        coverUrl = firstPhoto?.thumbnailUrl || null;
      }
      return { ...comp, coverUrl };
    })
  );

  return { year: yearRecord, competitions: withCovers };
}

export default async function YearPage({ params }: PageProps) {
  const { year } = await params;
  const yearNumber = parseInt(year);
  if (isNaN(yearNumber)) notFound();

  const data = await getYearData(yearNumber);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <Breadcrumbs items={[{ label: `${yearNumber}` }]} />

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Saison {yearNumber}</h1>
        <p className="text-muted-foreground mt-1">
          {data.competitions.length} compétition{data.competitions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {data.competitions.length === 0 ? (
        <div className="text-center py-20">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground">Aucune compétition pour cette année</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.competitions.map((comp) => (
            <Link
              key={comp.id}
              href={`/${yearNumber}/${comp.slug}`}
              className="group overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[16/10] relative bg-slate-100">
                {comp.coverUrl ? (
                  <Image
                    src={comp.coverUrl}
                    alt={comp.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Camera className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-lg group-hover:text-purple-700 transition-colors">
                  {comp.name}
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(comp.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  {comp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {comp.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" />
                    {comp.photoCount} photo{comp.photoCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

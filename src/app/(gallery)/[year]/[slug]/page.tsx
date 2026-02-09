import { db } from "@/lib/db";
import { years, competitions, photos } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PhotoGrid from "@/components/gallery/PhotoGrid";
import ShareButtons from "@/components/gallery/ShareButtons";
import BulkDownload from "@/components/gallery/BulkDownload";
import { Calendar, MapPin, Image as ImageIcon } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ year: string; slug: string }>;
}

async function getCompetitionData(yearNumber: number, slug: string) {
  const [yearRecord] = await db
    .select()
    .from(years)
    .where(eq(years.year, yearNumber));

  if (!yearRecord) return null;

  const [competition] = await db
    .select()
    .from(competitions)
    .where(
      and(
        eq(competitions.yearId, yearRecord.id),
        eq(competitions.slug, slug)
      )
    );

  if (!competition) return null;

  const competitionPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.competitionId, competition.id))
    .orderBy(asc(photos.order), asc(photos.createdAt));

  return {
    year: yearRecord,
    competition,
    photos: competitionPhotos,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, slug } = await params;
  const yearNumber = parseInt(year);
  if (isNaN(yearNumber)) return {};

  const data = await getCompetitionData(yearNumber, slug);
  if (!data) return {};

  const coverPhoto = data.photos[0];

  return {
    title: `${data.competition.name} - ${yearNumber}`,
    description: data.competition.description || `Photos de ${data.competition.name}`,
    openGraph: {
      title: `${data.competition.name} - ${yearNumber}`,
      description: data.competition.description || `Photos de ${data.competition.name}`,
      images: coverPhoto ? [{ url: coverPhoto.originalUrl }] : [],
    },
  };
}

export default async function CompetitionPage({ params }: PageProps) {
  const { year, slug } = await params;
  const yearNumber = parseInt(year);
  if (isNaN(yearNumber)) notFound();

  const data = await getCompetitionData(yearNumber, slug);
  if (!data) notFound();

  const { competition, photos: competitionPhotos } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <Breadcrumbs
        items={[
          { label: `${yearNumber}`, href: `/${yearNumber}` },
          { label: competition.name },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">
          {competition.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(competition.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          {competition.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {competition.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4" />
            {competitionPhotos.length} photo{competitionPhotos.length !== 1 ? "s" : ""}
          </span>
        </div>
        {competition.description && (
          <p className="mt-3 text-muted-foreground max-w-2xl">
            {competition.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <ShareButtons title={`${competition.name} - ${yearNumber}`} />
        <BulkDownload photos={competitionPhotos} albumName={competition.slug} />
      </div>

      {/* Photo grid */}
      {competitionPhotos.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-lg">
            Aucune photo pour le moment
          </p>
        </div>
      ) : (
        <PhotoGrid photos={competitionPhotos} />
      )}
    </div>
  );
}

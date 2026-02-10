import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { years, competitions, photos } from "@/lib/db/schema";
import { desc, eq, count, sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({
        id: years.id,
        year: years.year,
        coverPhotoId: years.coverPhotoId,
        createdAt: years.createdAt,
        competitionCount: count(competitions.id),
        photoCount: count(photos.id),
      })
      .from(years)
      .leftJoin(competitions, eq(competitions.yearId, years.id))
      .leftJoin(photos, eq(photos.competitionId, competitions.id))
      .groupBy(years.id)
      .orderBy(desc(years.year));

    const yearsWithCovers = await Promise.all(
      result.map(async (y) => {
        // Si une vignette est choisie manuellement, l'utiliser
        if (y.coverPhotoId) {
          const chosen = await db
            .select({ thumbnailUrl: photos.thumbnailUrl })
            .from(photos)
            .where(eq(photos.id, y.coverPhotoId))
            .limit(1);
          if (chosen[0]) {
            return { ...y, coverUrl: chosen[0].thumbnailUrl };
          }
        }

        // Fallback : 1ère photo de la 1ère compétition
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

    return NextResponse.json(yearsWithCovers);
  } catch (error) {
    console.error("Failed to fetch years:", error);
    return NextResponse.json({ error: "Failed to fetch years" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { year } = await request.json();

    if (!year || typeof year !== "number") {
      return NextResponse.json({ error: "Year is required and must be a number" }, { status: 400 });
    }

    const [newYear] = await db.insert(years).values({ year }).returning();
    return NextResponse.json(newYear, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Year already exists" }, { status: 409 });
    }
    console.error("Failed to create year:", error);
    return NextResponse.json({ error: "Failed to create year" }, { status: 500 });
  }
}

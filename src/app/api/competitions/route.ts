import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitions, photos, years } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import slugify from "slugify";

export async function GET(request: NextRequest) {
  try {
    const yearId = request.nextUrl.searchParams.get("yearId");

    const query = db
      .select({
        id: competitions.id,
        name: competitions.name,
        slug: competitions.slug,
        date: competitions.date,
        location: competitions.location,
        description: competitions.description,
        coverPhotoId: competitions.coverPhotoId,
        yearId: competitions.yearId,
        order: competitions.order,
        createdAt: competitions.createdAt,
        photoCount: count(photos.id),
      })
      .from(competitions)
      .leftJoin(photos, eq(photos.competitionId, competitions.id))
      .groupBy(competitions.id)
      .orderBy(desc(competitions.date));

    const result = yearId
      ? await query.where(eq(competitions.yearId, yearId))
      : await query;

    // Get cover photo URLs
    const withCovers = await Promise.all(
      result.map(async (comp) => {
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

    return NextResponse.json(withCovers);
  } catch (error) {
    console.error("Failed to fetch competitions:", error);
    return NextResponse.json({ error: "Failed to fetch competitions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, location, description, yearId } = body;

    if (!name || !date || !yearId) {
      return NextResponse.json(
        { error: "Name, date, and yearId are required" },
        { status: 400 }
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const [newCompetition] = await db
      .insert(competitions)
      .values({
        name,
        slug,
        date: new Date(date),
        location: location || null,
        description: description || null,
        yearId,
      })
      .returning();

    return NextResponse.json(newCompetition, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "A competition with this name already exists for this year" },
        { status: 409 }
      );
    }
    console.error("Failed to create competition:", error);
    return NextResponse.json({ error: "Failed to create competition" }, { status: 500 });
  }
}

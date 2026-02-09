import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitions, photos, years } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFolder } from "@/lib/r2";
import slugify from "slugify";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const competition = await db.query.competitions.findFirst({
      where: eq(competitions.id, id),
      with: {
        year: true,
        photos: {
          orderBy: (photos, { asc }) => [asc(photos.order), asc(photos.createdAt)],
        },
      },
    });

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    return NextResponse.json(competition);
  } catch (error) {
    console.error("Failed to fetch competition:", error);
    return NextResponse.json({ error: "Failed to fetch competition" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) {
      updateData.name = body.name;
      updateData.slug = slugify(body.name, { lower: true, strict: true });
    }
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.location !== undefined) updateData.location = body.location;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.coverPhotoId !== undefined) updateData.coverPhotoId = body.coverPhotoId;
    if (body.order !== undefined) updateData.order = body.order;

    const [updated] = await db
      .update(competitions)
      .set(updateData)
      .where(eq(competitions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update competition" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const competition = await db.query.competitions.findFirst({
      where: eq(competitions.id, id),
      with: { year: true },
    });

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    // Delete R2 objects
    await deleteFolder(`photos/${competition.year.year}/${competition.slug}/`);

    // Delete from DB (cascades to photos)
    await db.delete(competitions).where(eq(competitions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete competition:", error);
    return NextResponse.json({ error: "Failed to delete competition" }, { status: 500 });
  }
}

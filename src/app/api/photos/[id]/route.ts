import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, competitions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteObject } from "@/lib/r2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const photo = await db.query.photos.findFirst({
      where: eq(photos.id, id),
      with: { competition: true },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch {
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
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
    if (body.order !== undefined) updateData.order = body.order;

    const [updated] = await db
      .update(photos)
      .set(updateData)
      .where(eq(photos.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const photo = await db.query.photos.findFirst({
      where: eq(photos.id, id),
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Extract R2 keys from URLs
    const publicUrl = process.env.R2_PUBLIC_URL!;
    const originalKey = photo.originalUrl.replace(`${publicUrl}/`, "");
    const thumbnailKey = photo.thumbnailUrl.replace(`${publicUrl}/`, "");

    // Delete from R2
    await Promise.all([deleteObject(originalKey), deleteObject(thumbnailKey)]);

    // If this photo was a cover, clear the cover
    await db
      .update(competitions)
      .set({ coverPhotoId: null, updatedAt: new Date() })
      .where(eq(competitions.coverPhotoId, id));

    // Delete from DB
    await db.delete(photos).where(eq(photos.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete photo:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}

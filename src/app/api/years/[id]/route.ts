import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { years, competitions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFolder } from "@/lib/r2";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(years)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(years.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update year" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the year to know the folder prefix
    const [year] = await db.select().from(years).where(eq(years.id, id));
    if (!year) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    // Delete all R2 objects for this year
    await deleteFolder(`photos/${year.year}/`);

    // Delete from DB (cascades to competitions and photos)
    await db.delete(years).where(eq(years.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete year:", error);
    return NextResponse.json({ error: "Failed to delete year" }, { status: 500 });
  }
}

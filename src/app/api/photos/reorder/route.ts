import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "items array is required with { id, order } objects" },
        { status: 400 }
      );
    }

    await Promise.all(
      items.map(({ id, order }: { id: string; order: number }) =>
        db
          .update(photos)
          .set({ order, updatedAt: new Date() })
          .where(eq(photos.id, id))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder photos:", error);
    return NextResponse.json({ error: "Failed to reorder photos" }, { status: 500 });
  }
}

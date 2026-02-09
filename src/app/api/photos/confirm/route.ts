import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, competitions } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { uploadBuffer, getPublicUrl, getR2Key } from "@/lib/r2";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const { competitionId, uploadedFiles } = await request.json();

    if (!competitionId || !uploadedFiles || !Array.isArray(uploadedFiles)) {
      return NextResponse.json(
        { error: "competitionId and uploadedFiles are required" },
        { status: 400 }
      );
    }

    const competition = await db.query.competitions.findFirst({
      where: eq(competitions.id, competitionId),
      with: { year: true },
    });

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    // Get current photo count for ordering
    const [{ value: existingCount }] = await db
      .select({ value: count() })
      .from(photos)
      .where(eq(photos.competitionId, competitionId));

    const createdPhotos = await Promise.all(
      uploadedFiles.map(
        async (
          file: {
            key: string;
            filename: string;
            width: number;
            height: number;
            size: number;
          },
          index: number
        ) => {
          // Fetch original from R2 and generate thumbnail
          const originalUrl = getPublicUrl(file.key);
          const response = await fetch(originalUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const thumbnailBuffer = await sharp(buffer)
            .resize(400, null, { withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

          const thumbnailKey = getR2Key(
            competition.year.year,
            competition.slug,
            "thumbnails",
            `${file.filename}.webp`
          );

          const thumbnailUrl = await uploadBuffer(
            thumbnailKey,
            thumbnailBuffer,
            "image/webp"
          );

          const [newPhoto] = await db
            .insert(photos)
            .values({
              filename: file.filename,
              originalUrl,
              thumbnailUrl,
              width: file.width,
              height: file.height,
              size: file.size,
              competitionId,
              order: existingCount + index,
            })
            .returning();

          return newPhoto;
        }
      )
    );

    // If this is the first upload and no cover is set, set the first photo as cover
    if (!competition.coverPhotoId && createdPhotos.length > 0) {
      await db
        .update(competitions)
        .set({ coverPhotoId: createdPhotos[0].id, updatedAt: new Date() })
        .where(eq(competitions.id, competitionId));
    }

    return NextResponse.json(createdPhotos, { status: 201 });
  } catch (error) {
    console.error("Failed to confirm photos:", error);
    return NextResponse.json({ error: "Failed to confirm photos" }, { status: 500 });
  }
}

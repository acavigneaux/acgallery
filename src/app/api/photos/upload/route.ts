import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateUploadUrl, getR2Key } from "@/lib/r2";
import { createId } from "@paralleldrive/cuid2";

export async function POST(request: NextRequest) {
  try {
    const { competitionId, files } = await request.json();

    if (!competitionId || !files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "competitionId and files array are required" },
        { status: 400 }
      );
    }

    // Get competition with year info
    const competition = await db.query.competitions.findFirst({
      where: eq(competitions.id, competitionId),
      with: { year: true },
    });

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    const uploadInfos = await Promise.all(
      files.map(async (file: { filename: string; contentType: string }) => {
        const uniqueFilename = `${createId()}_${file.filename}`;
        const key = getR2Key(
          competition.year.year,
          competition.slug,
          "originals",
          uniqueFilename
        );
        const thumbnailKey = getR2Key(
          competition.year.year,
          competition.slug,
          "thumbnails",
          `${uniqueFilename}.webp`
        );

        const presignedUrl = await generateUploadUrl(key, file.contentType);

        return {
          presignedUrl,
          key,
          thumbnailKey,
          filename: uniqueFilename,
          originalFilename: file.filename,
        };
      })
    );

    return NextResponse.json(uploadInfos);
  } catch (error) {
    console.error("Failed to generate upload URLs:", error);
    return NextResponse.json({ error: "Failed to generate upload URLs" }, { status: 500 });
  }
}

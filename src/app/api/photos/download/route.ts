import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") || "photo.jpg";

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Valider que l'URL vient bien de notre bucket R2
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || !url.startsWith(publicUrl)) {
    return NextResponse.json({ error: "URL non autorisée" }, { status: 403 });
  }

  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
  }

  const blob = await response.blob();
  return new NextResponse(blob, {
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function generateUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await r2Client.send(command);
  return getPublicUrl(key);
}

export async function deleteObject(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function deleteFolder(prefix: string): Promise<void> {
  const listCommand = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix });
  const listed = await r2Client.send(listCommand);

  if (!listed.Contents || listed.Contents.length === 0) return;

  const objects = listed.Contents.map((obj) => ({ Key: obj.Key! }));
  await r2Client.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: objects },
    })
  );
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

export function getR2Key(yearNumber: number, competitionSlug: string, type: "originals" | "thumbnails", filename: string): string {
  return `photos/${yearNumber}/${competitionSlug}/${type}/${filename}`;
}

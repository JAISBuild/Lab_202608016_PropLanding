import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export function getUploadRoot(): string {
  return UPLOAD_ROOT;
}

export async function ensureUploadDir(orgId: string): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, orgId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function buildStorageKey(orgId: string, fileName: string): string {
  const ext = path.extname(fileName);
  return `${orgId}/${randomUUID()}${ext}`;
}

export async function saveFile(
  orgId: string,
  fileName: string,
  data: Buffer,
): Promise<string> {
  const storageKey = buildStorageKey(orgId, fileName);
  const fullPath = path.join(UPLOAD_ROOT, storageKey);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, data);
  return storageKey;
}

export function resolveFilePath(storageKey: string): string {
  return path.join(UPLOAD_ROOT, storageKey);
}

export function fileExists(storageKey: string): boolean {
  return existsSync(resolveFilePath(storageKey));
}

export function createFileReadStream(storageKey: string) {
  return createReadStream(resolveFilePath(storageKey));
}

export function getPublicMediaUrl(mediaId: string): string {
  const base = process.env.API_PUBLIC_URL ?? "http://localhost:4000";
  return `${base}/api/v1/media/${mediaId}/file`;
}

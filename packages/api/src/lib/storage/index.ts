import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";
import type { StorageProvider } from "./types";

export type ImageVariants = {
  original: string;
  large?: string;
  medium?: string;
  thumb?: string;
  width?: number;
  height?: number;
};

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!provider) {
    const driver = process.env.STORAGE_DRIVER ?? "local";
    if (driver === "s3") {
      provider = new S3StorageProvider();
    } else {
      provider = new LocalStorageProvider();
    }
  }
  return provider;
}

export function buildStorageKey(orgId: string, fileName: string, suffix = ""): string {
  const ext = path.extname(fileName);
  const base = `${orgId}/${randomUUID()}${suffix}${ext}`;
  return base;
}

export function getPublicMediaUrl(mediaId: string, storageKey?: string): string {
  const cdn = process.env.CDN_URL || process.env.S3_PUBLIC_URL;
  const storage = getStorageProvider();
  if (cdn && storageKey) {
    return storage.getPublicUrl?.(storageKey) ?? `${cdn}/${storageKey}`;
  }
  const base = process.env.API_PUBLIC_URL ?? "http://localhost:4000";
  return `${base}/api/v1/media/${mediaId}/file`;
}

export function resolveVariantUrl(
  mediaId: string,
  storageKey: string,
  variants: ImageVariants | null,
  size: "thumb" | "medium" | "large" | "original" = "original",
): string {
  const key =
    size === "original"
      ? storageKey
      : variants?.[size] ?? storageKey;
  const cdn = process.env.CDN_URL || process.env.S3_PUBLIC_URL;
  const storage = getStorageProvider();
  if (cdn || process.env.STORAGE_DRIVER === "s3") {
    const url = storage.getPublicUrl?.(key);
    if (url) return url;
  }
  return `${process.env.API_PUBLIC_URL ?? "http://localhost:4000"}/api/v1/media/${mediaId}/file?variant=${size}`;
}

export async function saveFile(
  orgId: string,
  fileName: string,
  data: Buffer,
  mimeType: string,
): Promise<{ storageKey: string; variants: ImageVariants | null; width?: number; height?: number }> {
  const storage = getStorageProvider();
  const storageKey = buildStorageKey(orgId, fileName);

  if (mimeType.startsWith("image/")) {
    return saveImageWithVariants(orgId, fileName, data, mimeType, storage);
  }

  await storage.save(storageKey, data, mimeType);
  return { storageKey, variants: null };
}

async function saveImageWithVariants(
  orgId: string,
  fileName: string,
  data: Buffer,
  mimeType: string,
  storage: StorageProvider,
): Promise<{ storageKey: string; variants: ImageVariants; width: number; height: number }> {
  const image = sharp(data);
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const storageKey = buildStorageKey(orgId, fileName);
  const variants: ImageVariants = { original: storageKey };

  const sizes = [
    { name: "large" as const, width: 1600 },
    { name: "medium" as const, width: 800 },
    { name: "thumb" as const, width: 400 },
  ];

  await storage.save(storageKey, data, mimeType);

  for (const { name, width: w } of sizes) {
    if (width <= w && name !== "thumb") continue;
    const resized = await sharp(data)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const variantKey = buildStorageKey(orgId, fileName.replace(/\.[^.]+$/, `.${name}.webp`));
    await storage.save(variantKey, resized, "image/webp");
    variants[name] = variantKey;
  }

  return { storageKey, variants, width, height };
}

export async function fileExists(storageKey: string): Promise<boolean> {
  return getStorageProvider().exists(storageKey);
}

export async function readFile(storageKey: string): Promise<Buffer> {
  return getStorageProvider().read(storageKey);
}

export function createFileReadStream(storageKey: string): NodeJS.ReadableStream {
  const storage = getStorageProvider();
  if (storage instanceof LocalStorageProvider) {
    return storage.createReadStream(storageKey);
  }
  throw new Error("Stream only supported for local storage");
}

export async function getSignedUploadUrl(
  orgId: string,
  fileName: string,
  contentType: string,
): Promise<{ uploadUrl: string; storageKey: string } | null> {
  const storage = getStorageProvider();
  if (!(storage instanceof S3StorageProvider)) return null;
  const storageKey = buildStorageKey(orgId, fileName);
  const uploadUrl = await storage.getSignedUploadUrl!(storageKey, contentType);
  return { uploadUrl, storageKey };
}

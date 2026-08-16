import { Hono } from "hono";
import { prisma } from "@proplanding/database";
import { requireAuth } from "../../middleware/auth";
import {
  saveFile,
  createFileReadStream,
  fileExists,
  getPublicMediaUrl,
  getSignedUploadUrl,
  getStorageProvider,
} from "../../lib/storage";
import { S3StorageProvider } from "../../lib/storage/s3";
import { getDefaultOrgId } from "../../services/campaigns";
import type { ApiEnv } from "../../types";
import type { ImageVariants } from "../../lib/storage/types";

const media = new Hono<ApiEnv>();

async function resolveAssetKey(
  asset: { storageKey: string; variants: unknown },
  variant?: string | null,
): Promise<string> {
  if (!variant || variant === "original") return asset.storageKey;
  const variants = asset.variants as ImageVariants | null;
  if (variants && variant in variants && variants[variant as keyof ImageVariants]) {
    return variants[variant as keyof ImageVariants] as string;
  }
  return asset.storageKey;
}

media.get("/:id/file", async (c) => {
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: c.req.param("id"), deletedAt: null },
  });
  if (!asset) return c.json({ error: "Not found" }, 404);

  const variant = c.req.query("variant");
  const key = await resolveAssetKey(asset, variant);

  const storage = getStorageProvider();
  if (storage instanceof S3StorageProvider) {
    const url = storage.getPublicUrl(key);
    return c.redirect(url, 302);
  }

  if (!(await fileExists(key))) {
    return c.json({ error: "Not found" }, 404);
  }

  const stream = createFileReadStream(key);
  const cacheControl = "public, max-age=86400, stale-while-revalidate=604800";
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": variant && variant !== "original" ? "image/webp" : asset.mimeType,
      "Cache-Control": cacheControl,
    },
  });
});

media.use("/upload", requireAuth);

media.post("/upload", async (c) => {
  const auth = c.get("auth");
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || typeof file === "string") {
    return c.json({ error: "file required" }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const { storageKey, variants, width, height } = await saveFile(
    auth.orgId,
    file.name,
    buffer,
    mimeType,
  );

  const asset = await prisma.mediaAsset.create({
    data: {
      organizationId: auth.orgId,
      storageKey,
      mimeType,
      fileName: file.name,
      fileSize: buffer.length,
      width: width ?? undefined,
      height: height ?? undefined,
      variants: variants ?? undefined,
      altText: typeof body["altText"] === "string" ? body["altText"] : undefined,
    },
  });

  return c.json(
    {
      data: {
        ...asset,
        url: getPublicMediaUrl(asset.id, storageKey),
        variants,
      },
    },
    201,
  );
});

media.get("/upload-url", requireAuth, async (c) => {
  const auth = c.get("auth");
  const fileName = c.req.query("fileName");
  const contentType = c.req.query("contentType") ?? "image/jpeg";
  if (!fileName) return c.json({ error: "fileName required" }, 400);

  const signed = await getSignedUploadUrl(auth.orgId, fileName, contentType);
  if (!signed) {
    return c.json({ error: "Signed upload only available with S3 storage" }, 400);
  }
  return c.json({ data: signed });
});

media.post("/upload/public", async (c) => {
  const orgId = await getDefaultOrgId();
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || typeof file === "string") {
    return c.json({ error: "file required" }, 400);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const { storageKey, variants, width, height } = await saveFile(orgId, file.name, buffer, mimeType);
  const asset = await prisma.mediaAsset.create({
    data: {
      organizationId: orgId,
      storageKey,
      mimeType,
      fileName: file.name,
      fileSize: buffer.length,
      width: width ?? undefined,
      height: height ?? undefined,
      variants: variants ?? undefined,
    },
  });
  return c.json({ data: { ...asset, url: getPublicMediaUrl(asset.id, storageKey) } }, 201);
});

export default media;

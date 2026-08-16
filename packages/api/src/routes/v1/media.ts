import { Hono } from "hono";
import { prisma } from "@proplanding/database";
import { requireAuth } from "../../middleware/auth";
import { saveFile, createFileReadStream, fileExists, getPublicMediaUrl } from "../../lib/storage";
import { getDefaultOrgId } from "../../services/campaigns";

import type { ApiEnv } from "../../types";

const media = new Hono<ApiEnv>();

media.get("/:id/file", async (c) => {
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: c.req.param("id"), deletedAt: null },
  });
  if (!asset || !fileExists(asset.storageKey)) {
    return c.json({ error: "Not found" }, 404);
  }
  const stream = createFileReadStream(asset.storageKey);
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "public, max-age=86400",
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
  const storageKey = await saveFile(auth.orgId, file.name, buffer);

  const asset = await prisma.mediaAsset.create({
    data: {
      organizationId: auth.orgId,
      storageKey,
      mimeType: file.type || "application/octet-stream",
      fileName: file.name,
      fileSize: buffer.length,
      altText: typeof body["altText"] === "string" ? body["altText"] : undefined,
    },
  });

  return c.json({
    data: {
      ...asset,
      url: getPublicMediaUrl(asset.id),
    },
  }, 201);
});

media.post("/upload/public", async (c) => {
  const orgId = await getDefaultOrgId();
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || typeof file === "string") {
    return c.json({ error: "file required" }, 400);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveFile(orgId, file.name, buffer);
  const asset = await prisma.mediaAsset.create({
    data: {
      organizationId: orgId,
      storageKey,
      mimeType: file.type || "application/octet-stream",
      fileName: file.name,
      fileSize: buffer.length,
    },
  });
  return c.json({ data: { ...asset, url: getPublicMediaUrl(asset.id) } }, 201);
});

export default media;

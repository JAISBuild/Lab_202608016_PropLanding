import { prisma } from "@proplanding/database";
import { getPublicMediaUrl, resolveVariantUrl } from "../lib/storage";
import type { ImageVariants } from "../lib/storage/types";

export async function listMedia(orgId: string, limit = 50) {
  const items = await prisma.mediaAsset.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return items.map(formatMediaAsset);
}

export function formatMediaAsset(asset: {
  id: string;
  storageKey: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  altText: string | null;
  width: number | null;
  height: number | null;
  variants: unknown;
  createdAt: Date;
}) {
  const variants = asset.variants as ImageVariants | null;
  return {
    id: asset.id,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    altText: asset.altText,
    width: asset.width,
    height: asset.height,
    url: getPublicMediaUrl(asset.id, asset.storageKey),
    thumbUrl: resolveVariantUrl(asset.id, asset.storageKey, variants, "thumb"),
    mediumUrl: resolveVariantUrl(asset.id, asset.storageKey, variants, "medium"),
    largeUrl: resolveVariantUrl(asset.id, asset.storageKey, variants, "large"),
    createdAt: asset.createdAt,
  };
}

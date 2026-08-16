import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";

const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;

let client: CloudFrontClient | null = null;

function getClient(): CloudFrontClient | null {
  if (!distributionId) return null;
  if (!client) {
    client = new CloudFrontClient({
      region: process.env.AWS_REGION ?? "us-east-1",
    });
  }
  return client;
}

/** CloudFront 캐시 무효화 (게시 시 호출) */
export async function invalidateCdnPaths(paths: string[]): Promise<{
  ok: boolean;
  invalidationId?: string;
  skipped?: boolean;
}> {
  const cf = getClient();
  if (!cf || paths.length === 0) {
    return { ok: true, skipped: true };
  }

  const uniquePaths = [...new Set(paths.map((p) => (p.startsWith("/") ? p : `/${p}`)))];

  try {
    const res = await cf.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `pl-${Date.now()}`,
          Paths: {
            Quantity: uniquePaths.length,
            Items: uniquePaths,
          },
        },
      }),
    );
    return { ok: true, invalidationId: res.Invalidation?.Id };
  } catch (err) {
    console.error("CloudFront invalidation failed:", err);
    return { ok: false };
  }
}

/** Next.js ISR 온디맨드 revalidate */
export async function revalidateWebCache(slug: string): Promise<boolean> {
  const base = process.env.WEB_REVALIDATE_URL ?? "http://localhost:3000/api/revalidate";
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;

  try {
    const url = `${base}?secret=${encodeURIComponent(secret)}&slug=${encodeURIComponent(slug)}`;
    const res = await fetch(url, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

export function buildCdnPathsForCampaign(slug: string): string[] {
  const paths = [`/c/${slug}`, `/c/${slug}/*`, `/api/v1/public/campaigns/${slug}`];
  const cdnPrefix = process.env.CDN_PATH_PREFIX;
  if (cdnPrefix) {
    paths.push(`${cdnPrefix}/${slug}/*`);
  }
  return paths;
}

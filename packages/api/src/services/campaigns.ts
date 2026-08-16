import { prisma } from "@proplanding/database";
import type { PublicCampaign } from "@proplanding/shared";
import { getPublicMediaUrl } from "../lib/storage";
import {
  buildCdnPathsForCampaign,
  invalidateCdnPaths,
  revalidateWebCache,
} from "../lib/cdn";

export async function getDefaultOrgId(): Promise<string> {
  const org = await prisma.organization.findFirst({ where: { deletedAt: null } });
  if (!org) throw new Error("No organization configured");
  return org.id;
}

export async function toPublicCampaign(
  campaign: Awaited<ReturnType<typeof fetchCampaignWithRelations>>,
): Promise<PublicCampaign> {
  const unitTypes = await Promise.all(
    campaign.unitTypes.map(async (ut) => {
      const floor = ut.media.find((m) => m.purpose === "floorplan");
      let floorplanUrl: string | null = null;
      if (floor) {
        floorplanUrl = getPublicMediaUrl(floor.media.id);
      }
      return {
        id: ut.id,
        code: ut.code,
        name: ut.name,
        areaSqm: ut.areaSqm,
        specs: ut.specs as Record<string, unknown> | null,
        floorplanUrl,
      };
    }),
  );

  return {
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    status: campaign.status as PublicCampaign["status"],
    contactPhone: campaign.contactPhone,
    meta: campaign.meta as Record<string, unknown> | null,
    blocks: campaign.siteBlocks.map((b) => ({
      id: b.id,
      type: b.type as PublicCampaign["blocks"][0]["type"],
      sortOrder: b.sortOrder,
      payload: b.payload as Record<string, unknown>,
    })),
    unitTypes,
    legalNotices: campaign.legalLinks.map((l) => ({
      id: l.legalNotice.id,
      type: l.legalNotice.type,
      version: l.legalNotice.version,
      title: l.legalNotice.title,
      content: l.legalNotice.content,
    })),
  };
}

async function fetchCampaignWithRelations(where: { id: string } | { organizationId_slug: { organizationId: string; slug: string } }) {
  return prisma.campaign.findFirstOrThrow({
    where: { ...where, deletedAt: null },
    include: {
      siteBlocks: { orderBy: { sortOrder: "asc" } },
      unitTypes: {
        orderBy: { sortOrder: "asc" },
        include: {
          media: { include: { media: true } },
        },
      },
      legalLinks: { include: { legalNotice: true } },
    },
  });
}

export async function getCampaignBySlug(
  slug: string,
  options?: { previewToken?: string },
): Promise<PublicCampaign | null> {
  const orgId = await getDefaultOrgId();
  const campaign = await prisma.campaign.findFirst({
    where: { organizationId: orgId, slug, deletedAt: null },
    include: {
      siteBlocks: { orderBy: { sortOrder: "asc" } },
      unitTypes: {
        orderBy: { sortOrder: "asc" },
        include: { media: { include: { media: true } } },
      },
      legalLinks: { include: { legalNotice: true } },
    },
  });

  if (!campaign) return null;

  const isPreview = options?.previewToken && options.previewToken === campaign.previewToken;
  if (campaign.status !== "published" && !isPreview) return null;

  return toPublicCampaign(campaign);
}

export async function listCampaigns(orgId: string) {
  return prisma.campaign.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { inquiries: true, siteBlocks: true } } },
  });
}

export async function getCampaignById(orgId: string, id: string) {
  return prisma.campaign.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    include: {
      siteBlocks: { orderBy: { sortOrder: "asc" } },
      unitTypes: { orderBy: { sortOrder: "asc" }, include: { media: { include: { media: true } } } },
      campaignMedia: { include: { media: true } },
      legalLinks: { include: { legalNotice: true } },
    },
  });
}

export async function createCampaign(
  orgId: string,
  data: { title: string; slug: string; contactPhone?: string },
) {
  return prisma.campaign.create({
    data: {
      organizationId: orgId,
      title: data.title,
      slug: data.slug,
      contactPhone: data.contactPhone,
      previewToken: `preview-${Date.now()}`,
      status: "draft",
    },
  });
}

export async function updateCampaign(
  orgId: string,
  id: string,
  data: Partial<{ title: string; slug: string; contactPhone: string; status: string; meta: object }>,
) {
  return prisma.campaign.update({
    where: { id, organizationId: orgId },
    data,
  });
}

export async function publishCampaign(orgId: string, id: string) {
  const campaign = await prisma.campaign.update({
    where: { id, organizationId: orgId },
    data: { status: "published", publishedAt: new Date() },
  });

  const cdnResult = await invalidateCdnPaths(buildCdnPathsForCampaign(campaign.slug));
  const revalidated = await revalidateWebCache(campaign.slug);

  return { campaign, cdn: cdnResult, revalidated };
}

export async function upsertSiteBlocks(
  campaignId: string,
  blocks: Array<{ type: string; sortOrder: number; payload: object }>,
) {
  await prisma.siteBlock.deleteMany({ where: { campaignId } });
  if (blocks.length === 0) return [];
  return prisma.siteBlock.createMany({
    data: blocks.map((b) => ({
      campaignId,
      type: b.type,
      sortOrder: b.sortOrder,
      payload: b.payload,
    })),
  });
}

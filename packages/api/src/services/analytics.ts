import { prisma } from "@proplanding/database";
import type { TrackEventInput } from "@proplanding/shared";

export async function getOrCreateSession(sessionKey: string, utm?: {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  userAgent?: string;
}) {
  return prisma.visitorSession.upsert({
    where: { sessionKey },
    update: {},
    create: {
      sessionKey,
      utmSource: utm?.utmSource,
      utmMedium: utm?.utmMedium,
      utmCampaign: utm?.utmCampaign,
      referrer: utm?.referrer,
      userAgent: utm?.userAgent,
    },
  });
}

export async function trackEvent(input: TrackEventInput) {
  let visitorSessionId: string | undefined;
  if (input.sessionKey) {
    const session = await getOrCreateSession(input.sessionKey, input.properties as {
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      referrer?: string;
      userAgent?: string;
    });
    visitorSessionId = session.id;

    if (input.eventName === "session_start") {
      await prisma.attributionTouch.createMany({
        data: [{ campaignId: input.campaignId, visitorSessionId: session.id }],
        skipDuplicates: true,
      });
    }
  }

  return prisma.analyticsEvent.create({
    data: {
      campaignId: input.campaignId,
      visitorSessionId,
      eventName: input.eventName,
      properties: input.properties as object | undefined,
    },
  });
}

export async function getCampaignReport(orgId: string, campaignId?: string) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      organizationId: orgId,
      deletedAt: null,
      ...(campaignId ? { id: campaignId } : {}),
    },
    include: {
      _count: {
        select: {
          inquiries: true,
          analyticsEvents: true,
        },
      },
      inquiries: {
        select: { status: true },
      },
    },
  });

  const events = await prisma.analyticsEvent.groupBy({
    by: ["eventName"],
    where: {
      campaign: { organizationId: orgId },
      ...(campaignId ? { campaignId } : {}),
    },
    _count: { id: true },
  });

  const utmBreakdown = await prisma.visitorSession.groupBy({
    by: ["utmSource"],
    where: {
      attributionTouches: {
        some: {
          campaign: { organizationId: orgId },
          ...(campaignId ? { campaignId } : {}),
        },
      },
    },
    _count: { id: true },
  });

  return {
    campaigns: campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      status: c.status,
      inquiryCount: c._count.inquiries,
      eventCount: c._count.analyticsEvents,
      inquiriesByStatus: c.inquiries.reduce(
        (acc, i) => {
          acc[i.status] = (acc[i.status] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    })),
    events: events.map((e) => ({ name: e.eventName, count: e._count.id })),
    utmSources: utmBreakdown.map((u) => ({
      source: u.utmSource ?? "direct",
      count: u._count.id,
    })),
  };
}

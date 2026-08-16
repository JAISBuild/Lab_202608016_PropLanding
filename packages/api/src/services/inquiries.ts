import { prisma } from "@proplanding/database";
import type { CreateInquiryInput } from "@proplanding/shared";
import { assignInquiryRoundRobin } from "./assignments";

export async function createInquiry(input: CreateInquiryInput) {
  return prisma.$transaction(async (tx) => {
    let visitorSessionId: string | undefined;
    if (input.sessionKey) {
      const session = await tx.visitorSession.upsert({
        where: { sessionKey: input.sessionKey },
        update: {},
        create: {
          sessionKey: input.sessionKey,
          ...(input.sourceSnapshot as object),
        },
      });
      visitorSessionId = session.id;
    }

    const campaign = await tx.campaign.findUniqueOrThrow({
      where: { id: input.campaignId },
    });

    const inquiry = await tx.inquiry.create({
      data: {
        organizationId: campaign.organizationId,
        campaignId: input.campaignId,
        visitorSessionId,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        preferredVisitAt: input.preferredVisitAt
          ? new Date(input.preferredVisitAt)
          : undefined,
        interestedUnitTypeId: input.interestedUnitTypeId,
        sourceSnapshot: input.sourceSnapshot as object | undefined,
        status: "new",
      },
    });

    await tx.inquiryConsent.create({
      data: {
        inquiryId: inquiry.id,
        legalNoticeId: input.legalNoticeId,
      },
    });

    await tx.inquiryEvent.create({
      data: {
        inquiryId: inquiry.id,
        type: "created",
        payload: { source: "form_submit" },
      },
    });

    await tx.analyticsEvent.create({
      data: {
        campaignId: input.campaignId,
        visitorSessionId,
        inquiryId: inquiry.id,
        eventName: "form_submit",
        properties: { inquiryId: inquiry.id },
      },
    });

    await assignInquiryRoundRobin(tx, inquiry);

    return inquiry;
  });
}

export async function listInquiries(orgId: string, filters?: { status?: string; campaignId?: string }) {
  return prisma.inquiry.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      campaign: { select: { title: true, slug: true } },
      assignedStaff: { select: { name: true } },
      interestedUnit: { select: { name: true, code: true } },
    },
  });
}

export async function getInquiry(orgId: string, id: string) {
  return prisma.inquiry.findFirst({
    where: { id, organizationId: orgId },
    include: {
      campaign: true,
      assignedStaff: true,
      interestedUnit: true,
      events: { orderBy: { createdAt: "desc" } },
      consents: { include: { legalNotice: true } },
      consultations: { orderBy: { createdAt: "desc" } },
      appointments: { orderBy: { scheduledAt: "asc" } },
      analyticsEvents: { orderBy: { occurredAt: "desc" }, take: 20 },
      visitorSession: true,
    },
  });
}

export async function updateInquiryStatus(
  orgId: string,
  id: string,
  status: string,
  note?: string,
) {
  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.update({
      where: { id, organizationId: orgId },
      data: { status },
    });
    await tx.inquiryEvent.create({
      data: {
        inquiryId: id,
        type: "status_change",
        payload: { status, note },
      },
    });
    return inquiry;
  });
}

export async function addConsultation(
  orgId: string,
  inquiryId: string,
  data: { channel: string; note?: string; outcome?: string },
) {
  const inquiry = await prisma.inquiry.findFirstOrThrow({
    where: { id: inquiryId, organizationId: orgId },
  });
  return prisma.$transaction(async (tx) => {
    const consultation = await tx.consultation.create({
      data: { inquiryId, ...data },
    });
    await tx.inquiryEvent.create({
      data: {
        inquiryId,
        type: "consultation",
        payload: data,
      },
    });
    if (inquiry.status === "new") {
      await tx.inquiry.update({
        where: { id: inquiryId },
        data: { status: "contacted" },
      });
    }
    return consultation;
  });
}

export async function createAppointment(
  orgId: string,
  inquiryId: string,
  data: { scheduledAt: string; note?: string },
) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.create({
      data: {
        inquiryId,
        scheduledAt: new Date(data.scheduledAt),
        note: data.note,
      },
    });
    await tx.inquiry.update({
      where: { id: inquiryId },
      data: { status: "visit_scheduled" },
    });
    await tx.inquiryEvent.create({
      data: {
        inquiryId,
        type: "appointment_created",
        payload: data,
      },
    });
    return appointment;
  });
}

export async function findDuplicateInquiries(orgId: string, phone: string) {
  return prisma.inquiry.findMany({
    where: { organizationId: orgId, phone },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function computeLeadScore(inquiryId: string): Promise<number> {
  const inquiry = await prisma.inquiry.findUniqueOrThrow({
    where: { id: inquiryId },
    include: {
      analyticsEvents: true,
      interestedUnit: true,
      appointments: true,
    },
  });

  let score = 10;
  if (inquiry.interestedUnitTypeId) score += 20;
  if (inquiry.preferredVisitAt) score += 15;
  if (inquiry.appointments.length > 0) score += 25;
  const videoEvents = inquiry.analyticsEvents.filter((e) => e.eventName === "media_play");
  if (videoEvents.length > 0) score += 15;
  const unitViews = inquiry.analyticsEvents.filter((e) => e.eventName === "unit_type_view");
  score += Math.min(unitViews.length * 5, 15);

  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { leadScore: score },
  });

  return score;
}

export function classifyInquiry(note: string): string {
  if (/방문|예약|견학/.test(note)) return "visit_request";
  if (/가격|분양가|계약/.test(note)) return "pricing";
  if (/대출|금융/.test(note)) return "finance";
  return "general";
}

import type { Prisma } from "@proplanding/database";
import { prisma } from "@proplanding/database";

type TxClient = Prisma.TransactionClient;

export async function assignInquiryRoundRobin(
  tx: TxClient,
  inquiry: { id: string; organizationId: string; campaignId: string },
) {
  const staff = await tx.staffMember.findMany({
    where: { organizationId: inquiry.organizationId, active: true },
    orderBy: { createdAt: "asc" },
  });
  if (staff.length === 0) return null;

  const lastAssignment = await tx.inquiryAssignment.findFirst({
    where: { staff: { organizationId: inquiry.organizationId } },
    orderBy: { createdAt: "desc" },
  });

  let nextStaff = staff[0];
  if (lastAssignment) {
    const idx = staff.findIndex((s) => s.id === lastAssignment.staffId);
    nextStaff = staff[(idx + 1) % staff.length];
  }

  await tx.inquiryAssignment.create({
    data: {
      inquiryId: inquiry.id,
      staffId: nextStaff.id,
      method: "round_robin",
    },
  });

  await tx.inquiry.update({
    where: { id: inquiry.id },
    data: { assignedStaffId: nextStaff.id },
  });

  await tx.inquiryEvent.create({
    data: {
      inquiryId: inquiry.id,
      type: "assigned",
      payload: { staffId: nextStaff.id, method: "round_robin" },
    },
  });

  return nextStaff;
}

export async function listAppointments(orgId: string) {
  return prisma.appointment.findMany({
    where: { inquiry: { organizationId: orgId } },
    orderBy: { scheduledAt: "asc" },
    include: {
      inquiry: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          status: true,
          campaign: { select: { title: true } },
        },
      },
    },
  });
}

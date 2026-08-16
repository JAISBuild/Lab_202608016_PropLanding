import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@proplanding/database";
import {
  createInquiry,
  listInquiries,
  getInquiry,
  updateInquiryStatus,
  addConsultation,
  createAppointment,
  findDuplicateInquiries,
  computeLeadScore,
  classifyInquiry,
} from "../../services/inquiries";

const inquiries = new Hono();

inquiries.post(
  "/",
  zValidator(
    "json",
    z.object({
      campaignId: z.string(),
      fullName: z.string().min(1),
      phone: z.string().min(8),
      email: z.string().email().optional(),
      preferredVisitAt: z.string().optional(),
      interestedUnitTypeId: z.string().optional(),
      legalNoticeId: z.string(),
      sessionKey: z.string().optional(),
      sourceSnapshot: z.record(z.unknown()).optional(),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");
    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: body.campaignId },
    });
    const duplicates = await findDuplicateInquiries(campaign.organizationId, body.phone);
    const inquiry = await createInquiry(body);
    const score = await computeLeadScore(inquiry.id);
    return c.json(
      {
        data: {
          ...inquiry,
          leadScore: score,
          duplicateWarning: duplicates.length > 0,
        },
      },
      201,
    );
  },
);

export default inquiries;

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  listInquiries,
  getInquiry,
  updateInquiryStatus,
  addConsultation,
  createAppointment,
  computeLeadScore,
} from "../../services/inquiries";
import { classifyInquiry, summarizeConsultation } from "../../services/ai";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "@proplanding/database";
import type { ApiEnv } from "../../types";

const inquiriesAdmin = new Hono<ApiEnv>();

inquiriesAdmin.use("*", requireAuth);

inquiriesAdmin.get("/", async (c) => {
  const auth = c.get("auth");
  const status = c.req.query("status");
  const campaignId = c.req.query("campaignId");
  const items = await listInquiries(auth.orgId, { status, campaignId });
  return c.json({ data: items });
});

inquiriesAdmin.get("/:id", async (c) => {
  const auth = c.get("auth");
  const item = await getInquiry(auth.orgId, c.req.param("id"));
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json({ data: item });
});

inquiriesAdmin.patch(
  "/:id/status",
  zValidator("json", z.object({ status: z.string(), note: z.string().optional() })),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const item = await updateInquiryStatus(auth.orgId, c.req.param("id"), body.status, body.note);
    return c.json({ data: item });
  },
);

inquiriesAdmin.post(
  "/:id/consultations",
  zValidator(
    "json",
    z.object({ channel: z.string(), note: z.string().optional(), outcome: z.string().optional() }),
  ),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const item = await addConsultation(auth.orgId, c.req.param("id"), body);
    if (body.note) {
      const { category } = await classifyInquiry(body.note);
      const summary = await summarizeConsultation(body.note);
      await prisma.inquiry.update({
        where: { id: c.req.param("id") },
        data: { aiCategory: category },
      });
      await prisma.inquiryEvent.create({
        data: {
          inquiryId: c.req.param("id"),
          type: "ai_summary",
          payload: { summary, category },
        },
      });
    }
    return c.json({ data: item }, 201);
  },
);

inquiriesAdmin.post(
  "/:id/appointments",
  zValidator("json", z.object({ scheduledAt: z.string(), note: z.string().optional() })),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const item = await createAppointment(auth.orgId, c.req.param("id"), body);
    return c.json({ data: item }, 201);
  },
);

inquiriesAdmin.post("/:id/score", async (c) => {
  const score = await computeLeadScore(c.req.param("id"));
  return c.json({ data: { leadScore: score } });
});

export default inquiriesAdmin;

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { trackEvent, getCampaignReport } from "../../services/analytics";
import { requireAuth } from "../../middleware/auth";

import type { ApiEnv } from "../../types";

const analytics = new Hono<ApiEnv>();

analytics.post(
  "/events",
  zValidator(
    "json",
    z.object({
      campaignId: z.string(),
      eventName: z.string(),
      sessionKey: z.string().optional(),
      properties: z.record(z.unknown()).optional(),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");
    const event = await trackEvent({
      campaignId: body.campaignId,
      eventName: body.eventName as "page_view",
      sessionKey: body.sessionKey,
      properties: body.properties,
    });
    return c.json({ data: event }, 201);
  },
);

analytics.get("/reports/campaigns", requireAuth, async (c) => {
  const auth = c.get("auth");
  const campaignId = c.req.query("campaignId");
  const report = await getCampaignReport(auth.orgId, campaignId);
  return c.json({ data: report });
});

export default analytics;

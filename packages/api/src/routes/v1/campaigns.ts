import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  createCampaign,
  getCampaignById,
  listCampaigns,
  publishCampaign,
  updateCampaign,
  upsertSiteBlocks,
} from "../../services/campaigns";
import { requireAuth } from "../../middleware/auth";
import type { ApiEnv } from "../../types";
import type { AuthPayload } from "../../services/auth";

const campaigns = new Hono<ApiEnv>();

campaigns.use("*", requireAuth);

campaigns.get("/", async (c) => {
  const auth = c.get("auth");
  const items = await listCampaigns(auth.orgId);
  return c.json({ data: items });
});

campaigns.get("/:id", async (c) => {
  const auth = c.get("auth");
  const item = await getCampaignById(auth.orgId, c.req.param("id"));
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json({ data: item });
});

campaigns.post(
  "/",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
      contactPhone: z.string().optional(),
    }),
  ),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const item = await createCampaign(auth.orgId, body);
    return c.json({ data: item }, 201);
  },
);

campaigns.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      title: z.string().optional(),
      slug: z.string().optional(),
      contactPhone: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      meta: z.record(z.unknown()).optional(),
    }),
  ),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const item = await updateCampaign(auth.orgId, c.req.param("id"), body);
    return c.json({ data: item });
  },
);

campaigns.post("/:id/publish", async (c) => {
  const auth = c.get("auth");
  const result = await publishCampaign(auth.orgId, c.req.param("id"));
  return c.json({ data: result });
});

campaigns.put(
  "/:id/blocks",
  zValidator(
    "json",
    z.object({
      blocks: z.array(
        z.object({
          type: z.string(),
          sortOrder: z.number(),
          payload: z.record(z.unknown()),
        }),
      ),
    }),
  ),
  async (c) => {
    const auth = c.get("auth");
    const campaign = await getCampaignById(auth.orgId, c.req.param("id"));
    if (!campaign) return c.json({ error: "Not found" }, 404);
    const { blocks } = c.req.valid("json");
    await upsertSiteBlocks(campaign.id, blocks);
    const updated = await getCampaignById(auth.orgId, campaign.id);
    return c.json({ data: updated });
  },
);

export default campaigns;

import type { PublicCampaign } from "@proplanding/shared";

function apiBase() {
  const explicit = process.env.NEXT_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (typeof window === "undefined") {
    return process.env.API_PUBLIC_URL ?? "http://127.0.0.1:4000";
  }
  return "";
}

const API_URL = apiBase();

export async function fetchPublicCampaign(
  slug: string,
  preview?: string,
): Promise<PublicCampaign | null> {
  const qs = preview ? `?preview=${encodeURIComponent(preview)}` : "";
  const res = await fetch(`${API_URL}/api/v1/public/campaigns/${slug}${qs}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as PublicCampaign;
}

export async function submitInquiry(data: {
  campaignId: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredVisitAt?: string;
  interestedUnitTypeId?: string;
  legalNoticeId: string;
  sessionKey?: string;
  sourceSnapshot?: Record<string, unknown>;
}) {
  const res = await fetch(`${API_URL}/api/v1/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Submit failed");
  }
  return res.json();
}

export async function trackEvent(data: {
  campaignId: string;
  eventName: string;
  sessionKey?: string;
  properties?: Record<string, unknown>;
}) {
  await fetch(`${API_URL}/api/v1/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {});
}

export { API_URL };

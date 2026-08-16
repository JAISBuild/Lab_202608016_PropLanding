const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pl_admin_token");
}

export function setToken(token: string) {
  localStorage.setItem("pl_admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("pl_admin_token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("로그인 실패");
  const json = await res.json();
  setToken(json.data.token);
  return json.data.user;
}

export async function getDashboard() {
  return apiFetch<{
    campaignCount: number;
    inquiryCount: number;
    newInquiries: number;
    upcomingAppointments: number;
  }>("/api/v1/auth/dashboard");
}

export async function getCampaigns() {
  return apiFetch<unknown[]>("/api/v1/campaigns");
}

export async function getCampaign(id: string) {
  return apiFetch<Record<string, unknown>>(`/api/v1/campaigns/${id}`);
}

export async function createCampaign(data: { title: string; slug: string; contactPhone?: string }) {
  return apiFetch<Record<string, unknown>>("/api/v1/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type MediaAsset = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  altText: string | null;
  width: number | null;
  height: number | null;
  url: string;
  thumbUrl: string;
  mediumUrl: string;
  largeUrl: string;
  createdAt: string;
};

export type PublishResult = {
  campaign: Record<string, unknown>;
  cdn: { ok: boolean; invalidationId?: string; skipped?: boolean };
  revalidated: boolean;
};

export async function updateCampaign(
  id: string,
  data: Partial<{ title: string; slug: string; contactPhone: string }>,
) {
  return apiFetch<Record<string, unknown>>(`/api/v1/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateCampaignBlocks(
  id: string,
  blocks: Array<{ type: string; sortOrder: number; payload: Record<string, unknown> }>,
) {
  return apiFetch<Record<string, unknown>>(`/api/v1/campaigns/${id}/blocks`, {
    method: "PUT",
    body: JSON.stringify({ blocks }),
  });
}

export async function publishCampaign(id: string) {
  return apiFetch<PublishResult>(`/api/v1/campaigns/${id}/publish`, { method: "POST" });
}

export async function listMedia() {
  return apiFetch<MediaAsset[]>("/api/v1/media/library");
}

export async function uploadMedia(file: File, altText?: string): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append("file", file);
  if (altText) formData.append("altText", altText);

  const token = getToken();
  const res = await fetch(`${API_URL}/api/v1/media/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Upload failed ${res.status}`);
  }
  const json = await res.json();
  return json.data as MediaAsset;
}

export async function getInquiries(params?: { status?: string }) {
  const qs = params?.status ? `?status=${params.status}` : "";
  return apiFetch<unknown[]>(`/api/v1/admin/inquiries${qs}`);
}

export async function getInquiry(id: string) {
  return apiFetch<Record<string, unknown>>(`/api/v1/admin/inquiries/${id}`);
}

export async function updateInquiryStatus(id: string, status: string, note?: string) {
  return apiFetch<unknown>(`/api/v1/admin/inquiries/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export async function getAppointments() {
  return apiFetch<unknown[]>("/api/v1/auth/appointments");
}

export async function getReports() {
  return apiFetch<Record<string, unknown>>("/api/v1/analytics/reports/campaigns");
}

export { API_URL };

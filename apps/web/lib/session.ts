"use client";

const KEY = "pl_session_key";

export function getSessionKey(): string {
  if (typeof window === "undefined") return "";
  let key = localStorage.getItem(KEY);
  if (!key) {
    key = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, key);
  }
  return key;
}

export function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign"]) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}

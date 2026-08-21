const scrollKey = (slug: string) => `pl:landing-scroll:${slug}`;
const returnKey = (slug: string) => `pl:landing-return:${slug}`;

export function saveLandingScroll(slug: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(scrollKey(slug), String(Math.round(window.scrollY)));
  } catch {
    /* private mode / quota */
  }
}

export function readLandingScroll(slug: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(scrollKey(slug));
    if (raw == null) return null;
    const y = Number(raw);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

/** Mark a section to land on instantly after returning to the campaign page. */
export function setLandingReturn(slug: string, sectionId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(returnKey(slug), sectionId.replace(/^#/, ""));
  } catch {
    /* ignore */
  }
}

export function consumeLandingReturn(slug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = sessionStorage.getItem(returnKey(slug));
    if (id) sessionStorage.removeItem(returnKey(slug));
    return id;
  } catch {
    return null;
  }
}

function withInstantScroll(fn: () => void) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  fn();
  // Restore on next frame so the jump itself never animates.
  requestAnimationFrame(() => {
    html.style.scrollBehavior = prev;
  });
}

const HEADER_OFFSET = 72;

/** Instant jump — never smooth-scroll from the top. */
export function jumpToLandingSection(sectionId: string) {
  const id = sectionId.replace(/^#/, "");
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  withInstantScroll(() => {
    window.scrollTo(0, Math.max(0, Math.round(top)));
  });
  return true;
}

/** @deprecated Prefer jumpToLandingSection for cross-page returns. */
export function scrollLandingToHash(hash: string, instant = false) {
  if (instant) return jumpToLandingSection(hash);
  const id = hash.replace(/^#/, "");
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

/**
 * In-page section jump without stacking hash history.
 * Uses replaceState so mouse/browser Back does not hop through 방문예약 → 입지 → …
 */
export function navigateLandingSection(sectionId: string, smooth = false) {
  if (typeof window === "undefined") return false;
  const id = sectionId.replace(/^#/, "");
  if (!id) return false;
  const ok = smooth ? scrollLandingToHash(id, false) : jumpToLandingSection(id);
  if (!ok) return false;
  const next = `${window.location.pathname}${window.location.search}#${id}`;
  window.history.replaceState(window.history.state, "", next);
  return true;
}

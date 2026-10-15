export type SourceChannel = "indeed" | "linkedin" | "google_jobs" | "direct" | "other";

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
}

export const SOURCE_LABELS: Record<SourceChannel, string> = {
  indeed: "Indeed",
  linkedin: "LinkedIn",
  google_jobs: "Google Jobs",
  direct: "Direct",
  other: "Other",
};

/** Classify an application's source from UTM params first, then referrer. */
export function classifySource(a: Attribution): SourceChannel {
  const utm = `${a.utm_source ?? ""} ${a.utm_medium ?? ""}`.toLowerCase();
  const ref = (a.referrer ?? "").toLowerCase();
  if (utm.includes("indeed")) return "indeed";
  if (utm.includes("linkedin")) return "linkedin";
  if (utm.includes("google_jobs") || utm.includes("google jobs") || utm.includes("googlejobs"))
    return "google_jobs";
  if (utm.trim()) {
    if (utm.includes("google")) return "google_jobs";
    return "other";
  }
  if (ref.includes("indeed.")) return "indeed";
  if (ref.includes("linkedin.") || ref.includes("lnkd.in")) return "linkedin";
  if (ref.includes("google.")) return "google_jobs";
  if (!ref) return "direct";
  return "other";
}

const KEY = "nunes_attribution";

/** Browser-only: remember first-touch UTM + referrer for this session. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const p = url.searchParams;
    const fresh: Attribution = {
      utm_source: p.get("utm_source") ?? undefined,
      utm_medium: p.get("utm_medium") ?? undefined,
      utm_campaign: p.get("utm_campaign") ?? undefined,
    };
    const existing = sessionStorage.getItem(KEY);
    if (existing && !fresh.utm_source) return;
    const ref = document.referrer && !document.referrer.startsWith(window.location.origin)
      ? document.referrer
      : undefined;
    sessionStorage.setItem(KEY, JSON.stringify({ ...fresh, referrer: ref }));
  } catch {
    /* storage blocked */
  }
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Attribution;
  } catch {
    return {};
  }
}
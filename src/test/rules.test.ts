import { describe, expect, it } from "vitest";
import { classifySource } from "@/lib/attribution";
import { checkResume, applicationSchema } from "@/lib/application-rules";

describe("source attribution", () => {
  it("indeed via utm", () => expect(classifySource({ utm_source: "Indeed" })).toBe("indeed"));
  it("linkedin via referrer", () =>
    expect(classifySource({ referrer: "https://www.linkedin.com/jobs" })).toBe("linkedin"));
  it("google jobs via utm", () =>
    expect(classifySource({ utm_source: "google_jobs_apply" })).toBe("google_jobs"));
  it("direct with nothing", () => expect(classifySource({})).toBe("direct"));
});

describe("resume rules", () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
  it("accepts 5MB pdf", () => expect(checkResume("cv.pdf", 5 * 1024 * 1024, pdf)).toBeNull());
  it("rejects over 5MB", () => expect(checkResume("cv.pdf", 5 * 1024 * 1024 + 1, pdf)).not.toBeNull());
  it("rejects png", () => expect(checkResume("cv.png", 1000)).not.toBeNull());
  it("rejects fake pdf", () => expect(checkResume("cv.pdf", 100, new Uint8Array([1, 2, 3, 4]))).not.toBeNull());
});

describe("consent", () => {
  it("requires consent", () => {
    const r = applicationSchema.safeParse({
      job_slug: "x", full_name: "Asha K", mobile: "9876543210", email: "a@b.co",
      location: "Coimbatore", experience: "fresher", consent: false,
    });
    expect(r.success).toBe(false);
  });
});
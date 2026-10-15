import { z } from "zod";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const RESUME_EXTENSIONS = ["pdf", "doc", "docx"] as const;
export const EXPERIENCE_OPTIONS = [
  { value: "fresher", label: "Fresher" },
  { value: "0-1", label: "0 – 1 year" },
  { value: "1-3", label: "1 – 3 years" },
  { value: "3+", label: "3+ years" },
] as const;
export const STAGES = ["new", "review", "interview", "rejected", "hired"] as const;
export type Stage = (typeof STAGES)[number];

export const applicationSchema = z.object({
  job_slug: z.string().trim().min(1).max(120),
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  mobile: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{8,15}$/, "Enter a valid mobile number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  location: z.string().trim().min(2, "Enter your current location").max(100),
  experience: z.enum(["fresher", "0-1", "1-3", "3+"], { message: "Select your experience" }),
  message: z.string().trim().max(1000, "Keep message under 1000 characters").optional().default(""),
  consent: z.literal(true, { message: "Consent is required to apply" }),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(150).optional(),
  referrer: z.string().max(500).optional(),
});

/** Validate a resume by extension, size, and file signature (magic bytes). */
export function checkResume(name: string, size: number, head?: Uint8Array): string | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (!(RESUME_EXTENSIONS as readonly string[]).includes(ext)) return "Resume must be PDF, DOC or DOCX";
  if (size <= 0) return "Resume file is empty";
  if (size > MAX_RESUME_BYTES) return "Resume must be 5 MB or smaller";
  if (head) {
    const b = head;
    const isPdf = b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;
    const isDoc = b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;
    const isZip = b[0] === 0x50 && b[1] === 0x4b;
    if (ext === "pdf" && !isPdf) return "File does not look like a valid PDF";
    if (ext === "doc" && !isDoc) return "File does not look like a valid DOC";
    if (ext === "docx" && !isZip) return "File does not look like a valid DOCX";
  }
  return null;
}

export function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const f = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  return f((min ?? max) as number);
}
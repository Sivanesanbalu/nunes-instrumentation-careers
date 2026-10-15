import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { applicationSchema, checkResume } from "./application-rules";
import { classifySource } from "./attribution";

export type PublicJob = {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience_levels: string[];
  salary_min: number | null;
  salary_max: number | null;
  highlight: string | null;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  date_posted: string;
  valid_through: string | null;
};

const COLS =
  "id, slug, title, department, location, employment_type, experience_levels, salary_min, salary_max, highlight, summary, responsibilities, requirements, date_posted, valid_through";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listOpenJobs = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("jobs")
    .select(COLS)
    .eq("status", "open")
    .order("sort_order");
  if (error) {
    console.error(error);
    return [] as PublicJob[];
  }
  return data as PublicJob[];
});

export const getOpenJob = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { data: job } = await publicClient()
      .from("jobs")
      .select(COLS)
      .eq("status", "open")
      .eq("slug", data.slug)
      .maybeSingle();
    return (job as PublicJob | null) ?? null;
  });

type SubmitResult = { ok: true; reference: string; role: string } | { ok: false; error: string };

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((d: FormData) => {
    if (!(d instanceof FormData)) throw new Error("Invalid form");
    return d;
  })
  .handler(async ({ data: fd }): Promise<SubmitResult> => {
    const raw = Object.fromEntries(
      [...fd.entries()].filter(([k, v]) => k !== "resume" && typeof v === "string"),
    ) as Record<string, string>;
    const parsed = applicationSchema.safeParse({ ...raw, consent: raw.consent === "true" });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };
    const v = parsed.data;

    const file = fd.get("resume");
    if (!(file instanceof File)) return { ok: false, error: "Please attach your resume" };
    const buf = new Uint8Array(await file.arrayBuffer());
    const fileErr = checkResume(file.name, file.size, buf.slice(0, 8));
    if (fileErr) return { ok: false, error: fileErr };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("id, title, status")
      .eq("slug", v.job_slug)
      .maybeSingle();
    if (!job || job.status !== "open") return { ok: false, error: "This role is no longer accepting applications" };

    // Basic abuse protection: max 3 submissions per email per hour, one per role per day.
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("applications")
      .select("job_id, created_at")
      .ilike("email", v.email)
      .gte("created_at", new Date(Date.now() - 86400_000).toISOString());
    if ((recent ?? []).filter((r) => r.created_at >= hourAgo).length >= 3)
      return { ok: false, error: "Too many applications from this email. Please try again later." };
    if ((recent ?? []).some((r) => r.job_id === job.id))
      return { ok: false, error: "You have already applied for this role today. We have your application." };

    const ext = file.name.split(".").pop()!.toLowerCase();
    const path = `${job.id}/${crypto.randomUUID()}.${ext}`;
    const contentType =
      ext === "pdf"
        ? "application/pdf"
        : ext === "doc"
          ? "application/msword"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const up = await supabaseAdmin.storage.from("resumes").upload(path, buf, { contentType, upsert: false });
    if (up.error) {
      console.error(up.error);
      return { ok: false, error: "Resume upload failed. Please try again." };
    }

    const { data: row, error } = await supabaseAdmin
      .from("applications")
      .insert({
        job_id: job.id,
        role_title: job.title,
        full_name: v.full_name,
        mobile: v.mobile,
        email: v.email.toLowerCase(),
        location: v.location,
        experience: v.experience,
        message: v.message || null,
        resume_path: path,
        resume_name: file.name.slice(0, 200),
        consent: true,
        source: classifySource(v),
        utm_source: v.utm_source || null,
        utm_medium: v.utm_medium || null,
        utm_campaign: v.utm_campaign || null,
        referrer: v.referrer || null,
      })
      .select("id")
      .single();
    if (error || !row) {
      console.error(error);
      await supabaseAdmin.storage.from("resumes").remove([path]);
      return { ok: false, error: "We could not save your application. Please try again." };
    }
    return { ok: true, reference: row.id.slice(0, 8).toUpperCase(), role: job.title };
  });

const deletionSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  mobile: z.string().trim().max(20).optional().default(""),
  details: z.string().trim().max(1000).optional().default(""),
});

export const requestDataDeletion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => deletionSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("deletion_requests").insert({
      full_name: data.full_name,
      email: data.email.toLowerCase(),
      mobile: data.mobile || null,
      details: data.details || null,
    });
    if (error) {
      console.error(error);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
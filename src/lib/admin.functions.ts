import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { STAGES } from "./application-rules";

type Ctx = { supabase: any; userId: string };

async function assertStaff(ctx: Ctx) {
  const { data, error } = await ctx.supabase.rpc("is_staff", { _user_id: ctx.userId });
  if (error || !data) throw new Error("Forbidden: HR access has not been granted to this account.");
}

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role as string);
    return { roles, isStaff: roles.length > 0, isAdmin: roles.includes("admin") };
  });

export const adminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const [jobs, apps, dels] = await Promise.all([
      context.supabase.from("jobs").select("*").order("sort_order"),
      context.supabase
        .from("applications")
        .select(
          "id, job_id, role_title, full_name, mobile, email, location, experience, message, resume_name, stage, hr_notes, source, utm_source, utm_medium, utm_campaign, referrer, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(1000),
      context.supabase.from("deletion_requests").select("*").order("created_at", { ascending: false }),
    ]);
    return { jobs: jobs.data ?? [], applications: apps.data ?? [], deletionRequests: dels.data ?? [] };
  });

const jobSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens"),
  title: z.string().trim().min(3).max(150),
  department: z.string().trim().min(2).max(60),
  location: z.string().trim().min(2).max(100),
  employment_type: z.string().trim().min(2).max(40),
  experience_levels: z.array(z.enum(["fresher", "0-1", "1-3", "3+"])).min(1),
  salary_min: z.number().int().positive().nullable(),
  salary_max: z.number().int().positive().nullable(),
  highlight: z.string().trim().max(40).nullable(),
  summary: z.string().trim().min(10).max(2000),
  responsibilities: z.array(z.string().trim().min(1).max(300)).max(20),
  requirements: z.array(z.string().trim().min(1).max(300)).max(20),
  status: z.enum(["open", "closed", "draft"]),
  sort_order: z.number().int(),
  valid_through: z.string().nullable(),
});

export const saveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => jobSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { id, ...rest } = data;
    const payload = { ...rest, valid_through: rest.valid_through || null, updated_at: new Date().toISOString() };
    const q = id
      ? context.supabase.from("jobs").update(payload).eq("id", id)
      : context.supabase.from("jobs").insert(payload);
    const { error } = await q;
    if (error) throw new Error(error.message.includes("duplicate") ? "That slug is already used" : "Could not save job");
    return { ok: true };
  });

export const setJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "closed", "draft"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase
      .from("jobs")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error("Could not update job");
    return { ok: true };
  });

export const updateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        stage: z.enum(STAGES).optional(),
        hr_notes: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("applications")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error("Could not update application");
    return { ok: true };
  });

export const getResumeLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { data: app } = await context.supabase
      .from("applications")
      .select("resume_path")
      .eq("id", data.id)
      .single();
    if (!app) throw new Error("Not found");
    const { data: signed, error } = await context.supabase.storage
      .from("resumes")
      .createSignedUrl(app.resume_path, 300);
    if (error || !signed) throw new Error("Could not create link");
    return { url: signed.signedUrl };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only admins can permanently delete applications");
    const { data: app } = await context.supabase
      .from("applications")
      .select("resume_path")
      .eq("id", data.id)
      .single();
    if (app?.resume_path) await context.supabase.storage.from("resumes").remove([app.resume_path]);
    const { error } = await context.supabase.from("applications").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete");
    return { ok: true };
  });

export const updateDeletionRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "completed", "rejected"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase
      .from("deletion_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error("Could not update");
    return { ok: true };
  });
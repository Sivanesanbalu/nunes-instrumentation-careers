import { useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload, FileCheck2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitApplication, type PublicJob } from "@/lib/jobs.functions";
import { applicationSchema, checkResume, EXPERIENCE_OPTIONS } from "@/lib/application-rules";
import { readAttribution } from "@/lib/attribution";
import { COMPANY } from "@/lib/company";

type Errors = Partial<Record<string, string>>;

export function ApplicationForm({ jobs, defaultSlug }: { jobs: PublicJob[]; defaultSlug?: string }) {
  const submit = useServerFn(submitApplication);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    const form = new FormData(e.currentTarget);
    const values = {
      job_slug: String(form.get("job_slug") ?? ""),
      full_name: String(form.get("full_name") ?? ""),
      mobile: String(form.get("mobile") ?? ""),
      email: String(form.get("email") ?? ""),
      location: String(form.get("location") ?? ""),
      experience: String(form.get("experience") ?? ""),
      message: String(form.get("message") ?? ""),
      consent: form.get("consent") === "on",
    };
    const parsed = applicationSchema.safeParse(values);
    const errs: Errors = {};
    if (!parsed.success) for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
    if (!values.job_slug) errs.job_slug = "Select a role";
    const fileErr = file ? checkResume(file.name, file.size) : "Please attach your resume";
    if (fileErr) errs.resume = fileErr;
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));
    const attr = readAttribution();
    Object.entries(attr).forEach(([k, v]) => v && fd.append(k, v));
    fd.append("resume", file!);
    setBusy(true);
    try {
      const res = await submit({ data: fd });
      if (res.ok) {
        navigate({ to: "/application-received", search: { ref: res.reference, role: res.role } });
      } else setServerError(res.error);
    } catch {
      setServerError("Something went wrong while sending your application. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`e-${k}`} className="mt-1.5 text-xs text-destructive">{errors[k]}</p>
    ) : null;
  const aria = (k: string) => ({ id: `f-${k}`, "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `e-${k}` : undefined });
  const selectCls =
    "flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="f-job_slug">Applying for *</Label>
          <select name="job_slug" defaultValue={defaultSlug ?? ""} className={`mt-1.5 ${selectCls}`} {...aria("job_slug")}>
            <option value="" disabled>Select role</option>
            {jobs.map((j) => <option key={j.slug} value={j.slug}>{j.title}</option>)}
          </select>
          {err("job_slug")}
        </div>
        <div>
          <Label htmlFor="f-full_name">Full name *</Label>
          <Input name="full_name" autoComplete="name" className="mt-1.5 h-11" maxLength={100} {...aria("full_name")} />
          {err("full_name")}
        </div>
        <div>
          <Label htmlFor="f-mobile">Mobile number *</Label>
          <Input name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" className="mt-1.5 h-11" maxLength={18} {...aria("mobile")} />
          {err("mobile")}
        </div>
        <div>
          <Label htmlFor="f-email">Email address *</Label>
          <Input name="email" type="email" autoComplete="email" className="mt-1.5 h-11" maxLength={255} {...aria("email")} />
          {err("email")}
        </div>
        <div>
          <Label htmlFor="f-location">Current location *</Label>
          <Input name="location" autoComplete="address-level2" placeholder="e.g. Coimbatore" className="mt-1.5 h-11" maxLength={100} {...aria("location")} />
          {err("location")}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="f-experience">Experience *</Label>
          <select name="experience" defaultValue="" className={`mt-1.5 ${selectCls}`} {...aria("experience")}>
            <option value="" disabled>Select experience</option>
            {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {err("experience")}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="f-resume">Resume * <span className="font-normal text-muted-foreground">(PDF, DOC or DOCX, max 5 MB)</span></Label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`mt-1.5 flex w-full items-center gap-3 rounded-md border border-dashed px-4 py-4 text-left text-sm transition-colors hover:bg-muted ${errors.resume ? "border-destructive" : "border-input"}`}
            aria-describedby={errors.resume ? "e-resume" : undefined}
            id="f-resume"
          >
            {file ? <FileCheck2 className="size-5 text-success" /> : <Upload className="size-5 text-muted-foreground" />}
            <span className="truncate">{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : "Choose file to upload"}</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setErrors((p) => ({ ...p, resume: f ? (checkResume(f.name, f.size) ?? undefined) : undefined }));
            }}
          />
          {err("resume")}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="f-message">Short message</Label>
          <Textarea name="message" rows={4} maxLength={1000} className="mt-1.5" placeholder="Tell us briefly about yourself and why this role suits you." {...aria("message")} />
          {err("message")}
        </div>
      </div>
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input type="checkbox" name="consent" id="f-consent" className="mt-0.5 size-4 accent-primary" aria-invalid={!!errors.consent} />
        <span>
          I agree that Nunes Instrumentation may store and process my details and resume for recruitment purposes, as described in the{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-2">privacy notice</Link>. *
        </span>
      </label>
      {err("consent")}
      {serverError && (
        <div role="alert" className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {serverError} You can also email your resume to{" "}
            <a className="underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
          </span>
        </div>
      )}
      <Button type="submit" size="xl" className="w-full sm:w-auto" disabled={busy}>
        {busy ? <><Loader2 className="animate-spin" /> Sending application…</> : "Submit application"}
      </Button>
    </form>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { requestDataDeletion } from "@/lib/jobs.functions";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Applicant Privacy Notice | Nunes Instrumentation" }, { name: "description", content: "How Nunes Instrumentation handles applicant data, and how to request deletion." }, { property: "og:title", content: "Applicant privacy notice" }, { property: "og:description", content: "How we handle your application data." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Privacy,
});

function Privacy() {
  const send = useServerFn(requestDataDeletion);
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("busy");
    try {
      const r = await send({ data: { full_name: String(f.get("full_name")), email: String(f.get("email")), mobile: String(f.get("mobile") ?? ""), details: String(f.get("details") ?? "") } });
      setState(r.ok ? "ok" : "err");
    } catch { setState("err"); }
  }
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14 md:px-8">
        <p className="eyebrow text-primary">Privacy</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Applicant privacy notice</h1>
        <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
          <p><strong className="text-foreground">What we collect.</strong> Your name, mobile number, email, location, experience, message, resume, the role you apply for, and how you found us (e.g. LinkedIn, Indeed, Google Jobs).</p>
          <p><strong className="text-foreground">Why.</strong> Only to evaluate your application for current or future roles at {COMPANY.legal}.</p>
          <p><strong className="text-foreground">Who can see it.</strong> Only authorised HR staff signed in to the private HR dashboard. Resumes are stored privately and opened via short-lived secure links. We do not sell your data.</p>
          <p><strong className="text-foreground">Your rights.</strong> You may request access, correction or deletion of your data at any time using the form below or by emailing <a className="text-primary underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.</p>
        </div>
        <section id="delete" className="mt-12 scroll-mt-24 rounded-lg border border-border bg-card p-6 shadow-card">
          <h2 className="text-xl font-semibold">Request data deletion</h2>
          {state === "ok" ? (
            <p role="status" className="mt-4 text-success">Your request has been recorded. HR will process it and may contact you to verify your identity.</p>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 grid gap-4">
              <div><Label htmlFor="d-name">Full name *</Label><Input id="d-name" name="full_name" required minLength={2} maxLength={100} className="mt-1.5" /></div>
              <div><Label htmlFor="d-email">Email used in application *</Label><Input id="d-email" name="email" type="email" required maxLength={255} className="mt-1.5" /></div>
              <div><Label htmlFor="d-mobile">Mobile (optional)</Label><Input id="d-mobile" name="mobile" maxLength={20} className="mt-1.5" /></div>
              <div><Label htmlFor="d-details">Details (optional)</Label><Textarea id="d-details" name="details" maxLength={1000} className="mt-1.5" /></div>
              {state === "err" && <p role="alert" className="text-sm text-destructive">Could not submit. Please email {COMPANY.email} instead.</p>}
              <Button type="submit" disabled={state === "busy"} className="w-fit">{state === "busy" ? "Sending…" : "Submit request"}</Button>
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
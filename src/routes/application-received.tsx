import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/application-received")({
  validateSearch: z.object({ ref: z.string().max(20).optional(), role: z.string().max(150).optional() }),
  head: () => ({ meta: [{ title: "Application received | Nunes Instrumentation" }, { name: "description", content: "Your application has been received." }, { property: "og:title", content: "Application received" }, { property: "og:description", content: "Thank you for applying to Nunes Instrumentation." }, { name: "robots", content: "noindex" }] }),
  component: Received,
});

function Received() {
  const { ref, role } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <CheckCircle2 className="mx-auto size-14 text-success" />
        <h1 className="mt-6 text-3xl font-semibold">Application received</h1>
        <p className="mt-4 text-muted-foreground">
          Thank you. Your application{role ? ` for ${role}` : ""} and resume have been saved securely. Our HR team will review your profile, and shortlisted candidates will be contacted.
        </p>
        {ref && <p className="mt-6 font-mono text-sm">Reference: <span className="font-semibold">{ref}</span></p>}
        <p className="mt-6 text-sm text-muted-foreground">No confirmation email is sent from this portal. For questions write to <a className="text-primary underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.</p>
        <Button asChild className="mt-8"><Link to="/jobs">Back to open roles</Link></Button>
      </main>
      <SiteFooter />
    </div>
  );
}
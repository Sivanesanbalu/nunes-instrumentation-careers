import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, MessagesSquare, TrendingUp, Globe2, ShieldCheck, Award, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { JobCard } from "@/components/site/JobCard";
import { listOpenJobs } from "@/lib/jobs.functions";
import hero from "@/assets/hero-instruments.svg";
import office from "@/assets/team-office.svg";

export const jobsQuery = queryOptions({ queryKey: ["jobs"], queryFn: () => listOpenJobs() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Careers at Nunes Instrumentation | Jobs in Coimbatore" },
      { name: "description", content: "Build your career with Nunes Instrumentation, precision instrumentation specialists in Coimbatore since 1976. Freshers and experienced candidates welcome." },
      { property: "og:title", content: "Careers at Nunes Instrumentation, Coimbatore" },
      { property: "og:description", content: "Office-based roles in marketing, procurement, CRM, Generative AI and export support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(jobsQuery),
  component: Home,
});

const VALUES = [
  { icon: GraduationCap, t: "Product training", d: "Learn testing instruments, customer requirements and quotation flow." },
  { icon: MessagesSquare, t: "Communication skills", d: "Improve professional calling, email writing and follow-up communication." },
  { icon: TrendingUp, t: "Career growth", d: "Clear responsibilities and opportunities based on performance." },
  { icon: Globe2, t: "Export exposure", d: "Work with domestic customers and overseas buyer enquiries." },
];
const STEPS = [
  { t: "Apply", d: "Submit your details and resume through this portal." },
  { t: "Profile review", d: "We check your role fit, experience and communication skills." },
  { t: "Interview", d: "Shortlisted candidates will be contacted for discussion." },
  { t: "Selection", d: "Selected candidates receive joining details and training support." },
];

function Home() {
  const { data: jobs } = useSuspenseQuery(jobsQuery);
  return (
    <div className="min-h-screen bg-background">
      <section className="relative isolate overflow-hidden bg-navy">
        <SiteHeader variant="dark" />
        <img src={hero} alt="Analytical and environmental instruments on a laboratory workbench" width={1600} height={1104} className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-scrim" />
        <div className="absolute inset-0 -z-10 grid-lines opacity-40" />
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-36 md:px-8 md:pb-28 md:pt-48">
          <p className="eyebrow animate-rise text-navy-muted">Careers · Coimbatore · Est. 1976</p>
          <h1 className="animate-rise mt-5 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-navy-foreground md:text-7xl">
            Precision is a <span className="font-display font-normal italic text-cobalt-glow">career</span>, not just a spec.
          </h1>
          <p className="animate-rise mt-6 max-w-xl text-lg text-navy-muted">
            Join the team behind analytical, environmental, industrial and laboratory instrumentation. Freshers and experienced candidates welcome — training and product guidance provided.
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl"><Link to="/jobs">View open roles <ArrowRight /></Link></Button>
            <Button asChild variant="heroOutline" size="xl"><Link to="/jobs/$slug" params={{ slug: "general-application" }}>General application</Link></Button>
          </div>
          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-6 border-t border-navy-line pt-8 md:grid-cols-4">
            {[["1976", "Established"], ["ISO 9001", "Certified quality"], [String(jobs.length), "Open roles"], ["Office", "Coimbatore based"]].map(([v, l]) => (
              <div key={l}><dt className="eyebrow text-navy-muted">{l}</dt><dd className="mt-1 text-2xl font-semibold text-navy-foreground">{v}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Current openings</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Available positions</h2>
          </div>
          <Link to="/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Search & filter all roles <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-2">
          <img src={office} alt="Team coordinating customer enquiries in the office" width={1408} height={1008} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover shadow-lift" />
          <div>
            <p className="eyebrow text-primary">Why join us</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">A simple, practical and growth-focused workplace</h2>
            <p className="mt-4 text-muted-foreground">You will learn customer handling, product enquiry management, documentation and real business communication.</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {VALUES.map(({ icon: I, t, d }) => (
                <div key={t}>
                  <I className="size-6 text-primary" aria-hidden />
                  <h3 className="mt-3 font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <p className="eyebrow text-primary">Hiring process</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Simple and easy to follow</h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="bg-card p-7">
              <span className="font-mono text-sm text-primary">0{i + 1}</span>
              <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-gradient-navy">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 text-navy-foreground md:grid-cols-3 md:px-8">
          {[
            { i: ShieldCheck, t: "Your data stays private", d: "Resumes are stored securely and only visible to authorised HR staff." },
            { i: Award, t: "Who can apply", d: "English required; Tamil preferred. Hindi or other languages an added advantage." },
            { i: MapPin, t: "Office based", d: "All roles are full-time and based at our Coimbatore office." },
          ].map(({ i: I, t, d }) => (
            <div key={t} className="flex gap-4"><I className="size-6 shrink-0 text-cobalt-glow" /><div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-navy-muted">{d}</p></div></div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
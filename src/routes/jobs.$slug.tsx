import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Share2, Check, MapPin, Briefcase, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { getOpenJob } from "@/lib/jobs.functions";
import { formatSalary } from "@/lib/application-rules";
import { COMPANY, EXPERIENCE_LABEL } from "@/lib/company";
import { jobsQuery } from "./index";

export const Route = createFileRoute("/jobs/$slug")({
  loader: async ({ params, context }) => {
    const [job] = await Promise.all([getOpenJob({ data: { slug: params.slug } }), context.queryClient.ensureQueryData(jobsQuery)]);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => {
    const job = loaderData?.job;
    if (!job) return { meta: [{ title: "Role unavailable | Nunes Instrumentation" }, { name: "robots", content: "noindex" }] };
    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.title,
      description: `<p>${job.summary}</p><ul>${[...job.responsibilities, ...job.requirements].map((x) => `<li>${x}</li>`).join("")}</ul>`,
      datePosted: job.date_posted,
      ...(job.valid_through ? { validThrough: job.valid_through } : {}),
      employmentType: "FULL_TIME",
      hiringOrganization: { "@type": "Organization", name: COMPANY.legal, sameAs: COMPANY.website },
      jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", streetAddress: "Sundarar St, Rathinapuri", addressLocality: COMPANY.city, addressRegion: COMPANY.region, addressCountry: "IN" } },
      directApply: true,
    };
    if (job.salary_min || job.salary_max)
      ld.baseSalary = { "@type": "MonetaryAmount", currency: "INR", value: { "@type": "QuantitativeValue", minValue: job.salary_min, maxValue: job.salary_max, unitText: "MONTH" } };
    const desc = job.summary.slice(0, 155);
    return {
      meta: [
        { title: `${job.title} – Coimbatore | Nunes Instrumentation Careers` },
        { name: "description", content: desc },
        { property: "og:title", content: `${job.title} at Nunes Instrumentation` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(ld) }],
    };
  },
  component: JobDetail,
});

function JobDetail() {
  const { job } = Route.useLoaderData();
  const { data: jobs } = useSuspenseQuery(jobsQuery);
  const [copied, setCopied] = useState(false);
  const salary = formatSalary(job.salary_min, job.salary_max);
  async function share() {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      try { await navigator.share({ title: job.title, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-gradient-navy text-navy-foreground">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-navy-muted hover:text-navy-foreground"><ArrowLeft className="size-4" /> All roles</Link>
          <p className="eyebrow mt-8 text-cobalt-glow">{job.department}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">{job.title}</h1>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-muted">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{job.location}</span>
            <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" />{job.employment_type}</span>
            {salary && <span className="inline-flex items-center gap-1.5 text-navy-foreground"><IndianRupee className="size-4" />{salary.replace("₹", "")}</span>}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl"><a href="#apply">Apply for this role</a></Button>
            <Button variant="heroOutline" size="xl" onClick={share}>{copied ? <><Check /> Link copied</> : <><Share2 /> Share</>}</Button>
          </div>
        </div>
      </section>
      <main className="mx-auto grid max-w-7xl gap-12 px-5 py-14 md:px-8 lg:grid-cols-[1fr_1.1fr]">
        <article className="space-y-8">
          <p className="text-lg leading-relaxed">{job.summary}</p>
          {job.responsibilities.length > 0 && (<div><h2 className="text-xl font-semibold">What you'll do</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">{job.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul></div>)}
          {job.requirements.length > 0 && (<div><h2 className="text-xl font-semibold">What we look for</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul></div>)}
          <div><h2 className="text-xl font-semibold">Experience</h2><p className="mt-2 text-muted-foreground">{job.experience_levels.map((e) => EXPERIENCE_LABEL[e] ?? e).join(" · ")}. Training and product guidance will be provided.</p></div>
          {salary && <p className="text-xs text-muted-foreground">Salary range as published on the official Nunes Instrumentation hiring page; final offer is role-based.</p>}
        </article>
        <section id="apply" className="scroll-mt-24 rounded-lg border border-border bg-card p-6 shadow-card md:p-8">
          <h2 className="text-2xl font-semibold">Apply now</h2>
          <p className="mt-1 text-sm text-muted-foreground">Prefer email? Send your resume to <a className="text-primary underline" href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(job.title)}`}>{COMPANY.email}</a> with the role name in the subject.</p>
          <div className="mt-6"><ApplicationForm jobs={jobs} defaultSlug={job.slug} /></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
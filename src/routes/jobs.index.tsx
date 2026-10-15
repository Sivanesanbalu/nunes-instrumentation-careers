import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { JobCard } from "@/components/site/JobCard";
import { jobsQuery } from "./index";
import { EXPERIENCE_OPTIONS } from "@/lib/application-rules";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "Open Roles | Nunes Instrumentation Careers" },
      { name: "description", content: "Search current job openings at Nunes Instrumentation, Coimbatore. Filter by department and experience." },
      { property: "og:title", content: "Open roles at Nunes Instrumentation" },
      { property: "og:description", content: "Search and filter current openings in Coimbatore." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(jobsQuery),
  component: Jobs,
});

function Jobs() {
  const { data: jobs } = useSuspenseQuery(jobsQuery);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [exp, setExp] = useState("");
  const depts = [...new Set(jobs.map((j) => j.department))];
  const filtered = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (!dept || j.department === dept) &&
          (!exp || j.experience_levels.includes(exp)) &&
          (!q || `${j.title} ${j.summary} ${j.department}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [jobs, q, dept, exp],
  );
  const sel = "h-11 rounded-md border border-input bg-background px-3 text-sm";
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <p className="eyebrow text-primary">Open roles</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Find your role</h1>
        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <span className="sr-only">Search roles</span>
            <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles…" className="h-11 pl-9" />
          </label>
          <select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)} className={sel}>
            <option value="">All departments</option>
            {depts.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select aria-label="Experience" value={exp} onChange={(e) => setExp(e.target.value)} className={sel}>
            <option value="">Any experience</option>
            {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">{filtered.length} role{filtered.length === 1 ? "" : "s"}</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
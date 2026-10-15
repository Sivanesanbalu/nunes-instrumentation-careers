import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin, Briefcase, IndianRupee } from "lucide-react";
import type { PublicJob } from "@/lib/jobs.functions";
import { formatSalary } from "@/lib/application-rules";

export function JobCard({ job }: { job: PublicJob }) {
  const salary = formatSalary(job.salary_min, job.salary_max);
  return (
    <Link
      to="/jobs/$slug"
      params={{ slug: job.slug }}
      className="group relative flex flex-col rounded-lg border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow text-primary">{job.department}</span>
        {job.highlight && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{job.highlight}</span>
        )}
      </div>
      <h3 className="mt-3 text-xl font-semibold leading-snug text-foreground">{job.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{job.summary}</p>
      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{job.location}</span>
        <span className="inline-flex items-center gap-1.5"><Briefcase className="size-3.5" />{job.employment_type}</span>
        {salary && <span className="inline-flex items-center gap-1.5 font-medium text-foreground"><IndianRupee className="size-3.5" />{salary.replace("₹", "")}</span>}
      </div>
      <ArrowUpRight className="absolute right-5 top-5 size-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
    </Link>
  );
}
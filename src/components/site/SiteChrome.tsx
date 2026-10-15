import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";

const NAV = [
  { to: "/", label: "Careers" },
  { to: "/jobs", label: "Open roles" },
  { to: "/privacy", label: "Privacy" },
] as const;

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Nunes Instrumentation careers home">
      <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground font-mono text-sm font-bold">
        NI
      </span>
      <span className="leading-tight">
        <span className={`block text-sm font-semibold tracking-wide ${inverted ? "text-navy-foreground" : "text-foreground"}`}>
          NUNES INSTRUMENTATION
        </span>
        <span className={`eyebrow block !text-[0.6rem] ${inverted ? "text-navy-muted" : "text-muted-foreground"}`}>
          Careers · Est. {COMPANY.est}
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const dark = variant === "dark";
  return (
    <header className={dark ? "absolute inset-x-0 top-0 z-30" : "sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur"}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <Logo inverted={dark} />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className={`text-sm font-medium transition-colors ${dark ? "text-navy-muted hover:text-navy-foreground" : "text-muted-foreground hover:text-foreground"}`}
              activeProps={{ className: dark ? "!text-navy-foreground" : "!text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
          <Button asChild variant={dark ? "hero" : "default"}>
            <Link to="/jobs">Apply now</Link>
          </Button>
        </nav>
        <button
          className={`md:hidden ${dark ? "text-navy-foreground" : "text-foreground"}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-5 py-4 md:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block py-3 text-base font-medium text-foreground">
              {n.label}
            </Link>
          ))}
          <Button asChild className="mt-3 w-full" size="xl">
            <Link to="/jobs" onClick={() => setOpen(false)}>Apply now</Link>
          </Button>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-gradient-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <Logo inverted />
          <p className="mt-5 max-w-sm text-sm text-navy-muted">
            Precision analytical, environmental, industrial and laboratory instrumentation — supplied, serviced and
            exported from Coimbatore since {COMPANY.est}.
          </p>
          <a href={COMPANY.website} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm text-navy-foreground underline-offset-4 hover:underline">
            Official company website <ExternalLink className="size-3.5" />
          </a>
        </div>
        <div>
          <p className="eyebrow text-navy-muted">Careers</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/jobs" className="hover:underline">Open roles</Link></li>
            <li><Link to="/privacy" className="hover:underline">Privacy notice</Link></li>
            <li><Link to="/privacy" hash="delete" className="hover:underline">Request data deletion</Link></li>
            <li><Link to="/admin" className="hover:underline">HR sign in</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-navy-muted">Contact</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0" /><a href={`mailto:${COMPANY.email}`} className="hover:underline">{COMPANY.email}</a></li>
            <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0" /><a href={COMPANY.phoneHref} className="hover:underline">{COMPANY.phone}</a></li>
            <li className="flex gap-2 text-navy-muted"><MapPin className="mt-0.5 size-4 shrink-0" />{COMPANY.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-line">
        <p className="mx-auto max-w-7xl px-5 py-5 text-xs text-navy-muted md:px-8">
          © {new Date().getFullYear()} {COMPANY.legal}. Careers portal.
        </p>
      </div>
    </footer>
  );
}
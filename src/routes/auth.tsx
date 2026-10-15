import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "HR sign in | Nunes Instrumentation" }, { name: "description", content: "Private sign-in for HR staff." }, { property: "og:title", content: "HR sign in" }, { property: "og:description", content: "Private HR area." }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      setMsg(error ? error.message : "Check your email to confirm your account. HR access must then be granted by the account owner.");
    }
    setBusy(false);
  }
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-navy px-5">
      <div className="w-full max-w-sm rounded-lg bg-card p-8 shadow-lift">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold">{mode === "in" ? "HR sign in" : "Create staff account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Private area. Accounts only see applicant data after HR access is granted.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div><Label htmlFor="a-email">Email</Label><Input id="a-email" name="email" type="email" required className="mt-1.5" /></div>
          <div><Label htmlFor="a-pw">Password</Label><Input id="a-pw" name="password" type="password" required minLength={8} className="mt-1.5" /></div>
          {msg && <p role="alert" className="text-sm text-muted-foreground">{msg}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
        <button className="mt-4 text-sm text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Need an account? Create one" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
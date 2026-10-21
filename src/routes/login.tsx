import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from "lucide-react";

import { adminExists, createFirstAdmin, getSession, signIn } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In | Workspace" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: bootstrap } = useQuery({
    queryKey: ["admin-exists"],
    queryFn: () => adminExists(),
  });
  const needsFirstAdmin = bootstrap?.exists === false;

  useEffect(() => {
    getSession()
      .then((user) => {
        if (user) navigate({ to: "/admin", replace: true });
      })
      .catch(() => {});
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (needsFirstAdmin) {
        await createFirstAdmin({ data: { email, password } });
        toast.success("Administrator account created.");
      }
      await signIn({ data: { email, password } });
      queryClient.clear();
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent-foreground">
          Workspace
        </p>
        <h1 className="font-display text-3xl text-foreground">
          {needsFirstAdmin ? "Create administrator" : "Admin sign in"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {needsFirstAdmin
            ? "Set up the first administrator account."
            : "Sign in to manage the app tiles."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={needsFirstAdmin ? "new-password" : "current-password"}
                required
                className="pl-9 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {needsFirstAdmin ? "Create Administrator" : "Login"}
          </Button>
        </form>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to workspace
        </Link>
      </div>
    </main>
  );
}

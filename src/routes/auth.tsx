import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AudioLines, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PASSWORD_RULE = /^(?=.*[^A-Za-z0-9]).{8,}$/;

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Audiomaxxer- Train your listening skills" },
      {
        name: "description",
        content:
          "Take a quick hearing screening and know your results. Train your listening skills with adaptive drills that adapt to your results.",
      },
      { property: "og:title", content: "Sign in | Audiomaxxer- Train your listening skills" },
      {
        property: "og:description",
        content: "Take a quick hearing screening and know your results. Train your listening skills with adaptive drills that adapt to your results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/test" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!PASSWORD_RULE.test(password)) {
          toast.error(t("auth.passwordRule"));
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/test` },
        });
        if (error) throw error;
        toast.success(t("auth.created"));

      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.failed"));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t("auth.googleFailed"));
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/test" });
  }

  return (
    <div className="hero-surface flex min-h-screen items-center justify-center px-5 py-16">
      <div className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card/80 p-8 shadow-glow">
        <Link
          to="/"
          aria-label={t("auth.close")}
          title={t("auth.close")}
          className="absolute right-4 top-4 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Link>
        <AudioLines className="h-6 w-6 text-signal" />
        <h1 className="mt-4 text-2xl font-semibold">
          {mode === "signin" ? t("auth.welcomeBack") : t("auth.createAccount")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.lead")}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : 6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={mode === "signup" ? "password-rule" : undefined}
            />
            {mode === "signup" ? (
              <p id="password-rule" className="text-xs text-muted-foreground">
                {t("auth.passwordRule")}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> {t("auth.or")} <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="secondary" className="w-full" onClick={() => void google()}>
          {t("auth.google")}
        </Button>

        <button
          type="button"
          className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? t("auth.toSignUp") : t("auth.toSignIn")}
        </button>

        <Link
          to="/"
          className="mt-3 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {t("auth.continueWithout")}
        </Link>
      </div>
    </div>
  );
}

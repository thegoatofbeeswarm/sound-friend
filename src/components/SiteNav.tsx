import { Link } from "@tanstack/react-router";
import { AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AppSettings } from "@/components/AppSettings";
import { useI18n } from "@/lib/i18n";

export function SiteNav() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-5 py-2">
        <Link to="/" className="group flex shrink-0 items-center gap-2">
          <AudioLines className="icon-bubble h-5 w-5 text-signal" />
          <span className="font-display text-lg font-semibold tracking-tight transition-colors group-hover:text-signal">
            Audiomaxxer
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <nav className="flex items-center gap-0.5 text-sm max-[760px]:hidden">
            <Link to="/test" className="nav-link rounded-md px-3 py-2 text-muted-foreground" activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}>
              {t("nav.test")}
            </Link>
            <Link to="/train" className="nav-link rounded-md px-3 py-2 text-muted-foreground" activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}>
              {t("nav.train")}
            </Link>
            <Link to="/risks" className="nav-link rounded-md px-3 py-2 text-muted-foreground" activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}>
              {t("nav.risks")}
            </Link>
            <Link to="/report" className="nav-link rounded-md px-3 py-2 text-muted-foreground" activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}>
              Report
            </Link>
            <Link to="/science" className="nav-link rounded-md px-3 py-2 text-muted-foreground" activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}>
              Science
            </Link>
            <Link to="/history" className="nav-link rounded-md px-3 py-2 text-muted-foreground" activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}>
              {t("nav.history")}
            </Link>
          </nav>
          <AppSettings />
          {user ? (
            <Button variant="ghost" size="sm" className="transition-transform hover:scale-105 max-[760px]:hidden" onClick={() => void signOut()}>
              {t("nav.signOut")}
            </Button>
          ) : (
            <Button asChild size="sm" className="transition-transform hover:scale-105 max-[760px]:hidden">
              <Link to="/auth">{t("nav.signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}


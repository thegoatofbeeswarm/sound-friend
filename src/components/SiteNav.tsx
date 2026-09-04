import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AudioLines, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AppSettings } from "@/components/AppSettings";
import { useI18n } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SiteNav() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/test" as const, label: t("nav.test") },
    { to: "/speech" as const, label: t("nav.speech") },
    { to: "/train" as const, label: t("nav.train") },
    { to: "/risks" as const, label: t("nav.risks") },
    { to: "/data" as const, label: t("nav.data") },
    { to: "/report" as const, label: t("nav.report") },
    { to: "/science" as const, label: t("nav.science") },
    { to: "/history" as const, label: t("nav.history") },
    { to: "/team" as const, label: t("nav.team") },
  ];


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
            <Link
              to="/test"
              className="nav-link rounded-md px-3 py-2 text-muted-foreground"
              activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
            >
              {t("nav.test")}
            </Link>
            <Link
              to="/speech"
              className="nav-link rounded-md px-3 py-2 text-muted-foreground"
              activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
            >
              {t("nav.speech")}
            </Link>
            <Link
              to="/train"
              className="nav-link rounded-md px-3 py-2 text-muted-foreground"
              activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
            >
              {t("nav.train")}
            </Link>
            <Link
              to="/risks"
              className="nav-link rounded-md px-3 py-2 text-muted-foreground"
              activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
            >
              {t("nav.risks")}
            </Link>
            <Link
              to="/data"
              className="nav-link rounded-md px-3 py-2 text-muted-foreground"
              activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
            >
              Data
            </Link>
            <Link
              to="/report"
              className="nav-link rounded-md px-3 py-2 text-muted-foreground"
              activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
            >
              Report
            </Link>
            <Link
              to="/science"
              className="nav-link rounded-md px-3 py-2 text-muted-foreground"
              activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
            >
              Science
            </Link>
            <Link
              to="/history"
              className="nav-link rounded-md px-3 py-2 text-muted-foreground"
              activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
            >
              {t("nav.history")}
            </Link>
            <Link
              to="/team"
              className="nav-link rounded-md px-3 py-2 text-muted-foreground"
              activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
            >
              {t("nav.team")}
            </Link>

          </nav>
          <AppSettings />
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="transition-transform hover:scale-105 max-[760px]:hidden"
              onClick={() => void signOut()}
            >
              {t("nav.signOut")}
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="transition-transform hover:scale-105 max-[760px]:hidden"
            >
              <Link to="/auth">{t("nav.signIn")}</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={t("nav.menu")}
                className="icon-bubble rounded-full bg-card/60 text-muted-foreground hover:text-signal min-[761px]:hidden"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{t("nav.menu")}</SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-4 pb-6">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base text-muted-foreground"
                    activeProps={{ className: "rounded-md px-3 py-3 text-base font-semibold text-foreground" }}
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="mt-4">
                  {user ? (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        setOpen(false);
                        void signOut();
                      }}
                    >
                      {t("nav.signOut")}
                    </Button>
                  ) : (
                    <Button asChild className="w-full" onClick={() => setOpen(false)}>
                      <Link to="/auth">{t("nav.signIn")}</Link>
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

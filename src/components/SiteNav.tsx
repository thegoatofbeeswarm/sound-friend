import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AudioLines, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AppSettings } from "@/components/AppSettings";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavPath = "/test" | "/speech" | "/profile" | "/train" | "/history" | "/report" | "/data" | "/science" | "/risks" | "/validation" | "/team" | "/research";

export function SiteNav({ transparent = false }: { transparent?: boolean } = {}) {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const groups: { label: string; to: NavPath; items: { to: NavPath; label: string }[] }[] = [
    {
      label: t("nav.testGroup"),
      to: "/test",
      items: [
        { to: "/test", label: t("nav.tone") },
        { to: "/speech", label: t("nav.speech") },
      ],
    },
    {
      label: t("nav.profile"),
      to: "/profile",
      items: [
        { to: "/profile", label: t("nav.profileMain") },
        { to: "/history", label: t("nav.history") },
        { to: "/report", label: t("nav.report") },
        { to: "/data", label: t("nav.data") },
      ],
    },
    {
      label: t("nav.train"),
      to: "/train",
      items: [],
    },
    {
      label: t("nav.learn"),
      to: "/science",
      items: [
        { to: "/science", label: t("nav.science") },
        { to: "/risks", label: t("nav.risks") },
      ],
    },
    {
      label: t("nav.about"),
      to: "/team",
      items: [{ to: "/team", label: t("nav.team") }],
    },
    {
      label: t("nav.researchGroup"),
      to: "/research",
      items: [
        { to: "/research", label: t("nav.research") },
        { to: "/validation", label: t("nav.validation") },
      ],
    },

  ];

  return (
    <header
      className={
        transparent
          ? "absolute inset-x-0 top-0 z-40 bg-transparent"
          : "sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur"
      }
    >
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-5 py-2">
        <Link to="/" className="group flex shrink-0 items-center gap-2">
          <AudioLines className="icon-bubble h-5 w-5 text-signal" />
          <span className="font-display text-lg font-semibold tracking-tight transition-colors group-hover:text-signal">
            Audiomaxxer
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <nav className="flex items-center gap-0.5 text-sm max-[760px]:hidden">
            {groups.map((g) =>
              g.items.length === 0 ? (
                <Link
                  key={g.label}
                  to={g.to}
                  className="nav-link rounded-md px-3 py-2 text-muted-foreground"
                  activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
                >
                  {g.label}
                </Link>
              ) : (
                <DropdownMenu key={g.label}>
                  <DropdownMenuTrigger className="nav-link inline-flex items-center gap-1 rounded-md px-3 py-2 text-muted-foreground outline-none transition-colors hover:text-foreground data-[state=open]:text-foreground">
                    {g.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-48">
                    {g.items.map((i) => (
                      <DropdownMenuItem key={i.to} asChild>
                        <Link to={i.to}>{i.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            )}
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
            <SheetContent side="right" className="w-72 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("nav.menu")}</SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-4 pb-6">
                {groups.map((g) => (
                  <div key={g.label} className="mb-2">
                    {g.items.length === 0 ? (
                      <Link
                        to={g.to}
                        onClick={() => setOpen(false)}
                        className="block rounded-md px-3 py-3 text-base text-muted-foreground"
                        activeProps={{ className: "block rounded-md px-3 py-3 text-base font-semibold text-foreground" }}
                      >
                        {g.label}
                      </Link>
                    ) : (
                      <>
                        <p className="px-3 pt-2 text-xs uppercase tracking-wide text-muted-foreground/70">
                          {g.label}
                        </p>
                        {g.items.map((i) => (
                          <Link
                            key={i.to}
                            to={i.to}
                            onClick={() => setOpen(false)}
                            className="block rounded-md px-3 py-2.5 text-base text-muted-foreground"
                            activeProps={{ className: "block rounded-md px-3 py-2.5 text-base font-semibold text-foreground" }}
                          >
                            {i.label}
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
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

import { Link } from "@tanstack/react-router";
import { AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function SiteNav() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="group flex items-center gap-2">
          <AudioLines className="icon-bubble h-5 w-5 text-signal" />
          <span className="font-display text-lg font-semibold tracking-tight transition-colors group-hover:text-signal">
            Audiomaxxer
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/test"
            className="nav-link rounded-md px-3 py-2 text-muted-foreground"
            activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
          >
            Hearing test
          </Link>
          <Link
            to="/train"
            className="nav-link rounded-md px-3 py-2 text-muted-foreground"
            activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
          >
            Train
          </Link>
          <Link
            to="/risks"
            className="nav-link hidden rounded-md px-3 py-2 text-muted-foreground sm:inline-block"
            activeProps={{
              className: "nav-link hidden rounded-md px-3 py-2 text-foreground sm:inline-block",
            }}
          >
            Risks
          </Link>
          <Link
            to="/history"
            className="nav-link rounded-md px-3 py-2 text-muted-foreground"
            activeProps={{ className: "nav-link rounded-md px-3 py-2 text-foreground" }}
          >
            History
          </Link>
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="transition-transform hover:scale-105"
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
          ) : (
            <Button asChild size="sm" className="transition-transform hover:scale-105">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

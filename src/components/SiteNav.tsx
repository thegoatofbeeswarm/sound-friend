import { Link } from "@tanstack/react-router";
import { AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function SiteNav() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <AudioLines className="h-5 w-5 text-signal" />
          <span className="font-display text-lg font-semibold tracking-tight">Audiomaxxer</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/test"
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-foreground" }}
          >
            Hearing test
          </Link>
          <Link
            to="/train"
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-foreground" }}
          >
            Train
          </Link>
          <Link
            to="/risks"
            className="hidden rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            activeProps={{ className: "hidden rounded-md px-3 py-2 text-foreground sm:inline-block" }}
          >
            Risks
          </Link>
          <Link
            to="/history"
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-foreground" }}
          >
            History
          </Link>
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { MessageSquarePlus, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCreateThread, useThreads } from "@/components/CoachThreads";

function initials(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "..";
  return (words[0]![0]! + (words[1]?.[0] ?? "")).toUpperCase();
}

/** Global coach rail: circular shortcuts that open or start a coach conversation. */
export function CoachRail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: threads } = useThreads(user?.id);
  const create = useCreateThread(user?.id);

  if (pathname.startsWith("/auth")) return null;

  const activeId = pathname.startsWith("/coach/") ? pathname.split("/")[2] : undefined;

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        aria-label="Hearing coach"
        className="fixed right-3 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-border/60 bg-background/85 p-2 shadow-lg backdrop-blur"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="icon-bubble h-11 w-11 rounded-full"
              aria-label="Start a conversation with your coach"
              disabled={create.isPending}
              onClick={() => {
                if (!user) {
                  void navigate({ to: "/auth" });
                  return;
                }
                create.mutate();
              }}
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Ask your hearing coach</TooltipContent>
        </Tooltip>

        {(threads ?? []).slice(0, 5).map((t) => (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <Link
                to="/coach/$threadId"
                params={{ threadId: t.id }}
                aria-label={t.title}
                className={`icon-bubble flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold ${
                  t.id === activeId
                    ? "border-signal bg-signal/15 text-foreground"
                    : "border-border/70 bg-card/70 text-muted-foreground hover:border-signal/60 hover:text-foreground"
                }`}
              >
                {initials(t.title)}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">{t.title}</TooltipContent>
          </Tooltip>
        ))}

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/coach"
              aria-label="All coach conversations"
              className="icon-bubble flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <Sparkle className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left">All conversations</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}

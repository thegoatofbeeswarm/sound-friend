import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { CoachThreads, useCreateThread, useThreads } from "@/components/CoachThreads";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/coach/")({
  head: () => ({
    meta: [
      { title: "AI Hearing Coach | Audiomaxxer- Check on and Improve your hearing with Audiomaxxer" },
      {
        name: "description",
        content:
          "Take a quick hearing screening and know your results. Improve your hearing with custom tests.",
      },
      { property: "og:title", content: "AI Hearing Coach | Audiomaxxer- Check on and Improve your hearing with Audiomaxxer" },
      {
        property: "og:description",
        content: "Take a quick hearing screening and know your results. Improve your hearing with custom tests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoachIndex,
});

function CoachIndex() {
  const { user, loading } = useAuth();
  const { data: threads } = useThreads(user?.id);
  const create = useCreateThread(user?.id);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-signal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="flex">
        {user ? <CoachThreads userId={user.id} /> : null}
        <main className="flex-1 px-5 py-12">
          <div className="mx-auto max-w-xl">
            <h1 className="text-3xl font-semibold">Your hearing coach</h1>
            <p className="mt-3 text-muted-foreground">
              Ask anything about your screenings, audiogram, training curve, device choice or
              overuse risk. The coach answers from your own saved data.
            </p>
            {!user ? (
              <Button asChild className="mt-8">
                <Link to="/auth">Sign in to start</Link>
              </Button>
            ) : (
              <>
                <Button className="mt-8" onClick={() => create.mutate()} disabled={create.isPending}>
                  <MessageSquarePlus className="mr-2 h-4 w-4" /> New conversation
                </Button>
                {(threads ?? []).length > 0 ? (
                  <div className="mt-8 space-y-2">
                    <p className="text-sm text-muted-foreground">Recent conversations</p>
                    {threads!.map((t) => (
                      <Link
                        key={t.id}
                        to="/coach/$threadId"
                        params={{ threadId: t.id }}
                        className="block truncate rounded-xl border border-border/70 bg-card/50 px-4 py-3 text-sm hover:border-signal/50"
                      >
                        {t.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { UIMessage } from "ai";
import { SiteNav } from "@/components/SiteNav";
import { CoachThreads } from "@/components/CoachThreads";
import { CoachChat } from "@/components/CoachChat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/coach/$threadId")({
  head: () => ({
    meta: [
      { title: "Coach Conversation - Audible" },
      {
        name: "description",
        content:
          "A saved conversation with the Audible hearing coach about your audiogram, safe listening ceiling and training progress.",
      },
      { property: "og:title", content: "Coach Conversation - Audible" },
      {
        property: "og:description",
        content: "Revisit what your hearing coach explained about your results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoachThreadPage,
});

function CoachThreadPage() {
  const { threadId } = Route.useParams();
  const { user, loading } = useAuth();

  const { data: initial, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["chat-messages", threadId],
    queryFn: async (): Promise<UIMessage[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: m.content }],
        }));
    },
  });

  if (loading || (user && isLoading)) {
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
        <CoachThreads userId={user?.id} activeId={threadId} />
        <main className="min-w-0 flex-1">
          {!user ? (
            <div className="mx-auto max-w-xl px-5 py-16">
              <p className="text-muted-foreground">Sign in to talk with your hearing coach.</p>
              <Button asChild className="mt-5">
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          ) : (
            <CoachChat
              key={threadId}
              threadId={threadId}
              userId={user.id}
              initialMessages={initial ?? []}
            />
          )}
        </main>
      </div>
    </div>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function useThreads(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["chat-threads", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateThread(userId: string | undefined) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({ user_id: userId! })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("No thread");
      return data.id as string;
    },
    onSuccess: (id) => {
      void qc.invalidateQueries({ queryKey: ["chat-threads", userId] });
      void navigate({ to: "/coach/$threadId", params: { threadId: id } });
    },
    onError: () => toast.error("Could not start a new conversation."),
  });
}

export function CoachThreads({
  userId,
  activeId,
}: {
  userId: string | undefined;
  activeId?: string;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: threads } = useThreads(userId);
  const create = useCreateThread(userId);

  async function remove(id: string) {
    const { error } = await supabase.from("chat_threads").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete that conversation.");
      return;
    }
    void qc.invalidateQueries({ queryKey: ["chat-threads", userId] });
    if (id === activeId) void navigate({ to: "/coach" });
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 p-4 md:block">
      <Button className="w-full" size="sm" onClick={() => create.mutate()}>
        <MessageSquarePlus className="mr-2 h-4 w-4" /> New conversation
      </Button>
      <nav className="mt-4 space-y-1">
        {(threads ?? []).map((t) => (
          <div
            key={t.id}
            className={`group flex items-center gap-1 rounded-lg px-2 ${
              t.id === activeId ? "bg-card" : "hover:bg-card/60"
            }`}
          >
            <Link
              to="/coach/$threadId"
              params={{ threadId: t.id }}
              className="flex-1 truncate py-2 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "flex-1 truncate py-2 text-sm text-foreground" }}
            >
              {t.title}
            </Link>
            <button
              type="button"
              aria-label="Delete conversation"
              onClick={() => void remove(t.id)}
              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {(threads ?? []).length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">No conversations yet.</p>
        ) : null}
      </nav>
    </aside>
  );
}

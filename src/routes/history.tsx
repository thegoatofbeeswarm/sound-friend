import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Audiogram } from "@/components/Audiogram";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Ear, ThresholdResult } from "@/lib/audiometry";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Hearing History | Audiomaxxer- Check on and Improve your hearing with Audiomaxxer" },
      {
        name: "description",
        content:
          "Take a quick hearing screening and know your results. Improve your hearing with custom tests.",
      },
      { property: "og:title", content: "Hearing History | Audiomaxxer- Check on and Improve your hearing with Audiomaxxer" },
      {
        property: "og:description",
        content: "Take a quick hearing screening and know your results. Improve your hearing with custom tests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user, loading } = useAuth();

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["hearing-history", user?.id],
    queryFn: async () => {
      const { data: tests, error } = await supabase
        .from("hearing_tests")
        .select("id, created_at, avg_threshold_db, worst_threshold_db, safe_volume_offset_db, trials, environment_db")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: points, error: pErr } = await supabase
        .from("threshold_points")
        .select("test_id, ear, frequency_hz, threshold_db, confidence");
      if (pErr) throw pErr;

      return (tests ?? []).map((t) => ({
        ...t,
        points: (points ?? [])
          .filter((p) => p.test_id === t.id)
          .map<ThresholdResult>((p) => ({
            ear: p.ear as Ear,
            frequency: p.frequency_hz,
            thresholdDb: Number(p.threshold_db),
            confidence: Number(p.confidence),
          })),
      }));
    },
  });

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="text-3xl font-semibold">Your hearing over time</h1>

        {loading || (user && isLoading) ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-signal" />
          </div>
        ) : !user ? (
          <div className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-8">
            <p className="text-muted-foreground">Sign in to see your saved screenings.</p>
            <Button asChild className="mt-5">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-8">
            <p className="text-muted-foreground">No screenings saved yet.</p>
            <Button asChild className="mt-5">
              <Link to="/test">Run your first test</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {data!.map((t) => (
              <article
                key={t.id}
                className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold">
                    {new Date(t.created_at).toLocaleString()}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    avg {Number(t.avg_threshold_db ?? 0).toFixed(1)} dB · ceiling{" "}
                    {85 + Number(t.safe_volume_offset_db ?? 0)} dB · {t.trials} trials
                    {t.environment_db ? ` · room ~${Number(t.environment_db)} dB` : ""}
                  </p>
                </div>
                <div className="mt-4">
                  <Audiogram points={t.points} />
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

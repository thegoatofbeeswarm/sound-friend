import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, BellRing, Loader2, Play, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SiteNav } from "@/components/SiteNav";
import { TrainingProgress, type ProgressPoint } from "@/components/TrainingProgress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { unlockAudio } from "@/lib/audiometry";
import {
  createTrainer,
  nextRound,
  playSoundscape,
  scoreRound,
  stopSoundscape,
  quietestHeard,
  type TrainerState,
  type TrainingRound,
} from "@/lib/soundscapes";
import {
  DAY_LABELS,
  armReminder,
  formatNextRun,
  permission,
  requestNotificationPermission,
  type Schedule,
} from "@/lib/reminders";

export const Route = createFileRoute("/train")({
  head: () => ({
    meta: [
      { title: "Adaptive Hearing Training - Audible" },
      {
        name: "description",
        content:
          "Train your hearing with real-world sounds - from light breathing to a passing motorcycle - in a closed-loop session that gets harder or easier as you answer.",
      },
      { property: "og:title", content: "Adaptive Hearing Training - Audible" },
      {
        property: "og:description",
        content: "A closed-loop hearing gym built on real-world soundscapes, with progress tracking and reminders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainPage,
});

const ROUNDS = 12;
type Phase = "intro" | "playing" | "answer" | "done";

function TrainPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [trainer, setTrainer] = useState<TrainerState>(() => createTrainer());
  const [round, setRound] = useState<TrainingRound | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const saved = useRef(false);

  const { data: ceiling } = useQuery({
    enabled: !!user,
    queryKey: ["latest-ceiling", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("hearing_tests")
        .select("safe_volume_offset_db")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return 85 + Number(data?.safe_volume_offset_db ?? 0);
    },
  });

  const { data: sessions } = useQuery({
    enabled: !!user,
    queryKey: ["training-sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("id, created_at, accuracy, end_level, quietest_db, rounds, correct")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const play = useCallback(async (r: TrainingRound) => {
    setPhase("playing");
    await new Promise((res) => setTimeout(res, 350));
    await playSoundscape(r.target.id, r.levelDb);
    setPhase("answer");
  }, []);

  async function begin() {
    await unlockAudio();
    saved.current = false;
    const fresh = createTrainer();
    setTrainer(fresh);
    setLastCorrect(null);
    const r = nextRound(fresh, ceiling ?? 85);
    setRound(r);
    await play(r);
  }

  async function answer(id: string) {
    if (!round || phase !== "answer") return;
    const correct = id === round.target.id;
    setLastCorrect(correct);
    const next = scoreRound(trainer, round, correct);
    setTrainer(next);
    await new Promise((res) => setTimeout(res, 900));
    if (next.rounds >= ROUNDS) {
      setRound(null);
      setPhase("done");
      return;
    }
    const r = nextRound(next, ceiling ?? 85);
    setRound(r);
    setLastCorrect(null);
    await play(r);
  }

  useEffect(() => () => stopSoundscape(), []);

  useEffect(() => {
    if (phase !== "done" || !user || saved.current) return;
    saved.current = true;
    void (async () => {
      const { error } = await supabase.from("training_sessions").insert({
        user_id: user.id,
        rounds: trainer.rounds,
        correct: trainer.correct,
        accuracy: Math.round((trainer.correct / Math.max(1, trainer.rounds)) * 100),
        start_level: 3,
        end_level: Math.round(trainer.level * 10) / 10,
        quietest_db: quietestHeard(trainer),
      });
      if (error) toast.error("Could not save this session.");
      else {
        toast.success("Session saved.");
        void qc.invalidateQueries({ queryKey: ["training-sessions", user.id] });
      }
    })();
  }, [phase, user, trainer, qc]);

  const points: ProgressPoint[] = (sessions ?? []).map((s) => ({
    date: s.created_at,
    accuracy: Number(s.accuracy),
    level: Number(s.end_level),
    quietestDb: s.quietest_db == null ? null : Number(s.quietest_db),
  }));

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
      <main className="mx-auto max-w-3xl px-5 py-12">
        {phase === "intro" ? (
          <section>
            <h1 className="text-3xl font-semibold">Hearing gym</h1>
            <p className="mt-3 text-muted-foreground">
              Twelve rounds of real-world sounds - light breathing, rustling leaves, a fridge hum, a
              motorcycle. Name what you hear. Every correct answer makes the next one quieter and
              adds a closer-sounding decoy; a miss pulls the difficulty back down, so you always
              train right at the edge of your own hearing.
            </p>
            {ceiling ? (
              <p className="mt-4 text-sm text-signal">
                Calibrated to your screening: presentation capped near your {ceiling} dB ceiling.
              </p>
            ) : null}
            <Button size="lg" className="mt-8" onClick={() => void begin()}>
              <Play className="mr-2 h-4 w-4" /> Start training
            </Button>
          </section>
        ) : null}

        {(phase === "playing" || phase === "answer") && round ? (
          <section className="text-center">
            <Progress value={(trainer.rounds / ROUNDS) * 100} className="mb-8" />
            <div
              className={`mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-border bg-card ${
                phase === "playing" ? "pulse-ring" : ""
              }`}
            >
              <Volume2 className="h-9 w-9 text-signal" />
            </div>
            <p className="mt-6 text-sm uppercase tracking-widest text-muted-foreground">
              Round {trainer.rounds + 1} of {ROUNDS} · difficulty {trainer.level.toFixed(1)}/10
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {phase === "playing" ? "Listening..." : "What did you hear?"}
            </h2>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {round.options.map((o) => (
                <Button
                  key={o.id}
                  variant="secondary"
                  size="lg"
                  disabled={phase !== "answer"}
                  className={
                    lastCorrect !== null && o.id === round.target.id
                      ? "border border-signal/60"
                      : undefined
                  }
                  onClick={() => void answer(o.id)}
                >
                  {o.label}
                  <span className="ml-2 text-xs text-muted-foreground">~{o.realDb} dB</span>
                </Button>
              ))}
            </div>

            {lastCorrect !== null ? (
              <p className={`mt-5 text-sm ${lastCorrect ? "text-signal" : "text-caution"}`}>
                {lastCorrect
                  ? "Correct - going quieter."
                  : `That was ${round.target.label}. Easing off a little.`}
              </p>
            ) : null}
          </section>
        ) : null}

        {phase === "done" ? (
          <section>
            <h1 className="text-3xl font-semibold">Session complete</h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat
                label="Accuracy"
                value={`${Math.round((trainer.correct / Math.max(1, trainer.rounds)) * 100)}%`}
                highlight
              />
              <Stat label="Difficulty reached" value={`${trainer.level.toFixed(1)}/10`} />
              <Stat
                label="Quietest identified"
                value={quietestHeard(trainer) != null ? `${quietestHeard(trainer)} dB` : "-"}
              />
            </div>
            {!user ? (
              <p className="mt-6 rounded-xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
                <Link to="/auth" className="text-signal underline-offset-4 hover:underline">
                  Sign in
                </Link>{" "}
                to save sessions and watch your improvement curve.
              </p>
            ) : null}
            <div className="mt-8 flex gap-3">
              <Button onClick={() => void begin()}>
                <Sparkles className="mr-2 h-4 w-4" /> Train again
              </Button>
              <Button asChild variant="secondary">
                <Link to="/risks">See my risk profile</Link>
              </Button>
            </div>
          </section>
        ) : null}

        {user && phase !== "playing" && phase !== "answer" ? (
          <>
            <section className="mt-14">
              <h2 className="text-xl font-semibold">Improvement over time</h2>
              {points.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Finish a session to start the curve.
                </p>
              ) : (
                <div className="mt-4 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-card">
                  <TrainingProgress points={points} />
                </div>
              )}
            </section>
            <ScheduleCard />
          </>
        ) : null}
      </main>
    </div>
  );
}

function ScheduleCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [perm, setPerm] = useState<string>("default");

  useEffect(() => setPerm(permission()), []);

  const { data: schedule } = useQuery({
    enabled: !!user,
    queryKey: ["training-schedule", user?.id],
    queryFn: async (): Promise<Schedule> => {
      const { data } = await supabase
        .from("training_schedules")
        .select("enabled, days, time_of_day")
        .maybeSingle();
      return {
        enabled: data?.enabled ?? false,
        days: (data?.days ?? [1, 3, 5]).map(Number),
        timeOfDay: data?.time_of_day ?? "19:00",
      };
    },
  });

  useEffect(() => {
    if (!schedule) return;
    return armReminder(schedule);
  }, [schedule]);

  async function save(next: Schedule) {
    if (!user) return;
    qc.setQueryData(["training-schedule", user.id], next);
    const { error } = await supabase.from("training_schedules").upsert(
      {
        user_id: user.id,
        enabled: next.enabled,
        days: next.days,
        time_of_day: next.timeOfDay,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) toast.error("Could not save your schedule.");
  }

  if (!schedule) return null;

  return (
    <section className="mt-14 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Bell className="h-4 w-4 text-signal" /> Training reminders
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{formatNextRun(schedule)}</p>
        </div>
        <Switch
          checked={schedule.enabled}
          onCheckedChange={async (v) => {
            if (v && permission() !== "granted") {
              const p = await requestNotificationPermission();
              setPerm(p);
              if (p !== "granted") {
                toast.error("Allow notifications in your browser to get reminders.");
                return;
              }
            }
            void save({ ...schedule, enabled: v });
          }}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {DAY_LABELS.map((d, i) => {
          const on = schedule.days.includes(i);
          return (
            <button
              key={d}
              type="button"
              onClick={() =>
                void save({
                  ...schedule,
                  days: on ? schedule.days.filter((x) => x !== i) : [...schedule.days, i].sort(),
                })
              }
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                on
                  ? "border-signal/50 bg-signal/10 text-signal"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Input
          type="time"
          value={schedule.timeOfDay}
          className="w-36"
          onChange={(e) => void save({ ...schedule, timeOfDay: e.target.value })}
        />
        {perm === "granted" ? (
          <span className="flex items-center gap-1 text-xs text-signal">
            <BellRing className="h-3.5 w-3.5" /> Notifications on
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {perm === "unsupported"
              ? "This browser cannot show notifications."
              : "Notifications not enabled yet."}
          </span>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Reminders are delivered by your device. Add Audible to your home screen so they arrive like
        any other app notification; a reminder missed while the app was closed is shown next time
        you open it.
      </p>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-signal/40 bg-card shadow-glow" : "border-border/70 bg-card/60"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

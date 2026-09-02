import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  Bell,
  BellRing,
  Brain,
  Check,
  ChevronRight,
  Compass,
  Gauge,
  Headphones,
  LineChart,
  Loader2,
  MessageCircle,
  Music2,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  Users,
  Volume2,
  Waves,
} from "lucide-react";
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
  stopSoundscape,
  type TrainerState,
} from "@/lib/soundscapes";
import {
  TRAINING_MODES,
  modeById,
  type ModeId,
  type ModeRound,
} from "@/lib/training-modes";
import {
  bestsByMode,
  dayStreak,
  focusMode,
  levelFromXp,
  sessionXp,
  thisWeek,
  totalXp,
  WEEKLY_GOAL_SESSIONS,
  type SessionRow,
} from "@/lib/gamification";
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
      { title: "Adaptive Hearing Training | Audiomaxxer" },
      {
        name: "description",
        content:
          "Build listening skills with targeted, adaptive hearing exercises for speech in noise, pitch, localization, and more.",
      },
      { property: "og:title", content: "Adaptive Hearing Training | Audiomaxxer" },
      {
        property: "og:description",
        content: "Target the listening skills that matter to you with adaptive hearing training.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainPage,
});

const ROUNDS = 12;
type Phase = "intro" | "playing" | "answer" | "done";

type StoredSession = SessionRow & { id: string };

const MODE_ICONS = {
  waves: Waves,
  messages: MessageCircle,
  sparkles: Sparkles,
  compass: Compass,
  music: Music2,
  users: Users,
  gauge: Gauge,
} as const;

function TrainPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [trainer, setTrainer] = useState<TrainerState>(() => createTrainer());
  const [round, setRound] = useState<ModeRound | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [modeId, setModeId] = useState<ModeId>("soundscape");
  const [startedAt, setStartedAt] = useState<number | null>(null);
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
        .select("id, created_at, accuracy, end_level, quietest_db, rounds, correct, mode, xp, duration_sec")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StoredSession[];
    },
  });

  const allSessions = sessions ?? [];
  const total = totalXp(allSessions);
  const level = levelFromXp(total);
  const week = thisWeek(allSessions);
  const bests = bestsByMode(allSessions);
  const currentMode = modeById(modeId);
  const focus = focusMode(allSessions, TRAINING_MODES.map((mode) => mode.id));

  const play = useCallback(async (nextRound: ModeRound) => {
    setPhase("playing");
    await new Promise((resolve) => setTimeout(resolve, 350));
    await nextRound.play();
    setPhase("answer");
  }, []);

  async function begin(nextMode: ModeId = modeId) {
    await unlockAudio();
    saved.current = false;
    setModeId(nextMode);
    const fresh = createTrainer();
    const mode = modeById(nextMode);
    setTrainer(fresh);
    setLastCorrect(null);
    setStartedAt(Date.now());
    const nextRound = mode.makeRound(fresh.level, ceiling ?? 85);
    setRound(nextRound);
    await play(nextRound);
  }

  async function answer(id: string) {
    if (!round || phase !== "answer") return;
    const correct = id === round.answerId;
    setLastCorrect(correct);
    const next = scoreRound(
      trainer,
      { target: { id: round.answerId, label: round.options.find((option) => option.id === round.answerId)?.label ?? "sound", realDb: 0, hint: "" }, options: [], levelDb: 0, choices: round.options.length },
      correct,
    );
    setTrainer(next);
    await new Promise((resolve) => setTimeout(resolve, 750));
    if (next.rounds >= ROUNDS) {
      setRound(null);
      setPhase("done");
      return;
    }
    const nextRound = currentMode.makeRound(next.level, ceiling ?? 85);
    setRound(nextRound);
    setLastCorrect(null);
    await play(nextRound);
  }

  useEffect(() => () => {
    stopSoundscape();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    if (phase !== "done" || !user || saved.current) return;
    saved.current = true;
    const accuracy = Math.round((trainer.correct / Math.max(1, trainer.rounds)) * 100);
    const xp = sessionXp(trainer.correct, trainer.rounds, trainer.level);
    void (async () => {
      const { error } = await supabase.from("training_sessions").insert({
        user_id: user.id,
        mode: modeId,
        rounds: trainer.rounds,
        correct: trainer.correct,
        accuracy,
        start_level: 3,
        end_level: Math.round(trainer.level * 10) / 10,
        quietest_db: modeId === "soundscape" ? quietestHeard(trainer) : null,
        xp,
        duration_sec: startedAt == null ? 0 : Math.round((Date.now() - startedAt) / 1000),
      });
      if (error) toast.error("Could not save this session.");
      else {
        toast.success(`Session saved · +${xp} XP`);
        void qc.invalidateQueries({ queryKey: ["training-sessions", user.id] });
      }
    })();
  }, [phase, user, trainer, qc, modeId, startedAt]);

  const points: ProgressPoint[] = allSessions.map((session) => ({
    date: session.created_at,
    accuracy: Number(session.accuracy),
    level: Number(session.end_level),
    quietestDb: session.quietest_db == null ? null : Number(session.quietest_db),
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
      <main className="mx-auto max-w-6xl px-5 py-10">
        {phase === "intro" ? (
          <>
            <section className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-signal">Closed-loop hearing training</p>
                <h1 className="mt-2 text-4xl font-semibold">Train the skills you use in real life.</h1>
                <p className="mt-4 text-muted-foreground">
                  Choose a focus. Each session adjusts to your performance, so you practice at the edge of your current ability — not on a one-size-fits-all playlist.
                </p>
              </div>
              {user ? <LevelSummary level={level} streak={dayStreak(allSessions)} /> : null}
            </section>

            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">Choose a training track</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your next focus: <span className="text-foreground">{modeById(focus).label}</span>
                  </p>
                </div>
                {ceiling ? <p className="text-xs text-signal">Calibrated to your latest screening</p> : null}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {TRAINING_MODES.map((mode) => {
                  const Icon = MODE_ICONS[mode.icon];
                  const best = bests[mode.id];
                  const selected = mode.id === modeId;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setModeId(mode.id)}
                      className={`group rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 ${
                        selected
                          ? "border-signal/60 bg-signal/10 shadow-glow"
                          : "border-border/70 bg-card/70 shadow-card hover:border-signal/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/60">
                          <Icon className="h-5 w-5 text-signal" />
                        </span>
                        {selected ? <Check className="h-4 w-4 text-signal" /> : <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />}
                      </div>
                      <h3 className="mt-5 font-semibold">{mode.label}</h3>
                      <p className="mt-2 min-h-12 text-sm leading-relaxed text-muted-foreground">{mode.blurb}</p>
                      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{mode.skill}</span>
                        {best ? <span className="text-foreground">Best {best.bestAccuracy}%</span> : <span>New track</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button size="lg" onClick={() => void begin()}>
                  <Play className="mr-2 h-4 w-4" /> Start {currentMode.label.toLowerCase()}
                </Button>
                {currentMode.needsSpeech ? (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Volume2 className="h-4 w-4 text-signal" /> Uses your device speaker or headphones
                  </span>
                ) : null}
              </div>
            </section>

            {user ? (
              <section className="mt-14 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
                <WeeklyProgress sessions={week} total={allSessions.length} />
                <ModeBests bests={bests} />
              </section>
            ) : (
              <p className="mt-10 max-w-xl text-sm text-muted-foreground">
                <Link to="/auth" className="text-signal underline-offset-4 hover:underline">Sign in</Link> to save your XP, streak, and track-by-track improvement.
              </p>
            )}
          </>
        ) : null}

        {(phase === "playing" || phase === "answer") && round ? (
          <section className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>{currentMode.label}</span>
              <span>Round {trainer.rounds + 1} of {ROUNDS}</span>
            </div>
            <Progress value={(trainer.rounds / ROUNDS) * 100} className="mt-3" />
            <div className={`mx-auto mt-16 flex h-36 w-36 items-center justify-center rounded-full border border-border bg-card ${phase === "playing" ? "pulse-ring" : ""}`}>
              {currentMode.icon === "compass" ? <Compass className="h-9 w-9 text-signal" /> : <Volume2 className="h-9 w-9 text-signal" />}
            </div>
            <p className="mt-7 text-sm uppercase tracking-widest text-muted-foreground">Difficulty {trainer.level.toFixed(1)}/10</p>
            <h2 className="mt-2 text-2xl font-semibold">{phase === "playing" ? "Listening..." : round.prompt}</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {round.options.map((option) => (
                <Button
                  key={option.id}
                  variant="secondary"
                  size="lg"
                  disabled={phase !== "answer"}
                  className={lastCorrect !== null && option.id === round.answerId ? "border border-signal/60" : undefined}
                  onClick={() => void answer(option.id)}
                >
                  {option.label}
                  {option.hint ? <span className="ml-2 text-xs text-muted-foreground">{option.hint}</span> : null}
                </Button>
              ))}
            </div>
            {lastCorrect !== null ? (
              <p className={`mt-5 text-sm ${lastCorrect ? "text-signal" : "text-caution"}`}>
                {lastCorrect ? "Correct — increasing the challenge." : "Not quite — adjusting the next round."}
              </p>
            ) : null}
          </section>
        ) : null}

        {phase === "done" ? (
          <section className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-signal">{currentMode.label}</p>
            <h1 className="mt-2 text-4xl font-semibold">Session complete</h1>
            <p className="mt-3 text-muted-foreground">You stayed with the track and pushed your listening edge forward.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat label="Accuracy" value={`${Math.round((trainer.correct / Math.max(1, trainer.rounds)) * 100)}%`} highlight />
              <Stat label="Difficulty reached" value={`${trainer.level.toFixed(1)}/10`} />
              <Stat label="XP earned" value={`+${sessionXp(trainer.correct, trainer.rounds, trainer.level)}`} />
            </div>
            {!user ? (
              <p className="mt-6 rounded-xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
                <Link to="/auth" className="text-signal underline-offset-4 hover:underline">Sign in</Link> to save this session and track your improvement.
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => void begin()}><RefreshCw className="mr-2 h-4 w-4" /> Train again</Button>
              <Button variant="secondary" onClick={() => setPhase("intro")}><Target className="mr-2 h-4 w-4" /> Choose another track</Button>
              <Button asChild variant="secondary"><Link to="/history"><LineChart className="mr-2 h-4 w-4" /> View my dashboard</Link></Button>
            </div>
          </section>
        ) : null}

        {user && phase !== "playing" && phase !== "answer" ? (
          <>
            <section className="mt-14">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Your training curve</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Accuracy and difficulty across completed sessions.</p>
                </div>
                {allSessions.length > 0 ? <span className="text-sm text-signal">{total} total XP</span> : null}
              </div>
              {points.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">Finish a session to start the curve.</p>
              ) : (
                <div className="mt-4 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-card"><TrainingProgress points={points} /></div>
              )}
            </section>
            <ScheduleCard />
          </>
        ) : null}
      </main>
    </div>
  );
}

function LevelSummary({ level, streak }: { level: ReturnType<typeof levelFromXp>; streak: number }) {
  return (
    <div className="min-w-64 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2"><Award className="h-4 w-4 text-signal" /><span className="text-sm font-semibold">Level {level.level}</span></div>
        <span className="text-xs text-muted-foreground">{level.into}/{level.needed} XP</span>
      </div>
      <Progress value={level.pct} className="mt-3" />
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{level.pct}% to next level</span>
        <span className="flex items-center gap-1 text-caution"><Trophy className="h-3.5 w-3.5" /> {streak} day streak</span>
      </div>
    </div>
  );
}

function WeeklyProgress({ sessions, total }: { sessions: SessionRow[]; total: number }) {
  const count = sessions.length;
  const pct = Math.min(100, Math.round((count / WEEKLY_GOAL_SESSIONS) * 100));
  return (
    <section className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-medium text-signal">This week</p><h2 className="mt-1 text-xl font-semibold">Keep the loop moving</h2></div>
        <span className="flex items-center gap-1 text-sm text-caution"><Trophy className="h-4 w-4" /> {count}/{WEEKLY_GOAL_SESSIONS}</span>
      </div>
      <Progress value={pct} className="mt-5" />
      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <MiniStat label="Sessions" value={`${count}`} />
        <MiniStat label="Minutes" value={`${Math.round(sessions.reduce((sum, s) => sum + (Number(s.duration_sec) || s.rounds * 0.55), 0))}`} />
        <MiniStat label="All time" value={`${total}`} />
      </div>
      <p className="mt-5 text-xs text-muted-foreground">{count >= WEEKLY_GOAL_SESSIONS ? "Weekly goal complete. Your next session can deepen the skill." : `${WEEKLY_GOAL_SESSIONS - count} more ${WEEKLY_GOAL_SESSIONS - count === 1 ? "session" : "sessions"} to reach your weekly goal.`}</p>
    </section>
  );
}

function ModeBests({ bests }: { bests: ReturnType<typeof bestsByMode> }) {
  const visible = TRAINING_MODES.filter((mode) => bests[mode.id]).slice(0, 4);
  return (
    <section className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
      <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-signal" /><h2 className="text-xl font-semibold">Personal bests</h2></div>
      {visible.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Your best scores will appear here as you explore tracks.</p> : <div className="mt-4 space-y-3">{visible.map((mode) => { const best = bests[mode.id]; if (!best) return null; return <div key={mode.id} className="flex items-center justify-between gap-4 border-t border-border/60 pt-3"><span className="min-w-0 truncate text-sm">{mode.label}</span><span className="shrink-0 font-display text-sm text-signal">{best.bestAccuracy}% <span className="font-sans text-xs text-muted-foreground">· L{best.bestLevel.toFixed(1)}</span></span></div>; })}</div>}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-xl font-semibold">{value}</p></div>;
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
      const { data } = await supabase.from("training_schedules").select("enabled, days, time_of_day").maybeSingle();
      return { enabled: data?.enabled ?? false, days: (data?.days ?? [1, 3, 5]).map(Number), timeOfDay: data?.time_of_day ?? "19:00" };
    },
  });

  useEffect(() => {
    if (!schedule) return;
    return armReminder(schedule);
  }, [schedule]);

  async function save(next: Schedule) {
    if (!user) return;
    qc.setQueryData(["training-schedule", user.id], next);
    const { error } = await supabase.from("training_schedules").upsert({ user_id: user.id, enabled: next.enabled, days: next.days, time_of_day: next.timeOfDay, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) toast.error("Could not save your schedule.");
  }

  if (!schedule) return null;

  return (
    <section className="mt-14 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
      <div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-semibold"><Bell className="h-4 w-4 text-signal" /> Training reminders</h2><p className="mt-1 text-sm text-muted-foreground">{formatNextRun(schedule)}</p></div><Switch checked={schedule.enabled} onCheckedChange={async (value) => { if (value && permission() !== "granted") { const nextPermission = await requestNotificationPermission(); setPerm(nextPermission); if (nextPermission !== "granted") { toast.error("Allow notifications in your browser to get reminders."); return; } } void save({ ...schedule, enabled: value }); }} /></div>
      <div className="mt-5 flex flex-wrap gap-2">{DAY_LABELS.map((day, index) => { const on = schedule.days.includes(index); return <button key={day} type="button" onClick={() => void save({ ...schedule, days: on ? schedule.days.filter((x) => x !== index) : [...schedule.days, index].sort() })} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${on ? "border-signal/50 bg-signal/10 text-signal" : "border-border/70 text-muted-foreground hover:text-foreground"}`}>{day}</button>; })}</div>
      <div className="mt-5 flex items-center gap-3"><Input type="time" value={schedule.timeOfDay} className="w-36" onChange={(event) => void save({ ...schedule, timeOfDay: event.target.value })} />{perm === "granted" ? <span className="flex items-center gap-1 text-xs text-signal"><BellRing className="h-3.5 w-3.5" /> Notifications on</span> : <span className="text-xs text-muted-foreground">{perm === "unsupported" ? "This browser cannot show notifications." : "Notifications not enabled yet."}</span>}</div>
      <p className="mt-4 text-xs text-muted-foreground">Reminders are delivered by your device from notifications. Add Audiomaxxer to your home screen so they arrive like any other app notification.</p>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-xl border p-4 ${highlight ? "border-signal/40 bg-card shadow-glow" : "border-border/70 bg-card/60"}`}><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-semibold">{value}</p></div>;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  Bell,
  Car,
  FlaskConical,
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
  Utensils,
  Phone,
  Volume2,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SiteNav } from "@/components/SiteNav";
import { TrainingProgress } from "@/components/charts/lazy";
import type { ProgressPoint } from "@/components/TrainingProgress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { unlockAudio } from "@/lib/audiometry";
import { useI18n } from "@/lib/i18n";
import { buildTrainingPlan, type TrainingPlan } from "@/lib/training-plan";
import {
  createTrainer,
  quietestHeard,
  stopSoundscape,
  FLOOR_STEP,
  type TrainerState,
} from "@/lib/soundscapes";
import {
  TRAINING_MODES,
  modeById,
  setBankVariant,
  type ModeId,
  type ModeRound,
  warmUpSpeech,
} from "@/lib/training-modes";
import {
  transferByMode,
  verdictOf,
  TRANSFER_ROUNDS,
  type TransferStat,
} from "@/lib/transfer";
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

type StoredSession = SessionRow & { id: string; quietest_db: number | null };

const MODE_ICONS = {
  waves: Waves,
  messages: MessageCircle,
  sparkles: Sparkles,
  compass: Compass,
  music: Music2,
  users: Users,
  gauge: Gauge,
  utensils: Utensils,
  car: Car,
  phone: Phone,
} as const;

function TrainPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [trainer, setTrainer] = useState<TrainerState>(() => createTrainer());
  const [round, setRound] = useState<ModeRound | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [modeId, setModeId] = useState<ModeId>("speech-in-noise");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [kind, setKind] = useState<"train" | "transfer">("train");
  const [fixedLevel, setFixedLevel] = useState<number | null>(null);
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

  const { data: plan } = useQuery({
    enabled: !!user,
    queryKey: ["training-plan", user?.id],
    queryFn: async (): Promise<TrainingPlan> => {
      const [reportsRes, testsRes, speechRes, trainedRes] = await Promise.all([
        supabase
          .from("clinical_reports")
          .select("id, source_label, file_name, status, created_at")
          .eq("status", "ready")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("hearing_tests")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("speech_tests")
          .select("score")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase.from("training_sessions").select("mode"),
      ]);

      const report = reportsRes.data?.[0] ?? null;
      const clinicPoints = report
        ? ((
            await supabase
              .from("clinical_threshold_points")
              .select("ear, frequency_hz, threshold_db")
              .eq("report_id", report.id)
          ).data ?? [])
        : [];
      const testId = testsRes.data?.[0]?.id ?? null;
      const screeningPoints = testId
        ? ((
            await supabase
              .from("threshold_points")
              .select("ear, frequency_hz, threshold_db")
              .eq("test_id", testId)
          ).data ?? [])
        : [];

      return buildTrainingPlan({
        clinicPoints: clinicPoints.map((point) => ({
          ear: point.ear,
          frequency_hz: point.frequency_hz,
          threshold_db: Number(point.threshold_db),
        })),
        clinicLabel: report ? report.source_label || report.file_name : null,
        screeningPoints: screeningPoints.map((point) => ({
          ear: point.ear,
          frequency_hz: point.frequency_hz,
          threshold_db: Number(point.threshold_db),
        })),
        sinScore: speechRes.data?.[0]?.score ?? null,
        trainedModes: (trainedRes.data ?? []).map((row) => row.mode as ModeId),
      });
    },
  });

  const { data: sessions } = useQuery({
    enabled: !!user,
    queryKey: ["training-sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("id, created_at, accuracy, end_level, quietest_db, rounds, correct, mode, xp, duration_sec, kind")
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
  const roundsTotal = kind === "transfer" ? TRANSFER_ROUNDS : ROUNDS;
  const transferStats = transferByMode(
    allSessions.map((row) => ({
      mode: row.mode,
      kind: (row as unknown as { kind?: string }).kind ?? "train",
      accuracy: Number(row.accuracy),
      end_level: Number(row.end_level),
      created_at: row.created_at,
    })),
  );
  const focus = focusMode(allSessions, TRAINING_MODES.map((mode) => mode.id));

  const play = useCallback(async (nextRound: ModeRound) => {
    setPhase("playing");
    await new Promise((resolve) => setTimeout(resolve, 350));
    await nextRound.play();
    setPhase("answer");
  }, []);

  async function begin(nextMode: ModeId = modeId, nextKind: "train" | "transfer" = "train", level?: number) {
    await unlockAudio();
    const mode0 = modeById(nextMode);
    if (mode0.needsSpeech) await warmUpSpeech();
    saved.current = false;
    setKind(nextKind);
    setFixedLevel(nextKind === "transfer" ? (level ?? 3) : null);
    // Transfer checks draw only from material training never uses.
    setBankVariant(nextKind === "transfer" ? "transfer" : "train");
    setModeId(nextMode);
    const fresh =
      nextKind === "transfer"
        ? { ...createTrainer(), level: level ?? 3, floor: level ?? 3 }
        : createTrainer();
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
    const rounds = trainer.rounds + 1;
    // A transfer check stays at one difficulty so the score is comparable;
    // a training session ratchets, so it never ends where it started.
    const floor =
      kind === "transfer" ? trainer.floor : Math.min(10, trainer.floor + FLOOR_STEP);
    const next: TrainerState = {
      ...trainer,
      rounds,
      correct: trainer.correct + (correct ? 1 : 0),
      streak: correct ? trainer.streak + 1 : 0,
      floor,
      level:
        kind === "transfer"
          ? trainer.level
          : Math.max(
              1,
              floor,
              Math.min(10, trainer.level + (correct ? (trainer.streak + 1 >= 3 ? 0.9 : 0.5) : -0.8)),
            ),
      history: [
        ...trainer.history,
        { round: rounds, level: trainer.level, correct, levelDb: round.levelDb ?? 0 },
      ],
    };
    setTrainer(next);
    await new Promise((resolve) => setTimeout(resolve, 750));
    if (next.rounds >= roundsTotal) {
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
        kind,
        rounds: trainer.rounds,
        correct: trainer.correct,
        accuracy,
        start_level: 3,
        end_level: Math.round(trainer.level * 10) / 10,
        quietest_db: modeId === "soundscape" ? quietestHeard(trainer) : null,
        xp,
        duration_sec: startedAt == null ? 0 : Math.round((Date.now() - startedAt) / 1000),
      });
      if (error) toast.error(t("train.toastSessionFail"));
      else {
        toast.success(t("train.toastSessionSavedTemplate").replace("{xp}", String(xp)));
        void qc.invalidateQueries({ queryKey: ["training-sessions", user.id] });
      }
    })();
  }, [phase, user, trainer, qc, modeId, startedAt, kind]);

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
                <p className="text-sm font-medium text-signal">{t("train.tagline")}</p>
                <h1 className="mt-2 text-4xl font-semibold">{t("train.heroTitle")}</h1>
                <p className="mt-4 text-muted-foreground">{t("train.heroBody")}</p>
              </div>
              {user ? <LevelSummary level={level} streak={dayStreak(allSessions)} /> : null}
            </section>

            {user ? (
              <PlanCard
                plan={plan ?? null}
                onStart={(mode) => {
                  setModeId(mode);
                  void begin(mode);
                }}
              />
            ) : (
              <p className="mt-8 text-sm text-muted-foreground">{t("plan.signedOut")}</p>
            )}

            {user ? (
              <TransferCard
                stats={transferStats}
                onRun={(mode, level) => void begin(mode, "transfer", level)}
              />
            ) : null}

            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{t("train.chooseTrack")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user && allSessions.length > 0 ? (
                      <>
                        {t("train.nextFocusPrefix")}{" "}
                        <span className="text-foreground">{t(`train.mode.${modeById(focus).id}.label`)}</span>
                        {focus !== modeId ? (
                          <>
                            {" · "}
                            {t("train.selectedPrefix")}{" "}
                            <span className="text-foreground">{t(`train.mode.${currentMode.id}.label`)}</span>
                          </>
                        ) : null}
                      </>
                    ) : (
                      <>
                        {t("train.noDataFocus")}{" "}
                        {t("train.selectedPrefix")}{" "}
                        <span className="text-foreground">{t(`train.mode.${currentMode.id}.label`)}</span>
                      </>
                    )}
                  </p>
                </div>
                {ceiling ? <p className="text-xs text-signal">{t("train.calibrated")}</p> : null}
              </div>
              <div role="radiogroup" aria-label={t("train.chooseTrack")} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {TRAINING_MODES.map((mode) => {
                  const Icon = MODE_ICONS[mode.icon];
                  const best = bests[mode.id];
                  const selected = mode.id === modeId;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={t(`train.mode.${mode.id}.label`)}
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
                      <h3 className="mt-5 font-semibold">{t(`train.mode.${mode.id}.label`)}</h3>
                      <p className="mt-2 min-h-12 text-sm leading-relaxed text-muted-foreground">{t(`train.mode.${mode.id}.blurb`)}</p>
                      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{t(`train.mode.${mode.id}.skill`)}</span>
                        {best ? <span className="text-foreground">{t("train.bestTemplate").replace("{pct}", String(best.bestAccuracy))}</span> : <span>{t("train.newTrack")}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button size="lg" onClick={() => void begin()}>
                  <Play className="mr-2 h-4 w-4" /> {t("train.startPrefix")} {t(`train.mode.${currentMode.id}.label`).toLowerCase()}
                </Button>
                {currentMode.needsSpeech ? (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Volume2 className="h-4 w-4 text-signal" /> {t("train.usesSpeaker")}
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
                <Link to="/auth" className="text-signal underline-offset-4 hover:underline">{t("train.signInLink")}</Link> {t("train.signInXpSuffix")}
              </p>
            )}
          </>
        ) : null}

        {(phase === "playing" || phase === "answer") && round ? (
          <section className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>
                {t(`train.mode.${currentMode.id}.label`)}
                {kind === "transfer" ? ` · ${t("transfer.badge")}` : ""}
              </span>
              <span>{t("train.roundOf").replace("{n}", String(trainer.rounds + 1)).replace("{max}", String(roundsTotal))}</span>
            </div>
            <Progress value={(trainer.rounds / roundsTotal) * 100} className="mt-3" />
            <div className={`mx-auto mt-16 flex h-36 w-36 items-center justify-center rounded-full border border-border bg-card ${phase === "playing" ? "pulse-ring" : ""}`}>
              {currentMode.icon === "compass" ? <Compass className="h-9 w-9 text-signal" /> : <Volume2 className="h-9 w-9 text-signal" />}
            </div>
            <div className="mt-7">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                {t("train.difficultyTemplate").replace("{level}", trainer.level.toFixed(1))}
              </p>
              <div
                className="mx-auto mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={10}
                aria-valuenow={Math.round(trainer.level * 10) / 10}
              >
                <div
                  className="h-full rounded-full bg-signal transition-[width] duration-500"
                  style={{ width: `${((trainer.level - 1) / 9) * 100}%` }}
                />
              </div>
            </div>
            <h2 className="mt-2 text-2xl font-semibold">{phase === "playing" ? t("train.listening") : round.prompt}</h2>
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
                {lastCorrect ? t("train.correctMsg") : t("train.incorrectMsg")}
              </p>
            ) : null}
          </section>
        ) : null}

        {phase === "done" ? (
          <section className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-signal">{t(`train.mode.${currentMode.id}.label`)}</p>
            <h1 className="mt-2 text-4xl font-semibold">
              {kind === "transfer" ? t("transfer.doneTitle") : t("train.sessionComplete")}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {kind === "transfer" ? t("transfer.doneBody") : t("train.sessionBody")}
            </p>
            {kind === "transfer" && fixedLevel != null ? (
              <p className="mt-2 text-sm text-signal">
                {t("transfer.fixedLevel").replace("{level}", fixedLevel.toFixed(1))}
              </p>
            ) : null}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat label={t("train.accuracy")} value={`${Math.round((trainer.correct / Math.max(1, trainer.rounds)) * 100)}%`} highlight />
              <Stat label={t("train.difficultyReached")} value={`${trainer.level.toFixed(1)}/10`} />
              <Stat label={t("train.xpEarned")} value={`+${sessionXp(trainer.correct, trainer.rounds, trainer.level)}`} />
            </div>
            {!user ? (
              <p className="mt-6 rounded-xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
                <Link to="/auth" className="text-signal underline-offset-4 hover:underline">{t("train.signInLink")}</Link> {t("train.signInSessionSuffix")}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => void begin()}><RefreshCw className="mr-2 h-4 w-4" /> {t("train.trainAgain")}</Button>
              <Button variant="secondary" onClick={() => setPhase("intro")}><Target className="mr-2 h-4 w-4" /> {t("train.chooseAnother")}</Button>
              <Button asChild variant="secondary"><Link to="/history"><LineChart className="mr-2 h-4 w-4" /> {t("train.viewDashboard")}</Link></Button>
            </div>
          </section>
        ) : null}

        {user && phase !== "playing" && phase !== "answer" ? (
          <>
            <section className="mt-14">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{t("train.curveTitle")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("train.curveBody")}</p>
                </div>
                {allSessions.length > 0 ? <span className="text-sm text-signal">{t("train.totalXpTemplate").replace("{total}", String(total))}</span> : null}
              </div>
              {points.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">{t("train.finishSession")}</p>
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

function TransferCard({
  stats,
  onRun,
}: {
  stats: TransferStat[];
  onRun: (mode: ModeId, level: number) => void;
}) {
  const { t } = useI18n();
  const ready = stats.filter((stat) => stat.ready);

  return (
    <section className="mt-10 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-signal" />
        <h2 className="text-xl font-semibold">{t("transfer.title")}</h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("transfer.body")}</p>

      {ready.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("transfer.needMore")}</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ready.map((stat) => {
            const verdict = verdictOf(stat);
            return (
              <article key={stat.mode} className="rounded-xl border border-border/70 bg-background/50 p-4">
                <h3 className="font-semibold">{t(`train.mode.${stat.mode}.label`)}</h3>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("transfer.trained")}</dt>
                    <dd>{stat.trainAccuracy ?? "—"}%</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("transfer.unseen")}</dt>
                    <dd>{stat.transferAccuracy == null ? t("transfer.notRun") : `${stat.transferAccuracy}%`}</dd>
                  </div>
                  {stat.gap == null ? null : (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">{t("transfer.gap")}</dt>
                      <dd className={stat.gap >= -8 ? "text-signal" : "text-caution"}>
                        {stat.gap > 0 ? "+" : ""}
                        {stat.gap} pts
                      </dd>
                    </div>
                  )}
                </dl>
                <p className="mt-2 text-xs text-muted-foreground">{t(`transfer.verdict.${verdict}`)}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-4"
                  onClick={() => onRun(stat.mode as ModeId, stat.trainLevel)}
                >
                  <FlaskConical className="mr-2 h-4 w-4" /> {t("transfer.run")}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PlanCard({
  plan,
  onStart,
}: {
  plan: TrainingPlan | null;
  onStart: (mode: ModeId) => void;
}) {
  const { t } = useI18n();
  if (!plan) return null;

  const fill = (key: string, vals?: Record<string, string | number>) => {
    let text = t(key);
    for (const [name, value] of Object.entries(vals ?? {})) {
      text = text.replace(`{${name}}`, String(value));
    }
    return text;
  };

  const sourceLine =
    plan.source === "clinic"
      ? t("plan.fromClinic").replace("{source}", plan.sourceLabel ?? "")
      : plan.source === "screening"
        ? t("plan.fromScreening")
        : t("plan.fromNone");

  const facts = [
    plan.highDb == null ? null : t("plan.summaryHigh").replace("{db}", String(plan.highDb)),
    plan.lowDb == null ? null : t("plan.summaryLow").replace("{db}", String(plan.lowDb)),
    plan.asymmetryDb == null || plan.asymmetryDb < 10
      ? null
      : t("plan.summaryAsym").replace("{db}", String(plan.asymmetryDb)),
  ].filter(Boolean) as string[];

  return (
    <section className="mt-10 rounded-2xl border border-signal/40 bg-signal/5 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Target className="h-5 w-5 text-signal" /> {t("plan.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{sourceLine}</p>
        </div>
        {plan.source !== "clinic" ? (
          <Button asChild variant="secondary" size="sm">
            <Link to="/data">{t("plan.upload")}</Link>
          </Button>
        ) : null}
      </div>

      {facts.length ? (
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      ) : null}

      <ol className="mt-5 grid gap-3 lg:grid-cols-3">
        {plan.steps.map((step, index) => (
          <li
            key={`${step.mode}-${index}`}
            className="rounded-xl border border-border/70 bg-card/80 p-4"
          >
            <p className="text-xs uppercase tracking-wide text-signal">
              {t("plan.step").replace("{n}", String(index + 1))}
            </p>
            <h3 className="mt-2 font-semibold">{t(`train.mode.${step.mode}.label`)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {fill(step.reasonKey, step.vals)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 px-0 text-signal"
              onClick={() => onStart(step.mode)}
            >
              {t("plan.start")} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </li>
        ))}
      </ol>

      {plan.source !== "clinic" ? (
        <p className="mt-4 text-xs text-muted-foreground">{t("plan.uploadHint")}</p>
      ) : null}
    </section>
  );
}

function LevelSummary({ level, streak }: { level: ReturnType<typeof levelFromXp>; streak: number }) {
  const { t } = useI18n();
  return (
    <div className="min-w-64 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2"><Award className="h-4 w-4 text-signal" /><span className="text-sm font-semibold">{t("train.levelTemplate").replace("{level}", String(level.level))}</span></div>
        <span className="text-xs text-muted-foreground">{level.into}/{level.needed} XP</span>
      </div>
      <Progress value={level.pct} className="mt-3" />
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("train.pctToNextTemplate").replace("{pct}", String(level.pct))}</span>
        <span className="flex items-center gap-1 text-caution"><Trophy className="h-3.5 w-3.5" /> {t("train.dayStreakTemplate").replace("{streak}", String(streak))}</span>
      </div>
    </div>
  );
}

function WeeklyProgress({ sessions, total }: { sessions: SessionRow[]; total: number }) {
  const { t } = useI18n();
  const count = sessions.length;
  const pct = Math.min(100, Math.round((count / WEEKLY_GOAL_SESSIONS) * 100));
  return (
    <section className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-medium text-signal">{t("train.thisWeek")}</p><h2 className="mt-1 text-xl font-semibold">{t("train.keepMoving")}</h2></div>
        <span className="flex items-center gap-1 text-sm text-caution"><Trophy className="h-4 w-4" /> {count}/{WEEKLY_GOAL_SESSIONS}</span>
      </div>
      <Progress value={pct} className="mt-5" />
      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <MiniStat label={t("train.sessions")} value={`${count}`} />
        <MiniStat label={t("train.minutes")} value={`${Math.round(sessions.reduce((sum, s) => sum + (Number(s.duration_sec) || s.rounds * 0.55), 0))}`} />
        <MiniStat label={t("train.allTime")} value={`${total}`} />
      </div>
      <p className="mt-5 text-xs text-muted-foreground">{count >= WEEKLY_GOAL_SESSIONS ? t("train.weeklyGoalComplete") : (WEEKLY_GOAL_SESSIONS - count === 1 ? t("train.moreSessionsOne") : t("train.moreSessionsMany")).replace("{n}", String(WEEKLY_GOAL_SESSIONS - count))}</p>
    </section>
  );
}

function ModeBests({ bests }: { bests: ReturnType<typeof bestsByMode> }) {
  const { t } = useI18n();
  const visible = TRAINING_MODES.filter((mode) => bests[mode.id]).slice(0, 4);
  return (
    <section className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
      <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-signal" /><h2 className="text-xl font-semibold">{t("train.personalBests")}</h2></div>
      {visible.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t("train.bestsEmpty")}</p> : <div className="mt-4 space-y-3">{visible.map((mode) => { const best = bests[mode.id]; if (!best) return null; return <div key={mode.id} className="flex items-center justify-between gap-4 border-t border-border/60 pt-3"><span className="min-w-0 truncate text-sm">{t(`train.mode.${mode.id}.label`)}</span><span className="shrink-0 font-display text-sm text-signal">{best.bestAccuracy}% <span className="font-sans text-xs text-muted-foreground">· L{best.bestLevel.toFixed(1)}</span></span></div>; })}</div>}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-xl font-semibold">{value}</p></div>;
}

function ScheduleCard() {
  const { user } = useAuth();
  const { t } = useI18n();
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
    if (error) toast.error(t("train.toastScheduleFail"));
  }

  if (!schedule) return null;

  return (
    <section className="mt-14 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
      <div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-semibold"><Bell className="h-4 w-4 text-signal" /> {t("train.remindersTitle")}</h2><p className="mt-1 text-sm text-muted-foreground">{formatNextRun(schedule)}</p></div><Switch checked={schedule.enabled} onCheckedChange={async (value) => { if (value && permission() !== "granted") { const nextPermission = await requestNotificationPermission(); setPerm(nextPermission); if (nextPermission !== "granted") { toast.error(t("train.toastNotifFail")); return; } } void save({ ...schedule, enabled: value }); }} /></div>
      <div className="mt-5 flex flex-wrap gap-2">{DAY_LABELS.map((day, index) => { const on = schedule.days.includes(index); return <button key={day} type="button" onClick={() => void save({ ...schedule, days: on ? schedule.days.filter((x) => x !== index) : [...schedule.days, index].sort() })} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${on ? "border-signal/50 bg-signal/10 text-signal" : "border-border/70 text-muted-foreground hover:text-foreground"}`}>{day}</button>; })}</div>
      <div className="mt-5 flex items-center gap-3"><Input type="time" value={schedule.timeOfDay} className="w-36" onChange={(event) => void save({ ...schedule, timeOfDay: event.target.value })} />{perm === "granted" ? <span className="flex items-center gap-1 text-xs text-signal"><BellRing className="h-3.5 w-3.5" /> {t("train.notifOn")}</span> : <span className="text-xs text-muted-foreground">{perm === "unsupported" ? t("train.notifUnsupported") : t("train.notifNotEnabled")}</span>}</div>
      <p className="mt-4 text-xs text-muted-foreground">{t("train.remindersFooter")}</p>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-xl border p-4 ${highlight ? "border-signal/40 bg-card shadow-glow" : "border-border/70 bg-card/60"}`}><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-semibold">{value}</p></div>;
}

import { clearPending, loadPending, newResultId, savePending } from "@/lib/pending-result";
import { saveToneOnce } from "@/lib/save-results";
import { resultTable, thresholdPoints } from "@/lib/save-results-supabase";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ear, FlaskConical, Gauge, Headphones, Loader2, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHero } from "@/components/PageHero";
import { SiteNav } from "@/components/SiteNav";
import { NoiseMeter } from "@/components/NoiseMeter";
import { Audiogram } from "@/components/charts/lazy";
import { ScreeningQuality } from "@/components/ScreeningQuality";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  applyResponse,
  createTestState,
  isComplete,
  nextTrial,
  playTone,
  progress,
  results,
  screeningSummary,
  unlockAudio,
  type TestState,
  type ThresholdResult,
  type Trial,
  setDeviceCalibration,
} from "@/lib/audiometry";
import { DevicePicker } from "@/components/DevicePicker";
import { DEFAULT_DEVICE, getDevice, loadDevice, saveDevice, type DeviceId } from "@/lib/devices";
import { scoreScreening } from "@/lib/test-quality";
import {
  encodeNotes,
  isArmed,
  loadProtocol,
  setArmed,
  NOISE_TOLERANCE_DB,
  type ResearchProtocol,
} from "@/lib/research";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Adaptive Hearing Test | Audiomaxxer- Train your listening skills" },
      {
        name: "description",
        content:
          "Take a quick hearing screening and know your results. Train your listening skills with adaptive drills that adapt to your results.",
      },
      { property: "og:title", content: "Adaptive Hearing Test | Audiomaxxer- Train your listening skills" },
      {
        property: "og:description",
        content: "Take a quick hearing screening and know your results. Train your listening skills with adaptive drills that adapt to your results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestPage,
});

type Phase = "intro" | "running" | "done";

/** Locally stored half-finished screening so a closed tab is not lost. */
const RESUME_KEY = "audiomaxxer.test.progress.v1";

type Saved = {
  state: TestState;
  device: DeviceId;
  rel: { catchTrials: number; catchPassed: number; repeatTrials: number; repeatAgreed: number };
};

function loadSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    if (!parsed?.state?.tracks?.length) return null;
    if (parsed.state.trialCount < 1) return null;
    if (isComplete(parsed.state)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** What a guest's finished screening keeps while they sign in. */
type TonePending = {
  points: ThresholdResult[];
  environmentDb: number | null;
  trials: number;
  device: DeviceId;
  rel: Saved["rel"];
};

function clearSaved() {
  if (typeof window !== "undefined") window.localStorage.removeItem(RESUME_KEY);
}


function TestPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [state, setState] = useState<TestState>(() => createTestState());
  const [trial, setTrial] = useState<Trial | null>(null);
  const [playing, setPlaying] = useState(false);
  const [noise, setNoise] = useState<number | null>(null);
  const [final, setFinal] = useState<ThresholdResult[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [device, setDeviceState] = useState<DeviceId>(DEFAULT_DEVICE);
  const [saved, setSaved] = useState<Saved | null>(null);
  /** Set when a guest's finished result was restored after sign-in and still needs saving. */
  const [restoredId, setRestoredId] = useState<string | null>(null);
  const [restoredTrials, setRestoredTrials] = useState<number | null>(null);
  /** One id per finished result; it is the database client_result_id. */
  const [resultId, setResultId] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  /** False when browser storage refused the guest copy, so sign-in can't preserve it. */
  const [pendingKept, setPendingKept] = useState<boolean | null>(null);
  const inFlight = useRef(false);
  const savedId = useRef<string | null>(null);

  useEffect(() => {
    setSaved(loadSaved());
  }, []);



  /** Research mode: a locked protocol armed from /research. */
  const [protocol, setProtocol] = useState<ResearchProtocol | null>(null);

  useEffect(() => {
    if (!isArmed()) return;
    const p = loadProtocol();
    if (!p) return;
    setProtocol(p);
    setDeviceState(p.device);
  }, []);

  useEffect(() => {
    if (protocol) return;
    setDeviceState(loadDevice());
  }, [protocol]);
  const setDevice = (id: DeviceId) => {
    setDeviceState(id);
    saveDevice(id);
  };
  const busy = useRef(false);

  /**
   * Reliability checks woven into the screening:
   * - catch trials play nothing at all; the honest answer is "nothing".
   * - repeat trials replay a tone already answered; the answer should match.
   * Neither feeds the threshold estimate, only the reliability score.
   */
  const answered = useRef<{ trial: Trial; heard: boolean }[]>([]);
  const kind = useRef<"real" | "catch" | "repeat">("real");
  const expected = useRef<boolean | null>(null);
  const [rel, setRel] = useState({
    catchTrials: 0,
    catchPassed: 0,
    repeatTrials: 0,
    repeatAgreed: 0,
  });
  const relRef = useRef(rel);
  relRef.current = rel;

  const runTrial = useCallback(async (s: TestState) => {
    const t = nextTrial(s);
    if (!t || isComplete(s)) {
      setTrial(null);
      setResultId(newResultId());
      setFinal(results(s));
      setPhase("done");
      return;
    }

    const lastWasSpecial = kind.current !== "real";
    kind.current = "real";
    expected.current = null;
    let shown = t;
    let silent = false;

    if (!lastWasSpecial && s.trialCount >= 6) {
      const r = relRef.current;
      if (r.catchTrials < 3 && Math.random() < 0.13) {
        kind.current = "catch";
        silent = true;
      } else if (r.repeatTrials < 3 && answered.current.length >= 4 && Math.random() < 0.13) {
        const prior = answered.current[Math.floor(Math.random() * answered.current.length)];
        if (prior) {
          kind.current = "repeat";
          expected.current = prior.heard;
          shown = prior.trial;
        }
      }
    }

    setTrial(shown);
    setPlaying(true);
    // Random pre-delay so responses reflect hearing, not rhythm.
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 900));
    if (silent) {
      // Nothing plays: the same wait as a tone, so it feels identical.
      await new Promise((r) => setTimeout(r, 900));
    } else {
      await playTone(shown.frequency, shown.levelDb, shown.ear);
    }
    setPlaying(false);
  }, []);

  async function respond(heard: boolean) {
    if (!trial || busy.current) return;
    busy.current = true;

    if (kind.current === "catch") {
      setRel((r) => ({
        ...r,
        catchTrials: r.catchTrials + 1,
        catchPassed: r.catchPassed + (heard ? 0 : 1),
      }));
      await runTrial(state);
    } else if (kind.current === "repeat") {
      const agreed = heard === expected.current;
      setRel((r) => ({
        ...r,
        repeatTrials: r.repeatTrials + 1,
        repeatAgreed: r.repeatAgreed + (agreed ? 1 : 0),
      }));
      await runTrial(state);
    } else {
      answered.current = [...answered.current.slice(-19), { trial, heard }];
      const next = applyResponse(state, trial, heard);
      setState(next);
      await runTrial(next);
    }
    busy.current = false;
  }

  async function start() {
    // Must happen synchronously in the click handler for autoplay policies.
    setDeviceCalibration(getDevice(device).calibrationOffsetDb);
    await unlockAudio();
    const fresh = createTestState();
    answered.current = [];
    kind.current = "real";
    expected.current = null;
    clearSaved();
    setSaved(null);
    setRel({ catchTrials: 0, catchPassed: 0, repeatTrials: 0, repeatAgreed: 0 });
    setState(fresh);
    setFinal(null);
    setResultId(null);
    setRestoredId(null);
    setSaveFailed(false);
    setPendingKept(null);
    setPhase("running");
    await runTrial(fresh);
  }

  /** Continue a screening that was closed part-way through. */
  async function resume() {
    const s = saved;
    if (!s) return;
    setDeviceCalibration(getDevice(s.device).calibrationOffsetDb);
    await unlockAudio();
    answered.current = [];
    kind.current = "real";
    expected.current = null;
    setDeviceState(s.device);
    setRel(s.rel);
    relRef.current = s.rel;
    setState(s.state);
    setFinal(null);
    setPhase("running");
    await runTrial(s.state);
  }

  // Keep a local snapshot so closing the tab mid-run is recoverable.
  useEffect(() => {
    if (phase !== "running") return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(RESUME_KEY, JSON.stringify({ state, device, rel }));
    } catch {
      /* storage unavailable: resume is a bonus, never a blocker */
    }
  }, [phase, state, device, rel]);




  const pendingPayload = (): TonePending | null =>
    final ? { points: final, environmentDb: noise, trials: restoredTrials ?? state.trialCount, device, rel } : null;

  const saveResults = useCallback(async () => {
    if (!final || !user || !resultId || inFlight.current || savedId.current === resultId) return;
    inFlight.current = true;
    setSaving(true);
    setSaveFailed(false);
    const summary = screeningSummary(final);
    const outcome = await saveToneOnce(
      resultTable("hearing_tests", user.id),
      thresholdPoints(),
      resultId,
      {
        user_id: user.id,
        environment_db: noise,
        trials: restoredTrials ?? state.trialCount,
        worst_threshold_db: summary.worst,
        avg_threshold_db: summary.avg,
        // No personal safe-volume figure is derived from a screening any more.
        safe_volume_offset_db: null,
        device_type: device,
        engine_version: 2,
        notes: protocol ? encodeNotes(protocol) : null,
      },
      (testId) =>
        final.map((r) => ({
          test_id: testId,
          user_id: user.id,
          ear: r.ear,
          frequency_hz: r.frequency,
          threshold_db: r.thresholdDb,
          confidence: r.confidence,
        })),
    );
    inFlight.current = false;
    setSaving(false);
    if (!outcome.ok) {
      // Keep a retryable copy (it survives a refresh too); the retry finds the
      // same parent row by its id and finishes the points instead of duplicating.
      const payload = pendingPayload();
      if (payload) savePending<TonePending>("tone", payload, Date.now(), resultId);
      setSaveFailed(true);
      toast.error(t(outcome.stage === "points" ? "test.toastSavePointsFail" : "test.toastSaveTestFail"));
      return;
    }
    savedId.current = resultId;
    clearPending("tone");
    setRestoredId(null);
    void queryClient.invalidateQueries();
    toast.success(t("test.toastSaveSuccess"));
    void navigate({ to: "/history" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [final, user, resultId, noise, state.trialCount, restoredTrials, navigate, device, queryClient, protocol, rel]);

  useEffect(() => {
    if (phase === "done" && final) setArmed(false);
    if (phase === "done" && final) {
      clearSaved();
      setSaved(null);
    }
    // A restored guest result is saved only when the user presses save.
    if (phase === "done" && final && user && resultId && !restoredId) void saveResults();
    // A guest's result is kept so signing in to save it doesn't lose it.
    if (phase === "done" && final && resultId && !user && !loading) {
      const payload = pendingPayload();
      setPendingKept(payload ? savePending<TonePending>("tone", payload, Date.now(), resultId) != null : false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, final, user, resultId]);

  // Back from sign-in: show the same result again, ready to save once.
  useEffect(() => {
    if (loading || !user || phase !== "intro") return;
    const p = loadPending<TonePending>("tone");
    if (!p) return;
    setRestoredId(p.id);
    setResultId(p.id);
    setRestoredTrials(p.payload.trials);
    setNoise(p.payload.environmentDb);
    setDeviceState(p.payload.device);
    setRel(p.payload.rel);
    setFinal(p.payload.points);
    setPhase("done");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);


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
      {phase === "intro" ? <PageHero variant="band" title={t("test.introTitle")} lede={t("test.introBody")} /> : null}
      <main className="mx-auto max-w-3xl px-5 py-12">
        {phase === "intro" ? (
          <section>
            <p className="rounded-xl border border-border/70 bg-card/60 p-3 text-sm text-muted-foreground">
              {t("test.disclaimer")}
            </p>

            <ul className="mt-8 space-y-3 text-sm">
              {(
                [
                  { Icon: Headphones, text: t("test.step1") },
                  { Icon: Volume2, text: t("test.step2") },
                  { Icon: Ear, text: t("test.step3") },
                  { Icon: Gauge, text: t("test.stepCatch") },
                ] as const
              ).map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                  <span className="text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>


            {protocol ? (
              <div className="mt-8 rounded-2xl border border-signal/40 bg-signal/5 p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold text-signal">
                  <FlaskConical className="h-4 w-4" /> {t("res.banner")}
                </p>
                <p className="mt-1 text-muted-foreground">{t("res.bannerBody")}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>{t("res.device")}: {getDevice(protocol.device).label}</li>
                  <li>{t("res.volume")}: {protocol.volumeNote || "—"}</li>
                  <li>{t("res.place")}: {protocol.place || "—"}</li>
                  {protocol.environmentDb == null ? null : (
                    <li>
                      {t("res.noise")}: {Math.round(protocol.environmentDb)} dB
                    </li>
                  )}
                </ul>
                {protocol.environmentDb != null &&
                noise != null &&
                Math.abs(noise - protocol.environmentDb) > NOISE_TOLERANCE_DB ? (
                  <p className="mt-2 text-xs text-destructive">{t("res.bannerNoise")}</p>
                ) : null}
              </div>
            ) : (
              <DevicePicker value={device} onChange={setDevice} className="mt-8" />
            )}

            <div className="mt-6">
              <NoiseMeter onLevel={setNoise} />
            </div>

            {!user ? (
              <p className="mt-6 rounded-xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
                {t("test.guestPre")}{" "}
                <Link to="/auth" search={{ returnTo: "/test" }} className="text-signal underline-offset-4 hover:underline">
                  {t("test.guestLink")}
                </Link>{" "}
                {t("test.guestPost")}
              </p>
            ) : null}

            {saved ? (
              <div className="mt-8 rounded-2xl border border-signal/40 bg-signal/5 p-4">
                <p className="font-semibold text-signal">{t("test.resumeTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("test.resumeBody").replace("{n}", String(saved.state.trialCount + 1))}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button size="lg" onClick={() => void resume()}>
                    <Play className="mr-2 h-4 w-4" /> {t("test.resumeBtn")}
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => {
                      clearSaved();
                      setSaved(null);
                    }}
                  >
                    {t("test.resumeDiscard")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="lg" className="mt-8" onClick={() => void start()}>
                <Play className="mr-2 h-4 w-4" /> {t("test.begin")}
              </Button>
            )}

          </section>
        ) : null}

        {phase === "running" && trial ? (
          <section className="text-center">
            <Progress value={progress(state) * 100} className="mb-10" />
            <div
              className={`mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-border bg-card ${
                playing ? "pulse-ring" : ""
              }`}
            >
              <Ear className="h-10 w-10 text-signal" />
            </div>
            <p className="mt-6 text-sm uppercase tracking-widest text-muted-foreground">
              {trial.ear === "left" ? t("test.earLeft") : t("test.earRight")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {playing ? t("test.listening") : t("test.question")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("test.trialOf").replace("{n}", String(state.trialCount + 1)).replace("{max}", String(state.maxTrials))}
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" disabled={playing} onClick={() => void respond(true)}>
                {t("test.heard")}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                disabled={playing}
                onClick={() => void respond(false)}
              >
                {t("test.nothing")}
              </Button>
            </div>
          </section>
        ) : null}

        {phase === "done" && final ? (
          <ResultsView
            points={final}
            saving={saving}
            environmentDb={noise}
            trials={state.trialCount}
            device={device}
            reliability={rel}
            onSave={restoredId || saveFailed ? () => void saveResults() : undefined}
            retry={saveFailed}
            pendingKept={pendingKept}
          />
        ) : null}
      </main>
    </div>
  );
}

function ResultsView({
  points,
  saving,
  environmentDb,
  trials,
  device,
  reliability,
  onSave,
  retry = false,
  pendingKept = null,
}: {
  points: ThresholdResult[];
  saving: boolean;
  /** Present when this result still needs saving (restored after sign-in, or a failed save). */
  onSave?: (() => void) | undefined;
  retry?: boolean;
  /** False when the guest copy couldn't be stored, so sign-in won't keep it. */
  pendingKept?: boolean | null;
  environmentDb: number | null;
  trials: number;
  device: DeviceId;
  reliability: {
    catchTrials: number;
    catchPassed: number;
    repeatTrials: number;
    repeatAgreed: number;
  };
}) {
  const summary = screeningSummary(points);
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <section>
      <h1 className="text-3xl font-semibold">{t("test.resultsTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("test.resultsBody")}</p>

       <div className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-card">
         <Audiogram points={points} />
       </div>

       <ScreeningQuality
         quality={scoreScreening({
           environmentDb,
           trials,
           confidences: points.map((point) => point.confidence),
           device,
           ...reliability,
         })}
         className="mt-6"
       />

       <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Stat label={t("test.avgThreshold")} value={`${summary.avg} dB`} />
        <Stat label={t("test.worstThreshold")} value={`${summary.worst} dB`} />
      </div>

      <p className="mt-4 rounded-xl bg-card p-4 text-sm">{t("test.levelsMeaning")}</p>
      <p className="mt-3 rounded-xl bg-card p-4 text-sm">{t("test.generalGuidance")}</p>

      <div className="mt-8 space-y-2">
        {points
          .slice()
          .sort((a, b) => a.frequency - b.frequency || a.ear.localeCompare(b.ear))
          .map((p) => {
            return (
              <div
                key={`${p.ear}-${p.frequency}`}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-4 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {p.frequency >= 1000 ? `${p.frequency / 1000} kHz` : `${p.frequency} Hz`} -{" "}
                  {p.ear}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {t("test.confidenceTemplate").replace("{pct}", String(Math.round(p.confidence * 100)))}
                  </span>
                  <span className="font-medium tabular-nums">{p.thresholdDb} dB</span>
                </span>
              </div>
            );
          })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/risks">{t("test.seeRisk")}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/train">{t("test.trainHearing")}</Link>
        </Button>
        {user && onSave ? (
          <Button disabled={saving} onClick={onSave}>
            {saving ? t("test.saving") : t(retry ? "test.retrySave" : "test.saveToAccount")}
          </Button>
        ) : user ? (
          <Button asChild variant="secondary" disabled={saving}>
            <Link to="/history">{saving ? t("test.saving") : t("test.viewHistory")}</Link>
          </Button>
        ) : pendingKept === false ? (
          <p className="text-sm text-muted-foreground">{t("test.cantKeep")}</p>
        ) : (
          <Button asChild variant="secondary">
            <Link to="/auth" search={{ returnTo: "/test" }}>{t("test.signInSave")}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
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

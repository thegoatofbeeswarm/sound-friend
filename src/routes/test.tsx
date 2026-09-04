import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ear, Gauge, Headphones, Loader2, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SiteNav } from "@/components/SiteNav";
import { NoiseMeter } from "@/components/NoiseMeter";
import { Audiogram } from "@/components/charts/lazy";
import { ScreeningQuality } from "@/components/ScreeningQuality";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  applyResponse,
  categorize,
  createTestState,
  isComplete,
  nextTrial,
  playTone,
  progress,
  results,
  safeListening,
  unlockAudio,
  type TestState,
  type ThresholdResult,
  type Trial,
  setDeviceCalibration,
} from "@/lib/audiometry";
import { DevicePicker } from "@/components/DevicePicker";
import { DEFAULT_DEVICE, getDevice, loadDevice, saveDevice, type DeviceId } from "@/lib/devices";
import { scoreScreening } from "@/lib/test-quality";
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

  useEffect(() => setDeviceState(loadDevice()), []);
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
    setRel({ catchTrials: 0, catchPassed: 0, repeatTrials: 0, repeatAgreed: 0 });
    setState(fresh);
    setFinal(null);
    setPhase("running");
    await runTrial(fresh);
  }


  const saveResults = useCallback(async () => {
    if (!final || !user) return;
    setSaving(true);
    const summary = safeListening(final);
    const { data, error } = await supabase
      .from("hearing_tests")
      .insert({
        user_id: user.id,
        environment_db: noise,
        trials: state.trialCount,
        worst_threshold_db: summary.worst,
        avg_threshold_db: summary.avg,
        safe_volume_offset_db: summary.offsetDb,
        device_type: device,
      })
      .select("id")
      .single();

    if (error || !data) {
      setSaving(false);
      toast.error(t("test.toastSaveTestFail"));
      return;
    }

    const { error: pointsError } = await supabase.from("threshold_points").insert(
      final.map((r) => ({
        test_id: data.id,
        user_id: user.id,
        ear: r.ear,
        frequency_hz: r.frequency,
        threshold_db: r.thresholdDb,
        confidence: r.confidence,
      })),
    );
    setSaving(false);
    if (pointsError) {
      toast.error(t("test.toastSavePointsFail"));
      return;
    }
    void queryClient.invalidateQueries();
    toast.success(t("test.toastSaveSuccess"));
    void navigate({ to: "/history" });
  }, [final, user, noise, state.trialCount, navigate, device, queryClient]);

  useEffect(() => {
    if (phase === "done" && final && user) void saveResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, final, user]);

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
            <h1 className="text-3xl font-semibold">{t("test.introTitle")}</h1>
            <p className="mt-3 text-muted-foreground">{t("test.introBody")}</p>

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


            <DevicePicker value={device} onChange={setDevice} className="mt-8" />

            <div className="mt-6">
              <NoiseMeter onLevel={setNoise} />
            </div>

            {!user ? (
              <p className="mt-6 rounded-xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
                {t("test.guestPre")}{" "}
                <Link to="/auth" className="text-signal underline-offset-4 hover:underline">
                  {t("test.guestLink")}
                </Link>{" "}
                {t("test.guestPost")}
              </p>
            ) : null}

            <Button size="lg" className="mt-8" onClick={() => void start()}>
              <Play className="mr-2 h-4 w-4" /> {t("test.begin")}
            </Button>
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
}: {
  points: ThresholdResult[];
  saving: boolean;
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
  const summary = safeListening(points);
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

       <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label={t("test.avgThreshold")} value={`${summary.avg} dB`} />
        <Stat label={t("test.volumeCeiling")} value={`${summary.ceilingDb} dB`} highlight />
        <Stat label={t("test.safeExposure")} value={`${summary.safeHours} h`} />
      </div>

      <p className="mt-4 rounded-xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
        {t("test.warningTemplate")
          .replace("{ceiling}", String(summary.ceilingDb))
          .replace("{offset}", String(summary.offsetDb))
          .replace("{hours}", String(summary.safeHours))}
      </p>

      <div className="mt-8 space-y-2">
        {points
          .slice()
          .sort((a, b) => a.frequency - b.frequency || a.ear.localeCompare(b.ear))
          .map((p) => {
            const cat = categorize(p.thresholdDb);
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
                  <span
                    className={
                      cat.tone === "ok"
                        ? "text-signal"
                        : cat.tone === "watch"
                          ? "text-caution"
                          : "text-danger"
                    }
                  >
                    {p.thresholdDb} dB - {cat.label}
                  </span>
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
        {user ? (
          <Button asChild variant="secondary" disabled={saving}>
            <Link to="/history">{saving ? t("test.saving") : t("test.viewHistory")}</Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link to="/auth">{t("test.signInSave")}</Link>
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

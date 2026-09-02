import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Ear, Headphones, Loader2, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SiteNav } from "@/components/SiteNav";
import { NoiseMeter } from "@/components/NoiseMeter";
import { Audiogram } from "@/components/Audiogram";
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

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Adaptive Hearing Test - Audible" },
      {
        name: "description",
        content:
          "Run a browser-based adaptive hearing screening: tones across five frequencies per ear, guided by a Bayesian staircase that shortens the test without losing accuracy.",
      },
      { property: "og:title", content: "Adaptive Hearing Test - Audible" },
      {
        property: "og:description",
        content: "Measure your hearing thresholds in minutes with an adaptive browser test.",
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

  const runTrial = useCallback(async (s: TestState) => {
    const t = nextTrial(s);
    if (!t || isComplete(s)) {
      setTrial(null);
      setFinal(results(s));
      setPhase("done");
      return;
    }
    setTrial(t);
    setPlaying(true);
    // Random pre-delay so responses reflect hearing, not rhythm.
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 900));
    await playTone(t.frequency, t.levelDb, t.ear);
    setPlaying(false);
  }, []);

  async function respond(heard: boolean) {
    if (!trial || busy.current) return;
    busy.current = true;
    const next = applyResponse(state, trial, heard);
    setState(next);
    await runTrial(next);
    busy.current = false;
  }

  async function start() {
    // Must happen synchronously in the click handler for autoplay policies.
    setDeviceCalibration(getDevice(device).calibrationOffsetDb);
    await unlockAudio();
    const fresh = createTestState();
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
      toast.error("Could not save this screening.");
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
      toast.error("Could not save the audiogram points.");
      return;
    }
    toast.success("Screening saved to your history.");
    void navigate({ to: "/history" });
  }, [final, user, noise, state.trialCount, navigate, device]);

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
            <h1 className="text-3xl font-semibold">Adaptive hearing screening</h1>
            <p className="mt-3 text-muted-foreground">
              Ten tracks - five frequencies in each ear. After every answer the model updates its
              estimate and probes only where it is still unsure, so the test ends as soon as the
              picture is clear.
            </p>

            <ul className="mt-8 space-y-3 text-sm">
              {(
                [
                  { Icon: Headphones, text: "Wear headphones and set your device volume to about 50%." },
                  { Icon: Volume2, text: "Sit somewhere quiet - scan the room noise below first." },
                  { Icon: Ear, text: "Answer honestly, even for the faintest tones you think you hear." },
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
                You can test without an account, but{" "}
                <Link to="/auth" className="text-signal underline-offset-4 hover:underline">
                  sign in
                </Link>{" "}
                to save results and track changes over time.
              </p>
            ) : null}

            <Button size="lg" className="mt-8" onClick={() => void start()}>
              <Play className="mr-2 h-4 w-4" /> Begin screening
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
              {trial.ear} ear
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {playing ? "Listening..." : "Did you hear that tone?"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Trial {state.trialCount + 1} of up to {state.maxTrials}
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" disabled={playing} onClick={() => void respond(true)}>
                I heard it
              </Button>
              <Button
                size="lg"
                variant="secondary"
                disabled={playing}
                onClick={() => void respond(false)}
              >
                Nothing
              </Button>
            </div>
          </section>
        ) : null}

        {phase === "done" && final ? <ResultsView points={final} saving={saving} /> : null}
      </main>
    </div>
  );
}

function ResultsView({ points, saving }: { points: ThresholdResult[]; saving: boolean }) {
  const summary = safeListening(points);
  const { user } = useAuth();

  return (
    <section>
      <h1 className="text-3xl font-semibold">Your audiogram</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Lower is better. The shaded bands mark normal, early loss, and notable loss ranges.
      </p>

      <div className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-card">
        <Audiogram points={points} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Average threshold" value={`${summary.avg} dB`} />
        <Stat label="Your volume ceiling" value={`${summary.ceilingDb} dB`} highlight />
        <Stat label="Safe daily exposure" value={`${summary.safeHours} h`} />
      </div>

      <p className="mt-4 rounded-xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
        The standard phone warning triggers at 85 dB. Based on your thresholds your personal ceiling
        is {summary.ceilingDb} dB ({summary.offsetDb} dB versus the generic rule), which allows about{" "}
        {summary.safeHours} hours of continuous listening per day.
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
                    {Math.round(p.confidence * 100)}% confidence
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
          <Link to="/risks">See my overuse risk</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/train">Train my hearing</Link>
        </Button>
        {user ? (
          <Button asChild variant="secondary" disabled={saving}>
            <Link to="/history">{saving ? "Saving..." : "View history"}</Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link to="/auth">Sign in to save this</Link>
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

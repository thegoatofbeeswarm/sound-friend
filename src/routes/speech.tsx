import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Delete, Headphones, Loader2, MessagesSquare, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SiteNav } from "@/components/SiteNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { DevicePicker } from "@/components/DevicePicker";
import { DEFAULT_DEVICE, loadDevice, saveDevice, type DeviceId } from "@/lib/devices";
import {
  applySinResponse,
  createSinState,
  isSinComplete,
  MAX_TRIALS,
  nextSinTrial,
  NOISE_TRACKS,
  playSinTrial,
  sinBand,
  sinResult,
  stopSinAudio,
  type NoiseId,
  type SinResult,
  type SinState,
  type SinTrial,
} from "@/lib/speech-in-noise";

export const Route = createFileRoute("/speech")({
  head: () => ({
    meta: [
      { title: "Speech-in-Noise Test | Audiomaxxer Listening Profile" },
      {
        name: "description",
        content:
          "Measure the signal-to-noise ratio where you still understand speech. A digits-in-noise listening test you can repeat and track over time.",
      },
      { property: "og:title", content: "Speech-in-Noise Test | Audiomaxxer Listening Profile" },
      {
        property: "og:description",
        content:
          "Measure the signal-to-noise ratio where you still understand speech. A digits-in-noise listening test you can repeat and track over time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpeechPage,
});

type Phase = "intro" | "running" | "done";

const NOISE_IDS = Object.keys(NOISE_TRACKS) as NoiseId[];

function SpeechPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("intro");
  const [noise, setNoise] = useState<NoiseId>("babble");
  const [state, setState] = useState<SinState>(() => createSinState());
  const [trial, setTrial] = useState<SinTrial | null>(null);
  const [playing, setPlaying] = useState(false);
  const [entry, setEntry] = useState<number[]>([]);
  const [final, setFinal] = useState<SinResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [device, setDeviceState] = useState<DeviceId>(DEFAULT_DEVICE);
  const busy = useRef(false);

  useEffect(() => setDeviceState(loadDevice()), []);
  useEffect(() => () => stopSinAudio(), []);

  const runTrial = useCallback(
    async (s: SinState, n: NoiseId) => {
      const next = nextSinTrial(s);
      if (!next || isSinComplete(s)) {
        setTrial(null);
        setFinal(sinResult(s));
        setPhase("done");
        return;
      }
      setEntry([]);
      setTrial(next);
      setPlaying(true);
      await playSinTrial(next, n);
      setPlaying(false);
    },
    [],
  );

  async function start() {
    const fresh = createSinState();
    setState(fresh);
    setFinal(null);
    setEntry([]);
    setPhase("running");
    await runTrial(fresh, noise);
  }

  async function submit() {
    if (!trial || playing || busy.current || entry.length < 3) return;
    busy.current = true;
    const next = applySinResponse(state, trial, entry);
    setState(next);
    await runTrial(next, noise);
    busy.current = false;
  }

  const saveResult = useCallback(async () => {
    if (!final || !user) return;
    setSaving(true);
    const { error } = await supabase.from("speech_tests").insert({
      user_id: user.id,
      srt_db: final.srtDb,
      score: final.score,
      trials: final.trials,
      reversals: final.reversals,
      spread_db: final.spreadDb,
      noise_type: noise,
      device_type: device,
    });
    setSaving(false);
    if (error) {
      toast.error(t("sin.saveFail"));
      return;
    }
    void queryClient.invalidateQueries();
    toast.success(t("sin.saved"));
  }, [final, user, noise, device, t, queryClient]);

  useEffect(() => {
    if (phase === "done" && final && user) void saveResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, final, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-signal" />
      </div>
    );
  }

  const band = final ? sinBand(final.srtDb) : null;

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-12">
        {phase === "intro" ? (
          <section>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <MessagesSquare className="h-3.5 w-3.5 text-signal" /> {t("sin.title")}
            </span>
            <h1 className="mt-5 text-3xl font-semibold">{t("sin.title")}</h1>
            <p className="mt-4 text-muted-foreground">{t("sin.lead")}</p>
            <p className="mt-3 text-sm text-muted-foreground">{t("sin.why")}</p>

            <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-signal" /> {t("sin.step1")}
              </li>
              <li className="flex items-start gap-3">
                <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" /> {t("sin.step2")}
              </li>
              <li className="flex items-start gap-3">
                <MessagesSquare className="mt-0.5 h-4 w-4 shrink-0 text-signal" /> {t("sin.step3")}
              </li>
            </ul>

            <div className="mt-8">
              <DevicePicker
                value={device}
                onChange={(id) => {
                  setDeviceState(id);
                  saveDevice(id);
                }}
              />
            </div>

            <div className="mt-8">
              <p className="text-sm font-medium">{t("sin.noiseLabel")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {NOISE_IDS.map((id) => (
                  <Button
                    key={id}
                    size="sm"
                    variant={noise === id ? "default" : "secondary"}
                    onClick={() => setNoise(id)}
                  >
                    {t(`sin.noise.${id}`)}
                  </Button>
                ))}
              </div>
            </div>

            <Button size="lg" className="mt-9" onClick={() => void start()}>
              {t("sin.begin")}
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">{t("sin.disclaimer")}</p>
          </section>
        ) : null}

        {phase === "running" && trial ? (
          <section>
            <Progress value={(state.trials.length / MAX_TRIALS) * 100} className="h-1.5" />
            <p className="mt-4 text-xs text-muted-foreground">
              {t("sin.trialOf")
                .replace("{n}", String(trial.index))
                .replace("{max}", String(MAX_TRIALS))}
            </p>

            <div className="mt-10 rounded-2xl border border-border/70 bg-card/60 p-8 text-center shadow-card">
              <p className="text-sm text-muted-foreground">
                {playing ? t("sin.listening") : t("sin.prompt")}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex h-16 w-14 items-center justify-center rounded-xl border border-border/70 bg-background/60 font-display text-2xl"
                  >
                    {entry[i] ?? ""}
                  </div>
                ))}
              </div>

              <div className="mx-auto mt-8 grid max-w-xs grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
                  <Button
                    key={d}
                    variant="secondary"
                    disabled={playing || entry.length >= 3}
                    onClick={() => setEntry((e) => (e.length >= 3 ? e : [...e, d]))}
                  >
                    {d}
                  </Button>
                ))}
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <Button
                  variant="ghost"
                  disabled={playing || entry.length === 0}
                  onClick={() => setEntry((e) => e.slice(0, -1))}
                >
                  <Delete className="mr-1 h-4 w-4" />
                  {t("sin.clear")}
                </Button>
                <Button disabled={playing || entry.length < 3} onClick={() => void submit()}>
                  {t("sin.submit")}
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {phase === "done" && final && band ? (
          <section>
            <h1 className="text-3xl font-semibold">{t("sin.resultsTitle")}</h1>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-card">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("sin.srt")}
                </p>
                <p className="mt-2 font-display text-4xl font-semibold text-signal">
                  {final.srtDb > 0 ? `+${final.srtDb}` : final.srtDb}
                </p>
                <p className="text-xs text-muted-foreground">{t("sin.srtUnit")}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-card">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("sin.scoreLabel")}
                </p>
                <p className="mt-2 font-display text-4xl font-semibold text-signal">
                  {final.score}
                  <span className="text-base text-muted-foreground">/100</span>
                </p>
                <p className="text-xs text-muted-foreground">{t(`sin.band.${band}`)}</p>
              </div>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              {t("sin.srtExplain").replace(
                "{srt}",
                final.srtDb > 0 ? `+${final.srtDb}` : String(final.srtDb),
              )}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{t(`sin.interp.${band}`)}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("sin.spread")
                .replace("{spread}", String(final.spreadDb))
                .replace("{reversals}", String(final.reversals))}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button onClick={() => setPhase("intro")}>{t("sin.again")}</Button>
              <Button asChild variant="secondary">
                <Link to="/train">{t("sin.train")}</Link>
              </Button>
              {user ? (
                <Button
                  variant="ghost"
                  disabled={saving}
                  onClick={() => void navigate({ to: "/history" })}
                >
                  {saving ? t("sin.saving") : t("sin.viewHistory")}
                </Button>
              ) : (
                <Button asChild variant="ghost">
                  <Link to="/auth">{t("sin.signInSave")}</Link>
                </Button>
              )}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">{t("sin.disclaimer")}</p>
          </section>
        ) : null}
      </main>
    </div>
  );
}

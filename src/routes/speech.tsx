import { clearPending, loadPending, savePending } from "@/lib/pending-result";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Delete, Headphones, Loader2, MessagesSquare, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHero } from "@/components/PageHero";
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
  type PlaybackResult,
  sinBand,
  sinDifficulty,
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

/** What a guest's finished speech test keeps while they sign in. */
type SpeechPending = { final: SinResult; noise: NoiseId; device: DeviceId };

const NOISE_IDS = Object.keys(NOISE_TRACKS) as NoiseId[];

function SpeechPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
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
  const [audioIssue, setAudioIssue] = useState<PlaybackResult | null>(null);
  const busy = useRef(false);
  const savingRef = useRef(false);
  /** Set when a guest's result came back from sign-in and still needs saving. */
  const [restoredId, setRestoredId] = useState<string | null>(null);

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
      setAudioIssue(null);
      setPlaying(true);
      const played = await playSinTrial(next, n);
      setPlaying(false);
      // Digits that never played can't be answered, so the trial stays unscored.
      if (played !== "ok") setAudioIssue(played);
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
    if (!trial || playing || audioIssue || busy.current || entry.length < 3) return;
    busy.current = true;
    const next = applySinResponse(state, trial, entry);
    setState(next);
    await runTrial(next, noise);
    busy.current = false;
  }

  const saveResult = useCallback(async () => {
    if (!final || !user || savingRef.current) return;
    savingRef.current = true;
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
      engine_version: 2,
    });
    setSaving(false);
    if (error) {
      savingRef.current = false;
      toast.error(t("sin.saveFail"));
      return;
    }
    clearPending("speech");
    setRestoredId(null);
    void queryClient.invalidateQueries();
    toast.success(t("sin.saved"));
  }, [final, user, noise, device, t, queryClient]);

  useEffect(() => {
    if (phase === "done" && final && user && !restoredId) void saveResult();
    if (phase === "done" && final && !user && !loading) {
      savePending<SpeechPending>("speech", { final, noise, device });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, final, user]);

  // Back from sign-in: show the same result again, ready to save once.
  useEffect(() => {
    if (loading || !user || phase !== "intro") return;
    const p = loadPending<SpeechPending>("speech");
    if (!p) return;
    setRestoredId(p.id);
    setNoise(p.payload.noise);
    setDeviceState(p.payload.device);
    setFinal(p.payload.final);
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

  const band = final ? sinBand(final.srtDb) : null;

  return (
    <div className="min-h-screen">
      <SiteNav />
      {phase === "intro" ? <PageHero variant="band" title={t("sin.title")} lede={t("sin.lead")} /> : null}
      <main className="mx-auto max-w-3xl px-5 py-12">
        {phase === "intro" ? (
          <section>
            <p className="text-muted-foreground">{t("sin.why")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("sin.languageNote")}</p>

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
            <div className="mt-4 flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>
                {t("sin.trialOf")
                  .replace("{n}", String(trial.index))
                  .replace("{max}", String(MAX_TRIALS))}
              </span>
              <span className="flex items-center gap-2">
                <span className="uppercase tracking-widest">
                  {`${t("sin.difficulty")} ${sinDifficulty(state)}%`}
                </span>
                <span
                  className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={t("sin.difficulty")}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={sinDifficulty(state)}
                >
                  <span
                    className="block h-full rounded-full bg-signal transition-[width] duration-500"
                    style={{ width: `${sinDifficulty(state)}%` }}
                  />
                </span>
              </span>
            </div>

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

              {audioIssue ? (
                <div role="alert" className="mx-auto mt-6 max-w-sm rounded-xl bg-background p-4 text-sm">
                  <p>{t(audioIssue === "unsupported" ? "audio.unsupported" : "audio.failed")}</p>
                  {audioIssue !== "unsupported" ? (
                    <Button size="sm" className="mt-3" onClick={() => void runTrial(state, noise)}>
                      {t("audio.retry")}
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" className="mt-3" onClick={() => setPhase("intro")}>
                      {t("audio.back")}
                    </Button>
                  )}
                </div>
              ) : null}
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
                <Button disabled={playing || audioIssue != null || entry.length < 3} onClick={() => void submit()}>
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
              {user && restoredId ? (
                <Button disabled={saving} onClick={() => void saveResult()}>
                  {saving ? t("sin.saving") : t("test.saveToAccount")}
                </Button>
              ) : user ? (
                <Button
                  variant="ghost"
                  disabled={saving}
                  onClick={() => void navigate({ to: "/history" })}
                >
                  {saving ? t("sin.saving") : t("sin.viewHistory")}
                </Button>
              ) : (
                <Button asChild variant="ghost">
                  <Link to="/auth" search={{ returnTo: "/speech" }}>{t("sin.signInSave")}</Link>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Headphones, Loader2, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SiteNav } from "@/components/SiteNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DevicePicker } from "@/components/DevicePicker";
import { DEFAULT_DEVICE, getDevice, loadDevice, saveDevice, type DeviceId } from "@/lib/devices";

export const Route = createFileRoute("/risks")({
  head: () => ({
    meta: [
      { title: "Your Headphone Risk Profile - Audible" },
      {
        name: "description",
        content:
          "See how your daily headphone volume and listening hours compare with your personal safe dose, and what continued overuse would cost your hearing.",
      },
      { property: "og:title", content: "Your Headphone Risk Profile - Audible" },
      {
        property: "og:description",
        content: "Personalized overuse risk from your own audiogram, not a generic 85 dB warning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RisksPage,
});

function volumeToDb(percent: number, maxOutputDb: number): number {
  // Consumer volume curves are roughly logarithmic in perceived level.
  return Math.round(maxOutputDb - 40 * Math.log10(100 / Math.max(5, percent)));
}

/** WHO-style dose: 100% = 8h at 85 dB, halving allowance every 3 dB. */
function dosePercent(levelDb: number, hours: number): number {
  const allowed = 8 * Math.pow(2, (85 - levelDb) / 3);
  return Math.round((hours / allowed) * 100);
}

function RisksPage() {
  const { user, loading } = useAuth();
  const [volume, setVolume] = useState(70);
  const [hours, setHours] = useState(3);
  const [device, setDeviceState] = useState<DeviceId>(DEFAULT_DEVICE);

  useEffect(() => setDeviceState(loadDevice()), []);
  const preset = getDevice(device);
  const setDevice = (id: DeviceId) => {
    setDeviceState(id);
    saveDevice(id);
  };

  const { data: latest, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["latest-test", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("hearing_tests")
        .select("created_at, avg_threshold_db, worst_threshold_db, safe_volume_offset_db")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const ceiling = 85 + Number(latest?.safe_volume_offset_db ?? 0);
  const avg = latest?.avg_threshold_db == null ? null : Number(latest.avg_threshold_db);
  const worst = latest?.worst_threshold_db == null ? null : Number(latest.worst_threshold_db);

  const model = useMemo(() => {
    const levelDb = volumeToDb(volume, preset.maxOutputDb);
    const dose = dosePercent(levelDb, hours);
    // Same dose measured against the listener's own, stricter ceiling.
    const personalAllowed = 8 * Math.pow(2, (ceiling - levelDb) / 3);
    const personalDose = Math.round((hours / personalAllowed) * 100);
    const over = levelDb - ceiling;
    // Rough projection: sustained overexposure adds ~1 dB of threshold shift
    // per year for every 5 dB above the personal ceiling.
    const shiftPerYear = Math.max(0, over) / 5;
    const tenYearShift = Math.round(shiftPerYear * 10 * 10) / 10;
    const tone: "ok" | "watch" | "risk" =
      personalDose <= 100 ? "ok" : personalDose <= 250 ? "watch" : "risk";
    return { levelDb, dose, personalDose, over, tenYearShift, personalAllowed, tone };
  }, [volume, hours, ceiling, preset.maxOutputDb]);

  const toneClass =
    model.tone === "ok" ? "text-signal" : model.tone === "watch" ? "text-caution" : "text-danger";

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-semibold">Your overuse risk</h1>
        <p className="mt-3 text-muted-foreground">
          Phones warn everyone at the same 85 dB. This page uses your own thresholds instead, so the
          limit fits the ears you actually have.
        </p>

        {loading || (user && isLoading) ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-signal" />
          </div>
        ) : (
          <>
            {!latest ? (
              <div className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-6">
                <p className="text-sm text-muted-foreground">
                  These numbers use the generic 85 dB rule until you run a screening.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/test">Run a hearing test</Link>
                </Button>
              </div>
            ) : null}

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat
                label="Your volume ceiling"
                value={`${ceiling} dB`}
                sub={`${ceiling - 85} dB vs the generic rule`}
                highlight
              />
              <Stat
                label="Average threshold"
                value={avg == null ? "-" : `${avg.toFixed(1)} dB`}
                sub={worst == null ? "No screening yet" : `worst point ${worst.toFixed(1)} dB`}
              />
              <Stat
                label="Safe time at your ceiling"
                value={`${Math.round(8 * Math.pow(2, (85 - ceiling) / 3) * 10) / 10} h`}
                sub="per day, continuous"
              />
            </section>

            <section className="mt-10 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Headphones className="h-4 w-4 text-signal" /> How you actually listen
              </h2>

              <div className="mt-6 space-y-7">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Typical headphone volume</span>
                    <span className="font-medium">
                      {volume}% · ~{model.levelDb} dB
                    </span>
                  </div>
                  <Slider
                    className="mt-3"
                    value={[volume]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={(v) => setVolume(v[0] ?? 70)}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hours per day</span>
                    <span className="font-medium">{hours} h</span>
                  </div>
                  <Slider
                    className="mt-3"
                    value={[hours]}
                    min={0.5}
                    max={12}
                    step={0.5}
                    onValueChange={(v) => setHours(v[0] ?? 3)}
                  />
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Stat
                  label="Daily dose vs the generic rule"
                  value={`${model.dose}%`}
                  sub="100% = the standard safe day"
                />
                <Stat
                  label="Daily dose vs your ceiling"
                  value={`${model.personalDose}%`}
                  sub={`your safe span at this volume: ${Math.round(model.personalAllowed * 10) / 10} h`}
                  highlight
                />
              </div>

              <p className={`mt-6 flex items-start gap-2 text-sm ${toneClass}`}>
                {model.tone === "ok" ? (
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>
                  {model.tone === "ok"
                    ? `You are inside your personal budget. Keep the dial at or below ${volume}% for ${hours} hours.`
                    : `This is ${model.personalDose}% of your personal daily dose. Drop to about ${Math.max(
                        10,
                        Math.round(
                          (volume * Math.pow(10, (ceiling - model.levelDb) / 40) ) / 5,
                        ) * 5,
                      )}% volume, or cut listening to ${Math.round(model.personalAllowed * 10) / 10} hours.`}
                </span>
              </p>
            </section>

            <section className="mt-10 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <TrendingUp className="h-4 w-4 text-caution" /> If nothing changes
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {model.over <= 0
                  ? "At this listening pattern your thresholds should stay where they are. Re-screen every few months to confirm."
                  : `You are listening about ${Math.round(model.over)} dB above your ceiling. Sustained, that pattern projects roughly ${model.tenYearShift} dB of added threshold shift over ten years - most of it at 4 and 8 kHz, the frequencies that carry consonants, so speech in noisy rooms is what you would lose first.`}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li>· 60/60 rule: 60% volume for 60 minutes, then a quiet break.</li>
                <li>· Noise-cancelling headphones let you listen 10-15 dB lower on transit.</li>
                <li>· Any ringing or muffling after listening means the dose was too high.</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/train">Train your hearing</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/test">Re-run screening</Link>
                </Button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
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
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Headphones, Info, Loader2, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SiteNav } from "@/components/SiteNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DevicePicker } from "@/components/DevicePicker";
import { DEFAULT_DEVICE, getDevice, loadDevice, saveDevice, type DeviceId } from "@/lib/devices";
import {
  dosePercent,
  formatMinutes,
  lastSevenDays,
  loadExposure,
  logListening,
  STATUS_LABEL,
  statusForDose,
  todayEntry,
  weeklyTrendPercent,
  type ExposureEntry,
} from "@/lib/exposure";

export const Route = createFileRoute("/risks")({
  head: () => ({
    meta: [
      { title: "Personalized Listening Risk | Audiomaxxer" },
      {
        name: "description",
        content:
          "Understand your listening habits with estimated headphone levels, daily exposure, device context and a seven-day trend.",
      },
      { property: "og:title", content: "Personalized Listening Risk | Audiomaxxer" },
      {
        property: "og:description",
        content:
          "Track estimated listening exposure and make more informed choices about volume, time and headphones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RisksPage,
});

function volumeToDb(percent: number, maxOutputDb: number): number {
  // Consumer volume curves are approximate; this is a comparison aid, not a measurement.
  return Math.round(maxOutputDb - 40 * Math.log10(100 / Math.max(5, percent)));
}

function RisksPage() {
  const { user, loading } = useAuth();
  const [volume, setVolume] = useState(70);
  const [hours, setHours] = useState(3);
  const [device, setDeviceState] = useState<DeviceId>(DEFAULT_DEVICE);
  const [exposure, setExposure] = useState<ExposureEntry[]>([]);

  useEffect(() => {
    setDeviceState(loadDevice());
    setExposure(loadExposure());
  }, []);

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
        .select("created_at, avg_threshold_db, worst_threshold_db")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const model = useMemo(() => {
    const levelDb = volumeToDb(volume, preset.maxOutputDb);
    const dose = dosePercent(levelDb, hours);
    return { levelDb, dose, status: statusForDose(dose) };
  }, [hours, preset.maxOutputDb, volume]);

  const week = lastSevenDays(exposure);
  const today = todayEntry(exposure);
  const trend = weeklyTrendPercent(exposure);
  const logEstimate = () => setExposure(logListening(Math.round(hours * 60), model.levelDb));
  const toneClass =
    model.status === "low" ? "text-signal" : model.status === "moderate" ? "text-caution" : "text-danger";

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Activity className="h-4 w-4 text-signal" /> Listening habits
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Personalized Listening Risk</h1>
          <p className="mt-3 text-muted-foreground">
            Audiomaxxer combines your reported listening habits, estimated sound exposure and
            screening context to help you understand your behaviour. These estimates are not a
            diagnosis or a medically validated personal safety limit.
          </p>
        </div>

        {loading || (user && isLoading) ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-signal" />
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-4">
              <Stat label="Today" value={today ? formatMinutes(today.minutes) : "Nothing logged"} sub="estimated listening" />
              <Stat label="Average level" value={today ? `~${today.avgDb} dB` : "-"} sub="reported estimate" />
              <Stat label="Loudest session" value={today ? `~${today.peakDb} dB` : "-"} sub="estimated peak" />
              <Stat
                label="Exposure status"
                value={today ? STATUS_LABEL[statusForDose(dosePercent(today.avgDb, today.minutes / 60))] : "Not set"}
                sub="based on today’s estimate"
                highlight={today != null}
              />
            </section>

            <section className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Headphones className="h-4 w-4 text-signal" /> Estimate a listening session
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick the device and pattern that best match how you listen. Device output varies by
                model, fit, seal and volume setting, so treat the dB estimate as directional.
              </p>

              <DevicePicker value={device} onChange={setDevice} className="mt-6" />

              <div className="mt-7 space-y-7">
                <div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Typical headphone volume</span>
                    <span className="shrink-0 font-medium">{volume}% · ~{model.levelDb} dB</span>
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
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Listening time</span>
                    <span className="shrink-0 font-medium">{hours} h</span>
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

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Stat label="Estimated daily dose" value={`${model.dose}%`} sub="WHO-style comparison" />
                <Stat label="Exposure status" value={STATUS_LABEL[model.status]} sub="for this pattern" highlight />
                <Stat label="Estimated loudest level" value={`~${model.levelDb} dB`} sub={preset.label} />
              </div>

              <p className={`mt-6 flex items-start gap-2 text-sm ${toneClass}`}>
                {model.status === "low" ? (
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>
                  {model.status === "low"
                    ? "This pattern is within a lower estimated exposure range. Breaks and a comfortable volume still matter."
                    : model.status === "moderate"
                      ? "This pattern is worth watching. Lowering volume or taking longer quiet breaks will reduce the estimated dose."
                      : "This pattern is high by the comparison model. Reduce volume and duration, especially if you notice ringing or muffling."}
                </span>
              </p>
              <Button className="mt-6" onClick={logEstimate}>
                Log this listening pattern
              </Button>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat label="7-day listening" value={formatMinutes(week.totalMinutes)} sub={week.avgDb == null ? "nothing logged yet" : `avg ~${week.avgDb} dB`} />
              <Stat label="7-day loudest" value={week.peakDb == null ? "-" : `~${week.peakDb} dB`} sub="estimated peak" />
              <Stat
                label="7-day trend"
                value={trend == null ? "-" : `${trend > 0 ? "↑" : trend < 0 ? "↓" : ""}${Math.abs(trend)}%`}
                sub={trend == null ? "log a second week to compare" : "listening time vs prior week"}
                highlight={trend != null && trend < 0}
              />
            </section>

            <section className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Info className="h-4 w-4 text-signal" /> What this does — and does not — mean
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The comparison uses the WHO 85 dB reference and a 3 dB exchange rate to make time
                and level easier to compare. It does not infer a personal safe limit from a hearing
                threshold. A screening can show patterns worth monitoring, but only a qualified
                hearing professional can diagnose hearing loss or advise on individual exposure.
              </p>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <p className="flex gap-2"><TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-signal" />Use noise-cancelling headphones to avoid turning up the volume in noisy places.</p>
                <p className="flex gap-2"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-caution" />Ringing, muffling or discomfort is a reason to stop and take a quiet break.</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild><Link to="/report">View weekly report</Link></Button>
                <Button asChild variant="secondary"><Link to="/test">Run a screening</Link></Button>
              </div>
            </section>

            {latest ? (
              <p className="mt-6 text-xs text-muted-foreground">
                Latest screening context: average threshold {Number(latest.avg_threshold_db ?? 0).toFixed(1)} dB,
                worst point {Number(latest.worst_threshold_db ?? 0).toFixed(1)} dB. This context is shown
                for tracking, not used as a safety cutoff.
              </p>
            ) : user ? (
              <p className="mt-6 text-xs text-muted-foreground">
                No screening yet. <Link className="text-signal underline-offset-4 hover:underline" to="/test">Run one</Link> to add context to your history.
              </p>
            ) : null}
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
    <div className={`rounded-xl border p-4 ${highlight ? "border-signal/40 bg-card shadow-glow" : "border-border/70 bg-card/60"}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

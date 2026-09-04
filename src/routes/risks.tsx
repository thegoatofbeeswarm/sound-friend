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
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
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
  const statusLabel: Record<string, string> = {
    low: t("risks.status.low"),
    moderate: t("risks.status.moderate"),
    high: t("risks.status.high"),
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Activity className="h-4 w-4 text-signal" /> {t("risks.tagline")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{t("risks.title")}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("risks.lead")}
          </p>
        </div>

        {loading || (user && isLoading) ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-signal" />
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-4">
              <Stat label={t("risks.today")} value={today ? formatMinutes(today.minutes) : t("risks.nothingLogged")} sub={t("risks.estimatedListening")} />
              <Stat label={t("risks.averageLevel")} value={today ? `~${today.avgDb} dB` : "-"} sub={t("risks.reportedEstimate")} />
              <Stat label={t("risks.loudestSession")} value={today ? `~${today.peakDb} dB` : "-"} sub={t("risks.estimatedPeak")} />
              <Stat
                label={t("risks.exposureStatus")}
                value={today ? statusLabel[statusForDose(dosePercent(today.avgDb, today.minutes / 60))] : t("risks.notSet")}
                sub={t("risks.basedOnToday")}
                highlight={today != null}
              />
            </section>

            <section className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Headphones className="h-4 w-4 text-signal" /> {t("risks.estimateTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("risks.estimateLead")}
              </p>

              <DevicePicker value={device} onChange={setDevice} className="mt-6" />

              <div className="mt-7 space-y-7">
                <div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{t("risks.typicalVolume")}</span>
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
                    <span className="text-muted-foreground">{t("risks.listeningTime")}</span>
                    <span className="shrink-0 font-medium">{hours} {t("risks.hoursShort")}</span>
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
                <Stat label={t("risks.estimatedDailyDose")} value={`${model.dose}%`} sub={t("risks.whoComparison")} />
                <Stat label={t("risks.exposureStatus")} value={statusLabel[model.status]} sub={t("risks.forThisPattern")} highlight />
                <Stat label={t("risks.estimatedLoudest")} value={`~${model.levelDb} dB`} sub={preset.label} />
              </div>

              <p className={`mt-6 flex items-start gap-2 text-sm ${toneClass}`}>
                {model.status === "low" ? (
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>
                  {model.status === "low"
                    ? t("risks.lowMsg")
                    : model.status === "moderate"
                      ? t("risks.moderateMsg")
                      : t("risks.highMsg")}
                </span>
              </p>
              <Button className="mt-6" onClick={logEstimate}>
                {t("risks.logPattern")}
              </Button>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat label={t("risks.sevenDayListening")} value={formatMinutes(week.totalMinutes)} sub={week.avgDb == null ? t("risks.nothingLoggedYet") : t("risks.avgAbbrev").replace("{n}", String(week.avgDb))} />
              <Stat label={t("risks.sevenDayLoudest")} value={week.peakDb == null ? "-" : `~${week.peakDb} dB`} sub={t("risks.estimatedPeak")} />
              <Stat
                label={t("risks.sevenDayTrend")}
                value={trend == null ? "-" : `${trend > 0 ? "↑" : trend < 0 ? "↓" : ""}${Math.abs(trend)}%`}
                sub={trend == null ? t("risks.logSecondWeek") : t("risks.vsWeekPrior")}
                highlight={trend != null && trend < 0}
              />
            </section>

            <section className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Info className="h-4 w-4 text-signal" /> {t("risks.meaningTitle")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("risks.meaningBody")}
              </p>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <p className="flex gap-2"><TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-signal" />{t("risks.tipNoiseCancelling")}</p>
                <p className="flex gap-2"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-caution" />{t("risks.tipRinging")}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild><Link to="/report">{t("risks.viewWeeklyReport")}</Link></Button>
                <Button asChild variant="secondary"><Link to="/test">{t("risks.runScreening")}</Link></Button>
              </div>
            </section>

            {latest ? (
              <p className="mt-6 text-xs text-muted-foreground">
                {t("risks.latestContext")
                  .replace("{avg}", Number(latest.avg_threshold_db ?? 0).toFixed(1))
                  .replace("{worst}", Number(latest.worst_threshold_db ?? 0).toFixed(1))}
              </p>
            ) : user ? (
              <p className="mt-6 text-xs text-muted-foreground">
                {t("risks.noScreeningYet")} <Link className="text-signal underline-offset-4 hover:underline" to="/test">{t("risks.runOne")}</Link> {t("risks.toAddContext")}
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

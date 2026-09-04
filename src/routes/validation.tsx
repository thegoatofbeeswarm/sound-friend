import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Loader2 } from "lucide-react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { agreementBand, pairPoints, summarize, type PointRow } from "@/lib/validation";

export const Route = createFileRoute("/validation")({
  head: () => ({
    meta: [
      { title: "Clinic vs App Accuracy | Audiomaxxer" },
      {
        name: "description",
        content:
          "Compare your clinic audiogram with your Audiomaxxer screenings point by point: average difference, direction of bias and agreement.",
      },
      { property: "og:title", content: "Clinic vs App Accuracy | Audiomaxxer" },
      {
        property: "og:description",
        content:
          "How close are Audiomaxxer screenings to a real clinic audiogram? See the matched points from your own data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ValidationPage,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string | undefined }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-card">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ValidationPage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["validation", user?.id],
    queryFn: async () => {
      const [reportsRes, testsRes] = await Promise.all([
        supabase
          .from("clinical_reports")
          .select("id, source_label, file_name, created_at")
          .eq("status", "ready")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("hearing_tests")
          .select("id, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const report = reportsRes.data?.[0] ?? null;
      const testIds = (testsRes.data ?? []).map((row) => row.id);

      const clinic: PointRow[] = report
        ? (
            (
              await supabase
                .from("clinical_threshold_points")
                .select("ear, frequency_hz, threshold_db")
                .eq("report_id", report.id)
            ).data ?? []
          ).map((p) => ({ ear: p.ear, frequency_hz: p.frequency_hz, threshold_db: Number(p.threshold_db) }))
        : [];

      const app: PointRow[] = testIds.length
        ? (
            (
              await supabase
                .from("threshold_points")
                .select("ear, frequency_hz, threshold_db")
                .in("test_id", testIds)
            ).data ?? []
          ).map((p) => ({ ear: p.ear, frequency_hz: p.frequency_hz, threshold_db: Number(p.threshold_db) }))
        : [];

      return {
        label: report ? report.source_label || report.file_name : null,
        hasClinic: clinic.length > 0,
        hasApp: app.length > 0,
        summary: summarize(pairPoints(clinic, app)),
      };
    },
  });

  if (loading || (user && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-signal" />
      </div>
    );
  }

  const summary = data?.summary;
  const pairs = summary?.pairs ?? [];

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <div className="flex items-center gap-2 text-signal">
          <FlaskConical className="h-5 w-5" />
          <p className="text-sm font-medium">{t("nav.validation")}</p>
        </div>
        <h1 className="mt-2 text-4xl font-semibold">{t("valid.title")}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{t("valid.lead")}</p>

        {!user ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("plan.signedOut")}</p>
        ) : !data?.hasClinic ? (
          <div className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-6">
            <p className="text-sm text-muted-foreground">{t("valid.needClinic")}</p>
            <Button asChild className="mt-4">
              <Link to="/report">{t("valid.upload")}</Link>
            </Button>
          </div>
        ) : !data?.hasApp ? (
          <div className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-6">
            <p className="text-sm text-muted-foreground">{t("valid.needTest")}</p>
            <Button asChild className="mt-4">
              <Link to="/test">{t("valid.takeTest")}</Link>
            </Button>
          </div>
        ) : pairs.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("valid.needTest")}</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-signal">
              {t("valid.source").replace("{name}", data?.label ?? "")}
            </p>

            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label={t("valid.pairs")} value={String(pairs.length)} />
              <Stat
                label={t("valid.error")}
                value={`${summary?.errorDb ?? 0} dB`}
                hint={
                  summary?.errorDb == null
                    ? undefined
                    : t(`valid.band.${agreementBand(summary.errorDb)}`)
                }
              />
              <Stat
                label={t("valid.bias")}
                value={
                  summary?.biasDb == null || Math.abs(summary.biasDb) < 3
                    ? "≈ 0 dB"
                    : `${summary.biasDb > 0 ? "+" : ""}${summary.biasDb} dB`
                }
                hint={
                  summary?.biasDb == null || Math.abs(summary.biasDb) < 3
                    ? t("valid.biasEven")
                    : summary.biasDb > 0
                      ? t("valid.biasLouder").replace("{db}", String(Math.abs(summary.biasDb)))
                      : t("valid.biasQuieter").replace("{db}", String(Math.abs(summary.biasDb)))
                }
              />
              <Stat
                label={t("valid.within")}
                value={`${summary?.within10Pct ?? 0}%`}
                hint={
                  summary?.correlation == null
                    ? undefined
                    : `${t("valid.corr")} r = ${summary.correlation}`
                }
              />
            </section>

            <section className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-card">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 16, bottom: 24, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      type="number"
                      dataKey="clinicDb"
                      name={t("valid.tableClinic")}
                      unit=" dB"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="appDb"
                      name={t("valid.tableApp")}
                      unit=" dB"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <ReferenceLine
                      segment={[
                        { x: 0, y: 0 },
                        { x: 100, y: 100 },
                      ]}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      className="text-muted-foreground"
                    />
                    <Scatter data={pairs} fill="hsl(var(--signal))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="mt-8 overflow-x-auto rounded-2xl border border-border/70 bg-card/70 shadow-card">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr className="border-b border-border/70">
                    <th className="px-4 py-3">{t("valid.tableFreq")}</th>
                    <th className="px-4 py-3">{t("valid.tableEar")}</th>
                    <th className="px-4 py-3">{t("valid.tableClinic")}</th>
                    <th className="px-4 py-3">{t("valid.tableApp")}</th>
                    <th className="px-4 py-3">{t("valid.tableDiff")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pairs.map((pair) => (
                    <tr key={`${pair.ear}-${pair.frequency_hz}`} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-3">{pair.frequency_hz} Hz</td>
                      <td className="px-4 py-3">
                        {pair.ear.toLowerCase().startsWith("l") ? t("valid.left") : t("valid.right")}
                      </td>
                      <td className="px-4 py-3">{pair.clinicDb} dB</td>
                      <td className="px-4 py-3">{pair.appDb} dB</td>
                      <td
                        className={`px-4 py-3 ${Math.abs(pair.diffDb) <= 10 ? "text-signal" : "text-caution"}`}
                      >
                        {pair.diffDb > 0 ? "+" : ""}
                        {pair.diffDb} dB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <p className="mt-6 text-xs text-muted-foreground">{t("valid.disclaimer")}</p>
          </>
        )}
      </main>
    </div>
  );
}

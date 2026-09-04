import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calculator, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClinicalReports } from "@/components/ClinicalReports";
import { SiteNav } from "@/components/SiteNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FREQUENCIES } from "@/lib/audiometry";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Hearing Data Comparison | Audiomaxxer" },
      {
        name: "description",
        content:
          "Upload a past audiogram, compare it with your Audiomaxxer screening, and inspect the difference and mean absolute error.",
      },
      { property: "og:title", content: "Hearing Data Comparison | Audiomaxxer" },
      {
        property: "og:description",
        content:
          "Compare external hearing reports with your Audiomaxxer screening using transparent threshold-difference calculations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataPage,
});

type Point = { ear: string; frequency_hz: number; threshold_db: number };

type ComparisonData = {
  latestTest: { id: string; created_at: string } | null;
  audiomaxxerPoints: Point[];
  reports: {
    id: string;
    source_label: string | null;
    file_name: string;
    test_date: string | null;
    status: string;
    summary: string | null;
    comparison_summary: string | null;
    next_steps: string | null;
  }[];
  clinicalPoints: Point[];
};

function DataPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const query = useQuery({
    enabled: !!user,
    queryKey: ["clinical-data", user?.id],
    queryFn: async (): Promise<ComparisonData> => {
      const [
        { data: tests, error: testsError },
        { data: audiomaxxerPoints, error: pointsError },
        { data: reports, error: reportsError },
      ] = await Promise.all([
        supabase
          .from("hearing_tests")
          .select("id, created_at")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("threshold_points")
          .select("test_id, ear, frequency_hz, threshold_db")
          .order("frequency_hz", { ascending: true }),
        supabase
          .from("clinical_reports")
          .select(
            "id, source_label, file_name, test_date, status, summary, comparison_summary, next_steps",
          )
          .order("created_at", { ascending: false }),
      ]);
      if (testsError) throw testsError;
      if (pointsError) throw pointsError;
      if (reportsError) throw reportsError;

      const firstReport = reports?.find((report) => report.status === "ready");
      let clinicalPoints: Point[] = [];
      if (firstReport) {
        const { data, error } = await supabase
          .from("clinical_threshold_points")
          .select("ear, frequency_hz, threshold_db")
          .eq("report_id", firstReport.id)
          .order("frequency_hz", { ascending: true });
        if (error) throw error;
        clinicalPoints = (data ?? []).map((point) => ({
          ...point,
          threshold_db: Number(point.threshold_db),
        }));
      }

      const latest = tests?.[0] ?? null;
      return {
        latestTest: latest ? { id: latest.id, created_at: latest.created_at } : null,
        audiomaxxerPoints: (audiomaxxerPoints ?? [])
          .filter((point) => point.test_id === latest?.id)
          .map((point) => ({
            ear: point.ear,
            frequency_hz: point.frequency_hz,
            threshold_db: Number(point.threshold_db),
          })),
        reports: (reports ?? []) as ComparisonData["reports"],
        clinicalPoints,
      };
    },
  });

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-medium text-signal">
            <Database className="h-4 w-4" /> {t("data.badge")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{t("data.title")}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t("data.lead")}</p>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-signal" />
          </div>
        ) : null}
        {!user && !loading ? (
          <div className="mt-10 rounded-xl border border-border/70 bg-card/60 p-7">
            <p className="text-muted-foreground">{t("data.signInPrompt")}</p>
            <Button asChild className="mt-5">
              <Link to="/auth">
                {t("data.signIn")} <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : null}
        {user ? (
          <div className="mt-12">
            <ClinicalReports />
          </div>
        ) : null}
        <section className="mt-16 border-t border-border/70 pt-10">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-signal/10 p-3 text-signal">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{t("data.howCalcTitle")}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {t("data.howCalcDesc")}
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <EquationCard
              title={t("data.eq1.title")}
              formula={
                <>
                  <i>Difference</i> = <i>T</i>
                  <sub>Audiomaxxer</sub> − <i>T</i>
                  <sub>Clinic</sub>
                </>
              }
              detail={t("data.eq1.detail")}
            />
            <EquationCard
              title={t("data.eq2.title")}
              formula={
                <>
                  <i>MAE</i> = <sup>1</sup>⁄<sub>n</sub> ∑<sub>i=1</sub>
                  <sup>n</sup> |<i>T</i>
                  <sub>Audiomaxxer,i</sub> − <i>T</i>
                  <sub>Clinic,i</sub>|
                </>
              }
              detail={t("data.eq2.detail")}
            />
          </div>
          <ComparisonTable data={query.data} />
        </section>
      </main>
    </div>
  );
}

function EquationCard({
  title,
  formula,
  detail,
}: {
  title: string;
  formula: React.ReactNode;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-border/70 bg-card/70 p-6 shadow-card">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-5 overflow-x-auto whitespace-nowrap rounded-lg bg-muted/60 px-4 py-4 font-mono text-sm text-foreground">
        {formula}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{detail}</p>
    </article>
  );
}

function ComparisonTable({ data }: { data: ComparisonData | undefined }) {
  const { t } = useI18n();
  const latestReport = data?.reports.find((report) => report.status === "ready");
  const matches =
    data && latestReport
      ? data.audiomaxxerPoints.flatMap((point) => {
          const clinic = data.clinicalPoints.find(
            (item) => item.ear === point.ear && item.frequency_hz === point.frequency_hz,
          );
          return clinic
            ? [
                {
                  ear: point.ear,
                  frequency: point.frequency_hz,
                  audiomaxxer: point.threshold_db,
                  clinic: clinic.threshold_db,
                  difference: point.threshold_db - clinic.threshold_db,
                },
              ]
            : [];
        })
      : [];
  const mae = matches.length
    ? matches.reduce((sum, row) => sum + Math.abs(row.difference), 0) / matches.length
    : null;

  return (
    <div className="mt-8 rounded-xl border border-border/70 bg-card/60 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">{t("data.table.title")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {latestReport
              ? t("data.table.subtitle").replace(
                  "{source}",
                  latestReport.source_label || latestReport.file_name,
                )
              : t("data.table.uploadPrompt")}
          </p>
        </div>
        <p className="text-sm font-medium text-signal">
          {t("data.table.mae")} {mae == null ? "—" : `${mae.toFixed(1)} dB`}
        </p>
      </div>
      {matches.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-3 font-medium">{t("data.table.header.ear")}</th>
                <th className="pb-3 font-medium">{t("data.table.header.frequency")}</th>
                <th className="pb-3 font-medium">{t("data.table.header.audiomaxxer")}</th>
                <th className="pb-3 font-medium">{t("data.table.header.clinic")}</th>
                <th className="pb-3 font-medium">{t("data.table.header.difference")}</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((row) => (
                <tr
                  key={`${row.ear}-${row.frequency}`}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 capitalize">{row.ear}</td>
                  <td className="py-3">
                    {row.frequency >= 1000 ? `${row.frequency / 1000} kHz` : `${row.frequency} Hz`}
                  </td>
                  <td className="py-3">{row.audiomaxxer} dB (est.)</td>
                  <td className="py-3">{row.clinic} dB HL</td>
                  <td className="py-3 font-medium">
                    {row.difference > 0 ? "+" : ""}
                    {row.difference.toFixed(1)} dB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          {t("data.table.empty").replace("{freqs}", FREQUENCIES.join(", "))}
        </p>
      )}
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{t("data.table.footnote")}</p>
    </div>
  );
}

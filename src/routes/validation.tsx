import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, Info, Loader2 } from "lucide-react";
import { AgreementScatter } from "@/components/charts/lazy";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCohortStats } from "@/lib/cohort.functions";
import { useI18n } from "@/lib/i18n";
import { pairPoints, patternSummary, type PointRow } from "@/lib/validation";

export const Route = createFileRoute("/validation")({
  head: () => ({
    meta: [
      { title: "Validation Data: Test-Retest & Clinic Comparison | Audiomaxxer" },
      {
        name: "description",
        content:
          "Anonymous test-retest repeatability, speech-in-noise consistency and clinic pattern comparison for Audiomaxxer screenings — with the limits stated openly.",
      },
      { property: "og:title", content: "Validation Data: Test-Retest & Clinic Comparison | Audiomaxxer" },
      {
        property: "og:description",
        content:
          "How stable are Audiomaxxer screenings, and how well does their pattern match a clinic audiogram? The pooled numbers, in the open.",
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

function CohortSection() {
  const { t } = useI18n();
  const fetchStats = useServerFn(getCohortStats);
  const { data, isLoading } = useQuery({
    queryKey: ["cohort-stats"],
    queryFn: () => fetchStats(),
    staleTime: 10 * 60 * 1000,
  });

  const dash = t("cohort.none");
  const db = (n: number | null | undefined) => (n == null ? dash : `${n} dB`);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold">{t("cohort.title")}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {t("cohort.lead")}
      </p>

      {isLoading ? (
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-signal" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("cohort.participants")} value={String(data?.participants ?? 0)} />
            <Stat
              label={t("cohort.screenings")}
              value={String(data?.screenings ?? 0)}
              hint={`${t("cohort.repeat")}: ${data?.repeatScreenings ?? 0}`}
            />
            <Stat
              label={t("cohort.retest")}
              value={db(data?.retestSpreadDb)}
              hint={t("cohort.retestHint")}
            />
            <Stat
              label={t("cohort.within")}
              value={data?.retestWithin10Pct == null ? dash : `${data.retestWithin10Pct}%`}
              hint={`${t("cohort.pairs")}: ${data?.retestPairs ?? 0}`}
            />
            <Stat
              label={t("cohort.speech")}
              value={db(data?.speechRepeatDb)}
              hint={t("cohort.speechHint")}
            />
            <Stat label={t("cohort.speechTests")} value={String(data?.speechTests ?? 0)} />
            <Stat
              label={t("cohort.clinic")}
              value={String(data?.clinicReports ?? 0)}
              hint={t("cohort.clinicHint")}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/70 shadow-card">
              <table className="w-full text-sm">
                <caption className="px-4 pt-4 text-left text-sm font-semibold">
                  {t("cohort.byDevice")}
                </caption>
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr className="border-b border-border/70">
                    <th className="px-4 py-3">{t("cohort.device")}</th>
                    <th className="px-4 py-3">{t("cohort.screenings")}</th>
                    <th className="px-4 py-3">{t("cohort.spread")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.byDevice ?? []).map((d) => (
                    <tr key={d.device} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-3">
                        {d.device === "unknown" ? t("cohort.unknown") : d.device}
                      </td>
                      <td className="px-4 py-3">{d.screenings}</td>
                      <td className="px-4 py-3">{db(d.retestSpreadDb)}</td>
                    </tr>
                  ))}
                  {!data?.byDevice.length ? (
                    <tr>
                      <td className="px-4 py-3 text-muted-foreground" colSpan={3}>
                        {dash}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/70 shadow-card">
              <table className="w-full text-sm">
                <caption className="px-4 pt-4 text-left text-sm font-semibold">
                  {t("cohort.byBand")}
                </caption>
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr className="border-b border-border/70">
                    <th className="px-4 py-3">{t("valid.tableFreq")}</th>
                    <th className="px-4 py-3">{t("cohort.pairs")}</th>
                    <th className="px-4 py-3">{t("cohort.spread")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.byBand ?? []).map((b) => (
                    <tr key={b.band} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-3">{t(`cohort.band.${b.band}`)}</td>
                      <td className="px-4 py-3">{b.pairs}</td>
                      <td className="px-4 py-3">{db(b.retestSpreadDb)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t("cohort.note")}</p>
        </>
      )}
    </section>
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
        summary: patternSummary(pairPoints(clinic, app)),
      };
    },
  });

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

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-caution/40 bg-caution/5 p-5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-caution" />
          <div>
            <p className="text-sm font-semibold">{t("valid.scaleWarn")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("valid.scaleNote")}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t("valid.noAbsolute")}
            </p>
          </div>
        </div>

        <CohortSection />

        <section className="mt-14 border-t border-border/60 pt-10">
          <h2 className="text-2xl font-semibold">{t("valid.yourData")}</h2>

          {loading || (user && isLoading) ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-signal" />
            </div>
          ) : !user ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("plan.signedOut")}</p>
          ) : !data?.hasClinic ? (
            <div className="mt-6 rounded-2xl border border-border/70 bg-card/60 p-6">
              <p className="text-sm text-muted-foreground">{t("valid.needClinic")}</p>
              <Button asChild className="mt-4">
                <Link to="/report">{t("valid.upload")}</Link>
              </Button>
            </div>
          ) : !data?.hasApp || pairs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-border/70 bg-card/60 p-6">
              <p className="text-sm text-muted-foreground">{t("valid.needTest")}</p>
              <Button asChild className="mt-4">
                <Link to="/test">{t("valid.takeTest")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-signal">
                {t("valid.source").replace("{name}", data?.label ?? "")}
              </p>

              <p className="mt-4 max-w-2xl text-base leading-relaxed">
                {summary?.sameWeakBand && summary.clinicWeakBand
                  ? t("valid.sameBand").replace("{band}", t(`valid.band.${summary.clinicWeakBand}`))
                  : summary?.clinicWeakBand && summary.appWeakBand
                    ? t("valid.diffBand")
                        .replace("{clinic}", t(`valid.band.${summary.clinicWeakBand}`))
                        .replace("{app}", t(`valid.band.${summary.appWeakBand}`))
                    : ""}
              </p>

              <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label={t("valid.pairs")} value={String(pairs.length)} />
                <Stat
                  label={t("valid.patternMatch")}
                  value={summary?.correlation == null ? "—" : `r = ${summary.correlation}`}
                  hint={
                    summary?.agreement ? t(`valid.agree.${summary.agreement}`) : t("valid.patternHint")
                  }
                />
                <Stat
                  label={t("valid.offset")}
                  value={
                    summary?.offsetDb == null
                      ? "—"
                      : `${summary.offsetDb > 0 ? "+" : ""}${summary.offsetDb} dB`
                  }
                  hint={t("valid.offsetHint")}
                />
                <Stat
                  label={t("valid.shapeSpread")}
                  value={summary?.shapeSpreadDb == null ? "—" : `${summary.shapeSpreadDb} dB`}
                  hint={`${t("valid.withinShape")}: ${summary?.withinShapePct ?? 0}%`}
                />
              </section>

              <section className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-card">
                <div className="h-72 w-full">
                  <AgreementScatter
                    pairs={pairs}
                    clinicLabel={`${t("valid.tableClinic")} (${t("valid.tableClinicUnit")})`}
                    appLabel={`${t("valid.tableApp")} (${t("valid.tableAppUnit")})`}
                  />
                </div>
              </section>

              <section className="mt-8 overflow-x-auto rounded-2xl border border-border/70 bg-card/70 shadow-card">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr className="border-b border-border/70">
                      <th className="px-4 py-3">{t("valid.tableFreq")}</th>
                      <th className="px-4 py-3">{t("valid.tableEar")}</th>
                      <th className="px-4 py-3">
                        {t("valid.tableClinic")} ({t("valid.tableClinicUnit")})
                      </th>
                      <th className="px-4 py-3">
                        {t("valid.tableApp")} ({t("valid.tableAppUnit")})
                      </th>
                      <th className="px-4 py-3">{t("valid.tableShape")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pairs.map((pair) => (
                      <tr key={`${pair.ear}-${pair.frequency_hz}`} className="border-b border-border/40 last:border-0">
                        <td className="px-4 py-3">{pair.frequency_hz} Hz</td>
                        <td className="px-4 py-3">
                          {pair.ear.toLowerCase().startsWith("l") ? t("valid.left") : t("valid.right")}
                        </td>
                        <td className="px-4 py-3">{pair.clinicDb}</td>
                        <td className="px-4 py-3">{pair.appDb}</td>
                        <td
                          className={`px-4 py-3 ${Math.abs(pair.shapeDb) <= 10 ? "text-signal" : "text-caution"}`}
                        >
                          {pair.shapeDb > 0 ? "+" : ""}
                          {pair.shapeDb} dB
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <p className="mt-6 text-xs text-muted-foreground">{t("valid.disclaimer")}</p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

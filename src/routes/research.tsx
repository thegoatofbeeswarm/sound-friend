import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FlaskConical, Lock, Play, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteNav } from "@/components/SiteNav";
import { NoiseMeter } from "@/components/NoiseMeter";
import { DevicePicker } from "@/components/DevicePicker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { getDevice } from "@/lib/devices";
import {
  clearProtocol,
  conditionsMatch,
  decodeNotes,
  emptyProtocol,
  isResearchNote,
  loadProtocol,
  mean,
  saveProtocol,
  setArmed,
  type ResearchProtocol,
} from "@/lib/research";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research mode — repeatable listening screenings | Audiomaxxer" },
      {
        name: "description",
        content:
          "Lock your headphones, volume, room and time into a protocol, then repeat a screening under identical conditions to measure how repeatable your results really are.",
      },
      { property: "og:title", content: "Research mode — repeatable listening screenings | Audiomaxxer" },
      {
        property: "og:description",
        content:
          "Fixed-condition screenings with a written protocol, so test-retest numbers mean something.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchPage,
});

type Run = {
  id: string;
  created_at: string;
  notes: string | null;
  device_type: string | null;
  environment_db: number | null;
  avg_threshold_db: number | null;
};

function ResearchPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [protocol, setProtocol] = useState<ResearchProtocol | null>(null);
  const [draft, setDraft] = useState<ResearchProtocol>(() => emptyProtocol());
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadProtocol();
    setProtocol(saved);
    if (saved) setDraft(saved);
    else setEditing(true);
  }, []);

  const runsQuery = useQuery({
    queryKey: ["research-runs", user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<Run[]> => {
      const { data, error: err } = await supabase
        .from("hearing_tests")
        .select("id, created_at, notes, device_type, environment_db, avg_threshold_db")
        .order("created_at", { ascending: true });
      if (err) throw err;
      return (data ?? []).filter((r) => isResearchNote(r.notes));
    },
  });

  const runs = useMemo(() => runsQuery.data ?? [], [runsQuery.data]);

  const matched = useMemo(
    () =>
      runs.filter((r) => {
        const p = decodeNotes(r.notes);
        return p ? conditionsMatch(p, r) : false;
      }),
    [runs],
  );

  const spread = useMemo(() => {
    const diffs: number[] = [];
    for (let i = 1; i < matched.length; i += 1) {
      const a = matched[i - 1]?.avg_threshold_db;
      const b = matched[i]?.avg_threshold_db;
      if (a != null && b != null) diffs.push(Math.abs(Number(b) - Number(a)));
    }
    return mean(diffs);
  }, [matched]);

  const lock = () => {
    if (!draft.volumeNote.trim() || !draft.place.trim()) {
      setError(t("res.needFields"));
      return;
    }
    const next = { ...draft, createdAt: new Date().toISOString() };
    saveProtocol(next);
    setProtocol(next);
    setEditing(false);
    setError(null);
  };

  const startRun = () => {
    setArmed(true);
    void navigate({ to: "/test" });
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          <FlaskConical className="h-3.5 w-3.5 text-signal" /> {t("res.banner")}
        </span>
        <h1 className="mt-4 text-3xl font-semibold">{t("res.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("res.lead")}</p>

        <section className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {t("res.whyTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("res.why")}</p>
        </section>

        <section className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{t("res.protocolTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("res.protocolLead")}</p>
            </div>
            {protocol && !editing ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-signal/40 px-2.5 py-1 text-xs text-signal">
                <Lock className="h-3.5 w-3.5" /> {t("res.locked")}
              </span>
            ) : null}
          </div>

          {editing ? (
            <div className="mt-5 space-y-5">
              <DevicePicker
                value={draft.device}
                onChange={(id) => setDraft((d) => ({ ...d, device: id }))}
              />

              <div>
                <p className="mb-2 text-sm font-medium">{t("res.noise")}</p>
                <NoiseMeter onLevel={(db) => setDraft((d) => ({ ...d, environmentDb: db }))} />
                <p className="mt-2 text-xs text-muted-foreground">{t("res.noiseHint")}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="res-volume">{t("res.volume")}</Label>
                  <Input
                    id="res-volume"
                    className="mt-1.5"
                    value={draft.volumeNote}
                    placeholder={t("res.volumePlaceholder")}
                    onChange={(e) => setDraft((d) => ({ ...d, volumeNote: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="res-place">{t("res.place")}</Label>
                  <Input
                    id="res-place"
                    className="mt-1.5"
                    value={draft.place}
                    placeholder={t("res.placePlaceholder")}
                    onChange={(e) => setDraft((d) => ({ ...d, place: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="res-time">{t("res.time")}</Label>
                  <Input
                    id="res-time"
                    className="mt-1.5"
                    value={draft.timeNote}
                    placeholder={t("res.timePlaceholder")}
                    onChange={(e) => setDraft((d) => ({ ...d, timeNote: e.target.value }))}
                  />
                </div>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button onClick={lock}>
                <Lock className="mr-2 h-4 w-4" /> {t("res.lock")}
              </Button>
            </div>
          ) : protocol ? (
            <>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <Field label={t("res.device")} value={getDevice(protocol.device).label} />
                <Field
                  label={t("res.noise")}
                  value={protocol.environmentDb == null ? "—" : `${Math.round(protocol.environmentDb)} dB`}
                />
                <Field label={t("res.volume")} value={protocol.volumeNote} />
                <Field label={t("res.place")} value={protocol.place} />
                {protocol.timeNote ? <Field label={t("res.time")} value={protocol.timeNote} /> : null}
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={startRun}>
                  {runs.length ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" /> {t("res.repeat")}
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" /> {t("res.start")}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  {t("res.edit")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    clearProtocol();
                    setProtocol(null);
                    setDraft(emptyProtocol());
                    setEditing(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {t("res.clear")}
                </Button>
              </div>
            </>
          ) : null}
        </section>

        <section className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-5">
          <h2 className="text-lg font-semibold">{t("res.checklistTitle")}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {[t("res.check1"), t("res.check2"), t("res.check3"), t("res.check4")].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t("res.runsTitle")}</h2>
          {!user ? (
            <p className="mt-3 rounded-xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
              {t("res.signedOut")}{" "}
              <Link to="/auth" className="text-signal underline-offset-4 hover:underline">
                {t("nav.signIn")}
              </Link>
            </p>
          ) : runs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("res.runsEmpty")}</p>
          ) : (
            <>
              <div className="mt-4 rounded-2xl border border-border/70 bg-card/60 p-5">
                <p className="text-sm font-semibold">{t("res.retestTitle")}</p>
                <p className="mt-1 text-3xl font-semibold text-signal">
                  {spread == null ? "—" : `±${spread.toFixed(1)} dB`}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {spread == null ? t("res.needTwo") : t("res.retestHint")}
                </p>
              </div>

              <ul className="mt-4 space-y-2">
                {[...runs].reverse().map((r, idx, arr) => {
                  const p = decodeNotes(r.notes);
                  const ok = p ? conditionsMatch(p, r) : false;
                  const prev = arr[idx + 1];
                  const delta =
                    prev?.avg_threshold_db != null && r.avg_threshold_db != null
                      ? Number(r.avg_threshold_db) - Number(prev.avg_threshold_db)
                      : null;
                  return (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {new Date(r.created_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getDevice(r.device_type ?? "").label}
                          {r.environment_db == null ? "" : ` · ${Math.round(Number(r.environment_db))} dB`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={ok ? "text-xs text-signal" : "text-xs text-muted-foreground"}>
                          {ok ? t("res.match") : t("res.mismatch")}
                        </p>
                        {delta != null ? (
                          <p className="text-xs text-muted-foreground">
                            {t("res.change")}: {delta > 0 ? "+" : ""}
                            {delta.toFixed(1)} dB
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value || "—"}</dd>
    </div>
  );
}

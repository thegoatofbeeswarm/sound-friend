import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, FileImage, FileText, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { analyzeClinicalReport } from "@/lib/clinical.functions";
import { useServerFn } from "@tanstack/react-start";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

type Report = {
  id: string;
  created_at: string;
  file_name: string;
  mime_type: string;
  source_label: string | null;
  test_date: string | null;
  status: string;
  summary: string | null;
  error: string | null;
  comparison_summary: string | null;
  next_steps: string | null;
};

export function ClinicalReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeClinicalReport);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const reportsQuery = useQuery({
    enabled: !!user,
    queryKey: ["clinical-reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_reports")
        .select(
          "id, created_at, file_name, mime_type, source_label, test_date, status, summary, error, comparison_summary, next_steps",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Report[];
    },
  });

  const helperText = useMemo(() => {
    if (!selectedFile) return "PDF, PNG or JPG · up to 20 MB";
    return `${selectedFile.name} · ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`;
  }, [selectedFile]);

  async function uploadAndAnalyze() {
    if (!user || !selectedFile) return;
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      toast.error("Choose a PDF, PNG or JPG hearing report.");
      return;
    }
    if (selectedFile.size <= 0 || selectedFile.size > MAX_FILE_SIZE) {
      toast.error("The file must be between 1 byte and 15 MB.");
      return;
    }

    setBusy(true);
    try {
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("clinical-reports")
        .upload(path, selectedFile, { contentType: selectedFile.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: report, error: insertError } = await supabase
        .from("clinical_reports")
        .insert({
          user_id: user.id,
          file_path: path,
          file_name: selectedFile.name,
          mime_type: selectedFile.type,
          source_label: sourceLabel.trim() || null,
        })
        .select("id")
        .single();
      if (insertError || !report) throw insertError ?? new Error("Could not save the report.");

      const result = await analyze({ data: { reportId: report.id } });
      if (!result.ok) throw new Error(result.error);

      toast.success(
        `Report analyzed · ${result.points} threshold${result.points === 1 ? "" : "s"} found`,
      );
      setSelectedFile(null);
      setSourceLabel("");
      if (inputRef.current) inputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["clinical-reports", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["clinical-data", user.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The report could not be analyzed.");
      await queryClient.invalidateQueries({ queryKey: ["clinical-reports", user.id] });
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/60 p-6">
        <p className="text-sm text-muted-foreground">
          Sign in to upload a clinic or hearing-center report and compare it with your Audiomaxxer
          screening.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="border-b border-border/70 pb-8">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-signal/10 p-3 text-signal">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Add a past hearing report</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Upload an audiogram or hearing screening from a clinic, hearing center, or another
              app. Lovable AI will read the report, extract visible air-conduction thresholds, and
              compare them with your latest Audiomaxxer screening.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="clinical-report">Report file</Label>
            <Input
              ref={inputRef}
              id="clinical-report"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-source">Source (optional)</Label>
            <Input
              id="report-source"
              value={sourceLabel}
              maxLength={100}
              placeholder="Clinic or provider"
              onChange={(event) => setSourceLabel(event.target.value)}
            />
          </div>
          <Button onClick={() => void uploadAndAnalyze()} disabled={!selectedFile || busy}>
            {busy ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            {busy ? "Analyzing…" : "Upload and analyze"}
          </Button>
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution" />
          Keep the original report for clinical use. AI extraction is a convenience layer and can
          miss symbols or values in a low-quality scan.
        </p>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Imported reports</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your private reports and extracted comparison notes.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {reportsQuery.data?.length ?? 0} saved
          </span>
        </div>
        {reportsQuery.isLoading ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-signal" />
          </div>
        ) : reportsQuery.data?.length ? (
          <div className="mt-5 space-y-4">
            {reportsQuery.data.map((report) => (
              <ReportItem key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-border/80 p-8 text-center">
            <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No external reports yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ReportItem({ report }: { report: Report }) {
  const ready = report.status === "ready";
  return (
    <article className="rounded-xl border border-border/70 bg-card/70 p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {report.mime_type === "application/pdf" ? (
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
          ) : (
            <FileImage className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
          )}
          <div className="min-w-0">
            <h3 className="truncate font-medium">{report.source_label || report.file_name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {report.test_date ? `Test date ${report.test_date}` : "Date not detected"} · uploaded{" "}
              {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${ready ? "bg-signal/10 text-signal" : report.status === "failed" ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground"}`}
        >
          {ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
          {ready
            ? "Compared"
            : report.status === "failed"
              ? "Needs another upload"
              : report.status === "empty"
                ? "No thresholds found"
                : "Processing"}
        </span>
      </div>
      {report.summary ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{report.summary}</p>
      ) : null}
      {report.comparison_summary ? (
        <div className="mt-4 border-l-2 border-signal/50 pl-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-signal">AI comparison</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {report.comparison_summary}
          </p>
          {report.next_steps ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              <span className="font-medium">Next:</span> {report.next_steps}
            </p>
          ) : null}
        </div>
      ) : null}
      {report.error ? <p className="mt-3 text-sm text-danger">{report.error}</p> : null}
    </article>
  );
}

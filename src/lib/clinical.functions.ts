import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EXTRACTION_PROMPT = `You are reading a hearing test report (an audiogram from a clinic, hospital, hearing-aid shop or another app).

Extract the pure-tone air-conduction hearing thresholds.

Return ONLY minified JSON with this exact shape:
{"testDate":"YYYY-MM-DD or null","sourceLabel":"short name of clinic/provider/document or null","summary":"2-4 plain-language sentences describing what the report shows, including any notable asymmetry, configuration of loss, and anything the document states about masking, bone conduction, tympanometry or speech testing","points":[{"ear":"left|right","frequencyHz":500,"thresholdDb":15}]}

Rules:
- Only include frequencies you can actually read; never invent values.
- thresholdDb is dB HL as printed on the report (may be negative).
- Use air conduction (usually O for right, X for left). Ignore bone conduction and masked-only symbols if air conduction is present.
- If the document is not a hearing test, return points: [] and explain that in summary.
- No markdown, no code fences.`;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

type Extracted = {
  testDate?: string | null;
  sourceLabel?: string | null;
  summary?: string | null;
  points?: { ear?: string; frequencyHz?: number; thresholdDb?: number }[];
};

function parseJson(text: string): Extracted {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI response could not be read.");
  return JSON.parse(cleaned.slice(start, end + 1)) as Extracted;
}

export const analyzeClinicalReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reportId: string }) => {
    if (!input?.reportId) throw new Error("reportId is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: report, error: reportError } = await supabase
      .from("clinical_reports")
      .select("id, file_path, mime_type, file_name")
      .eq("id", data.reportId)
      .maybeSingle();
    if (reportError || !report) throw new Error("Report not found.");

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured.");

    const fail = async (message: string) => {
      await supabase
        .from("clinical_reports")
        .update({ status: "failed", error: message })
        .eq("id", report.id);
      return { ok: false as const, error: message };
    };

    const { data: blob, error: dlError } = await supabase.storage
      .from("clinical-reports")
      .download(report.file_path);
    if (dlError || !blob) return fail("We could not read the uploaded file.");

    const base64 = toBase64(new Uint8Array(await blob.arrayBuffer()));
    if (!base64) return fail("The uploaded file appears to be empty.");
    const dataUrl = `data:${report.mime_type};base64,${base64}`;

    const contentBlock = report.mime_type.startsWith("image/")
      ? { type: "image_url", image_url: { url: dataUrl } }
      : { type: "file", file: { filename: report.file_name, file_data: dataUrl } };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: EXTRACTION_PROMPT }, contentBlock],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) return fail("AI is busy right now. Try again in a moment.");
      if (response.status === 402) return fail("AI credits are exhausted for this workspace.");
      console.error("clinical extraction failed", response.status, body);
      return fail("The AI could not read this document.");
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content ?? "";

    let extracted: Extracted;
    try {
      extracted = parseJson(text);
    } catch {
      return fail("The AI response could not be read. Try a clearer photo or the original PDF.");
    }

    const points = (extracted.points ?? [])
      .filter(
        (p) =>
          (p.ear === "left" || p.ear === "right") &&
          Number.isFinite(p.frequencyHz) &&
          Number.isFinite(p.thresholdDb),
      )
      .map((p) => ({
        report_id: report.id,
        user_id: userId,
        ear: p.ear as string,
        frequency_hz: Math.round(p.frequencyHz as number),
        threshold_db: p.thresholdDb as number,
      }));

    await supabase.from("clinical_threshold_points").delete().eq("report_id", report.id);
    if (points.length) {
      const { error: insertError } = await supabase.from("clinical_threshold_points").insert(points);
      if (insertError) return fail("We could not save the extracted thresholds.");
    }

    const testDate =
      typeof extracted.testDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(extracted.testDate)
        ? extracted.testDate
        : null;

    await supabase
      .from("clinical_reports")
      .update({
        status: points.length ? "ready" : "empty",
        summary: extracted.summary ?? null,
        source_label: extracted.sourceLabel ?? null,
        test_date: testDate,
        error: null,
      })
      .eq("id", report.id);

    return { ok: true as const, points: points.length };
  });

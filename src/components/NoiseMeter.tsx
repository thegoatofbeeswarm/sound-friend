import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

/**
 * Background-noise check from the device microphone. The number is
 * 94 + 20·log10(RMS) on an uncalibrated microphone (often with automatic gain
 * control), so it is a relative reading for spotting a noisy room, not a
 * sound-level measurement, and the UI says so.
 */
export function NoiseMeter({ onLevel }: { onLevel?: (db: number) => void }) {
  const { t } = useI18n();
  const [level, setLevel] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<"denied" | "noMic" | null>(null);
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanup.current?.(), []);

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("noMic");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      let raf = 0;

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += v * v;
        const rms = Math.sqrt(sum / buf.length);
        const db = Math.max(25, Math.min(110, 94 + 20 * Math.log10(rms || 1e-7)));
        const rounded = Math.round(db);
        setLevel(rounded);
        onLevel?.(rounded);
        raf = requestAnimationFrame(tick);
      };
      tick();
      setActive(true);
      cleanup.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
        setActive(false);
      };
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setError(name === "NotFoundError" || name === "OverconstrainedError" ? "noMic" : "denied");
    }
  }

  const tooLoud = level != null && level > 55;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/60 p-4">
      <div>
        <p className="text-sm font-medium">{t("noise.title")}</p>
        <p className="text-xs text-muted-foreground">
          {level == null
            ? t("noise.scanPrompt")
            : t(tooLoud ? "noise.tooLoud" : "noise.ok").replace("{n}", String(level))}
        </p>
        {error ? (
          <p role="alert" className="text-xs text-danger">
            {t(error === "noMic" ? "noise.noMic" : "noise.error")}
          </p>
        ) : null}
      </div>
      {active ? (
        <Button variant="secondary" size="sm" onClick={() => cleanup.current?.()}>
          <MicOff className="mr-2 h-4 w-4" /> {t("noise.stop")}
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => void start()}>
          <Mic className="mr-2 h-4 w-4" /> {t("noise.scan")}
        </Button>
      )}
    </div>
  );
}

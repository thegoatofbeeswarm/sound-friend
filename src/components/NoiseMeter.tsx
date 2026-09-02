import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Environmental noise estimate from the device microphone.
 * Reported as an approximate SPL figure (uncalibrated microphones cannot be
 * exact), used to warn when a test room is too loud.
 */
export function NoiseMeter({ onLevel }: { onLevel?: (db: number) => void }) {
  const [level, setLevel] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanup.current?.(), []);

  async function start() {
    setError(null);
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
    } catch {
      setError("Microphone access was denied.");
    }
  }

  const tooLoud = level != null && level > 55;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/60 p-4">
      <div>
        <p className="text-sm font-medium">Room noise</p>
        <p className="text-xs text-muted-foreground">
          {level == null
            ? "Scan your surroundings before testing."
            : tooLoud
              ? `~${level} dB - too loud, find a quieter space.`
              : `~${level} dB - quiet enough to test.`}
        </p>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
      {active ? (
        <Button variant="secondary" size="sm" onClick={() => cleanup.current?.()}>
          <MicOff className="mr-2 h-4 w-4" /> Stop
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => void start()}>
          <Mic className="mr-2 h-4 w-4" /> Scan
        </Button>
      )}
    </div>
  );
}

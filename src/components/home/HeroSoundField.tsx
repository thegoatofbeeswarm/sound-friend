import { useEffect, useRef } from "react";

/**
 * Ambient "sound field" behind the hero: a few very large drifting glows,
 * a thin morphing waveform and two faint concentric ripples.
 *
 * All motion is transform/opacity based except the waveform path, which is
 * resampled at ~30fps from a cheap sine sum. Mouse parallax and the local
 * amplitude bump are disabled on coarse pointers and for reduced motion.
 */
const W = 1200;
const H = 300;
const POINTS = 72;

export function HeroSoundField() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathA = useRef<SVGPathElement>(null);
  const pathB = useRef<SVGPathElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    // Static fallback: draw one calm wave, no listeners, no loop.
    const build = (t: number, phase: number, amp: number, mx: number, my: number) => {
      let d = "";
      for (let i = 0; i <= POINTS; i++) {
        const p = i / POINTS;
        const x = p * W;
        // Fade the wave out towards both edges.
        const env = Math.sin(Math.PI * p) ** 1.4;
        let a = amp;
        if (mx >= 0) {
          const dist = Math.abs(p - mx);
          a += 26 * Math.exp(-(dist * dist) / 0.012) * (1 - Math.min(1, Math.abs(my)));
        }
        const y =
          H / 2 +
          env *
            (Math.sin(p * 7.5 + t * 1.1 + phase) * a +
              Math.sin(p * 17.3 - t * 0.75 + phase) * a * 0.45 +
              Math.sin(p * 3.1 + t * 0.35) * a * 0.6);
        d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(2)} `;
      }
      return d;
    };

    if (reduced) {
      pathA.current?.setAttribute("d", build(0, 0, 16, -1, 0));
      pathB.current?.setAttribute("d", build(0, 1.7, 10, -1, 0));
      return;
    }

    let mx = -1;
    let my = 0;
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let last = 0;
    const start = performance.now();

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      tx = (mx - 0.5) * 18;
      ty = my * 10;
    };
    const onLeave = () => {
      mx = -1;
      tx = 0;
      ty = 0;
    };

    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave, { passive: true });
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;

      const t = (now - start) / 1000;

      // Scroll fade: fully visible at the top of the hero, gone one screen down.
      const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.85));
      root.style.opacity = String(fade);
      if (fade <= 0.01) return;

      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      root.style.setProperty("--sf-x", `${px.toFixed(2)}px`);
      root.style.setProperty("--sf-y", `${py.toFixed(2)}px`);

      const amp = 15 + Math.sin(t * 0.35) * 4;
      pathA.current?.setAttribute("d", build(t, 0, amp, mx, my));
      pathB.current?.setAttribute("d", build(t * 0.82, 1.7, amp * 0.6, mx, my));
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden className="sound-field">
      <span className="sf-glow sf-glow-1" />
      <span className="sf-glow sf-glow-2" />
      <span className="sf-glow sf-glow-3" />
      <span className="sf-ripple sf-ripple-1" />
      <span className="sf-ripple sf-ripple-2" />
      <span className="sf-grain" />
      <svg
        className="sf-wave"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <path ref={pathA} className="sf-wave-a" fill="none" strokeWidth="1.5" />
        <path ref={pathB} className="sf-wave-b" fill="none" strokeWidth="1" />
      </svg>
    </div>
  );
}

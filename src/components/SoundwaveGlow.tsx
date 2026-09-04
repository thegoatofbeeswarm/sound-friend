/**
 * A slow, glowing sine wave that drifts behind the hero content.
 * Purely decorative — two copies of the same path scroll seamlessly.
 */
export function SoundwaveGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[420px] -translate-y-1/2 opacity-70">
      <div className="wave-drift flex h-full w-[200%]">
        {[0, 1].map((i) => (
          <svg key={i} viewBox="0 0 1200 420" preserveAspectRatio="none" className="h-full w-1/2">
            <defs>
              <linearGradient id={`wave-stroke-${i}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="oklch(0.7 0.14 210)" stopOpacity="0" />
                <stop offset="35%" stopColor="oklch(0.8 0.15 200)" stopOpacity="0.9" />
                <stop offset="70%" stopColor="oklch(0.72 0.16 285)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="oklch(0.7 0.14 210)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g fill="none" stroke={`url(#wave-stroke-${i})`}>
              <path
                d="M0 210 C 150 90, 300 330, 450 210 S 750 90, 900 210 S 1050 330, 1200 210"
                strokeWidth="1.5"
                style={{ filter: "blur(0.3px)" }}
              />
              <path
                d="M0 210 C 150 140, 300 280, 450 210 S 750 140, 900 210 S 1050 280, 1200 210"
                strokeWidth="1"
                opacity="0.55"
              />
              <path
                d="M0 210 C 150 40, 300 380, 450 210 S 750 40, 900 210 S 1050 380, 1200 210"
                strokeWidth="18"
                opacity="0.1"
                style={{ filter: "blur(28px)" }}
              />
            </g>
          </svg>
        ))}
      </div>
    </div>
  );
}

/**
 * Circular score dial. Used for the overall listening score and for the five
 * smaller dimension dials that sit around it.
 */
export function ScoreRing({
  value,
  size = 200,
  stroke = 10,
  label,
  caption,
  tone = "accent",
}: {
  /** 0-100, or null when there is no measurement yet. */
  value: number | null;
  size?: number;
  stroke?: number;
  label?: string;
  caption?: string;
  tone?: "accent" | "caution" | "danger" | "muted";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  const colors: Record<string, string> = {
    accent: "var(--signal)",
    caution: "var(--caution)",
    danger: "var(--danger)",
    muted: "var(--muted-foreground)",
  };
  const color = colors[tone] ?? colors["accent"]!;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          className="text-border/60"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="font-display font-semibold leading-none"
          style={{ fontSize: size * 0.3, color: value == null ? "var(--muted-foreground)" : color }}
        >
          {value ?? "—"}
        </span>
        {label ? (
          <span className="mt-1 px-2 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        ) : null}
        {caption ? <span className="mt-0.5 px-2 text-[11px] text-muted-foreground">{caption}</span> : null}
      </div>
    </div>
  );
}

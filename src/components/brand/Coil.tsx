/**
 * The cochlea's coil: the site's one motif.
 *
 * The real cochlea is a tube about 35 mm long wound two and a half times,
 * wide at the base (where high notes land) and narrow at the apex. This
 * draws that taper as one flat filled shape, so the same coil can be a
 * page-hero field, a list bullet and the footer mark.
 */

const TURNS = 2.6;
const STEPS = 220;

function coilPath(turns: number) {
  const outer: string[] = [];
  const inner: string[] = [];
  const spacing = 0.84 / turns;
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS; // 0 = apex (centre), 1 = base (outside)
    const a = t * turns * Math.PI * 2 - Math.PI / 2;
    const r = 0.1 + 0.84 * t;
    const half = (0.18 + 0.62 * t) * spacing * 0.5;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    outer.push(`${((r + half) * cx).toFixed(4)} ${((r + half) * cy).toFixed(4)}`);
    inner.push(`${((r - half) * cx).toFixed(4)} ${((r - half) * cy).toFixed(4)}`);
  }
  return `M${outer.join("L")}L${inner.reverse().join("L")}Z`;
}

const D = coilPath(TURNS);

export function Coil({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="-1 -1 2 2"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="currentColor"
    >
      <path d={D} />
    </svg>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

/**
 * EarHero — interactive cochlear hero for Audiomaxxer.
 *
 * Hover a part: it lights up and names itself.
 * Click a part: the ear zooms to it and a panel opens with what goes wrong
 * there, whether that loss is permanent, and which profile dimension it lands
 * in. The panel carries the signal path so you can walk the chain.
 *
 * The frequency slider maps a pitch to the place in the cochlea that actually
 * responds to it, using the Greenwood function (Greenwood 1990):
 *
 *     f = A * (10^(a * x) - k)     A = 165.4, a = 0.06, k = 0.88, x in mm from apex
 *
 * No dependencies beyond React. Styles are scoped under `am-` class names, so
 * nothing depends on your Tailwind config or shadcn tokens.
 */

/* ------------------------------------------------------------------ *
 * content
 * ------------------------------------------------------------------ */

type Part = {
  id: string;
  title: string;
  short: string;
  what: string;
  wrong: string;
  profile: string;
  kind: string;
  /** region of the 900x620 canvas to zoom to on click */
  focus: { x: number; y: number; w: number; h: number };
};

const PARTS: Part[] = [
  {
    id: "outer",
    title: "Outer ear",
    short: "Outer ear",
    what:
      "The folds of the outer ear color a sound depending on where it came from, which is how you tell a voice above you from one behind you.",
    wrong:
      "This is rarely the problem, and usually fixable when it is (i.e. wax or water that won't clear). Sound is blocked rather than lost, so it comes back when the blockage does.",
    profile: "Auditory attention",
    kind: "Conductive, usually temporary",
    focus: { x: 60, y: 80, w: 260, h: 470 },
  },
  {
    id: "canal",
    title: "Ear canal",
    short: "Canal",
    what:
      "About 25 mm of tube. Its length makes it resonate near 3 kHz, which is the band that carries consonants. ",
    wrong:
      "Wearing an earbud seals this tube shut. This kills the natural resonance and puts a driver millimetres from the eardrum, so the level arriving there is higher than the number on your phone suggests.",
    profile: "Hearing sensitivity",
    kind: "Conductive, usually temporary",
    focus: { x: 250, y: 250, w: 250, h: 160 },
  },
  {
    id: "drum",
    title: "Eardrum",
    short: "Eardrum",
    what:
      "A membrane the width of a pencil eraser. It moves less than the width of a single atom at the quietest sound you can hear.",
    wrong:
      "A blast or a sharp pressure change can tear it, but it usually heals within weeks. Muscles behind it take tens of milliseconds to brace against loud sound.",
    profile: "Hearing sensitivity",
    kind: "Conductive, usually heals",
    focus: { x: 400, y: 268, w: 160, h: 160 },
  },
  {
    id: "ossicles",
    title: "Malleus, incus, stapes",
    short: "Bones",
    what:
      "The three smallest bones in your body, levering the eardrum onto a window seventeen times smaller so the vibration is strong enough to move fluid.",
    wrong:
      "Bone can stiffen or the chain can come apart. Either way, sound arrives quieter but undistorted. Luckily, a test can see it, because sound conducted through the skull skips these bones entirely and a gap opens between the two routes.",
    profile: "Hearing sensitivity",
    kind: "Conductive, often treatable",
    focus: { x: 440, y: 258, w: 175, h: 132 },
  },
  {
    id: "cochlea",
    title: "Cochlea",
    short: "Cochlea",
    what:
      "The Cochlea is a coiled tube filled with 35 mm of fluid. The Cochlea sorts high notes near the entrance and low notes deep inside.",
    wrong:
      "Around 12,000 outer hair cells amplify quiet sound. Loud noise kills them, they don't grow back, and the ones nearest the entrance go first. That is the 4–6 kHz notch, and it can sit there for years before you notice anything missing.",
    profile: "Hearing sensitivity and sound discrimination",
    kind: "Sensorineural, permanent",
    focus: { x: 540, y: 300, w: 200, h: 190 },
  },
  {
    id: "nerve",
    title: "Auditory nerve",
    short: "Nerve",
    what:
      "The Auditory nerve contains roughly 30,000 fibres. The ones that fire tell your brain which pitch arrived. How they fire in time tells it where the sound came from.",
    wrong:
      "The connections between hair cells and nerve fibres can be lost while the hair cells themselves survive. In animals this happens after noise that leaves thresholds looking normal, and it is one suspected reason a person can pass a hearing test and still lose the thread in a loud bar.",
    profile: "Speech in noise",
    kind: "Sensorineural, and largely invisible to a threshold test",
    focus: { x: 640, y: 330, w: 250, h: 120 },
  },
  {
    id: "vestibular",
    title: "Semicircular canals",
    short: "Balance canals",
    what:
      "Three loops at right angles, filled with fluid that lags behind when you turn your head. These have nothing to do with hearing.",
    wrong:
      "The semicircular canals share fluid and bone with the cochlea. Very loud sound makes some people briefly dizzy, and inner-ear disorders often take both hearing and balance. ",
    profile: "Not measured — see a clinician about balance symptoms",
    kind: "Off the hearing path",
    focus: { x: 560, y: 190, w: 170, h: 140 },
  },
  {
    id: "eustachian",
    title: "Eustachian tube",
    short: "Eustachian tube",
    what:
      "A valve down to the back of your throat. It flicks open when you swallow, which is why yawning fixes your ears on a plane.",
    wrong:
      "When it stays shut, pressure behind the eardrum drops and fluid collects behind it. In children that is the commonest cause of hearing loss, and it is why a screening taken during a cold can look worse than you are.",
    profile: "Hearing sensitivity, temporarily",
    kind: "Conductive, usually temporary",
    focus: { x: 530, y: 370, w: 330, h: 240 },
  },
];

const byId = (id: string) => PARTS.find((p) => p.id === id)!;
const PATH = ["outer", "canal", "drum", "ossicles", "cochlea", "nerve"];
const OFF_PATH = ["vestibular", "eustachian"];

/* ------------------------------------------------------------------ *
 * cochlear geometry + physics
 * ------------------------------------------------------------------ */

const GW_A = 165.4, GW_a = 0.06, GW_k = 0.88, COCHLEA_MM = 35;
const F_MIN = 125, F_MAX = 8000;

const mmFromApex = (f: number) => Math.log10(f / GW_A + GW_k) / GW_a;
/** 0 = base (high notes, damaged first), 1 = apex (low notes) */
const placeFromFreq = (f: number) =>
  Math.min(1, Math.max(0, 1 - mmFromApex(f) / COCHLEA_MM));

const SP = { cx: 640, cy: 392, turns: 2.7, rOut: 68, rIn: 7, a0: Math.PI, squash: 0.9 };

function spiralPoint(t: number) {
  const a = SP.a0 + t * SP.turns * Math.PI * 2;
  const r = SP.rOut + (SP.rIn - SP.rOut) * t;
  return { x: SP.cx + Math.cos(a) * r, y: SP.cy + Math.sin(a) * r * SP.squash };
}
function spiralPath(t0: number, t1: number) {
  const steps = Math.max(2, Math.round(Math.abs(t1 - t0) * 240));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const p = spiralPoint(t0 + (t1 - t0) * (i / steps));
    d += (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1);
  }
  return d;
}

const WP: { x: number; y: number }[] = [
  { x: 10, y: 222 }, { x: 200, y: 296 }, { x: 344, y: 330 }, { x: 458, y: 346 },
];
const wp = (i: number) => WP[i] as { x: number; y: number };
function bez(t: number) {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return {
    x: a * wp(0).x + b * wp(1).x + c * wp(2).x + d * wp(3).x,
    y: a * wp(0).y + b * wp(1).y + c * wp(2).y + d * wp(3).y,
  };
}
function bezAngle(t: number) {
  const p = bez(Math.min(t + 0.01, 1)), q = bez(Math.max(t - 0.01, 0));
  return (Math.atan2(p.y - q.y, p.x - q.x) * 180) / Math.PI;
}

const VB_FULL = { x: 0, y: 0, w: 900, h: 620 };
const ASPECT = VB_FULL.w / VB_FULL.h;

/** grow a focus rect to the canvas aspect ratio, with breathing room */
function fitBox(r: { x: number; y: number; w: number; h: number }) {
  const pad = 1.34;
  let w = r.w * pad, h = r.h * pad;
  if (w / h < ASPECT) w = h * ASPECT;
  else h = w / ASPECT;
  return { x: r.x + r.w / 2 - w / 2, y: r.y + r.h / 2 - h / 2, w, h };
}

const MAX_WAVES = 13;

/** render a template containing {mm} with the value emphasised */
function withMm(template: string, value: string) {
  const [before = "", after = ""] = template.split("{mm}");
  return (
    <>
      {before}
      <em>{value}</em>
      {after}
    </>
  );
}

const BANDS: { upTo: number; key: string }[] = [
  { upTo: 200, key: "hero.band.1" },
  { upTo: 450, key: "hero.band.2" },
  { upTo: 900, key: "hero.band.3" },
  { upTo: 1800, key: "hero.band.4" },
  { upTo: 3200, key: "hero.band.5" },
  { upTo: 3800, key: "hero.band.6" },
  { upTo: 6200, key: "hero.band.7" },
  { upTo: 9000, key: "hero.band.8" },
];
const bandKey = (f: number) => BANDS.find((b) => f < b.upTo)?.key ?? "hero.band.8";
const formatFreq = (f: number) =>
  f < 1000 ? `${Math.round(f)} Hz` : `${(f / 1000).toFixed(1)} kHz`;

/* ------------------------------------------------------------------ *
 * component
 * ------------------------------------------------------------------ */

export default function EarHero() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const toPathway = useCallback(() => {
    void navigate({ to: "/auditory-pathway" });
  }, [navigate]);
  const tp = useCallback(
    (id: string, field: string) => t(`hero.part.${id}.${field}`),
    [t],
  );
  const bandLabel = useCallback((f: number) => t(bandKey(f)), [t]);
  const [pos, setPos] = useState(55);
  const [hovered, setHovered] = useState<Part | null>(null);
  const [selected, setSelected] = useState<Part | null>(null);
  const [visited, setVisited] = useState<string[]>([]);

  const shown = selected ?? hovered;

  const freq = useMemo(() => F_MIN * Math.pow(F_MAX / F_MIN, pos / 100), [pos]);
  const tPeak = useMemo(() => placeFromFreq(freq), [freq]);
  const mmFromBase = COCHLEA_MM - mmFromApex(freq);
  const inDangerBand = freq >= 4000 && freq <= 6000;

  const bandPath = useMemo(() => spiralPath(placeFromFreq(6000), placeFromFreq(4000)), []);
  const travelPath = useMemo(() => spiralPath(0, Math.min(tPeak + 0.04, 1)), [tPeak]);
  const peak = spiralPoint(tPeak);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const waveRefs = useRef<(SVGPathElement | null)[]>([]);
  const drumRef = useRef<SVGGElement | null>(null);
  const ossRef = useRef<SVGGElement | null>(null);
  const travelRef = useRef<SVGPathElement | null>(null);
  const peakRef = useRef<SVGCircleElement | null>(null);
  const nerveRef = useRef<SVGPathElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const live = useRef({ count: 8, amp: 1, travelLen: 1, nerveLen: 1 });
  const vb = useRef({ ...VB_FULL });
  const vbTarget = useRef({ ...VB_FULL });

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const select = useCallback((p: Part) => {
    setSelected(p);
    setHovered(null);
    setVisited((v) => (v.includes(p.id) ? v : [...v, p.id]));
  }, []);

  /* zoom target follows the selection */
  useEffect(() => {
    vbTarget.current = selected ? fitBox(selected.focus) : { ...VB_FULL };
    if (reduced) {
      vb.current = { ...vbTarget.current };
      svgRef.current?.setAttribute(
        "viewBox",
        `${vb.current.x} ${vb.current.y} ${vb.current.w} ${vb.current.h}`
      );
    }
  }, [selected, reduced]);

  /* move focus into the panel when it opens, and close on Escape */
  useEffect(() => {
    if (!selected) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  /* slider-driven values the animation reads without re-rendering */
  useEffect(() => {
    const p = pos / 100;
    live.current.count = Math.round(4 + p * (MAX_WAVES - 4));
    live.current.amp = 1.2 - 0.55 * p;
  }, [pos]);

  /* dash patterns depend on measured path lengths */
  useEffect(() => {
    if (travelRef.current) {
      const len = travelRef.current.getTotalLength();
      live.current.travelLen = len;
      travelRef.current.style.strokeDasharray = `${len * 0.3} ${len * 1.3}`;
    }
    if (nerveRef.current) {
      const len = nerveRef.current.getTotalLength();
      live.current.nerveLen = len;
      nerveRef.current.style.strokeDasharray = `${len * 0.22} ${len}`;
    }
  }, [travelPath]);

  /* one animation loop drives the waves, the chain, and the zoom */
  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const paint = (elapsed: number) => {
      const { count, amp, travelLen, nerveLen } = live.current;
      const speed = 0.34;
      const cycle = (elapsed * speed) % 1;

      for (let i = 0; i < MAX_WAVES; i++) {
        const el = waveRefs.current[i];
        if (!el) continue;
        if (i >= count) { el.setAttribute("opacity", "0"); continue; }
        const t = (cycle + i / count) % 1;
        const pt = bez(t);
        const sx = 1 - 0.62 * t;
        const sy = (1 - 0.66 * t) * amp;
        el.setAttribute(
          "transform",
          `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${bezAngle(t).toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`
        );
        el.setAttribute("opacity", (Math.min(t * 4, 1) * (1 - t * 0.5) * 0.8).toFixed(3));
        el.setAttribute("stroke-width", (1.6 + amp * 1.5).toFixed(2));
      }

      const arrival = (elapsed * speed * count) % 1;
      const thump = (delay: number) => Math.exp(-(((arrival - delay + 1) % 1) * 5.5));

      if (drumRef.current)
        drumRef.current.style.transform = `scaleX(${(1 + 0.2 * amp * thump(0)).toFixed(3)})`;
      if (ossRef.current)
        ossRef.current.style.opacity = (0.45 + 0.55 * thump(0.07)).toFixed(3);

      if (travelRef.current) {
        const seg = travelLen * 0.3;
        const prog = (arrival + 0.86) % 1;
        travelRef.current.style.strokeDashoffset = (seg - prog * (travelLen + seg)).toFixed(1);
        travelRef.current.style.opacity = (0.85 * Math.min(prog * 5, 1)).toFixed(3);
      }
      if (peakRef.current) {
        const hit = thump(0.3);
        peakRef.current.setAttribute("r", (5 + 9 * hit).toFixed(2));
        peakRef.current.setAttribute("opacity", (0.25 + 0.7 * hit).toFixed(3));
      }
      if (nerveRef.current) {
        const prog = (arrival + 0.55) % 1;
        nerveRef.current.style.strokeDashoffset = (nerveLen - prog * nerveLen).toFixed(1);
        nerveRef.current.style.opacity = (0.1 + 0.7 * thump(0.45)).toFixed(3);
      }

      // ease the viewBox toward whatever is selected
      const c = vb.current, tgt = vbTarget.current;
      if (Math.abs(c.w - tgt.w) > 0.4 || Math.abs(c.x - tgt.x) > 0.4 || Math.abs(c.y - tgt.y) > 0.4) {
        const k = 0.11;
        c.x += (tgt.x - c.x) * k;
        c.y += (tgt.y - c.y) * k;
        c.w += (tgt.w - c.w) * k;
        c.h += (tgt.h - c.h) * k;
        svgRef.current?.setAttribute(
          "viewBox",
          `${c.x.toFixed(1)} ${c.y.toFixed(1)} ${c.w.toFixed(1)} ${c.h.toFixed(1)}`
        );
      }
    };

    if (reduced) { paint(0.4); return; }
    const loop = (now: number) => {
      paint((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const parallax = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduced || e.pointerType !== "mouse" || selected) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--am-px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      el.style.setProperty("--am-py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    },
    [reduced, selected]
  );

  const bind = (id: string) => {
    const p = byId(id);
    const on = shown?.id === id;
    return {
      tabIndex: 0,
      role: "button" as const,
      "aria-label": `${tp(p.id, "title")}. ${t("hero.peek.more")}`,
      "aria-expanded": selected?.id === id,
      className:
        "am-part" + (on ? " am-on" : "") + (visited.includes(id) ? " am-seen" : ""),
      onPointerEnter: () => !selected && setHovered(p),
      onPointerLeave: () => setHovered(null),
      onFocus: () => !selected && setHovered(p),
      onBlur: () => setHovered(null),
      onClick: () => select(p),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(p); }
      },
    };
  };

  const chainBtn = (id: string) => {
    const p = byId(id);
    return (
      <button
        key={id}
        type="button"
        className={
          "am-step" +
          (selected?.id === id ? " am-step-now" : "") +
          (visited.includes(id) ? " am-step-seen" : "")
        }
        onClick={() => select(p)}
      >
        {tp(p.id, "short")}
      </button>
    );
  };

  return (
    <section className="am-hero" onPointerMove={parallax}>
      <style>{CSS}</style>

      <div className="am-copy">
        <p className="am-mark">
          <b>Audiomaxxer</b> <span>{t("hero.tagline")}</span>
        </p>

        <h1>{t("hero.title")}</h1>

        <p className="am-lede">{t("hero.lede")}</p>

        <div className="am-meter">
          <label htmlFor="am-freq">{t("hero.meter.label")}</label>
          <div className="am-readout">
            <span className="am-hz">{formatFreq(freq)}</span>
            <span className="am-band">{bandLabel(freq)}</span>
          </div>
          <input
            id="am-freq"
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-describedby="am-place"
            aria-valuetext={`${formatFreq(freq)}, ${bandLabel(freq)}`}
          />
          <p id="am-place" className={"am-place" + (inDangerBand ? " am-warn" : "")}>
            {withMm(
              t(inDangerBand ? "hero.place.danger" : "hero.place.normal"),
              `${mmFromBase.toFixed(1)} mm`,
            )}
          </p>
        </div>

        <div className="am-actions">
          <a className="am-btn am-btn-solid" href="/test">{t("hero.cta.test")}</a>
          <a className="am-btn am-btn-line" href="/sample-profile">{t("hero.cta.profile")}</a>
        </div>
        <p className="am-fine">{t("hero.fine")}</p>

        <div className="am-detail">
          <p className={"am-hint" + (shown ? " am-off" : "")}>
            {t("hero.hint")}
            {visited.length > 0 && (
              <span className="am-count">
                {" "}
                {t("hero.count")
                  .replace("{n}", String(visited.length))
                  .replace("{total}", String(PARTS.length))}
              </span>
            )}
          </p>
          <div className={"am-peek" + (hovered && !selected ? " am-on" : "")}>
            <h2>{hovered ? tp(hovered.id, "title") : ""}</h2>
            <p>{hovered ? tp(hovered.id, "what") : ""}</p>
            <span className="am-more">{t("hero.peek.more")}</span>
          </div>
        </div>
      </div>

      {/* ---------------- detail panel ---------------- */}
      {selected && (
        <div
          className="am-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="am-panel-title"
          tabIndex={-1}
          ref={panelRef}
        >
          <button
            type="button"
            className="am-close"
            onClick={() => setSelected(null)}
            aria-label={t("hero.close.aria")}
          >
            {t("hero.close")}
          </button>

          <p className="am-kind">{tp(selected.id, "kind")}</p>
          <h2 id="am-panel-title">{tp(selected.id, "title")}</h2>
          <p className="am-what">{tp(selected.id, "what")}</p>

          <h3>{t("hero.panel.wrong")}</h3>
          <p className="am-wrong">{tp(selected.id, "wrong")}</p>

          <h3>{t("hero.panel.profile")}</h3>
          <p className="am-prof">{tp(selected.id, "profile")}</p>

          <div className="am-chain">
            <h3>{t("hero.panel.path")}</h3>
            <div className="am-steps">
              {PATH.map(chainBtn)}
              <button type="button" className="am-step am-step-gate" onClick={toPathway}>
                {t("path.hero.step")}
              </button>
            </div>
            <h3 className="am-chain-sub">{t("hero.panel.alongside")}</h3>
            <div className="am-steps">{OFF_PATH.map(chainBtn)}</div>
          </div>

          {selected.id === "nerve" && (
            <p className="am-onward">
              {t("path.hero.gate.sub")}
              <Link to="/auditory-pathway">{t("path.hero.cta")}</Link>
            </p>
          )}

          {visited.length === PARTS.length && (
            <p className="am-done">
              {t("hero.done")}
              <a href="/test">{t("hero.done.cta")}</a>
            </p>
          )}
        </div>
      )}

      <div className="am-stage">
        <svg
          ref={svgRef}
          viewBox="0 0 900 620"
          className={shown ? "am-dim" : undefined}
          role="img"
          aria-label={t("hero.svg.alt")}
        >
          <defs>
            <radialGradient id="amHead" cx="55%" cy="45%" r="62%">
              <stop offset="0%" stopColor="#16242F" />
              <stop offset="100%" stopColor="#070E15" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="amCanal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7FB6E8" stopOpacity=".05" />
              <stop offset="100%" stopColor="#7FB6E8" stopOpacity=".17" />
            </linearGradient>
            <linearGradient id="amDrum" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F0997E" />
              <stop offset="100%" stopColor="#B4503A" />
            </linearGradient>
            <filter id="amSoft" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <filter id="amGlow" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="3.6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g id="am-far">
            <ellipse cx="520" cy="300" rx="360" ry="290" fill="url(#amHead)" />
            <path
              d="M300 40 C520 20 760 120 830 300 C880 430 840 560 760 620 L900 620 L900 0 Z"
              fill="#0B1620" opacity=".55" filter="url(#amSoft)"
            />
          </g>

          <g id="am-mid">
            <g {...bind("outer")}>
              <g className="am-art">
                <path d="M236 116 C166 92 100 130 88 208 C74 296 94 378 128 448 C150 494 182 524 220 528 C252 531 270 510 264 482" fill="none" stroke="#9FB3C0" strokeWidth="9" strokeLinecap="round" opacity=".55" />
                <path d="M230 168 C188 178 168 224 176 272 C184 320 208 352 224 392" fill="none" stroke="#9FB3C0" strokeWidth="6" strokeLinecap="round" opacity=".38" />
                <path d="M240 246 C212 258 204 300 222 332 C236 356 258 360 272 344" fill="none" stroke="#9FB3C0" strokeWidth="6" strokeLinecap="round" opacity=".38" />
                <path d="M188 452 C176 484 192 516 220 522" fill="none" stroke="#9FB3C0" strokeWidth="8" strokeLinecap="round" opacity=".3" />
              </g>
              <circle className="am-node" cx="140" cy="180" r="3.2" />
              <polyline className="am-lead" points="140,180 106,120 100,96" />
              <text className="am-lbl" x="66" y="82">{t("hero.lbl.outer")}</text>
              <path className="am-ring" d="M78 96 h204 v450 h-204 Z" />
              <path className="am-hit" d="M78 96 h204 v450 h-204 Z" />
            </g>

            <g {...bind("canal")}>
              <g className="am-art">
                <path d="M262 294 C322 300 400 312 462 318 L466 374 C404 368 330 358 268 352 Z" fill="url(#amCanal)" />
                <path d="M262 294 C322 300 400 312 462 318" fill="none" stroke="#9FB3C0" strokeWidth="3" opacity=".4" />
                <path d="M268 352 C330 358 404 368 466 374" fill="none" stroke="#9FB3C0" strokeWidth="3" opacity=".4" />
              </g>
              <circle className="am-node" cx="356" cy="310" r="3.2" />
              <polyline className="am-lead" points="356,310 352,268 348,254" />
              <text className="am-lbl" x="348" y="242" textAnchor="middle">{t("hero.lbl.canal")}</text>
              <path className="am-ring" d="M258 288 h214 v92 h-214 Z" />
              <path className="am-hit" d="M258 288 h214 v92 h-214 Z" />
            </g>

            <g>
              {Array.from({ length: MAX_WAVES }).map((_, i) => (
                <path
                  key={i}
                  ref={(el) => { waveRefs.current[i] = el; }}
                  className="am-wave"
                  d="M0 -58 Q 26 0 0 58"
                  opacity="0"
                />
              ))}
            </g>
          </g>

          <g id="am-near">
            <path d="M470 286 C540 272 606 292 612 340 C618 392 566 412 508 404 C472 398 462 340 470 286 Z" fill="#0F1D26" opacity=".85" />

            <g {...bind("drum")}>
              <g className="am-art">
                <g ref={drumRef} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                  <ellipse cx="466" cy="346" rx="9" ry="31" fill="url(#amDrum)" transform="rotate(-9 466 346)" />
                  <ellipse cx="466" cy="346" rx="9" ry="31" fill="none" stroke="#F3B49E" strokeWidth="1.2" opacity=".7" transform="rotate(-9 466 346)" />
                </g>
              </g>
              <circle className="am-node" cx="462" cy="374" r="3.2" />
              <polyline className="am-lead" points="462,374 436,442 430,458" />
              <text className="am-lbl" x="424" y="478" textAnchor="middle">{t("hero.lbl.drum")}</text>
              <ellipse className="am-ring" cx="466" cy="346" rx="20" ry="40" />
              <ellipse className="am-hit" cx="466" cy="346" rx="22" ry="42" />
            </g>

            <g {...bind("ossicles")}>
              <g className="am-art" ref={ossRef}>
                <path d="M466 344 L484 320 L499 302" fill="none" stroke="#E8B44C" strokeWidth="6" strokeLinecap="round" />
                <circle cx="503" cy="297" r="9" fill="#E8B44C" />
                <path d="M510 300 L530 310 L536 328" fill="none" stroke="#E8B44C" strokeWidth="6" strokeLinecap="round" />
                <circle cx="520" cy="304" r="7.5" fill="#E8B44C" />
                <path d="M538 330 L556 338 M538 340 L556 350 M556 336 L556 352" fill="none" stroke="#E8B44C" strokeWidth="4" strokeLinecap="round" />
                <path d="M560 334 L562 356" stroke="#E8B44C" strokeWidth="5" strokeLinecap="round" />
              </g>
              <circle className="am-node" cx="512" cy="292" r="3.2" />
              <polyline className="am-lead" points="512,292 516,252 518,238" />
              <text className="am-lbl" x="518" y="226" textAnchor="middle">{t("hero.lbl.bones")}</text>
              <path className="am-ring" d="M456 282 h122 v86 h-122 Z" />
              <path className="am-hit" d="M456 282 h122 v86 h-122 Z" />
            </g>

            <g {...bind("vestibular")}>
              <g className="am-art">
                <ellipse cx="612" cy="250" rx="30" ry="47" transform="rotate(-26 612 250)" fill="none" stroke="#4FD1A5" strokeWidth="7" opacity=".9" />
                <ellipse cx="664" cy="262" rx="45" ry="26" transform="rotate(14 664 262)" fill="none" stroke="#4FD1A5" strokeWidth="7" opacity=".9" />
                <ellipse cx="628" cy="296" rx="26" ry="38" transform="rotate(66 628 296)" fill="none" stroke="#4FD1A5" strokeWidth="7" opacity=".75" />
                <path d="M604 312 C596 330 596 344 604 356" fill="none" stroke="#4FD1A5" strokeWidth="9" strokeLinecap="round" opacity=".8" />
              </g>
              <circle className="am-node" cx="676" cy="230" r="3.2" />
              <polyline className="am-lead" points="676,230 706,196 718,188" />
              <text className="am-lbl" x="726" y="182">{t("hero.lbl.balance")}</text>
              <path className="am-ring" d="M572 196 h146 v126 h-146 Z" />
              <path className="am-hit" d="M572 196 h146 v126 h-146 Z" />
            </g>

            <g {...bind("cochlea")}>
              <g className="am-art">
                <path d={spiralPath(0, 0.46)} fill="none" stroke="#4FD1A5" strokeWidth="13" strokeLinecap="round" opacity=".8" />
                <path d={spiralPath(0.44, 0.76)} fill="none" stroke="#4FD1A5" strokeWidth="9" strokeLinecap="round" opacity=".8" />
                <path d={spiralPath(0.74, 1)} fill="none" stroke="#4FD1A5" strokeWidth="5" strokeLinecap="round" opacity=".8" />
                <path d={bandPath} className={"am-danger" + (inDangerBand ? " am-lit" : "")} fill="none" strokeWidth="15" strokeLinecap="butt" />
                <path ref={travelRef} d={travelPath} className="am-travel" fill="none" strokeWidth="5" strokeLinecap="round" filter="url(#amGlow)" />
                <circle ref={peakRef} cx={peak.x} cy={peak.y} r="7" fill="#EFFFF8" filter="url(#amGlow)" />
              </g>
              <circle className="am-node" cx="672" cy="430" r="3.2" />
              <polyline className="am-lead" points="672,430 706,470 716,478" />
              <text className="am-lbl" x="724" y="484">{t("hero.lbl.cochlea")}</text>
              <circle className="am-ring" cx="640" cy="392" r="78" />
              <circle className="am-hit" cx="640" cy="392" r="78" />
            </g>

            <g className="am-annot" pointerEvents="none">
              <polyline points="622,444 566,494 556,502" fill="none" />
              <text x="548" y="508" textAnchor="end">4–6 kHz</text>
              <text x="548" y="526" textAnchor="end" className="am-annot-sub">{t("hero.annot.first")}</text>
            </g>

            <g {...bind("nerve")}>
              <g className="am-art">
                <path d="M654 402 C724 400 776 394 884 366" fill="none" stroke="#E8B44C" strokeWidth="15" strokeLinecap="round" opacity=".55" />
                <path d="M700 402 C760 412 810 420 880 414" fill="none" stroke="#E8B44C" strokeWidth="6" strokeLinecap="round" opacity=".3" />
                <path ref={nerveRef} d="M654 402 C724 400 776 394 884 366" fill="none" stroke="#FFE3A6" strokeWidth="7" strokeLinecap="round" filter="url(#amGlow)" />
              </g>
              <circle className="am-node" cx="796" cy="384" r="3.2" />
              <polyline className="am-lead" points="796,384 792,340 790,328" />
              <text className="am-lbl" x="790" y="316" textAnchor="middle">{t("hero.lbl.nerve")}</text>
              <path className="am-ring" d="M650 356 h244 v72 h-244 Z" />
              <path className="am-hit" d="M650 356 h244 v72 h-244 Z" />
            </g>

            <g
              className="am-gate"
              role="button"
              tabIndex={0}
              aria-label={t("path.hero.gate")}
              onClick={toPathway}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toPathway();
                }
              }}
            >
              <circle className="am-gate-halo" cx="872" cy="368" r="27" />
              <circle className="am-gate-ring" cx="872" cy="368" r="15" />
              <path className="am-gate-arrow" d="M864 368 h15 M874 362 l6 6 l-6 6" />
              <text className="am-gate-lbl" x="896" y="414" textAnchor="end">
                {t("path.hero.gate")}
              </text>
              <text className="am-gate-sub" x="896" y="433" textAnchor="end">
                {t("path.hero.gate.sub")}
              </text>
              <circle className="am-hit" cx="872" cy="368" r="34" />
            </g>

            <g {...bind("eustachian")}>
              <g className="am-art">
                <path d="M552 388 C628 462 690 512 828 592" fill="none" stroke="#8FA0AC" strokeWidth="13" strokeLinecap="round" opacity=".38" />
                <path d="M556 394 C630 466 692 516 824 596" fill="none" stroke="#0C1620" strokeWidth="4" strokeLinecap="round" opacity=".6" />
              </g>
              <circle className="am-node" cx="694" cy="516" r="3.2" />
              <polyline className="am-lead" points="694,516 700,566 702,578" />
              <text className="am-lbl" x="710" y="586">{t("hero.lbl.eustachian")}</text>
              <path className="am-ring" d="M544 380 L836 584 L822 604 L534 400 Z" />
              <path className="am-hit" d="M540 374 L840 580 L820 610 L526 404 Z" />
            </g>
          </g>
        </svg>
      </div>
    </section>
  );
}

const CSS = `
.am-hero{
  --am-ink:#060B12; --am-bone:#E8E3D6; --am-muted:#8FA0AC;
  --am-jade:#4FD1A5; --am-gold:#E8B44C; --am-hot:#FF7A4A;
  --am-px:0; --am-py:0;
  position:relative; display:grid; grid-template-columns:minmax(320px,44%) 1fr;
  align-items:center; overflow:hidden; min-height:100svh;
  color:var(--am-bone); background:radial-gradient(120% 90% at 78% 42%,#101E28 0%,#08111A 45%,var(--am-ink) 78%);
}
.am-hero::after{
  content:""; position:absolute; inset:0; pointer-events:none;
  background-image:linear-gradient(to right,rgba(143,160,172,.055) 1px,transparent 1px),
                   linear-gradient(to bottom,rgba(143,160,172,.055) 1px,transparent 1px);
  background-size:78px 78px;
  -webkit-mask-image:radial-gradient(80% 70% at 60% 45%,#000 20%,transparent 78%);
  mask-image:radial-gradient(80% 70% at 60% 45%,#000 20%,transparent 78%);
}
.am-copy{position:relative; z-index:3; padding:clamp(28px,5vw,84px); max-width:38em}
.am-stage{position:relative; z-index:2; min-width:0}
.am-stage svg{width:100%; height:auto; display:block; overflow:visible}

.am-mark{display:flex; gap:.6rem; align-items:baseline; flex-wrap:wrap;
  font-size:.92rem; color:var(--am-muted); margin:0 0 clamp(24px,6vh,52px)}
.am-mark b{color:var(--am-bone); font-weight:600}
.am-hero h1{
  font-family:var(--am-display, ui-serif, Georgia, "Times New Roman", serif);
  font-weight:400; font-size:clamp(2.1rem,4.2vw,3.7rem); line-height:1.04;
  letter-spacing:-.018em; margin:0 0 1.1rem; text-wrap:balance;
}
.am-lede{font-size:clamp(1rem,1.1vw,1.1rem); line-height:1.62; color:#B9C4CC; max-width:33em; margin:0 0 2rem}

.am-meter{border-top:1px solid rgba(143,160,172,.22); padding-top:1.3rem; max-width:31em}
.am-meter label{display:block; font-size:.88rem; color:var(--am-muted); margin-bottom:.85rem}
.am-readout{display:flex; align-items:baseline; gap:.75rem; flex-wrap:wrap; margin-bottom:.4rem}
.am-hz{font-family:var(--am-display, ui-serif, Georgia, serif); font-size:2.9rem; line-height:1; font-variant-numeric:tabular-nums}
.am-band{font-size:1rem; color:#B9C4CC}
.am-place{font-size:.9rem; line-height:1.5; color:var(--am-muted); min-height:3em; max-width:28em; margin:.2rem 0 0}
.am-place em{font-style:normal; color:var(--am-bone)}
.am-place.am-warn{color:#FFB79B}

.am-hero input[type=range]{-webkit-appearance:none; appearance:none; width:100%; height:32px;
  background:transparent; margin:.2rem 0 .5rem; cursor:grab}
.am-hero input[type=range]:active{cursor:grabbing}
.am-hero input[type=range]::-webkit-slider-runnable-track{height:3px; border-radius:2px;
  background:linear-gradient(to right,var(--am-jade) 0%,var(--am-jade) 62%,var(--am-gold) 78%,var(--am-hot) 92%,var(--am-jade) 100%); opacity:.7}
.am-hero input[type=range]::-moz-range-track{height:3px; border-radius:2px;
  background:linear-gradient(to right,var(--am-jade) 0%,var(--am-jade) 62%,var(--am-gold) 78%,var(--am-hot) 92%,var(--am-jade) 100%); opacity:.7}
.am-hero input[type=range]::-webkit-slider-thumb{-webkit-appearance:none; appearance:none;
  width:18px; height:18px; border-radius:50%; background:var(--am-bone); border:0; margin-top:-7.5px;
  box-shadow:0 0 0 6px rgba(232,227,214,.12)}
.am-hero input[type=range]::-moz-range-thumb{width:18px; height:18px; border-radius:50%;
  background:var(--am-bone); border:0; box-shadow:0 0 0 6px rgba(232,227,214,.12)}
.am-hero input[type=range]:focus-visible{outline:none}
.am-hero input[type=range]:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 4px var(--am-jade)}
.am-hero input[type=range]:focus-visible::-moz-range-thumb{box-shadow:0 0 0 4px var(--am-jade)}

.am-actions{display:flex; flex-wrap:wrap; gap:.7rem; margin-top:1.5rem}
.am-btn{font:inherit; font-size:.95rem; font-weight:500; padding:.72rem 1.25rem; border-radius:2px;
  border:1px solid transparent; text-decoration:none; transition:background .18s,border-color .18s}
.am-btn-solid{background:var(--am-bone); color:#0A121A}
.am-btn-solid:hover{background:#fff}
.am-btn-line{border-color:rgba(143,160,172,.4); color:var(--am-bone)}
.am-btn-line:hover{border-color:var(--am-bone)}
.am-btn:focus-visible{outline:2px solid var(--am-jade); outline-offset:3px}
.am-fine{font-size:.82rem; color:rgba(143,160,172,.8); margin:.9rem 0 0}

/* hover preview */
.am-detail{position:relative; margin-top:clamp(26px,4vh,44px); min-height:7em; max-width:30em}
.am-peek{position:absolute; inset:0; border-left:1px solid var(--am-jade); padding:.15rem 0 .15rem 1rem;
  opacity:0; transform:translateY(6px); transition:opacity .2s,transform .2s; pointer-events:none}
.am-peek.am-on{opacity:1; transform:none}
.am-peek h2{font-family:var(--am-display, ui-serif, Georgia, serif); font-weight:400; font-size:1.1rem; margin:0 0 .3rem}
.am-peek p{margin:0 0 .45rem; font-size:.9rem; line-height:1.55; color:#AEBAC3}
.am-more{font-size:.8rem; color:var(--am-jade)}
.am-hint{position:absolute; inset:0; margin:0; font-size:.85rem; color:rgba(143,160,172,.72); transition:opacity .2s}
.am-hint.am-off{opacity:0}
.am-count{color:rgba(143,160,172,.5)}

/* detail panel */
.am-panel{
  position:absolute; z-index:6; left:0; top:0; bottom:0; width:min(46ch,100%);
  padding:clamp(28px,4vw,56px); overflow:auto;
  background:linear-gradient(to right,rgba(6,11,18,.97) 70%,rgba(6,11,18,.86));
  -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);
  border-right:1px solid rgba(79,209,165,.25);
  animation:am-in .24s ease both;
}
@keyframes am-in{from{opacity:0; transform:translateX(-14px)} to{opacity:1; transform:none}}
.am-panel:focus{outline:none}
.am-close{position:sticky; top:0; z-index:8; float:right; margin:0 0 .5rem 1rem;
  font:inherit; font-size:.82rem;
  background:rgba(6,11,18,.92); border:1px solid rgba(143,160,172,.35); color:var(--am-muted);
  padding:.45rem .9rem; border-radius:2px; cursor:pointer; -webkit-tap-highlight-color:transparent}
.am-close:hover{color:var(--am-bone); border-color:var(--am-bone)}
.am-close:focus-visible{outline:2px solid var(--am-jade); outline-offset:2px}
.am-kind{margin:0 0 .5rem; font-size:.8rem; color:var(--am-gold)}
.am-panel h2{font-family:var(--am-display, ui-serif, Georgia, serif); font-weight:400;
  font-size:1.8rem; line-height:1.1; margin:0 0 .7rem}
.am-panel h3{font-size:.82rem; font-weight:600; color:var(--am-muted);
  margin:1.5rem 0 .4rem; letter-spacing:.01em}
.am-panel p{margin:0; font-size:.95rem; line-height:1.62; color:#C3CCD4}
.am-what{color:#98A6B0 !important; font-size:.9rem !important}
.am-prof{color:var(--am-jade) !important}
.am-chain{margin-top:1.7rem; border-top:1px solid rgba(143,160,172,.18); padding-top:.3rem}
.am-chain-sub{margin-top:1.1rem !important}
.am-steps{display:flex; flex-wrap:wrap; gap:.4rem}
.am-step{font:inherit; font-size:.82rem; padding:.4rem .7rem; border-radius:2px; cursor:pointer;
  background:none; color:var(--am-muted); border:1px solid rgba(143,160,172,.28)}
.am-step:hover{color:var(--am-bone); border-color:var(--am-bone)}
.am-step-seen{color:#B9C4CC}
.am-step-now{background:var(--am-jade); border-color:var(--am-jade); color:#062018; font-weight:500}
.am-step:focus-visible{outline:2px solid var(--am-jade); outline-offset:2px}
.am-done{margin-top:1.6rem !important; font-size:.88rem !important; color:var(--am-bone) !important}
.am-done a{color:var(--am-jade); margin-left:.4rem}

/* the way on to the auditory pathway */
.am-gate{cursor:pointer}
.am-gate:focus{outline:none}
.am-gate-halo{fill:rgba(232,180,76,.14); stroke:none; transform-box:fill-box; transform-origin:center;
  animation:am-gate-pulse 2.8s ease-in-out infinite}
.am-gate-ring{fill:rgba(6,11,18,.78); stroke:var(--am-gold); stroke-width:1.6; transition:fill .2s}
.am-gate-arrow{fill:none; stroke:var(--am-gold); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; transition:stroke .2s}
.am-gate-lbl{fill:var(--am-gold); font-size:15px; font-weight:600; transition:fill .2s}
.am-gate-sub{fill:var(--am-muted); font-size:12.5px}
.am-gate:hover .am-gate-ring,.am-gate:focus-visible .am-gate-ring{fill:var(--am-gold)}
.am-gate:hover .am-gate-arrow,.am-gate:focus-visible .am-gate-arrow{stroke:#0A121A}
.am-gate:hover .am-gate-lbl,.am-gate:focus-visible .am-gate-lbl{fill:var(--am-bone)}
@keyframes am-gate-pulse{0%,100%{opacity:.3; transform:scale(.84)} 50%{opacity:1; transform:scale(1.14)}}
.am-step-gate{border-color:rgba(232,180,76,.5); color:var(--am-gold)}
.am-step-gate:hover{border-color:var(--am-gold); color:var(--am-gold)}
.am-onward{margin-top:1.5rem !important; font-size:.88rem !important; color:var(--am-bone) !important}
.am-onward a{color:var(--am-gold); margin-left:.4rem}

/* anatomy */
#am-far{transform:translate(calc(var(--am-px) * 7px),calc(var(--am-py) * 5px))}
#am-mid{transform:translate(calc(var(--am-px) * 14px),calc(var(--am-py) * 10px))}
#am-near{transform:translate(calc(var(--am-px) * 24px),calc(var(--am-py) * 17px))}

.am-part{cursor:pointer}
.am-part:focus{outline:none}
.am-hit{fill:transparent; stroke:none}
.am-art{transition:opacity .25s}
.am-ring{fill:none; stroke:var(--am-bone); stroke-width:1.5; stroke-dasharray:3 4; opacity:0; pointer-events:none}
.am-part:focus-visible .am-ring{opacity:1}
.am-lbl{font-size:15px; font-weight:500; fill:var(--am-bone); opacity:.34; transition:opacity .25s; pointer-events:none}
.am-lead{stroke:var(--am-bone); stroke-width:1; opacity:.22; fill:none; transition:opacity .25s; pointer-events:none}
.am-node{fill:var(--am-bone); opacity:.3; transition:opacity .25s,fill .25s; pointer-events:none}
.am-seen .am-node{fill:var(--am-jade); opacity:.55}
.am-part:hover .am-lbl,.am-part:focus-visible .am-lbl,.am-part.am-on .am-lbl{opacity:1}
.am-part:hover .am-lead,.am-part:focus-visible .am-lead,.am-part.am-on .am-lead{opacity:.6}
.am-part:hover .am-node,.am-part:focus-visible .am-node,.am-part.am-on .am-node{opacity:1}
svg.am-dim .am-part:not(.am-on) .am-art{opacity:.22}
svg.am-dim .am-part:not(.am-on) .am-lbl{opacity:.14}

.am-wave{fill:none; stroke:#7FB6E8; stroke-linecap:round}
.am-travel{stroke:#EFFFF8}
.am-danger{stroke:var(--am-gold); opacity:.32; transition:opacity .3s,stroke .3s}
.am-danger.am-lit{stroke:var(--am-hot); opacity:.85}
.am-annot polyline{stroke:var(--am-gold); stroke-width:1; opacity:.45}
.am-annot text{fill:var(--am-gold); font-size:14px; font-weight:500; opacity:.8}
.am-annot .am-annot-sub{opacity:.5; font-size:13px}

@media (max-width:1000px){
  .am-hero{grid-template-columns:1fr; min-height:auto; align-content:start}
  .am-stage{order:-1; padding-top:10px}
  .am-copy{padding:clamp(22px,6vw,40px) clamp(22px,6vw,40px) 30px}
  .am-detail{min-height:8.4em; max-width:none}
  .am-hero h1{font-size:clamp(1.9rem,6.4vw,2.7rem)}
  .am-hz{font-size:2.4rem}
  .am-panel{position:fixed; inset:auto 0 0 0; top:auto; width:100%; max-height:76svh;
    border-right:0; border-top:1px solid rgba(79,209,165,.3);
    background:rgba(6,11,18,.97); animation:am-up .24s ease both}
  @keyframes am-up{from{opacity:0; transform:translateY(18px)} to{opacity:1; transform:none}}
}
@media (max-width:640px){
  .am-lbl{display:none}
  .am-gate-lbl{font-size:19px}
  .am-gate-sub{font-size:16px}
  .am-annot text{font-size:19px}
  .am-node{opacity:.8}
}
@media (prefers-reduced-motion:reduce){
  .am-hero *{transition-duration:.01ms !important; animation:none !important}
}
`;

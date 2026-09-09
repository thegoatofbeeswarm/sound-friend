import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

/**
 * AuditoryPathway — where EarHero stops, this picks up.
 *
 * EarHero walks the signal outer ear -> canal -> drum -> ossicles -> cochlea
 * -> auditory nerve and ends there. This component carries the same signal the
 * rest of the way: cochlear nucleus -> superior olive -> inferior colliculus
 * -> medial geniculate -> auditory cortex, then opens the cortex itself.
 *
 * Two stages:
 *   pathway   coronal section, a spike ascends both sides at true relative
 *             latency and crosses the midline at the trapezoid body
 *   cortex    lateral view, seven regions mapped to profile dimensions and
 *             to the training modes that load them
 *
 * Latencies are typical click-evoked brainstem values (waves I-V, then the
 * middle-latency response). Styles are scoped under `ap-` class names so
 * nothing depends on the Tailwind config or shadcn tokens, matching EarHero.
 */

type TrainTo = "/train" | "/test" | "/speech";

type Station = {
  id: string;
  latin: string;
  ms: number;
  /** fraction along the traced path */
  at: number;
  to: TrainTo;
  terminal?: boolean;
};

const STATIONS: Station[] = [
  { id: "cochlea", latin: "cochlea", ms: 0, at: 0, to: "/test" },
  { id: "cn", latin: "nucleus cochlearis", ms: 2.4, at: 0.19, to: "/train" },
  { id: "soc", latin: "complexus olivaris superior", ms: 4.1, at: 0.31, to: "/train" },
  { id: "ic", latin: "colliculus inferior", ms: 6.3, at: 0.53, to: "/train" },
  { id: "mgn", latin: "corpus geniculatum mediale", ms: 12, at: 0.74, to: "/train" },
  { id: "a1", latin: "gyrus temporalis transversus", ms: 17.5, at: 1, to: "/train", terminal: true },
];

type Region = { id: string; to: TrainTo };

const REGIONS: Region[] = [
  { id: "a1", to: "/train" },
  { id: "belt", to: "/speech" },
  { id: "wernicke", to: "/train" },
  { id: "arcuate", to: "/train" },
  { id: "broca", to: "/speech" },
  { id: "dlpfc", to: "/train" },
  { id: "hippo", to: "/train" },
];

/* ------------------------------------------------------------------ *
 * geometry
 * ------------------------------------------------------------------ */

function logSpiral(cx: number, cy: number, a: number, b: number, turns: number, rot: number) {
  const pts: string[] = [];
  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const t = turns * Math.PI * 2 * (i / steps);
    const r = a * Math.exp(b * t);
    pts.push(`${(cx + r * Math.cos(t + rot)).toFixed(1)},${(cy + r * Math.sin(t + rot)).toFixed(1)}`);
  }
  return "M" + pts.join(" L");
}

const COCH_L = logSpiral(206, 522, 3.2, 0.2, 1.9, 0.4);
const COCH_R = logSpiral(694, 522, 3.2, 0.2, 1.9, Math.PI - 0.4);

/* Screen-left ear is the subject's right ear in a face-on coronal view, and it
   crosses to the left hemisphere, which sits on screen-right. Mirrored below. */
const D_A =
  "M 206,522 C 286,534 344,520 392,512 C 414,509 420,552 432,566 C 444,580 468,568 478,548 C 490,522 480,448 470,386 C 466,352 480,330 516,316 C 562,296 608,288 648,294";
const D_B =
  "M 694,522 C 614,534 556,520 508,512 C 486,509 480,552 468,566 C 456,580 432,568 422,548 C 410,522 420,448 430,386 C 434,352 420,330 384,316 C 338,296 292,288 252,294";

const NODES_A: [number, number][] = [
  [206, 522], [392, 512], [478, 548], [470, 386], [516, 316], [648, 294],
];
const NODES_B: [number, number][] = [
  [694, 522], [508, 512], [422, 548], [430, 386], [384, 316], [252, 294],
];

const REGION_SHAPES: Record<string, string> = {
  dlpfc: "M 168,214 C 212,192 262,196 288,224 C 306,244 296,278 266,286 C 226,296 180,276 166,250 C 158,236 158,220 168,214 Z",
  broca: "M 186,306 C 224,290 268,300 280,326 C 290,348 268,372 238,370 C 208,368 184,350 182,330 C 181,318 182,310 186,306 Z",
  a1: "M 288,336 C 330,326 378,330 402,344 C 418,353 414,372 392,378 C 356,388 306,382 288,368 C 278,360 278,340 288,336 Z",
  belt: "M 268,382 C 330,368 424,370 486,388 C 510,395 512,420 486,428 C 418,448 320,444 268,424 C 248,416 248,388 268,382 Z",
  wernicke: "M 500,378 C 546,364 592,376 602,404 C 611,430 586,454 552,452 C 518,450 494,428 494,404 C 494,392 496,382 500,378 Z",
  hippo: "M 336,432 C 386,420 452,424 486,444 C 500,452 496,470 476,474 C 424,484 358,478 332,462 C 320,455 324,436 336,432 Z",
};

const REGION_LABEL: Record<string, [number, number, "start" | "middle" | "end"]> = {
  dlpfc: [140, 196, "end"],
  broca: [150, 344, "end"],
  a1: [344, 316, "middle"],
  belt: [378, 470, "middle"],
  wernicke: [634, 396, "start"],
  hippo: [408, 500, "middle"],
};

const ARC_D = "M 540,392 C 540,300 470,236 372,232 C 300,229 246,264 232,318";

/** progress along the path -> elapsed ms, piecewise through real latencies */
function progressToMs(p: number) {
  for (let i = 0; i < STATIONS.length - 1; i++) {
    const a = STATIONS[i]!, b = STATIONS[i + 1]!;
    if (p <= b.at) {
      const span = b.at - a.at || 1;
      return a.ms + ((p - a.at) / span) * (b.ms - a.ms);
    }
  }
  return STATIONS[STATIONS.length - 1]!.ms;
}

/* ------------------------------------------------------------------ *
 * component
 * ------------------------------------------------------------------ */

export default function AuditoryPathway() {
  const { t } = useI18n();
  const [stage, setStage] = useState<"pathway" | "cortex">("pathway");
  const [station, setStation] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [p, setP] = useState(1);
  const [running, setRunning] = useState(false);

  const aRef = useRef<SVGPathElement | null>(null);
  const bRef = useRef<SVGPathElement | null>(null);
  const raf = useRef(0);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fire = useCallback(() => {
    if (reduced) { setP(1); return; }
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    setRunning(true);
    setP(0);
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 4200);
      setP(k);
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf.current = requestAnimationFrame(tick);
  }, [reduced]);

  useEffect(() => {
    const id = setTimeout(fire, 400);
    return () => { clearTimeout(id); cancelAnimationFrame(raf.current); };
  }, [fire]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (stage === "cortex") setStage("pathway");
      else { setStation(null); setRegion(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);

  const spike = (ref: RefObject<SVGPathElement | null>) => {
    const el = ref.current;
    if (!el) return null;
    try {
      const pt = el.getPointAtLength(el.getTotalLength() * p);
      return [pt.x, pt.y] as const;
    } catch {
      return null;
    }
  };
  const ptA = spike(aRef);
  const ptB = spike(bRef);

  const activeIdx = useMemo(() => {
    let i = -1;
    STATIONS.forEach((s, k) => { if (p >= s.at - 0.005) i = k; });
    return i;
  }, [p]);

  const openStation = STATIONS.find((s) => s.id === station);
  const openRegion = REGIONS.find((r) => r.id === region);
  const ms = progressToMs(p);

  return (
    <section className="ap-root">
      <style>{CSS}</style>

      <nav className="ap-tabs" aria-label={t("path.stage.pathway")}>
        <button
          type="button"
          className={"ap-tab" + (stage === "pathway" ? " ap-on" : "")}
          onClick={() => setStage("pathway")}
        >
          {t("path.stage.pathway")}
        </button>
        <span className="ap-tabline" aria-hidden="true" />
        <button
          type="button"
          className={"ap-tab" + (stage === "cortex" ? " ap-on" : "")}
          onClick={() => setStage("cortex")}
        >
          {t("path.stage.cortex")}
        </button>
      </nav>

      <div className="ap-grid">
        <div className="ap-stage">
          {stage === "pathway" ? (
            <>
              <svg viewBox="0 0 900 660" role="img" aria-label={t("path.svg.alt")}>
                <defs>
                  <radialGradient id="apGlow">
                    <stop offset="0%" stopColor="#EFFFF8" stopOpacity=".95" />
                    <stop offset="45%" stopColor="#4FD1A5" stopOpacity=".4" />
                    <stop offset="100%" stopColor="#4FD1A5" stopOpacity="0" />
                  </radialGradient>
                  <filter id="apSoft" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="7" />
                  </filter>
                </defs>

                <g className="ap-anat">
                  <path d="M 22,452 C 74,446 138,470 190,506 C 196,510 196,532 188,536 C 132,556 66,566 26,556 C 10,552 8,456 22,452 Z" />
                  <path d="M 878,452 C 826,446 762,470 710,506 C 704,510 704,532 712,536 C 768,556 834,566 874,556 C 890,552 892,456 878,452 Z" />
                </g>

                <path
                  className="ap-brain"
                  d="M 450,40 C 322,40 206,104 168,226 C 138,322 146,412 182,470 C 206,508 252,522 292,510 C 330,499 350,468 352,428 C 356,368 388,336 450,336 C 512,336 544,368 548,428 C 550,468 570,499 608,510 C 648,522 694,508 718,470 C 754,412 762,322 732,226 C 694,104 578,40 450,40 Z"
                />
                <g className="ap-gyri" aria-hidden="true">
                  <path d="M 232,180 C 286,152 342,152 392,178" />
                  <path d="M 508,178 C 558,152 614,152 668,180" />
                  <path d="M 210,268 C 260,246 306,250 344,272" />
                  <path d="M 556,272 C 594,250 640,246 690,268" />
                  <path d="M 300,110 C 350,88 400,84 442,92" />
                  <path d="M 458,92 C 500,84 550,88 600,110" />
                </g>

                <g className="ap-core">
                  <ellipse cx="416" cy="320" rx="48" ry="34" />
                  <ellipse cx="484" cy="320" rx="48" ry="34" />
                  <rect x="394" y="356" width="112" height="76" rx="30" />
                  <rect x="396" y="424" width="108" height="98" rx="34" />
                  <rect x="413" y="516" width="74" height="96" rx="22" />
                  <ellipse cx="330" cy="486" rx="62" ry="46" />
                  <ellipse cx="570" cy="486" rx="62" ry="46" />
                </g>
                <g className="ap-gyri" aria-hidden="true">
                  <path d="M 280,470 C 312,462 348,464 378,476" />
                  <path d="M 278,492 C 312,484 350,486 380,498" />
                  <path d="M 522,476 C 552,464 588,462 620,470" />
                  <path d="M 520,498 C 550,486 588,484 622,492" />
                </g>

                <path className="ap-ctx ap-b" d="M 196,258 C 244,238 300,256 306,300 C 311,336 282,358 254,350 C 232,344 226,318 244,306 C 258,297 274,306 272,320" />
                <path className="ap-ctx ap-a" d="M 704,258 C 656,238 600,256 594,300 C 589,336 618,358 646,350 C 668,344 674,318 656,306 C 642,297 626,306 628,320" />

                <path className="ap-coch ap-a" d={COCH_L} />
                <path className="ap-coch ap-b" d={COCH_R} />

                <path ref={aRef} className="ap-route ap-a" d={D_A} />
                <path ref={bRef} className="ap-route ap-b" d={D_B} />

                {NODES_A.map(([x, y], i) => (
                  <Relay key={"a" + i} x={x} y={y} tone="a" lit={i <= activeIdx}
                    sel={station === STATIONS[i]!.id} label={t(`path.st.${STATIONS[i]!.id}.name`)}
                    onPick={() => setStation(STATIONS[i]!.id)} />
                ))}
                {NODES_B.map(([x, y], i) => (
                  <Relay key={"b" + i} x={x} y={y} tone="b" lit={i <= activeIdx}
                    sel={station === STATIONS[i]!.id} label={t(`path.st.${STATIONS[i]!.id}.name`)}
                    onPick={() => setStation(STATIONS[i]!.id)} />
                ))}

                {ptA && (
                  <g pointerEvents="none">
                    <circle cx={ptA[0]} cy={ptA[1]} r="26" fill="url(#apGlow)" filter="url(#apSoft)" />
                    <circle cx={ptA[0]} cy={ptA[1]} r="4.6" fill="#EFFFF8" />
                  </g>
                )}
                {ptB && (
                  <g pointerEvents="none">
                    <circle cx={ptB[0]} cy={ptB[1]} r="26" fill="url(#apGlow)" filter="url(#apSoft)" />
                    <circle cx={ptB[0]} cy={ptB[1]} r="4.6" fill="#EFFFF8" />
                  </g>
                )}

                <g className="ap-lead" aria-hidden="true">
                  <path d="M 130,258 L 190,262" />
                  <path d="M 118,522 L 186,522" />
                  <path d="M 770,296 L 700,300" />
                </g>
                <g className="ap-lbl" aria-hidden="true">
                  <text x="126" y="250" textAnchor="end">{t("path.anno.cortex")}</text>
                  <text x="114" y="518" textAnchor="end">{t("path.anno.rightEar")}</text>
                  <text x="114" y="536" textAnchor="end" className="ap-sm">{t("path.anno.rightEar.sub")}</text>
                  <text x="778" y="292">{t("path.anno.leftEar")}</text>
                  <text x="778" y="310" className="ap-sm">{t("path.anno.leftEar.sub")}</text>
                  <text x="450" y="600" textAnchor="middle" className="ap-sm">{t("path.anno.cross")}</text>
                </g>
              </svg>

              <div className="ap-time">
                <button type="button" className="ap-fire" onClick={fire} disabled={running}>
                  {running ? t("path.firing") : t("path.fire")}
                </button>
                <div className="ap-track">
                  <div className="ap-fill" style={{ width: `${p * 100}%` }} />
                  {STATIONS.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      className={"ap-tick" + (i <= activeIdx ? " ap-lit" : "") + (station === s.id ? " ap-sel" : "")}
                      style={{ left: `${s.at * 100}%` }}
                      onClick={() => { setStation(s.id); setP(s.at); }}
                      aria-label={`${t(`path.st.${s.id}.name`)} — ${s.ms} ms`}
                    >
                      <span>{s.ms.toFixed(1)}</span>
                    </button>
                  ))}
                </div>
                <p className="ap-readout">
                  <em>{ms.toFixed(1)}</em> {t("path.readout")}
                </p>
              </div>
            </>
          ) : (
            <svg viewBox="0 0 780 560" role="img" aria-label={t("path.cortex.svg.alt")}>
              <path
                className="ap-brain"
                d="M 96,296 C 88,196 156,112 268,84 C 386,54 520,68 596,124 C 676,182 700,282 668,362 C 646,416 596,444 540,450 C 470,458 400,462 330,466 C 262,470 200,460 158,428 C 118,398 100,348 96,296 Z"
              />
              <g className="ap-gyri" aria-hidden="true">
                <path d="M 190,140 C 250,164 300,208 322,262" />
                <path d="M 300,106 C 356,140 402,192 424,254" />
                <path d="M 420,92 C 474,132 516,190 534,250" />
                <path d="M 540,110 C 588,158 616,222 622,286" />
                <path d="M 132,300 C 172,282 214,278 250,286" />
                <path d="M 624,330 C 648,342 660,362 662,384" />
              </g>

              <path className="ap-fiss" d="M 166,352 C 250,378 360,384 470,358 C 520,346 560,326 586,300" />
              <path className="ap-fiss ap-thin" d="M 174,330 C 258,352 366,356 472,332 C 520,321 556,304 580,282" />

              {REGIONS.filter((r) => r.id !== "arcuate").map((r) => (
                <g
                  key={r.id}
                  className={"ap-region" + (region === r.id ? " ap-sel" : "")}
                  role="button"
                  tabIndex={0}
                  aria-label={t(`path.rg.${r.id}.name`)}
                  onClick={() => setRegion(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRegion(r.id); }
                  }}
                >
                  <path className={"ap-blob ap-r-" + r.id} d={REGION_SHAPES[r.id]!} />
                </g>
              ))}

              <g
                className={"ap-region" + (region === "arcuate" ? " ap-sel" : "")}
                role="button"
                tabIndex={0}
                aria-label={t("path.rg.arcuate.name")}
                onClick={() => setRegion("arcuate")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRegion("arcuate"); }
                }}
              >
                <path className="ap-tract" d={ARC_D} />
                <path className="ap-tractline" d={ARC_D} />
              </g>

              <g className="ap-lead" aria-hidden="true">
                <path d="M 146,198 L 190,214" />
                <path d="M 156,344 L 190,338" />
                <path d="M 344,326 L 344,340" />
                <path d="M 620,398 L 596,404" />
                <path d="M 408,490 L 408,466" />
              </g>
              <g className="ap-lbl" aria-hidden="true">
                {REGIONS.filter((r) => r.id !== "arcuate").map((r) => {
                  const spot = REGION_LABEL[r.id]!;
                  return (
                    <text key={r.id} x={spot[0]} y={spot[1]} textAnchor={spot[2]}
                      className={region === r.id ? "ap-on" : ""}>
                      {t(`path.rg.${r.id}.name`)}
                    </text>
                  );
                })}
                <text x="286" y="212" textAnchor="middle" className={region === "arcuate" ? "ap-on" : ""}>
                  {t("path.rg.arcuate.name")}
                </text>
                <text x="166" y="502" className="ap-sm">{t("path.anno.fissure")}</text>
              </g>
            </svg>
          )}
        </div>

        <aside className="ap-panel">
          {stage === "pathway" && !openStation && (
            <div className="ap-card">
              <h2>{t("path.intro.title")}</h2>
              <p className="ap-body">{t("path.intro.body")}</p>
              <button type="button" className="ap-fire ap-wide" onClick={fire}>{t("path.fire")}</button>
            </div>
          )}

          {stage === "pathway" && openStation && (
            <div className="ap-card" key={openStation.id}>
              <p className="ap-latin">{openStation.latin}</p>
              <h2>{t(`path.st.${openStation.id}.name`)}</h2>
              <p className="ap-stamp"><em>{openStation.ms.toFixed(1)}</em> ms</p>

              <h3>{t("path.label.does")}</h3>
              <p className="ap-body">{t(`path.st.${openStation.id}.does`)}</p>
              <h3>{t("path.label.mind")}</h3>
              <p className="ap-body ap-mind">{t(`path.st.${openStation.id}.mind`)}</p>
              <h3>{t("path.label.train")}</h3>
              <p className="ap-body">{t(`path.st.${openStation.id}.train`)}</p>
              <h3>{t("path.label.profile")}</h3>
              <p className="ap-body ap-prof">{t(`path.st.${openStation.id}.profile`)}</p>

              <div className="ap-acts">
                <Link className="ap-btn" to={openStation.to}>
                  {openStation.to === "/test" ? t("path.go.test") : t("path.go.train")}
                </Link>
                {openStation.terminal && (
                  <button type="button" className="ap-btn ap-btn-solid" onClick={() => setStage("cortex")}>
                    {t("path.open.cortex")}
                  </button>
                )}
              </div>

              <div className="ap-chain">
                {STATIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={"ap-step" + (station === s.id ? " ap-step-now" : "")}
                    onClick={() => { setStation(s.id); setP(s.at); }}
                  >
                    {t(`path.st.${s.id}.name`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === "cortex" && !openRegion && (
            <div className="ap-card">
              <h2>{t("path.cortex.intro.title")}</h2>
              <p className="ap-body">{t("path.cortex.intro.body")}</p>
              <button type="button" className="ap-fire ap-wide" onClick={() => setStage("pathway")}>
                {t("path.back")}
              </button>
            </div>
          )}

          {stage === "cortex" && openRegion && (
            <div className="ap-card" key={openRegion.id}>
              <p className="ap-latin">{t(`path.rg.${openRegion.id}.sub`)}</p>
              <h2>{t(`path.rg.${openRegion.id}.name`)}</h2>

              <h3>{t("path.label.role")}</h3>
              <p className="ap-body">{t(`path.rg.${openRegion.id}.role`)}</p>
              <h3>{t("path.label.link")}</h3>
              <p className="ap-body ap-mind">{t(`path.rg.${openRegion.id}.mind`)}</p>
              <h3>{t("path.label.drill")}</h3>
              <p className="ap-body">{t(`path.rg.${openRegion.id}.train`)}</p>
              <h3>{t("path.label.profile")}</h3>
              <p className="ap-body ap-prof">{t(`path.rg.${openRegion.id}.profile`)}</p>

              <div className="ap-acts">
                <Link className="ap-btn ap-btn-solid" to={openRegion.to}>{t("path.go.train")}</Link>
              </div>

              <div className="ap-chain">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={"ap-step" + (region === r.id ? " ap-step-now" : "")}
                    onClick={() => setRegion(r.id)}
                  >
                    {t(`path.rg.${r.id}.name`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function Relay({
  x, y, tone, lit, sel, label, onPick,
}: {
  x: number; y: number; tone: "a" | "b";
  lit: boolean; sel: boolean; label: string; onPick: () => void;
}) {
  return (
    <g
      className={"ap-relay ap-" + tone + (lit ? " ap-lit" : "") + (sel ? " ap-sel" : "")}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(); }
      }}
    >
      <circle cx={x} cy={y} r="17" className="ap-hit" />
      <circle cx={x} cy={y} r="9" className="ap-halo" />
      <circle cx={x} cy={y} r="5" className="ap-dot" />
    </g>
  );
}

const CSS = `
.ap-root{
  --ap-ink:#060B12; --ap-bone:#E8E3D6; --ap-muted:#8FA0AC;
  --ap-jade:#4FD1A5; --ap-gold:#E8B44C; --ap-blue:#7FB6E8;
  color:var(--ap-bone);
  background:radial-gradient(120% 90% at 50% 34%,#101E28 0%,#08111A 46%,var(--ap-ink) 80%);
  border:1px solid rgba(143,160,172,.2); border-radius:18px; overflow:hidden;
}
.ap-root *{box-sizing:border-box}
.ap-root button{font:inherit; cursor:pointer}

.ap-tabs{display:flex; align-items:center; gap:14px;
  padding:14px clamp(16px,2.6vw,28px); border-bottom:1px solid rgba(143,160,172,.18)}
.ap-tab{background:none; border:0; padding:4px 0; font-size:.88rem;
  color:rgba(143,160,172,.8); border-bottom:1px solid transparent; transition:color .2s,border-color .2s}
.ap-tab.ap-on{color:var(--ap-bone); border-bottom-color:var(--ap-jade)}
.ap-tab:hover{color:var(--ap-bone)}
.ap-tabline{width:26px; height:1px; background:rgba(143,160,172,.28)}

.ap-grid{display:grid; grid-template-columns:minmax(0,1.4fr) minmax(300px,.6fr)}
.ap-stage{min-width:0; padding:clamp(10px,2vw,22px); display:flex; flex-direction:column; gap:12px; justify-content:center}
.ap-stage svg{width:100%; height:auto; display:block; overflow:visible}

.ap-brain{fill:rgba(232,227,214,.04); stroke:rgba(232,227,214,.34); stroke-width:1.5}
.ap-anat path{fill:rgba(232,227,214,.05); stroke:rgba(232,227,214,.26); stroke-width:1.3}
.ap-gyri path{fill:none; stroke:rgba(143,160,172,.24); stroke-width:1.2; stroke-linecap:round}
.ap-core ellipse,.ap-core rect{fill:rgba(232,227,214,.06); stroke:rgba(143,160,172,.3); stroke-width:1.2}
.ap-fiss{fill:none; stroke:rgba(232,227,214,.34); stroke-width:1.6; stroke-linecap:round}
.ap-fiss.ap-thin{stroke:rgba(232,227,214,.18); stroke-width:1.1}

.ap-ctx{fill:none; stroke-width:9; stroke-linecap:round; opacity:.8}
.ap-coch{fill:none; stroke-width:2.4; stroke-linecap:round; opacity:.9}
.ap-route{fill:none; stroke-width:3; stroke-linecap:round; opacity:.6}
.ap-a{stroke:var(--ap-jade)}
.ap-b{stroke:var(--ap-blue)}

.ap-relay{cursor:pointer}
.ap-relay:focus{outline:none}
.ap-hit{fill:transparent}
.ap-halo{fill:rgba(6,11,18,.9); stroke-width:1.6; opacity:.85}
.ap-relay.ap-a .ap-halo{stroke:var(--ap-jade)}
.ap-relay.ap-b .ap-halo{stroke:var(--ap-blue)}
.ap-dot{fill:rgba(232,227,214,.26); transition:fill .3s}
.ap-relay.ap-lit .ap-dot{fill:var(--ap-gold)}
.ap-relay.ap-sel .ap-halo{stroke:var(--ap-bone); stroke-width:2.4}
.ap-relay:hover .ap-dot{fill:#FFE3A6}
.ap-relay:focus-visible .ap-halo{stroke:var(--ap-bone); stroke-width:2.4}

.ap-region{cursor:pointer}
.ap-region:focus{outline:none}
.ap-blob{stroke-width:1.4; transition:opacity .25s}
.ap-r-a1{fill:rgba(232,180,76,.28); stroke:rgba(232,180,76,.85)}
.ap-r-belt{fill:rgba(79,209,165,.2); stroke:rgba(79,209,165,.72)}
.ap-r-wernicke{fill:rgba(127,182,232,.22); stroke:rgba(127,182,232,.75)}
.ap-r-broca{fill:rgba(127,182,232,.13); stroke:rgba(127,182,232,.5)}
.ap-r-dlpfc{fill:rgba(232,227,214,.07); stroke:rgba(143,160,172,.45)}
.ap-r-hippo{fill:rgba(79,209,165,.12); stroke:rgba(79,209,165,.5); stroke-dasharray:5 4}
.ap-region:hover .ap-blob{opacity:.8}
.ap-region.ap-sel .ap-blob,.ap-region:focus-visible .ap-blob{stroke:var(--ap-bone); stroke-width:2.4; stroke-dasharray:none}
.ap-tract{fill:none; stroke:rgba(232,180,76,.22); stroke-width:11; stroke-linecap:round}
.ap-tractline{fill:none; stroke:rgba(232,180,76,.5); stroke-width:1.2; stroke-dasharray:3 7}
.ap-region.ap-sel .ap-tractline,.ap-region:focus-visible .ap-tractline{stroke:var(--ap-bone); stroke-dasharray:none; stroke-width:2}

.ap-lead path{fill:none; stroke:rgba(232,227,214,.26); stroke-width:1}
.ap-lbl text{font-size:15px; font-weight:500; fill:var(--ap-muted); opacity:.85}
.ap-lbl text.ap-sm{font-size:12.5px; opacity:.6}
.ap-lbl text.ap-on{fill:var(--ap-bone); opacity:1}

.ap-time{display:flex; align-items:center; gap:18px; flex-wrap:wrap; padding:0 6px}
.ap-fire{background:transparent; border:1px solid rgba(79,209,165,.45); color:var(--ap-jade);
  padding:.6rem 1.1rem; border-radius:2px; font-size:.86rem; white-space:nowrap; transition:background .2s,border-color .2s}
.ap-fire:hover:not(:disabled){background:rgba(79,209,165,.12); border-color:var(--ap-jade)}
.ap-fire:disabled{opacity:.45; cursor:default}
.ap-fire:focus-visible{outline:2px solid var(--ap-jade); outline-offset:3px}
.ap-wide{width:100%; margin-top:1.4rem}
.ap-track{position:relative; flex:1 1 240px; height:2px; background:rgba(143,160,172,.2); margin:20px 8px 26px}
.ap-fill{position:absolute; inset:0 auto 0 0; background:var(--ap-gold)}
.ap-tick{position:absolute; top:50%; width:11px; height:11px; padding:0; transform:translate(-50%,-50%);
  border-radius:50%; background:var(--ap-ink); border:1px solid rgba(143,160,172,.4)}
.ap-tick.ap-lit{border-color:var(--ap-gold); background:var(--ap-gold)}
.ap-tick.ap-sel{box-shadow:0 0 0 4px rgba(232,180,76,.22)}
.ap-tick:focus-visible{outline:2px solid var(--ap-jade); outline-offset:3px}
.ap-tick span{position:absolute; top:15px; left:50%; transform:translateX(-50%);
  font-size:11.5px; color:rgba(143,160,172,.85); font-variant-numeric:tabular-nums}
.ap-readout{margin:0; font-size:.85rem; color:var(--ap-muted); white-space:nowrap}
.ap-readout em{font-style:normal; color:var(--ap-bone); font-size:1.35rem;
  font-family:var(--am-display, ui-serif, Georgia, serif); font-variant-numeric:tabular-nums}

.ap-panel{border-left:1px solid rgba(143,160,172,.18); background:rgba(6,11,18,.55);
  padding:clamp(20px,2.4vw,32px); max-height:78vh; overflow-y:auto}
.ap-card{animation:ap-in .24s ease both}
@keyframes ap-in{from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none}}
.ap-latin{margin:0 0 .35rem; font-size:.8rem; color:var(--ap-gold); font-style:italic}
.ap-card h2{font-family:var(--am-display, ui-serif, Georgia, serif); font-weight:400;
  font-size:1.65rem; line-height:1.12; margin:0 0 .5rem}
.ap-card h3{font-size:.8rem; font-weight:600; color:var(--ap-muted); margin:1.35rem 0 .35rem}
.ap-stamp{margin:.6rem 0 0; font-size:.82rem; color:var(--ap-muted)}
.ap-stamp em{font-style:normal; color:var(--ap-gold); font-size:1.6rem;
  font-family:var(--am-display, ui-serif, Georgia, serif)}
.ap-body{margin:0; font-size:.92rem; line-height:1.62; color:#C3CCD4; max-width:52ch}
.ap-mind{color:#CFE6DD}
.ap-prof{color:var(--ap-jade)}

.ap-acts{display:flex; flex-wrap:wrap; gap:.5rem; margin-top:1.5rem}
.ap-btn{font-size:.85rem; font-weight:500; padding:.6rem 1rem; border-radius:2px;
  border:1px solid rgba(143,160,172,.4); color:var(--ap-bone); text-decoration:none;
  background:none; transition:border-color .2s,background .2s}
.ap-btn:hover{border-color:var(--ap-bone)}
.ap-btn-solid{background:var(--ap-bone); color:#0A121A; border-color:var(--ap-bone)}
.ap-btn-solid:hover{background:#fff}
.ap-btn:focus-visible{outline:2px solid var(--ap-jade); outline-offset:3px}

.ap-chain{display:flex; flex-wrap:wrap; gap:.4rem; margin-top:1.6rem;
  border-top:1px solid rgba(143,160,172,.16); padding-top:1.1rem}
.ap-step{font-size:.78rem; padding:.36rem .62rem; border-radius:2px; background:none;
  color:var(--ap-muted); border:1px solid rgba(143,160,172,.26)}
.ap-step:hover{color:var(--ap-bone); border-color:var(--ap-bone)}
.ap-step-now{background:var(--ap-jade); border-color:var(--ap-jade); color:#062018; font-weight:500}
.ap-step:focus-visible{outline:2px solid var(--ap-jade); outline-offset:2px}

@media (max-width:1000px){
  .ap-grid{grid-template-columns:1fr}
  .ap-panel{border-left:0; border-top:1px solid rgba(143,160,172,.18); max-height:none}
  .ap-time{gap:12px}
}
@media (max-width:640px){
  .ap-lbl text{font-size:18px}
  .ap-lbl text.ap-sm{font-size:15px}
}
@media (prefers-reduced-motion:reduce){
  .ap-root *{transition-duration:.01ms !important; animation:none !important}
}
`;

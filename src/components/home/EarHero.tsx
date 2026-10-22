import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import { useI18n } from "@/lib/i18n";
import type { AnchorId, EarScene, EarState, PartId } from "./earScene";
import { PART_COLOR } from "./earColors";
import { Coil } from "@/components/brand/Coil";

/**
 * EarHero: the homepage as an exam room with one specimen on the table.
 *
 * A 3D ear (three.js, see ./earScene) fills the screen under an exam lamp,
 * with the copy, the specimen readout and the index of parts in the corners. Drag to
 * turn it; press a part and the camera flies to it while a panel opens with
 * what goes wrong there and one experiment that changes the model live.
 *
 * The cochlea experiment maps a pitch to the place that responds to it with
 * the Greenwood function (Greenwood 1990):
 *
 *     f = A * (10^(a * x) - k)     A = 165.4, a = 0.06, k = 0.88, x in mm from apex
 */

/* ------------------------------------------------------------------ *
 * content
 * ------------------------------------------------------------------ */

const PARTS: PartId[] = ["outer", "canal", "drum", "ossicles", "cochlea", "nerve", "vestibular", "eustachian"];
const PATH: PartId[] = ["outer", "canal", "drum", "ossicles", "cochlea", "nerve"];
const OFF_PATH: PartId[] = ["vestibular", "eustachian"];
const LABEL: Record<PartId, string> = {
  outer: "hero.lbl.outer",
  canal: "hero.lbl.canal",
  drum: "hero.lbl.drum",
  ossicles: "hero.lbl.bones",
  cochlea: "hero.lbl.cochlea",
  nerve: "hero.lbl.nerve",
  vestibular: "hero.lbl.balance",
  eustachian: "hero.lbl.eustachian",
};

/* ------------------------------------------------------------------ *
 * cochlear physics
 * ------------------------------------------------------------------ */

const GW_A = 165.4, GW_a = 0.06, GW_k = 0.88, COCHLEA_MM = 35;
const F_MIN = 125, F_MAX = 8000;

const mmFromApex = (f: number) => Math.log10(f / GW_A + GW_k) / GW_a;
/** 0 = base (high notes, damaged first), 1 = apex (low notes) */
const placeFromFreq = (f: number) => Math.min(1, Math.max(0, 1 - mmFromApex(f) / COCHLEA_MM));

const MAX_WAVES = 13;

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
const LOCALE = { en: "en-US", zh: "zh-CN", es: "es-ES" } as const;
const formatFreq = (f: number, lang: keyof typeof LOCALE) =>
  f < 1000
    ? `${new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 0 }).format(f)}\u00a0Hz`
    : `${new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(f / 1000)}\u00a0kHz`;
const formatMm = (mm: number, lang: keyof typeof LOCALE) =>
  `${new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(mm)}\u00a0mm`;

/** render a template containing {mm} with the value emphasised */
function withMm(template: string, value: string) {
  const [before = "", after = ""] = template.split("{mm}");
  return (
    <>
      {before}
      <strong>{value}</strong>
      {after}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * component
 * ------------------------------------------------------------------ */

export default function EarHero() {
  const { t, language } = useI18n();
  const fmtHz = (f: number) => formatFreq(f, language);
  const tp = useCallback((id: PartId, field: string) => t(`hero.part.${id}.${field}`), [t]);

  const [hovered, setHovered] = useState<PartId | null>(null);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [visited, setVisited] = useState<PartId[]>([]);
  const [ready, setReady] = useState(false);
  const [glFailed, setGlFailed] = useState(false);
  // narrow screens get the panel as a bottom sheet, portalled to <body> because
  // the page wrapper's enter animation leaves a transform that traps position: fixed
  const [asSheet, setAsSheet] = useState(false);

  // experiments
  const [pos, setPos] = useState(78);
  const [source, setSource] = useState<EarState["source"]>("front");
  const [bud, setBud] = useState(false);
  const [pressure, setPressure] = useState(0);
  const [stiff, setStiff] = useState(false);
  const [noiseDamage, setNoiseDamage] = useState(false);
  const [synapseLoss, setSynapseLoss] = useState(false);
  const [playing, setPlaying] = useState(false);

  const freq = useMemo(() => F_MIN * Math.pow(F_MAX / F_MIN, pos / 100), [pos]);
  const peak = useMemo(() => placeFromFreq(freq), [freq]);
  const mmFromBase = COCHLEA_MM - mmFromApex(freq);
  const inDangerBand = freq >= 4000 && freq <= 6000;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<EarScene | null>(null);
  const tagRefs = useRef<Partial<Record<AnchorId, HTMLElement | null>>>({});
  const plateRefs = useRef<Partial<Record<PartId, HTMLButtonElement | null>>>({});
  const returnFocus = useRef<PartId | null>(null);
  const audio = useRef<{ ctx: AudioContext; stop: () => void } | null>(null);

  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const select = useCallback((id: PartId) => {
    setSelected(id);
    setHovered(null);
    setVisited((v) => (v.includes(id) ? v : [...v, id]));
  }, []);
  const close = useCallback(() => {
    returnFocus.current = selected;
    setSelected(null);
  }, [selected]);

  // the scene calls back into whatever the latest render knows
  const live = useRef({ selected, select });
  live.current = { selected, select };

  /* build the scene once, on the client */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let chase = -1;
    import("./earScene")
      .then(({ createEarScene }) =>
        createEarScene(host, {
          reduced,
          onHover: (id) => {
            if (!live.current.selected) setHovered(id);
          },
          onSelect: (id) => live.current.select(id),
          onFrame: (anchors) => {
            for (const id of Object.keys(anchors) as AnchorId[]) {
              const el = tagRefs.current[id];
              const a = anchors[id];
              if (!el) continue;
              el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`;
              el.style.visibility = a.visible ? "visible" : "hidden";
            }
            // the chase light walks the signal path, one plate at a time
            if (reduced) return;
            const next = Math.floor(performance.now() / 520) % PATH.length;
            if (next !== chase) {
              plateRefs.current[PATH[chase] as PartId]?.removeAttribute("data-chase");
              plateRefs.current[PATH[next] as PartId]?.setAttribute("data-chase", "");
              chase = next;
            }
          },
        }),
      )
      .then((scene) => {
        if (cancelled) {
          scene.dispose();
          return;
        }
        scene.setDangerBand(placeFromFreq(6000), placeFromFreq(4000));
        sceneRef.current = scene;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setGlFailed(true);
      });
    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1000px)");
    const sync = () => setAsSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* push experiment state into the scene */
  useEffect(() => {
    const p = pos / 100;
    sceneRef.current?.setState({
      source,
      bud,
      pressure,
      stiff,
      peak,
      danger: inDangerBand,
      waves: Math.round(4 + p * (MAX_WAVES - 4)),
      amp: 1.2 - 0.55 * p,
      noiseDamage,
      synapseLoss,
    });
  }, [ready, pos, source, bud, pressure, stiff, peak, inDangerBand, noiseDamage, synapseLoss]);

  useEffect(() => {
    sceneRef.current?.setShown(hovered, selected);
  }, [ready, hovered, selected]);

  /* on wide screens the ear sits in the gap between the copy and the index (or the panel) */
  useEffect(() => {
    sceneRef.current?.setFrame(asSheet ? 0.1 : selected ? -0.2 : 0.02, asSheet ? 0.95 : selected ? 1 : 1.2);
  }, [ready, asSheet, selected]);

  /* focus into the panel when it opens, back to its plate when it closes; Escape closes */
  useEffect(() => {
    if (!selected) {
      const back = returnFocus.current;
      if (back) plateRefs.current[back]?.focus({ preventScroll: true });
      returnFocus.current = null;
      return;
    }
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, close]);

  /* a quiet two-second sine at the chosen pitch */
  const playNote = useCallback(() => {
    if (audio.current) {
      audio.current.stop();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
    gain.gain.setValueAtTime(0.06, now + 1.8);
    gain.gain.linearRampToValueAtTime(0, now + 2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.05);
    const stop = () => {
      try { osc.stop(); } catch { /* already stopped */ }
      void ctx.close();
      audio.current = null;
      setPlaying(false);
    };
    osc.onended = stop;
    audio.current = { ctx, stop };
    setPlaying(true);
  }, [freq]);
  useEffect(() => () => audio.current?.stop(), []);

  const shown = selected ?? hovered;

  /* ---------------- experiments, one per part ---------------- */

  const experiment = (id: PartId) => {
    switch (id) {
      case "outer":
        return (
          <>
            <p className="am-x-label" id="am-x-outer">{t("hero.x.outer.label")}</p>
            <div className="am-seg" role="radiogroup" aria-labelledby="am-x-outer">
              {(["front", "above", "behind"] as const).map((s) => (
                <button key={s} type="button" role="radio" aria-checked={source === s} className="am-key" onClick={() => setSource(s)}>
                  {t(`hero.x.outer.${s}`)}
                </button>
              ))}
            </div>
            <p className="am-read" aria-live="polite">{t(`hero.x.outer.read.${source}`)}</p>
          </>
        );
      case "canal":
        return (
          <>
            <button type="button" className="am-key" aria-pressed={bud} onClick={() => setBud((b) => !b)}>
              {t(bud ? "hero.x.canal.off" : "hero.x.canal.on")}
            </button>
            <p className="am-read" aria-live="polite">{t(bud ? "hero.x.canal.read.sealed" : "hero.x.canal.read.open")}</p>
          </>
        );
      case "drum":
        return (
          <>
            <label className="am-x-label" htmlFor="am-pressure">{t("hero.x.drum.label")}</label>
            <input
              id="am-pressure"
              type="range"
              min={-100}
              max={100}
              step={1}
              value={Math.round(pressure * 100)}
              onChange={(e) => setPressure(Number(e.target.value) / 100)}
            />
            <p className="am-read" aria-live="polite">
              {t(Math.abs(pressure) < 0.15 ? "hero.x.drum.read.equal" : "hero.x.drum.read.off")}
            </p>
          </>
        );
      case "ossicles":
        return (
          <>
            <div className="am-seg">
              <button type="button" className="am-key" aria-pressed={stiff} onClick={() => setStiff((s) => !s)}>
                {t(stiff ? "hero.x.oss.off" : "hero.x.oss.on")}
              </button>
              <button type="button" className="am-key" onClick={() => sceneRef.current?.pulse("strike")}>
                {t("hero.x.oss.tap")}
              </button>
            </div>
            <p className="am-read" aria-live="polite">{t(stiff ? "hero.x.oss.read.stiff" : "hero.x.oss.read.free")}</p>
          </>
        );
      case "cochlea":
        return (
          <>
            <label className="am-x-label" htmlFor="am-freq">{t("hero.meter.label")}</label>
            <p className="am-readout">
              <span className="am-hz">{fmtHz(freq)}</span>
              <span className="am-band">{t(bandKey(freq))}</span>
            </p>
            <input
              id="am-freq"
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              aria-describedby="am-place"
              aria-valuetext={`${fmtHz(freq)}, ${t(bandKey(freq))}`}
              className={inDangerBand ? "am-hot" : undefined}
            />
            <p id="am-place" className="am-read">
              {withMm(t(inDangerBand ? "hero.place.danger" : "hero.place.normal"), formatMm(mmFromBase, language))}
            </p>
            <div className="am-seg">
              <button type="button" className="am-key" aria-pressed={playing} onClick={playNote}>
                {t(playing ? "hero.x.cochlea.stop" : "hero.x.cochlea.play")}
              </button>
              <button type="button" className="am-key am-key-hazard" disabled={noiseDamage} onClick={() => setNoiseDamage(true)}>
                {t("hero.x.cochlea.noise")}
              </button>
            </div>
            <p className="am-note">{t("hero.x.cochlea.volume")}</p>
            {noiseDamage && <p className="am-scar" role="status">{t("hero.permanent")}</p>}
          </>
        );
      case "nerve":
        return (
          <>
            <button type="button" className="am-key am-key-hazard" disabled={synapseLoss} onClick={() => setSynapseLoss(true)}>
              {t("hero.x.nerve.on")}
            </button>
            <p className="am-read" aria-live="polite">{t(synapseLoss ? "hero.x.nerve.read.after" : "hero.x.nerve.read.before")}</p>
            {synapseLoss && <p className="am-scar" role="status">{t("hero.permanent")}</p>}
          </>
        );
      case "vestibular":
        return (
          <>
            <button type="button" className="am-key" onClick={() => sceneRef.current?.pulse("turn")}>
              {t("hero.x.vest.turn")}
            </button>
            <p className="am-read">{t("hero.x.vest.read")}</p>
          </>
        );
      case "eustachian":
        return (
          <>
            <button
              type="button"
              className="am-key"
              onClick={() => {
                sceneRef.current?.pulse("swallow");
                setPressure(0);
              }}
            >
              {t("hero.x.eus.swallow")}
            </button>
            <p className="am-read">{t("hero.x.eus.read")}</p>
          </>
        );
    }
  };

  const plate = (id: PartId) => (
    <button
      key={id}
      ref={(el) => {
        plateRefs.current[id] = el;
      }}
      type="button"
      className="am-plate"
      style={{ "--dot": PART_COLOR[id] } as React.CSSProperties}
      aria-pressed={selected === id}
      data-seen={visited.includes(id) ? "" : undefined}
      data-hot={shown === id ? "" : undefined}
      onClick={() => (selected === id ? close() : select(id))}
      onPointerEnter={(e) => e.pointerType === "mouse" && !selected && setHovered(id)}
      onPointerLeave={() => !selected && setHovered(null)}
    >
      <span className="am-plate-l">{t(LABEL[id])}</span>
    </button>
  );

  const panel = (id: PartId) => (
      <div
        className="am-panel"
        style={{ "--dot": PART_COLOR[id] } as React.CSSProperties}
        role="dialog"
        aria-modal="false"
        aria-labelledby="am-panel-title"
        tabIndex={-1}
        ref={panelRef}
        key={id}
      >
        <div className="am-panel-head">
          <h2 id="am-panel-title">{tp(id, "title")}</h2>
          <button type="button" className="am-close" onClick={close} aria-label={t("hero.close.aria")}>
            <X aria-hidden className="am-btn-icon" />
            {t("hero.close")}
          </button>
        </div>
        <p className="am-kind">{tp(id, "kind")}</p>
        <p className="am-what">{tp(id, "what")}</p>

        <div className="am-try">
          <h3>{t("hero.panel.try")}</h3>
          {experiment(id)}
        </div>

        <h3>{t("hero.panel.wrong")}</h3>
        <p>{tp(id, "wrong")}</p>

        <h3>{t("hero.panel.profile")}</h3>
        <p className="am-prof">{tp(id, "profile")}</p>

        {id === "nerve" && (
          <p className="am-onward">
            {t("path.hero.gate.sub")} <Link to="/auditory-pathway">{t("path.hero.cta")}</Link>
          </p>
        )}
        {visited.length === PARTS.length && (
          <p className="am-onward">
            {t("hero.done")} <Link to="/test">{t("hero.done.cta")}</Link>
          </p>
        )}
      </div>
  );

  return (
    <section className="am-hero" data-open={selected ? "" : undefined}>
      <style>{CSS}</style>

      <div className="am-copy">
        <h1>{t("hero.title")}</h1>
        <p className="am-sub">{t("hero.sub")}</p>
        <div className="am-actions">
          <Link className="am-btn am-btn-go" to="/test">
            {t("hero.cta.test")}
            <ArrowRight aria-hidden className="am-btn-icon" />
          </Link>
          <Link className="am-btn am-btn-quiet" to="/sample-profile">
            {t("hero.cta.profile")}
          </Link>
        </div>
        <p className="am-lede">{t("hero.lede")}</p>
        <p className="am-fine">{t("hero.fine")}</p>
      </div>

      <div className="am-stage" ref={stageRef} data-dim={shown ? "" : undefined}>
        <Coil className="am-stage-coil" />
        <div className="am-gl" ref={hostRef} role="img" aria-label={t("hero.svg.alt")} />
        {!ready && !glFailed && <p className="am-status">{t("hero.loading")}</p>}
        {glFailed && <p className="am-status">{t("hero.nogl")}</p>}
        {ready && (
          <div className="am-tags" aria-hidden>
            {PARTS.map((id) => (
              <button
                key={id}
                ref={(el) => {
                  tagRefs.current[id] = el;
                }}
                type="button"
                tabIndex={-1}
                className="am-tag"
                style={{ "--dot": PART_COLOR[id] } as React.CSSProperties}
                data-hot={shown === id ? "" : undefined}
                data-seen={visited.includes(id) ? "" : undefined}
                onClick={() => select(id)}
                onPointerEnter={(e) => e.pointerType === "mouse" && !selected && setHovered(id)}
                onPointerLeave={() => !selected && setHovered(null)}
              >
                {t(LABEL[id])}
              </button>
            ))}
            <span
              ref={(el) => {
                tagRefs.current.danger = el;
              }}
              className="am-tag am-tag-hz"
              data-hot={inDangerBand ? "" : undefined}
            >
              {fmtHz(freq)}
            </span>
          </div>
        )}

        <div className="am-detail" aria-live="polite">
          {hovered && !selected ? (
            <div className="am-peek" key={hovered} style={{ "--dot": PART_COLOR[hovered] } as React.CSSProperties}>
              <p className="am-peek-title">{tp(hovered, "title")}</p>
              <p>{tp(hovered, "what")}</p>
            </div>
          ) : (
            <p className="am-hint">
              {t("hero.hint")}
              {visited.length > 0 && (
                <span className="am-count">
                  {" "}
                  {t("hero.count").replace("{n}", String(visited.length)).replace("{total}", String(PARTS.length))}
                </span>
              )}
            </p>
          )}
        </div>

        <nav className="am-path" aria-label={t("hero.panel.path")}>
          {PATH.map((id) => plate(id))}
          <span className="am-path-gap" aria-hidden />
          {OFF_PATH.map((id) => plate(id))}
          <Link className="am-plate am-plate-out" to="/auditory-pathway">
            <span className="am-plate-l">{t("path.hero.step")}</span>
            <ArrowRight aria-hidden className="am-btn-icon" />
          </Link>
        </nav>
      </div>

      {selected && (asSheet ? createPortal(<div className="am-sheet-root">{panel(selected)}</div>, document.body) : panel(selected))}
    </section>
  );
}

const CSS = `
.am-hero,.am-sheet-root{
  --am-bg:var(--background); --am-tone:var(--card); --am-tint:var(--accent);
  --am-ink:var(--foreground); --am-ink-2:var(--muted-foreground);
  --am-accent:var(--primary); --am-red:#d93b3f;
  --am-ease:cubic-bezier(0.23,1,0.32,1);
  --am-panel-w:clamp(21rem,28vw,26rem);
  --am-margin:clamp(20px,4vw,80px);
  -webkit-font-smoothing:antialiased;
}
.am-hero{
  position:relative; display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1.08fr);
  grid-template-areas:none;
  min-height:max(calc(100svh - 64px), 640px);
  background:var(--am-bg); color:var(--am-ink);
}

/* ---------- copy ---------- */
.am-copy{grid-column:1; grid-row:1; grid-area:auto; justify-self:center; align-self:center; width:min(100%, 46rem); box-sizing:border-box; padding:clamp(32px,5vh,64px) clamp(24px,3vw,48px) clamp(32px,5vh,64px) var(--am-margin)}
.am-hero h1{
  font-weight:600; font-size:clamp(2.5rem,3.7vw,4rem);
  line-height:1; letter-spacing:-.05em; margin:0; text-wrap:balance;
  animation:am-lift 700ms var(--am-ease) both;
}
.am-sub{max-width:44ch; margin:1.4rem 0 0; font-size:clamp(1.08rem,1.3vw,1.22rem); line-height:1.5; font-weight:500; letter-spacing:-.01em; text-wrap:pretty; animation:am-rise 700ms var(--am-ease) 80ms both}
.am-actions{display:flex; flex-wrap:wrap; gap:.6rem; margin-top:1.8rem; animation:am-rise 700ms var(--am-ease) 160ms both}
.am-lede{max-width:62ch; margin:2rem 0 0; font-size:1.02rem; line-height:1.62; color:var(--am-ink); text-wrap:pretty; animation:am-rise 700ms var(--am-ease) 240ms both}
.am-fine{margin:.9rem 0 0; font-size:.9rem; line-height:1.5; color:var(--am-ink-2)}
@keyframes am-rise{from{opacity:0; transform:translateY(16px)} to{opacity:1; transform:none}}
/* the title is painted on the first frame and only travels in */
@keyframes am-lift{from{transform:translateY(16px)} to{transform:none}}

.am-btn{
  display:inline-flex; align-items:center; gap:.5rem;
  font-weight:500; font-size:1rem; letter-spacing:-.01em;
  padding:.85rem 1.35rem; border-radius:999px; text-decoration:none;
  transition:transform 160ms var(--am-ease), background-color 160ms ease;
  -webkit-tap-highlight-color:transparent; touch-action:manipulation;
}
.am-btn:active{transform:scale(.97)}
.am-btn-go{background:var(--am-accent); color:var(--primary-foreground)}
.am-btn-quiet{background:var(--am-tone); color:var(--am-ink)}
@media (hover:hover) and (pointer:fine){
  .am-btn-go:hover{background:color-mix(in oklab, var(--am-accent) 88%, black)}
  .am-btn-quiet:hover{background:color-mix(in oklab, var(--am-tone) 94%, black)}
}
.am-btn-icon{width:1.05em; height:1.05em; flex:none}
.am-btn:focus-visible,.am-plate:focus-visible,.am-key:focus-visible,.am-close:focus-visible{outline:2px solid var(--ring); outline-offset:3px}

/* ---------- the stage: a pale teal field, its corner rounded like the coil ---------- */
.am-stage{
  grid-column:2; grid-row:1;
  position:relative; min-height:0; min-width:0; overflow:hidden;
  background:var(--am-tint); border-top-left-radius:min(15vw,240px);
  margin-top:clamp(12px,2vh,24px);
}
.am-stage-coil{position:absolute; width:min(92vh,64vw); aspect-ratio:1; right:-16%; bottom:-30%; color:oklch(0.925 0.04 205); pointer-events:none; animation:am-coil 1.4s var(--am-ease) both}
@keyframes am-coil{from{opacity:0; transform:rotate(-30deg) scale(.94)} to{opacity:1; transform:none}}
.am-gl{position:absolute; inset:0}
.am-canvas{display:block; width:100%; height:100%; cursor:grab}
.am-canvas:active{cursor:grabbing}
.am-status{position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); margin:0; font-weight:500; color:var(--am-ink-2); text-align:center; max-width:22em}

.am-tags{position:absolute; inset:0; pointer-events:none}
.am-tag{
  position:absolute; left:0; top:0; pointer-events:auto; cursor:pointer; white-space:nowrap;
  display:inline-flex; align-items:center; gap:.4rem;
  font:500 .82rem/1 var(--font-body); letter-spacing:-.005em;
  background:var(--am-bg); color:var(--am-ink); border:0; border-radius:999px;
  padding:.42rem .7rem .42rem .5rem; margin:0; translate:-50% -50%;
  transition:background-color 140ms ease, opacity 200ms ease, color 140ms ease;
  touch-action:manipulation;
}
.am-tag::before{content:""; width:.6rem; height:.6rem; border-radius:50%; background:var(--dot); flex:none}
.am-tag[data-hot]{background:var(--am-ink); color:var(--am-bg)}
.am-stage[data-dim] .am-tag:not([data-hot]){opacity:.35}
.am-tag-hz{pointer-events:none; background:var(--am-ink); color:var(--am-bg); padding-left:.7rem; font-variant-numeric:tabular-nums}
.am-tag-hz::before{display:none}
.am-tag-hz[data-hot]{background:var(--am-red)}

/* hint or peek, top right of the stage */
.am-detail{position:absolute; z-index:3; top:clamp(20px,3vh,32px); right:var(--am-margin); width:min(22rem,40%)}
.am-hint{margin:0; font-size:.95rem; line-height:1.5; color:var(--am-ink); text-align:right}
.am-count{color:var(--am-ink-2)}
.am-peek{background:var(--am-bg); border-radius:18px; padding:.95rem 1.1rem; box-shadow:0 12px 30px -16px rgba(15,30,40,.35); animation:am-rise 180ms var(--am-ease) both} /* taste-skill-ignore: floats over the canvas */
.am-peek p{margin:0; font-size:.93rem; line-height:1.5; color:var(--am-ink)}
.am-peek .am-peek-title{display:flex; align-items:center; gap:.5rem; font-weight:600; font-size:1.02rem; margin-bottom:.25rem}
.am-peek .am-peek-title::before{content:""; width:.62rem; height:.62rem; border-radius:50%; background:var(--dot)}

/* the signal path, along the foot of the stage */
.am-path{position:absolute; z-index:3; left:clamp(20px,2.4vw,36px); right:var(--am-margin); bottom:clamp(20px,3vh,32px); display:flex; flex-wrap:wrap; gap:.4rem; transition:right 300ms var(--am-ease)}
.am-hero[data-open] .am-path{right:calc(var(--am-margin) + var(--am-panel-w) + 24px)}
.am-path-gap{width:.8rem}
.am-plate{
  position:relative; display:inline-flex; align-items:center; gap:.5rem; cursor:pointer; text-decoration:none;
  font:500 .92rem/1 var(--font-body); letter-spacing:-.01em; color:var(--am-ink);
  background:var(--am-bg); border:0; border-radius:999px; padding:.68rem 1rem .68rem .8rem;
  transition:transform 160ms var(--am-ease), background-color 140ms ease, color 140ms ease;
  -webkit-tap-highlight-color:transparent; touch-action:manipulation;
}
.am-plate:active{transform:scale(.97)}
.am-plate-l{white-space:nowrap}
.am-plate::before{content:""; width:.62rem; height:.62rem; border-radius:50%; background:var(--dot); flex:none; transition:transform 260ms var(--am-ease)}
.am-plate[data-chase]::before{transform:scale(1.45)}
.am-plate[data-seen]::before{box-shadow:0 0 0 2px var(--am-bg), 0 0 0 3.5px var(--dot)} /* taste-skill-ignore: a ring, not a shadow */
.am-plate[data-hot]{background:color-mix(in oklab, var(--am-bg) 92%, var(--am-accent))}
.am-plate[aria-pressed=true]{background:var(--am-ink); color:var(--am-bg)}
.am-plate[aria-pressed=true][data-seen]::before{box-shadow:0 0 0 2px var(--am-ink), 0 0 0 3.5px var(--dot)} /* taste-skill-ignore: a ring, not a shadow */
.am-plate-out{background:transparent; color:var(--am-accent); font-weight:600}
.am-plate-out::before{display:none}
@media (hover:hover) and (pointer:fine){
  .am-plate:not([aria-pressed=true]):not(.am-plate-out):hover{background:color-mix(in oklab, var(--am-bg) 92%, var(--am-accent))}
  .am-plate-out:hover{text-decoration:underline; text-underline-offset:4px}
}

/* ---------- panel: a white card floating over the stage ---------- */
.am-panel{
  position:absolute; z-index:6; right:var(--am-margin); top:clamp(28px,4vh,44px); bottom:clamp(16px,2vh,28px);
  width:var(--am-panel-w); overflow:auto; overscroll-behavior:contain;
  background:var(--am-bg); color:var(--am-ink); border-radius:24px;
  padding:clamp(20px,1.8vw,28px);
  box-shadow:0 30px 70px -30px rgba(15,30,40,.4); /* taste-skill-ignore: the panel is a dialog */
  animation:am-in 240ms var(--am-ease) both;
  scrollbar-width:thin;
}
@keyframes am-in{from{opacity:0; transform:translateX(12px)} to{opacity:1; transform:none}}
.am-panel:focus{outline:none}
.am-panel-head{display:flex; align-items:flex-start; justify-content:space-between; gap:1rem}
.am-panel h2{font-weight:600; font-size:clamp(1.7rem,2.1vw,2.1rem); letter-spacing:-.04em; line-height:1.05; margin:0; text-wrap:balance}
.am-close{
  display:inline-flex; align-items:center; gap:.3rem; flex:none; cursor:pointer;
  font:500 .9rem var(--font-body); background:var(--am-tone); color:var(--am-ink);
  border:0; border-radius:999px; padding:.45rem .8rem; transition:transform 160ms var(--am-ease), background-color 140ms ease;
  touch-action:manipulation;
}
.am-close:hover{background:color-mix(in oklab, var(--am-tone) 92%, black)}
.am-close:active{transform:scale(.97)}
.am-kind{margin:.6rem 0 .9rem; font-weight:500; font-size:.92rem; color:var(--am-ink-2); display:flex; align-items:center; gap:.5rem}
.am-kind::before{content:""; width:.62rem; height:.62rem; border-radius:50%; background:var(--dot); flex:none}
.am-panel p{margin:0; font-size:.98rem; line-height:1.6; color:var(--am-ink)}
.am-panel h3{font-weight:600; font-size:1rem; letter-spacing:-.01em; margin:1.4rem 0 .35rem; color:var(--am-ink)}
.am-prof{font-weight:500; color:var(--am-accent) !important}
.am-onward{margin-top:1.3rem !important}
.am-onward a{color:var(--am-accent); font-weight:600; text-underline-offset:3px}

/* the experiment */
.am-try{background:var(--am-tint); border-radius:18px; padding:1rem 1.1rem 1.15rem; margin-top:1.2rem}
.am-try h3{margin:0 0 .7rem !important}
.am-x-label{display:block; font-weight:500; font-size:.93rem; color:var(--am-ink); margin:0 0 .55rem}
.am-seg{display:flex; flex-wrap:wrap; gap:.4rem}
.am-key{
  font:500 .95rem var(--font-body); letter-spacing:-.01em; cursor:pointer;
  background:var(--am-bg); color:var(--am-ink); border:0; border-radius:999px;
  padding:.6rem 1rem;
  transition:transform 160ms var(--am-ease), background-color 140ms ease, color 140ms ease;
  -webkit-tap-highlight-color:transparent; touch-action:manipulation;
}
.am-key:active{transform:scale(.97)}
.am-key[aria-checked=true],.am-key[aria-pressed=true]{background:var(--am-ink); color:var(--am-bg)}
.am-key-hazard{background:var(--am-red); color:#fff}
.am-key:disabled{cursor:default; background:transparent; color:var(--am-ink-2)}
@media (hover:hover) and (pointer:fine){
  .am-key:not(:disabled):not([aria-pressed=true]):not([aria-checked=true]):not(.am-key-hazard):hover{background:color-mix(in oklab, var(--am-bg) 94%, black)}
  .am-key-hazard:not(:disabled):hover{background:#c22f33}
}
.am-try .am-read{margin-top:.75rem; font-size:.95rem; line-height:1.55}
.am-try .am-read strong{font-weight:600; font-variant-numeric:tabular-nums}
.am-note{margin-top:.5rem !important; font-size:.88rem !important; color:var(--am-ink-2) !important}
.am-scar{margin-top:.8rem !important; background:#fdeaea; color:#8f1d20 !important; border-radius:12px; padding:.65rem .8rem; font-weight:500; font-size:.92rem !important}
.am-readout{display:flex; align-items:baseline; gap:.7rem; flex-wrap:wrap; margin:0 0 .2rem !important}
.am-hz{font-weight:600; font-size:2.4rem; line-height:1; letter-spacing:-.04em; font-variant-numeric:tabular-nums}
.am-band{font-size:.93rem}

:is(.am-hero,.am-sheet-root) input[type=range]{-webkit-appearance:none; appearance:none; width:100%; height:32px; background:transparent; margin:.1rem 0; cursor:grab}
:is(.am-hero,.am-sheet-root) input[type=range]:active{cursor:grabbing}
:is(.am-hero,.am-sheet-root) input[type=range]::-webkit-slider-runnable-track{height:6px; border-radius:99px; background:color-mix(in oklab, var(--am-accent) 22%, white)}
:is(.am-hero,.am-sheet-root) input[type=range]::-moz-range-track{height:6px; border-radius:99px; background:color-mix(in oklab, var(--am-accent) 22%, white)}
:is(.am-hero,.am-sheet-root) input[type=range]::-webkit-slider-thumb{-webkit-appearance:none; appearance:none; width:22px; height:22px; margin-top:-8px; border-radius:50%; background:var(--am-accent); border:3px solid #fff}
:is(.am-hero,.am-sheet-root) input[type=range]::-moz-range-thumb{width:22px; height:22px; border-radius:50%; background:var(--am-accent); border:3px solid #fff}
:is(.am-hero,.am-sheet-root) input[type=range].am-hot::-webkit-slider-thumb{background:var(--am-red)}
:is(.am-hero,.am-sheet-root) input[type=range].am-hot::-moz-range-thumb{background:var(--am-red)}
:is(.am-hero,.am-sheet-root) input[type=range]:focus-visible{outline:none}
:is(.am-hero,.am-sheet-root) input[type=range]:focus-visible::-webkit-slider-thumb{outline:2px solid var(--ring); outline-offset:2px}
:is(.am-hero,.am-sheet-root) input[type=range]:focus-visible::-moz-range-thumb{outline:2px solid var(--ring); outline-offset:2px}

/* ---------- narrower screens ---------- */
@media (max-width:1000px){
  .am-hero{display:flex; flex-direction:column; min-height:auto}
  .am-copy{display:contents}
  .am-copy > h1{order:1; padding:40px 20px 0}
  .am-sub{order:2; padding-inline:20px}
  .am-actions{order:3; padding-inline:20px}
  .am-stage{order:4; height:min(118vw,640px); margin:28px 0 0 20px; border-top-left-radius:120px}
  .am-lede{order:5; padding-inline:20px; margin-top:28px}
  .am-fine{order:6; padding-inline:20px}
  .am-detail{left:auto; width:min(18rem,60%)}
  .am-path{left:16px; right:16px; bottom:16px}
  .am-hero[data-open] .am-path{right:16px}
  .am-panel{position:fixed; z-index:60; inset:auto 0 0 0; width:auto; max-height:80svh; border-radius:24px 24px 0 0; padding-bottom:calc(24px + env(safe-area-inset-bottom,0px)); animation-name:am-up}
  @keyframes am-up{from{opacity:0; transform:translateY(24px)} to{opacity:1; transform:none}}
}
@media (max-width:640px){
  .am-tag{font-size:.82rem}
  .am-tag:not([data-hot]):not(.am-tag-hz){opacity:0 !important; pointer-events:none}
  .am-plate{font-size:.85rem; padding:.58rem .8rem .58rem .66rem}
  .am-hero h1{font-size:clamp(2.3rem,10vw,3rem)}
  .am-hint{font-size:.85rem}
}
@media (prefers-reduced-motion:reduce){
  .am-hero *,.am-sheet-root *{animation:none !important; transition-property:opacity,background-color,color !important}
}
`;

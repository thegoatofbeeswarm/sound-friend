import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import { useI18n } from "@/lib/i18n";
import type { AnchorId, EarScene, EarState, PartId } from "./earScene";

/**
 * EarHero: the homepage as a hearing-safety sign you can walk around.
 *
 * A 3D ear (three.js, see ./earScene) turns on a signal-blue field. Drag to
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
const formatFreq = (f: number) => (f < 1000 ? `${Math.round(f)} Hz` : `${(f / 1000).toFixed(1)} kHz`);

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
  const { t } = useI18n();
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
              <span className="am-hz">{formatFreq(freq)}</span>
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
              aria-valuetext={`${formatFreq(freq)}, ${t(bandKey(freq))}`}
              className={inDangerBand ? "am-hot" : undefined}
            />
            <p id="am-place" className="am-read">
              {withMm(t(inDangerBand ? "hero.place.danger" : "hero.place.normal"), `${mmFromBase.toFixed(1)} mm`)}
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
      aria-pressed={selected === id}
      data-seen={visited.includes(id) ? "" : undefined}
      data-hot={shown === id ? "" : undefined}
      onClick={() => (selected === id ? close() : select(id))}
      onPointerEnter={(e) => e.pointerType === "mouse" && !selected && setHovered(id)}
      onPointerLeave={() => !selected && setHovered(null)}
    >
      {t(LABEL[id])}
    </button>
  );

  const panel = (id: PartId) => (
      <div
        className="am-panel"
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
    <section className="am-hero">
      <style>{CSS}</style>

      <div className="am-copy">
        <h1>{t("hero.title")}</h1>
        <p className="am-sub">{t("hero.sub")}</p>
        <p className="am-lede">{t("hero.lede")}</p>

        <div className="am-actions">
          <Link className="am-btn am-btn-go" to="/test">
            {t("hero.cta.test")}
            <ArrowRight aria-hidden className="am-btn-icon" />
          </Link>
          <Link className="am-btn am-btn-quiet" to="/sample-profile">
            {t("hero.cta.profile")}
          </Link>
        </div>
        <p className="am-fine">{t("hero.fine")}</p>

        <div className="am-detail" aria-live="polite">
          {hovered && !selected ? (
            <div className="am-peek" key={hovered}>
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

        {selected && (asSheet ? createPortal(<div className="am-sheet-root">{panel(selected)}</div>, document.body) : panel(selected))}
      </div>

      <div className="am-stage" ref={stageRef} data-dim={shown ? "" : undefined}>
        <div className="am-sign" aria-hidden />
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
              {formatFreq(freq)}
            </span>
          </div>
        )}
      </div>

      <nav className="am-path" aria-label={t("hero.panel.path")}>
        <div className="am-path-run">{PATH.map(plate)}</div>
        <div className="am-path-run am-path-side">
          {OFF_PATH.map(plate)}
          <Link className="am-plate am-plate-out" to="/auditory-pathway">
            {t("path.hero.step")}
            <ArrowRight aria-hidden className="am-btn-icon" />
          </Link>
        </div>
      </nav>
    </section>
  );
}

const CSS = `
.am-home{
  --foreground:#f4f1ea; --muted-foreground:#dfe5ee; --signal:#f4f1ea;
  --primary:#f6b800; --primary-foreground:#121212; --card:#103a72; --border:#2a5c9c;
  --font-display:"Barlow Condensed","Arial Narrow",sans-serif;
  background:#15488a;
}
.am-home header > div{max-width:none; padding-inline:clamp(20px,3vw,48px)}
.am-home header .nav-link:hover{color:#ffffff}
.am-home header .nav-link:focus-visible{outline:2px solid #f6b800; outline-offset:2px}

.am-hero,.am-sheet-root{
  --am-blue:#15488a; --am-blue-deep:#103a72; --am-blue-step:#1b569e;
  --am-enamel:#f4f1ea; --am-yellow:#f6b800; --am-ink:#121212;
  --am-ease:cubic-bezier(0.23,1,0.32,1);
  --am-cond:"Barlow Condensed","Arial Narrow",sans-serif;
  --am-text:"Barlow","Helvetica Neue",Arial,sans-serif;
  font-family:var(--am-text);
}
.am-hero{
  position:relative; display:grid;
  grid-template-columns:minmax(0,5.6fr) minmax(0,6.4fr);
  grid-template-rows:1fr auto;
  min-height:100svh; overflow:hidden;
  padding:clamp(76px,9vh,104px) clamp(20px,3vw,48px) clamp(20px,3vh,32px);
  column-gap:clamp(16px,2vw,40px);
  background:var(--am-blue); color:var(--am-enamel);
  font-family:var(--am-text);
}
.am-hero ::selection{background:var(--am-yellow); color:var(--am-ink)}

/* ---------- copy ---------- */
.am-copy{position:relative; z-index:3; align-self:center; max-width:40rem; padding-block:clamp(8px,3vh,32px)}
.am-hero h1{
  font-family:var(--am-cond); font-weight:700; font-size:clamp(2.6rem,4vw,4.4rem);
  line-height:.94; letter-spacing:-.012em; margin:0 0 clamp(18px,2.6vh,28px); text-wrap:balance;
}
.am-sub{font-size:clamp(1.12rem,1.35vw,1.32rem); line-height:1.42; font-weight:500; margin:0 0 1.1rem; max-width:32em; text-wrap:pretty}
.am-lede{font-size:1rem; line-height:1.6; margin:0; max-width:36em; text-wrap:pretty}

.am-actions{display:flex; flex-wrap:wrap; gap:.6rem; margin-top:clamp(22px,3.4vh,34px)}
.am-btn{
  display:inline-flex; align-items:center; gap:.55rem;
  font-family:var(--am-cond); font-weight:600; font-size:1.2rem; letter-spacing:.01em;
  padding:.78rem 1.25rem .74rem; border-radius:0; text-decoration:none;
  transition:transform 160ms var(--am-ease), background-color 160ms ease;
  -webkit-tap-highlight-color:transparent;
}
.am-btn:active{transform:scale(.97)}
.am-btn:focus-visible,.am-plate:focus-visible,.am-key:focus-visible,.am-close:focus-visible{outline:3px solid var(--am-yellow); outline-offset:3px}
.am-btn-go{background:var(--am-yellow); color:var(--am-ink)}
.am-btn-quiet{background:var(--am-blue-deep); color:var(--am-enamel)}
@media (hover:hover) and (pointer:fine){
  .am-btn-go:hover{background:#ffc928}
  .am-btn-quiet:hover{background:#0c2f5e}
}
.am-btn-icon{width:1.05em; height:1.05em; flex:none}
.am-fine{font-size:.9rem; line-height:1.5; margin:.85rem 0 0; color:#dfe5ee}

.am-detail{margin-top:clamp(20px,3.4vh,36px); min-height:6.4em; max-width:34em}
.am-hint{margin:0; font-size:.95rem; line-height:1.5; color:#dfe5ee}
.am-count{color:var(--am-enamel); font-weight:600}
.am-peek{background:var(--am-blue-deep); padding:.85rem 1rem; animation:am-rise 180ms var(--am-ease) both}
.am-peek p{margin:0; font-size:.95rem; line-height:1.5}
.am-peek .am-peek-title{font-family:var(--am-cond); font-weight:600; font-size:1.2rem; margin-bottom:.2rem}
@keyframes am-rise{from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none}}

/* ---------- panel: an enamel plate over the copy ---------- */
.am-panel{
  position:absolute; z-index:6; inset:0 0 0 0; overflow:auto; overscroll-behavior:contain;
  background:var(--am-enamel); color:var(--am-ink);
  padding:clamp(20px,2.4vw,34px);
  box-shadow:0 18px 48px -12px rgba(5,20,45,.45);
  animation:am-in 240ms var(--am-ease) both;
  scrollbar-color:#9aa6b8 transparent;
}
@keyframes am-in{from{opacity:0; transform:translateY(10px) scale(.985)} to{opacity:1; transform:none}}
.am-panel:focus{outline:none}
.am-panel ::selection{background:var(--am-blue); color:var(--am-enamel)}
.am-panel-head{display:flex; align-items:flex-start; justify-content:space-between; gap:1rem}
.am-panel h2{font-family:var(--am-cond); font-weight:700; font-size:clamp(2rem,2.6vw,2.6rem); line-height:.98; margin:0}
.am-close{
  display:inline-flex; align-items:center; gap:.35rem; flex:none; cursor:pointer;
  font:600 .95rem var(--am-cond); background:var(--am-ink); color:var(--am-enamel);
  border:0; border-radius:0; padding:.45rem .75rem; transition:transform 160ms var(--am-ease);
}
.am-close:active{transform:scale(.97)}
.am-kind{margin:.55rem 0 .9rem; font-weight:600; font-size:.98rem; display:flex; align-items:center; gap:.5rem}
.am-kind::before{content:""; width:.7rem; height:.7rem; background:var(--am-yellow); flex:none}
.am-panel p{margin:0; font-size:1rem; line-height:1.58}
.am-panel h3{font-family:var(--am-cond); font-weight:600; font-size:1.2rem; margin:1.5rem 0 .35rem}
.am-prof{font-weight:600; color:var(--am-blue)}
.am-onward{margin-top:1.3rem !important; font-weight:500}
.am-onward a{color:var(--am-blue); font-weight:600; text-underline-offset:3px}

/* the experiment: a blue plate inside the white one */
.am-try{background:var(--am-blue); color:var(--am-enamel); padding:1rem 1.1rem 1.15rem; margin-top:1.3rem}
.am-try h3{margin:0 0 .7rem !important}
.am-try ::selection{background:var(--am-yellow); color:var(--am-ink)}
.am-x-label{display:block; font-weight:600; font-size:.98rem; margin:0 0 .55rem}
.am-seg{display:flex; flex-wrap:wrap; gap:.4rem}
.am-key{
  font:600 1.05rem var(--am-cond); letter-spacing:.01em; cursor:pointer;
  background:var(--am-blue-deep); color:var(--am-enamel); border:0; border-radius:0;
  padding:.55rem .9rem .5rem; transition:transform 160ms var(--am-ease), background-color 140ms ease, color 140ms ease;
  -webkit-tap-highlight-color:transparent;
}
.am-key:active{transform:scale(.97)}
.am-key[aria-checked=true],.am-key[aria-pressed=true]{background:var(--am-enamel); color:var(--am-ink)}
.am-key-hazard{background:var(--am-yellow); color:var(--am-ink)}
.am-key:disabled{cursor:default; background:#0c2f5e; color:#9fb3cf}
@media (hover:hover) and (pointer:fine){
  .am-key:not(:disabled):not([aria-pressed=true]):not([aria-checked=true]):not(.am-key-hazard):hover{background:#0c2f5e}
}
.am-try .am-read{margin-top:.75rem; font-size:.97rem; line-height:1.55}
.am-try .am-read strong{font-weight:600; font-variant-numeric:tabular-nums}
.am-note{margin-top:.5rem !important; font-size:.88rem !important; color:#dfe5ee}
.am-scar{margin-top:.8rem !important; background:var(--am-yellow); color:var(--am-ink); padding:.6rem .75rem; font-weight:600; font-size:.95rem !important}
.am-readout{display:flex; align-items:baseline; gap:.7rem; flex-wrap:wrap; margin:0 0 .2rem !important}
.am-hz{font:700 2.6rem/1 var(--am-cond); font-variant-numeric:tabular-nums}
.am-band{font-size:.98rem}

:is(.am-hero,.am-sheet-root) input[type=range]{-webkit-appearance:none; appearance:none; width:100%; height:34px; background:transparent; margin:.1rem 0; cursor:grab}
:is(.am-hero,.am-sheet-root) input[type=range]:active{cursor:grabbing}
:is(.am-hero,.am-sheet-root) input[type=range]::-webkit-slider-runnable-track{height:6px; background:var(--am-blue-deep)}
:is(.am-hero,.am-sheet-root) input[type=range]::-moz-range-track{height:6px; background:var(--am-blue-deep)}
:is(.am-hero,.am-sheet-root) input[type=range]::-webkit-slider-thumb{-webkit-appearance:none; appearance:none; width:22px; height:22px; margin-top:-8px; background:var(--am-enamel); border:0; border-radius:0}
:is(.am-hero,.am-sheet-root) input[type=range]::-moz-range-thumb{width:22px; height:22px; background:var(--am-enamel); border:0; border-radius:0}
:is(.am-hero,.am-sheet-root) input[type=range].am-hot::-webkit-slider-thumb{background:var(--am-yellow)}
:is(.am-hero,.am-sheet-root) input[type=range].am-hot::-moz-range-thumb{background:var(--am-yellow)}
:is(.am-hero,.am-sheet-root) input[type=range]:focus-visible{outline:none}
:is(.am-hero,.am-sheet-root) input[type=range]:focus-visible::-webkit-slider-thumb{outline:3px solid var(--am-yellow); outline-offset:2px}
:is(.am-hero,.am-sheet-root) input[type=range]:focus-visible::-moz-range-thumb{outline:3px solid var(--am-yellow); outline-offset:2px}

/* ---------- stage: the sign the ear came off ---------- */
.am-stage{position:relative; z-index:2; min-height:0; min-width:0}
.am-sign{
  position:absolute; left:50%; top:50%; width:min(94%,76svh); aspect-ratio:1; transform:translate(-50%,-50%);
  border-radius:50%; background:var(--am-blue-deep);
  box-shadow:0 0 0 clamp(10px,1vw,16px) var(--am-enamel);
}
.am-gl{position:absolute; inset:0}
.am-canvas{display:block; width:100%; height:100%; cursor:grab}
.am-canvas:active{cursor:grabbing}
.am-status{position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); margin:0; font:600 1.15rem var(--am-cond); text-align:center; max-width:22em}

.am-tags{position:absolute; inset:0; pointer-events:none}
.am-tag{
  position:absolute; left:0; top:0; pointer-events:auto; cursor:pointer; white-space:nowrap;
  font:600 .92rem/1 var(--am-cond); letter-spacing:.01em;
  background:var(--am-enamel); color:var(--am-ink); border:0; border-radius:0;
  padding:.38rem .55rem .34rem; margin:0; translate:-50% -50%;
  transition:background-color 140ms ease, opacity 200ms ease;
}
.am-tag[data-seen]::after{content:""; display:inline-block; width:.42rem; height:.42rem; margin-left:.4rem; vertical-align:.08em; background:var(--am-blue)}
.am-tag[data-hot]{background:var(--am-yellow)}
.am-stage[data-dim] .am-tag:not([data-hot]){opacity:.3}
.am-tag-hz{pointer-events:none; background:var(--am-ink); color:var(--am-enamel); font-variant-numeric:tabular-nums}
.am-tag-hz[data-hot]{background:var(--am-yellow); color:var(--am-ink)}

/* ---------- the signal path: one unbroken row of plates ---------- */
.am-path{grid-column:1 / -1; position:relative; z-index:4; display:flex; flex-wrap:wrap; gap:clamp(10px,1.4vw,22px); margin-top:clamp(12px,2vh,20px)}
.am-path-run{display:flex; gap:4px; flex-wrap:wrap}
.am-path-side{margin-left:auto}
.am-plate{
  position:relative; display:inline-flex; align-items:center; gap:.45rem; cursor:pointer; text-decoration:none;
  font:600 1.08rem/1 var(--am-cond); letter-spacing:.01em; color:var(--am-enamel);
  background:var(--am-blue-deep); border:0; border-radius:0; padding:.82rem 1rem .76rem;
  transition:transform 160ms var(--am-ease), background-color 140ms ease, color 140ms ease;
  -webkit-tap-highlight-color:transparent;
}
.am-plate:active{transform:scale(.97)}
.am-plate::before{content:""; position:absolute; left:0; right:0; top:0; height:4px; background:var(--am-yellow); transform:scaleX(0); transform-origin:left; transition:transform 260ms var(--am-ease)}
.am-plate[data-chase]::before{transform:scaleX(1)}
.am-plate[data-seen]::after{content:""; width:.45rem; height:.45rem; background:var(--am-enamel); opacity:.7}
.am-plate[data-hot]{background:var(--am-blue-step)}
.am-plate[aria-pressed=true]{background:var(--am-enamel); color:var(--am-ink)}
.am-plate[aria-pressed=true]::after{background:var(--am-blue)}
.am-plate-out{background:transparent; padding-inline:.6rem}
@media (hover:hover) and (pointer:fine){
  .am-plate:not([aria-pressed=true]):hover{background:var(--am-blue-step)}
  .am-plate-out:hover{background:var(--am-blue-deep)}
}

/* ---------- narrower screens ---------- */
@media (max-width:1000px){
  .am-hero{display:flex; flex-direction:column; min-height:auto; padding-top:84px}
  /* the ear comes straight after the headline, before the long read */
  .am-copy{display:contents}
  .am-copy > h1{order:1}
  .am-sub{order:2}
  .am-stage{order:3; height:min(100vw,560px); margin-inline:calc(-1 * clamp(20px,3vw,48px))}
  .am-path{order:4; margin-top:0}
  .am-lede{order:5; margin-top:clamp(28px,5vh,40px)}
  .am-actions{order:6}
  .am-fine{order:7}
  .am-detail{order:8}
  .am-sign{width:min(88%,520px)}
  .am-detail{min-height:0}
  .am-panel{position:fixed; z-index:60; inset:auto 0 0 0; max-height:78svh; padding-bottom:calc(24px + env(safe-area-inset-bottom,0px)); animation-name:am-up}
  @keyframes am-up{from{opacity:0; transform:translateY(24px)} to{opacity:1; transform:none}}
  .am-path-side{margin-left:0}
}
@media (max-width:640px){
  .am-tag{font-size:.8rem; padding:.3rem .42rem .27rem}
  /* too small for every label at once: the row below names the parts */
  .am-tag:not([data-hot]):not(.am-tag-hz){opacity:0 !important; pointer-events:none}
  .am-plate{font-size:1rem; padding:.7rem .8rem .66rem}
  .am-hero h1{font-size:clamp(2.1rem,9.2vw,3rem)}
}
@media (prefers-reduced-motion:reduce){
  .am-hero *{animation:none !important; transition-property:opacity,background-color,color !important}
  .am-plate::before{display:none}
}
`;

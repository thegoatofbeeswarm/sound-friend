import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Coil } from "@/components/brand/Coil";
import { DEVICES, DEVICE_GROUPS, loadDevice, saveDevice, type DeviceId } from "@/lib/devices";

/**
 * Everything on the homepage below the 3D ear: how a screening works, where
 * the hearing test came from, what it measures, and the first step of the
 * test itself, already open.
 */
export default function HomeSections() {
  return (
    <div className="hs">
      <style>{CSS}</style>
      <HowItWorks />
      <History />
      <Measures />
      <FirstStep />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * entrance: each section's parts rise in turn as it scrolls into view
 * ------------------------------------------------------------------ */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset["shown"] = "";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset["shown"] = "";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ------------------------------------------------------------------ *
 * how it works: many sounds, one narrow screening, five ordered skills
 * ------------------------------------------------------------------ */

function HowItWorks() {
  const { t } = useI18n();
  const ref = useReveal<HTMLElement>();
  const dots = useMemo(() => {
    // a fixed pseudo-random scatter so the server and client draw the same picture
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const out: { x: number; y: number; tone: 0 | 1 | 2 }[] = [];
    for (let i = 0; i < 54; i++) out.push({ x: 18 + rnd() * 262, y: 16 + rnd() * 168, tone: rnd() > 0.5 ? 0 : 1 });
    for (let c = 0; c < 22; c++) for (let r = 0; r < 3; r++) out.push({ x: 330 + c * 11, y: 89 + r * 11, tone: 1 });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) out.push({ x: 640 + c * 28, y: 30 + r * 35, tone: 2 });
    return out;
  }, []);

  return (
    <section className="hs-how" ref={ref} aria-labelledby="hs-how-h">
      <div className="hs-wrap">
        <div className="hs-how-head">
          <h2 id="hs-how-h" className="hs-h2 hs-in">
            {t("home.how.h")}
          </h2>
          <p className="hs-body hs-in" style={{ transitionDelay: "80ms" }}>
            {t("home.how.p")}
          </p>
        </div>
        <svg className="hs-how-fig hs-in" style={{ transitionDelay: "160ms" }} viewBox="0 0 900 200" role="img" aria-label={t("home.how.alt")}>
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.tone === 2 ? 6 : 4.5} className={`hs-dot hs-dot-${d.tone}`} />
          ))}
        </svg>
        <ol className="hs-how-steps">
          {[1, 2, 3].map((n, i) => (
            <li key={n} className="hs-in" style={{ transitionDelay: `${220 + i * 80}ms` }}>
              <h3>{t(`home.how.${n}.t`)}</h3>
              <p>{t(`home.how.${n}.d`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * history: three plates, one at a time
 * ------------------------------------------------------------------ */

const ERAS = [
  { id: "1879", img: "/img/hughes-audiometer-1879.jpg", w: 1600, h: 1071, alt: "Engraving of Hughes' 1879 audiometer with a listener holding the receiver to her ear" },
  { id: "1960", img: "/img/maico-audiometer-1960s.jpg", w: 1147, h: 1600, alt: "A 1960s Maico portable audiometer in its case, headphones coiled inside" },
  { id: "now", img: null, w: 0, h: 0, alt: "" },
] as const;

function History() {
  const { t } = useI18n();
  const ref = useReveal<HTMLElement>();
  const [era, setEra] = useState<(typeof ERAS)[number]["id"]>("1879");
  const current = ERAS.find((e) => e.id === era) ?? ERAS[0];

  return (
    <section className="hs-hist" ref={ref} aria-labelledby="hs-hist-h">
      <div className="hs-wrap hs-hist-grid">
        <div className="hs-hist-plate hs-in" key={current.id}>
          {current.img ? (
            <img src={current.img} width={current.w} height={current.h} alt={current.alt} loading="lazy" decoding="async" />
          ) : (
            <div className="hs-hist-now" role="img" aria-label={t("home.hist.now.alt")}>
              <Coil className="hs-hist-coil" />
            </div>
          )}
        </div>
        <div className="hs-hist-text">
          <div className="hs-tabs hs-in" role="tablist" aria-label={t("home.hist.h")}>
            {ERAS.map((e) => (
              <button
                key={e.id}
                type="button"
                role="tab"
                aria-selected={era === e.id}
                className="hs-tab"
                onClick={() => setEra(e.id)}
              >
                <span className="hs-tab-thumb" aria-hidden>
                  {e.img ? <img src={e.img} alt="" width={96} height={96} loading="lazy" decoding="async" /> : <Coil className="hs-tab-coil" />}
                </span>
                {t(`home.hist.${e.id}.tab`)}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="hs-hist-copy hs-in" style={{ transitionDelay: "80ms" }}>
            <h2 id="hs-hist-h" className="hs-h2">
              {t("home.hist.h")}
            </h2>
            <h3 className="hs-h3" key={`t-${era}`}>
              {t(`home.hist.${era}.title`)}
            </h3>
            <p className="hs-body" key={`b-${era}`}>
              {t(`home.hist.${era}.body`)}
            </p>
          </div>
          <div className="hs-cells hs-in" style={{ transitionDelay: "160ms" }}>
            <Link to="/test" className="hs-cell hs-cell-go">
              {t("hero.cta.test")}
              <ArrowRight aria-hidden className="hs-icon" />
            </Link>
            <Link to="/sample-profile" className="hs-cell">
              {t("hero.cta.profile")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * what it measures: one statement, with the picture beside each stage
 * ------------------------------------------------------------------ */

function Measures() {
  const { t } = useI18n();
  const ref = useReveal<HTMLElement>();
  const slot = (src: string, alt: string, pos: string) => (
    <span className="hs-slot">
      <img src={src} alt={alt} loading="lazy" decoding="async" width={190} height={100} style={{ objectPosition: pos }} />
    </span>
  );
  return (
    <section className="hs-measure" ref={ref} aria-labelledby="hs-measure-h">
      <div className="hs-wrap">
        <h2 id="hs-measure-h" className="sr-only">
          {t("home.feat.h")}
        </h2>
        <p className="hs-statement hs-in">
          {t("home.feat.1")}
          {slot("/img/tympanic-membrane.jpg", "A healthy eardrum seen through an otoscope", "50% 50%")}
          {t("home.feat.2")}
          {slot("/img/tonotopy-chittka-brockmann.jpg", "Diagram of the cochlea marked with the pitches each turn answers", "78% 22%")}
          {t("home.feat.3")}
          {slot("/img/gray-head-1860.jpg", "Engraving of the side of the head from Gray's Anatomy, 1860", "62% 34%")}
          {t("home.feat.4")}
        </p>
        <div className="hs-measure-foot hs-in" style={{ transitionDelay: "100ms" }}>
          <p className="hs-body">{t("home.feat.more")}</p>
          <Link to="/science" className="hs-link">
            {t("home.feat.link")}
            <ArrowRight aria-hidden className="hs-icon" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * the first step of the screening, already open
 * ------------------------------------------------------------------ */

function FirstStep() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const ref = useReveal<HTMLElement>();
  const [device, setDevice] = useState<DeviceId>("over-ear");
  useEffect(() => setDevice(loadDevice()), []);
  const group = DEVICES.find((d) => d.id === device)?.group ?? "Headphones";
  const [shownGroup, setShownGroup] = useState<(typeof DEVICE_GROUPS)[number]>(group);
  useEffect(() => setShownGroup(group), [group]);
  const models = DEVICES.filter((d) => d.group === shownGroup);

  return (
    <section className="hs-cta" ref={ref} aria-labelledby="hs-cta-h">
      <div className="hs-wrap hs-cta-grid">
        <div className="hs-cta-copy hs-in">
          <h2 id="hs-cta-h">{t("home.cta.h")}</h2>
          <p>{t("home.cta.p")}</p>
        </div>
        <form
          className="hs-dialog hs-in"
          style={{ transitionDelay: "120ms" }}
          data-ui
          onSubmit={(e) => {
            e.preventDefault();
            saveDevice(device);
            void navigate({ to: "/test" });
          }}
        >
          <h3>{t("home.cta.title")}</h3>
          <div className="hs-seg" role="radiogroup" aria-label={t("home.cta.title")}>
            {DEVICE_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={shownGroup === g}
                onClick={() => setShownGroup(g)}
              >
                {t(`home.cta.group.${g}`)}
              </button>
            ))}
          </div>
          <fieldset className="hs-models">
            <legend className="sr-only">{t(`home.cta.group.${shownGroup}`)}</legend>
            {models.map((m) => (
              <label key={m.id} className="hs-model">
                <input type="radio" name="device" value={m.id} checked={device === m.id} onChange={() => setDevice(m.id)} />
                <span>
                  <strong>{m.label}</strong>
                  <span>{m.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <button type="submit" className="hs-go">
            {t("hero.cta.test")}
            <ArrowRight aria-hidden className="hs-icon" />
          </button>
        </form>
      </div>
    </section>
  );
}

const CSS = `
.hs{
  --hs-ink:var(--foreground); --hs-muted:var(--muted-foreground); --hs-tone:var(--card);
  --hs-accent:var(--primary); --hs-tint:var(--accent);
  --hs-ease:cubic-bezier(0.23,1,0.32,1);
  color:var(--hs-ink);
}
.hs-wrap{max-width:72rem; margin-inline:auto; padding-inline:20px}
.hs-h2{font-size:clamp(2.1rem,4vw,3.6rem); line-height:1.02; letter-spacing:-.045em; font-weight:600; text-wrap:balance}
.hs-h3{font-size:clamp(1.6rem,2.4vw,2.2rem); line-height:1.08; letter-spacing:-.035em; font-weight:600; margin-top:1.5rem}
.hs-body{font-size:1.06rem; line-height:1.6; color:var(--hs-ink); max-width:40ch; text-wrap:pretty}
.hs-icon{width:1.05em; height:1.05em; flex:none}

/* reveal: parts rise in turn once their section is on screen; content is never hidden without script */
.hs-in{transition:opacity 700ms var(--hs-ease), transform 700ms var(--hs-ease)}
.hs section:not([data-shown]) .hs-in{opacity:0; transform:translateY(22px)}
@media (scripting:none){ .hs section .hs-in{opacity:1 !important; transform:none !important} }

/* how it works */
.hs-how{padding-block:clamp(120px,16vh,200px) clamp(80px,10vh,120px)}
.hs-how-head{display:grid; grid-template-columns:minmax(0,5fr) minmax(0,7fr); gap:24px 48px; align-items:end}
.hs-how-head .hs-body{justify-self:end}
.hs-how-fig{display:block; width:100%; height:auto; margin-top:clamp(40px,6vh,64px)}
.hs-dot{transition:transform 900ms var(--hs-ease); transform-box:fill-box; transform-origin:center}
.hs-dot-0{fill:oklch(0.86 0.01 250)}
.hs-dot-1{fill:oklch(0.76 0.03 215)}
.hs-dot-2{fill:var(--hs-accent)}
.hs-how:not([data-shown]) .hs-dot{transform:scale(.2)}
.hs-how-steps{list-style:none; margin:clamp(28px,4vh,44px) 0 0; padding:0; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:32px}
.hs-how-steps h3{font-size:1.3rem; font-weight:600; letter-spacing:-.02em}
.hs-how-steps p{margin-top:.5rem; font-size:1rem; line-height:1.55; max-width:30ch}

/* history */
.hs-hist{background:var(--hs-tone); padding-block:clamp(96px,12vh,160px)}
.hs-hist-grid{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:clamp(32px,5vw,80px); align-items:center; min-height:min(88svh,820px)}
.hs-hist-plate{aspect-ratio:1; overflow:hidden; border-top-left-radius:min(14vw,220px); background:var(--background); animation:hs-shutter 1.1s var(--hs-ease) both}
.hs-hist-plate img{width:100%; height:100%; object-fit:cover; animation:hs-settle 1.1s var(--hs-ease) both}
.hs-hist-now{width:100%; height:100%; background:var(--hs-tint); display:grid; place-items:center}
.hs-hist-coil{width:72%; color:var(--hs-accent)}
@keyframes hs-shutter{from{clip-path:inset(0 0 0 100%)} to{clip-path:inset(0 0 0 0)}}
@keyframes hs-settle{from{transform:scale(1.12)} to{transform:none}}
.hs-hist-text{display:flex; flex-direction:column; justify-content:space-between; gap:40px; align-self:stretch; padding-block:clamp(8px,4vh,48px)}
.hs-tabs{display:flex; gap:28px}
.hs-tab{display:flex; flex-direction:column; align-items:flex-start; gap:.55rem; background:none; border:0; padding:.4rem 0; cursor:pointer; font:inherit; font-size:1.1rem; font-weight:500; color:var(--hs-muted); transition:color 160ms ease; touch-action:manipulation}
.hs-tab[aria-selected=true]{color:var(--hs-ink); font-weight:600}
.hs-tab-thumb{display:block; width:96px; height:96px; overflow:hidden; border-top-left-radius:40px; background:var(--hs-tint); opacity:.55; transition:opacity 200ms ease, transform 160ms var(--hs-ease)}
.hs-tab-thumb img{width:100%; height:100%; object-fit:cover}
.hs-tab-coil{width:70%; margin:15%; color:var(--hs-accent)}
.hs-tab[aria-selected=true] .hs-tab-thumb{opacity:1}
.hs-tab:hover .hs-tab-thumb{opacity:1}
.hs-tab:active .hs-tab-thumb{transform:scale(.97)}
.hs-tab:hover{color:var(--hs-ink)}
.hs-tab:focus-visible,.hs-cell:focus-visible,.hs-link:focus-visible,.hs-go:focus-visible,.hs-seg button:focus-visible{outline:2px solid var(--ring); outline-offset:3px; border-radius:8px}
.hs-hist-copy .hs-body{margin-top:1rem}
.hs-cells{display:grid; grid-template-columns:1fr 1fr; gap:8px}
.hs-cell{display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:72px; padding:0 22px; font-weight:500; font-size:1.02rem; background:var(--background); color:var(--hs-ink); border-radius:999px; transition:transform 160ms var(--hs-ease), background-color 160ms ease; touch-action:manipulation}
.hs-cell-go{background:var(--hs-accent); color:var(--primary-foreground)}
.hs-cell:active{transform:scale(.97)}
@media (hover:hover) and (pointer:fine){
  .hs-cell:not(.hs-cell-go):hover{background:oklch(0.99 0 0)}
  .hs-cell-go:hover{background:color-mix(in oklab, var(--hs-accent) 88%, black)}
}

/* what it measures */
.hs-measure{padding-block:clamp(120px,16vh,200px)}
.hs-statement{font-size:clamp(1.7rem,3vw,2.25rem); line-height:1.3; letter-spacing:-.03em; font-weight:500; max-width:30em; text-wrap:pretty}
.hs-slot{display:inline-block; height:1em; width:1.9em; margin:0 .14em; vertical-align:-.12em; border-radius:.18em; overflow:hidden; background:var(--hs-tone)}
.hs-slot img{width:100%; height:100%; object-fit:cover; display:block}
.hs-measure-foot{margin-top:72px; margin-left:auto; max-width:30rem; display:flex; flex-direction:column; gap:1rem}
.hs-link{display:inline-flex; align-items:center; gap:.4rem; font-weight:600; color:var(--hs-accent); text-underline-offset:4px}
.hs-link:hover{text-decoration:underline}

/* the first step */
.hs-cta{background:var(--hs-accent); color:var(--primary-foreground); padding-block:clamp(80px,10vh,120px)}
.hs-cta-grid{display:grid; grid-template-columns:minmax(0,5fr) minmax(0,6fr); gap:clamp(32px,5vw,80px); align-items:end; min-height:min(90svh,820px)}
.hs-cta-copy h2{font-size:clamp(3.4rem,7vw,6.6rem); line-height:.92; letter-spacing:-.055em; font-weight:600}
.hs-cta-copy p{margin-top:1.4rem; font-size:1.08rem; line-height:1.55; max-width:34ch}
.hs-dialog{justify-self:end; width:min(100%,460px); background:var(--background); color:var(--hs-ink); border-radius:24px; padding:26px; box-shadow:0 30px 70px -30px rgba(0,0,0,.45); align-self:center} /* taste-skill-ignore: the product's own dialog (data-ui) */
.hs-dialog h3{font-size:1.25rem; font-weight:600; letter-spacing:-.02em}
.hs-seg{margin-top:1rem; display:grid; grid-template-columns:repeat(3,1fr); gap:4px; background:var(--hs-tone); border-radius:999px; padding:4px}
.hs-seg button{border:0; background:transparent; border-radius:999px; padding:.6rem .4rem; font:inherit; font-size:.92rem; font-weight:500; color:var(--hs-muted); cursor:pointer; transition:background-color 160ms ease, color 160ms ease; touch-action:manipulation}
.hs-seg button[aria-checked=true]{background:var(--background); color:var(--hs-ink)}
.hs-models{border:0; margin:1rem 0 0; padding:0; display:grid; gap:6px; max-height:260px; overflow:auto; overscroll-behavior:contain}
.hs-model{display:flex; gap:12px; align-items:flex-start; padding:12px 14px; border-radius:14px; background:var(--hs-tone); cursor:pointer; transition:background-color 140ms ease}
.hs-model:has(input:checked){background:var(--hs-tint)}
.hs-model input{margin-top:.25rem; accent-color:var(--hs-accent)}
.hs-model strong{display:block; font-weight:600; font-size:.98rem}
.hs-model span span{display:block; font-size:.88rem; color:var(--hs-muted); margin-top:.1rem}
.hs-go{margin-top:1.1rem; width:100%; display:flex; align-items:center; justify-content:center; gap:.5rem; min-height:52px; border:0; border-radius:999px; background:var(--hs-accent); color:var(--primary-foreground); font:inherit; font-weight:600; font-size:1rem; cursor:pointer; transition:transform 160ms var(--hs-ease), background-color 160ms ease; touch-action:manipulation}
.hs-go:hover{background:color-mix(in oklab, var(--hs-accent) 88%, black)}
.hs-go:active{transform:scale(.97)}
.hs-cta + *{margin-top:0}

@media (max-width:860px){
  .hs-how-head{grid-template-columns:1fr}
  .hs-how-head .hs-body{justify-self:start}
  .hs-how-steps{grid-template-columns:1fr; gap:22px}
  .hs-hist-grid{grid-template-columns:1fr; min-height:0}
  .hs-hist-plate{border-top-left-radius:96px}
  .hs-cells{grid-template-columns:1fr}
  .hs-cell{min-height:60px}
  .hs-measure-foot{margin-left:0; margin-top:40px}
  .hs-cta-grid{grid-template-columns:1fr; min-height:0; align-items:start}
  .hs-cta-copy h2{font-size:clamp(3rem,13vw,4.4rem)}
  .hs-dialog{justify-self:stretch; width:auto}
}
@media (prefers-reduced-motion:reduce){
  .hs *{animation:none !important}
  .hs-in,.hs-dot{transition:none !important}
  .hs section .hs-in{opacity:1 !important; transform:none !important}
  .hs-dot{transform:none !important}
}
`;

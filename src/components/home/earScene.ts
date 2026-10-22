import type * as T from "three";
import { PART_COLOR } from "./earColors";

/**
 * The 3D ear behind the homepage hero.
 *
 * Imperative three.js, loaded on the client only (three is dynamically
 * imported so SSR never touches WebGL). React owns the copy, the panel and
 * the part tags; this module owns geometry, the per-part experiments, picking
 * and the camera, and reports where each tag should sit every frame.
 *
 * World units are roughly centimetres: the outer ear sits at -x, the
 * auditory nerve leaves at +x, +z faces the viewer.
 */

export type PartId =
  | "outer"
  | "canal"
  | "drum"
  | "ossicles"
  | "cochlea"
  | "nerve"
  | "vestibular"
  | "eustachian";
export type AnchorId = PartId | "danger";
export type Anchor = { x: number; y: number; visible: boolean };

/** Everything the panel's experiments can change. */
export type EarState = {
  /** where the sound comes from, for the outer-ear experiment */
  source: "front" | "above" | "behind";
  /** earbud sealed in the canal */
  bud: boolean;
  /** pressure behind the eardrum, -1 (pulled in) .. 1 (pushed out) */
  pressure: number;
  /** ossicular chain stiffened */
  stiff: boolean;
  /** place of the current note on the cochlea, 0 = base .. 1 = apex */
  peak: number;
  /** current note falls in the 4–6 kHz band */
  danger: boolean;
  /** waves in flight and their size, from the note's pitch */
  waves: number;
  amp: number;
  /** permanent marks: once true they never go back */
  noiseDamage: boolean;
  synapseLoss: boolean;
};

export type EarSceneOptions = {
  reduced: boolean;
  onHover: (id: PartId | null) => void;
  onSelect: (id: PartId) => void;
  /** tag positions in CSS pixels relative to the host, plus the wave's arrival phase 0..1 */
  onFrame: (anchors: Record<AnchorId, Anchor>, arrival: number) => void;
};

export type EarScene = {
  setState: (s: EarState) => void;
  setShown: (hovered: PartId | null, selected: PartId | null) => void;
  /** one-shot actions from the panel */
  pulse: (kind: "turn" | "swallow" | "strike") => void;
  /** the 4–6 kHz band, as places on the cochlea (0 = base) */
  setDangerBand: (t0: number, t1: number) => void;
  /** move the subject right by `shift` of the stage width; `zoom` > 1 pulls the home view back */
  setFrame: (shift: number, zoom: number) => void;
  dispose: () => void;
};

const hex = (c: string) => parseInt(c.slice(1), 16);
const COLOR = {
  outer: hex(PART_COLOR.outer),
  outerDeep: 0xf07f5c,
  canal: hex(PART_COLOR.canal),
  drum: hex(PART_COLOR.drum),
  bone: hex(PART_COLOR.ossicles),
  stiff: 0xa3abb8,
  cochlea: hex(PART_COLOR.cochlea),
  nerve: hex(PART_COLOR.nerve),
  nerveSoft: 0xfcc96b,
  vest: hex(PART_COLOR.vestibular),
  vestDeep: 0x2f4fd8,
  tube: hex(PART_COLOR.eustachian),
  tubeOpen: 0xc9f2d9,
  red: 0xe5484d,
  redSoft: 0xf3a1a3,
  ink: 0xffffff,
  wave: 0x0e6e7d,
};

const MAX_WAVES = 13;
const TRAVEL_DOTS = 26;
const NERVE_DOTS = 18;

export async function createEarScene(host: HTMLElement, opts: EarSceneOptions): Promise<EarScene> {
  const [THREE, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/controls/OrbitControls.js"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
  ]);
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  /* ---------------------------------------------------------------- *
   * renderer, camera, controls
   * ---------------------------------------------------------------- */

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = "am-canvas";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const HOME_TARGET = V(0.15, -0.55, 0);
  const HOME_DIR = V(0.1, 0.14, 1).normalize();
  let homeDist = 12.5;
  let frameShift = 0;
  let frameShiftNow = 0;
  let frameZoom = 1;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.65;
  controls.minPolarAngle = Math.PI * 0.18;
  controls.maxPolarAngle = Math.PI * 0.82;
  controls.target.copy(HOME_TARGET);
  camera.position.copy(HOME_TARGET).addScaledVector(HOME_DIR, homeDist);
  // vertical swipes keep scrolling the page on phones; sideways ones turn the ear
  canvas.style.touchAction = "pan-y";

  // a soft studio room for reflections, one key light for the ground shadow
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe9ec, 1.5));
  // a soft rim from behind keeps the silhouette crisp on the pale stage
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(2, 3, -8);
  scene.add(rim);
  // a soft light from the viewer's side keeps colours clean on surfaces facing us
  const front = new THREE.DirectionalLight(0xffffff, 0.9);
  front.position.set(1, 1, 10);
  scene.add(front);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  scene.add(key);

  const groundMat = new THREE.ShadowMaterial({ color: 0x0b3a40, opacity: 0.14 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.75;
  ground.receiveShadow = true;
  scene.add(ground);

  const ear = new THREE.Group();
  scene.add(ear);

  /* ---------------------------------------------------------------- *
   * parts registry and helpers
   * ---------------------------------------------------------------- */

  type MatRec = { m: T.MeshPhysicalMaterial; opacity: number; emissive: number };
  type PartRec = {
    group: T.Group;
    mats: MatRec[];
    vis: number;
    glow: number;
    center: T.Vector3;
    radius: number;
    view: T.Vector3;
  };
  const parts = {} as Record<PartId, PartRec>;
  const pickables: T.Object3D[] = [];
  const disposables: { dispose: () => void }[] = [];

  const part = (id: PartId, view: T.Vector3) => {
    const group = new THREE.Group();
    group.name = id;
    ear.add(group);
    parts[id] = { group, mats: [], vis: 1, glow: 0, center: V(0, 0, 0), radius: 1, view: view.normalize() };
    return group;
  };

  const material = (
    id: PartId,
    color: number,
    opacity = 1,
    extra: Partial<T.MeshPhysicalMaterialParameters> = {},
  ) => {
    // glossy, slightly soft plastic: the premium-render look
    const m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.48,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.35,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0,
      transparent: true,
      opacity,
      depthWrite: opacity > 0.9,
      ...extra,
    });
    parts[id].mats.push({ m, opacity, emissive: m.emissiveIntensity });
    disposables.push(m);
    return m;
  };

  const mesh = (id: PartId, geo: T.BufferGeometry, mat: T.Material, pick = true) => {
    const o = new THREE.Mesh(geo, mat);
    o.userData["part"] = id;
    o.castShadow = mat !== hitMat;
    parts[id].group.add(o);
    if (pick) pickables.push(o);
    disposables.push(geo);
    return o;
  };

  /** a hit area that is raycast but never drawn */
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
  disposables.push(hitMat);
  const hit = (id: PartId, geo: T.BufferGeometry, at: T.Vector3) => {
    const o = mesh(id, geo, hitMat);
    o.position.copy(at);
    return o;
  };

  /** a tube whose radius follows r(u) along the curve, with rounded ends */
  const taper = (curve: T.Curve<T.Vector3>, segs: number, radial: number, r: (u: number) => number, caps = true) => {
    const frames = curve.computeFrenetFrames(segs, false);
    const pos: number[] = [];
    const nor: number[] = [];
    const idx: number[] = [];
    const p = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      curve.getPointAt(u, p);
      const N = frames.normals[i]!;
      const B = frames.binormals[i]!;
      const rad = r(u);
      for (let j = 0; j <= radial; j++) {
        const v = (j / radial) * Math.PI * 2;
        n.set(0, 0, 0).addScaledVector(N, Math.cos(v)).addScaledVector(B, Math.sin(v)).normalize();
        pos.push(p.x + n.x * rad, p.y + n.y * rad, p.z + n.z * rad);
        nor.push(n.x, n.y, n.z);
      }
    }
    for (let i = 1; i <= segs; i++) {
      for (let j = 1; j <= radial; j++) {
        const a = (radial + 1) * (i - 1) + (j - 1);
        const b = (radial + 1) * i + (j - 1);
        const c = (radial + 1) * i + j;
        const d = (radial + 1) * (i - 1) + j;
        idx.push(a, b, d, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setIndex(idx);
    if (!caps) return geo;
    // round the ends with half-spheres folded into the same geometry
    const ends = [0, 1].map((u) => {
      const s = new THREE.SphereGeometry(r(u), radial, 8);
      const at = curve.getPointAt(u);
      s.translate(at.x, at.y, at.z);
      return s;
    });
    const merged = mergeGeometries([geo, ...ends]);
    geo.dispose();
    ends.forEach((e) => e.dispose());
    return merged;
  };

  function mergeGeometries(list: T.BufferGeometry[]) {
    const pos: number[] = [];
    const nor: number[] = [];
    const idx: number[] = [];
    let offset = 0;
    for (const g of list) {
      const gi = g.index ? g : g.toNonIndexed();
      const P = gi.getAttribute("position");
      const N = gi.getAttribute("normal");
      for (let i = 0; i < P.count; i++) {
        pos.push(P.getX(i), P.getY(i), P.getZ(i));
        nor.push(N.getX(i), N.getY(i), N.getZ(i));
      }
      if (gi.index) for (let i = 0; i < gi.index.count; i++) idx.push(gi.index.getX(i) + offset);
      else for (let i = 0; i < P.count; i++) idx.push(i + offset);
      offset += P.count;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    out.setIndex(idx);
    return out;
  }

  /** a capsule running from a to b */
  const rod = (a: T.Vector3, b: T.Vector3, r: number) => {
    const len = a.distanceTo(b);
    const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 12);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
    g.applyQuaternion(q);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    g.translate(mid.x, mid.y, mid.z);
    return g;
  };

  const curve = (pts: [number, number, number][]) => new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => V(x, y, z)));

  /* ---------------------------------------------------------------- *
   * outer ear
   * ---------------------------------------------------------------- */

  part("outer", V(-1, 0.25, 0.75));
  const pinna = new THREE.Group();
  pinna.position.set(-2.75, 0.2, 0.15);
  pinna.rotation.set(0.04, -0.58, 0.07);
  parts.outer.group.add(pinna);

  const helixPts: [number, number, number][] = [
    [0.32, 0.4, 0.06], [0.5, 0.98, 0.02], [0.22, 1.5, -0.02], [-0.35, 1.64, -0.06],
    [-0.86, 1.26, -0.1], [-1.08, 0.6, -0.12], [-1.05, -0.12, -0.1], [-0.82, -0.78, -0.06], [-0.48, -1.26, -0.02],
  ];
  const skin = material("outer", COLOR.outer);
  const skinSoft = material("outer", COLOR.outerDeep, 1, { side: THREE.DoubleSide });
  const addPinna = (geo: T.BufferGeometry, m: T.Material) => {
    const o = mesh("outer", geo, m);
    parts.outer.group.remove(o);
    pinna.add(o);
    return o;
  };
  addPinna(taper(curve(helixPts), 140, 16, (u) => 0.08 + 0.09 * Math.sin(Math.PI * Math.min(1, u * 1.15))), skin);
  addPinna(
    taper(curve([[-0.05, -0.78, 0.02], [-0.5, -0.28, 0.05], [-0.64, 0.34, 0.05], [-0.44, 0.9, 0.02], [-0.04, 1.14, 0]]), 90, 12, (u) => 0.05 + 0.04 * Math.sin(Math.PI * u)),
    skin,
  );
  addPinna(taper(curve([[-0.6, 0.42, 0.04], [-0.22, 0.72, 0.03], [0.16, 0.76, 0.02]]), 40, 10, (u) => 0.035 + 0.025 * Math.sin(Math.PI * u)), skin);

  // the cartilage plate the ridges sit on
  const outline = [
    ...helixPts.map(([x, y]) => new THREE.Vector2(x, y)),
    new THREE.Vector2(-0.3, -1.66), new THREE.Vector2(0.1, -1.6), new THREE.Vector2(0.34, -1.06),
    new THREE.Vector2(0.52, -0.48), new THREE.Vector2(0.5, 0.08),
  ];
  const shape = new THREE.Shape(new THREE.SplineCurve([...outline, outline[0]!]).getPoints(90));
  const plate = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 4, curveSegments: 24 });
  plate.translate(0, 0, -0.16);
  addPinna(plate, skinSoft);

  const lobe = new THREE.SphereGeometry(0.4, 28, 18);
  lobe.scale(1, 1.08, 0.42);
  lobe.translate(-0.12, -1.38, -0.08);
  addPinna(lobe, skin);
  const concha = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  concha.rotateX(-Math.PI / 2);
  concha.scale(1, 1.18, 0.62);
  concha.translate(0.02, -0.12, -0.04);
  addPinna(concha, material("outer", COLOR.outerDeep, 1, { side: THREE.DoubleSide }));
  const tragus = new THREE.SphereGeometry(0.14, 18, 12);
  tragus.scale(0.8, 1.25, 0.7);
  tragus.translate(0.52, -0.2, 0.08);
  addPinna(tragus, skin);

  /* ---------------------------------------------------------------- *
   * canal, eardrum
   * ---------------------------------------------------------------- */

  ear.updateMatrixWorld(true);
  const conchaAt = pinna.localToWorld(V(0.04, -0.12, -0.24));
  const drumAt = V(-0.95, -0.04, -0.12);

  part("canal", V(-0.3, 0.6, 1));
  const canalCurve = new THREE.CatmullRomCurve3([
    conchaAt.clone(),
    V(-2.05, 0.1, -0.1),
    V(-1.45, 0.02, -0.14),
    drumAt.clone().add(V(-0.05, 0, 0)),
  ]);
  mesh("canal", taper(canalCurve, 60, 20, (u) => 0.22 - 0.05 * u, false), material("canal", COLOR.canal, 0.55, { side: THREE.DoubleSide }));
  hit("canal", taper(canalCurve, 20, 8, () => 0.3, false), V(0, 0, 0));

  // the earbud the canal experiment pushes in
  const bud = new THREE.Group();
  const budMat = material("canal", COLOR.ink, 0);
  const budStem = mesh("canal", rod(V(-0.55, 0, 0), V(0.05, 0, 0), 0.2), budMat, false);
  const budTip = mesh("canal", new THREE.SphereGeometry(0.21, 20, 14), budMat, false);
  budTip.position.set(0.12, 0, 0);
  parts.canal.group.remove(budStem, budTip);
  bud.add(budStem, budTip);
  parts.canal.group.add(bud);
  const budIn = canalCurve.getPointAt(0.18);
  const budOut = conchaAt.clone().add(V(-1.6, 0.1, 0.9));
  bud.position.copy(budOut);
  bud.lookAt(canalCurve.getPointAt(0.5));
  bud.rotateY(-Math.PI / 2);

  part("drum", V(-0.4, 0.2, 1));
  const drum = new THREE.Group();
  drum.position.copy(drumAt);
  drum.rotation.set(0, 0.32, -0.22);
  parts.drum.group.add(drum);
  const drumGeo = new THREE.SphereGeometry(0.29, 40, 12, 0, Math.PI * 2, 0, 0.55);
  drumGeo.rotateZ(Math.PI / 2);
  drumGeo.translate(0.25, 0, 0);
  const drumMesh = mesh("drum", drumGeo, material("drum", COLOR.drum, 1, { side: THREE.DoubleSide }));
  parts.drum.group.remove(drumMesh);
  drum.add(drumMesh);
  const drumHit = hit("drum", new THREE.SphereGeometry(0.34, 12, 8), V(0, 0, 0));
  parts.drum.group.remove(drumHit);
  drum.add(drumHit);

  /* ---------------------------------------------------------------- *
   * ossicles
   * ---------------------------------------------------------------- */

  part("ossicles", V(0.1, 0.5, 1));
  const ossMat = material("ossicles", COLOR.bone, 1, { roughness: 0.55 });
  const ossicles = new THREE.Group();
  parts.ossicles.group.add(ossicles);
  const ossGeos = [
    rod(V(-0.92, -0.02, -0.12), V(-0.78, 0.34, -0.12), 0.05),
    (() => { const g = new THREE.SphereGeometry(0.12, 20, 14); g.translate(-0.74, 0.42, -0.12); return g; })(),
    (() => { const g = new THREE.SphereGeometry(0.1, 20, 14); g.translate(-0.56, 0.44, -0.1); return g; })(),
    rod(V(-0.56, 0.42, -0.1), V(-0.42, 0.08, -0.1), 0.04),
    rod(V(-0.41, 0.06, -0.1), V(-0.17, 0.13, -0.1), 0.03),
    rod(V(-0.41, 0.06, -0.1), V(-0.17, -0.06, -0.1), 0.03),
    (() => { const g = new THREE.BoxGeometry(0.05, 0.27, 0.15); g.translate(-0.13, 0.03, -0.1); return g; })(),
  ];
  for (const g of ossGeos) {
    const o = mesh("ossicles", g, ossMat);
    parts.ossicles.group.remove(o);
    ossicles.add(o);
  }
  hit("ossicles", new THREE.SphereGeometry(0.36, 12, 8), V(-0.52, 0.2, -0.1));
  const ovalWindow = V(-0.08, 0.03, -0.1);

  /* ---------------------------------------------------------------- *
   * cochlea
   * ---------------------------------------------------------------- */

  part("cochlea", V(0.2, -0.1, 1));
  const C = V(0.68, -0.28, -0.12);
  const startOff = ovalWindow.clone().sub(C);
  const a0 = Math.atan2(startOff.y, startOff.x);
  const r0 = Math.hypot(startOff.x, startOff.y);
  const TURNS = 2.7;
  /** t = 0 at the base (high notes) .. 1 at the apex (low notes) */
  const spiral = (t: number, target = new THREE.Vector3()) => {
    const a = a0 - t * TURNS * Math.PI * 2;
    const r = r0 + (0.1 - r0) * Math.pow(t, 0.85);
    return target.set(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, C.z + t * 0.55);
  };
  class Spiral extends THREE.Curve<T.Vector3> {
    t0: number;
    t1: number;
    constructor(t0: number, t1: number) {
      super();
      this.t0 = t0;
      this.t1 = t1;
    }
    override getPoint(u: number, target = new THREE.Vector3()) {
      return spiral(this.t0 + (this.t1 - this.t0) * u, target);
    }
  }
  const tubeR = (t: number) => 0.17 - 0.11 * t;
  mesh("cochlea", taper(new Spiral(0, 1), 260, 16, tubeR), material("cochlea", COLOR.cochlea));

  // 4–6 kHz band, drawn as a collar over the tube; places come from React
  let dangerMesh: T.Mesh | null = null;
  const dangerMat = material("cochlea", COLOR.red, 0.55);
  const setDangerBand = (t0: number, t1: number) => {
    if (dangerMesh) parts.cochlea.group.remove(dangerMesh);
    dangerMesh = mesh("cochlea", taper(new Spiral(t0, t1), 40, 16, (u) => tubeR(t0 + (t1 - t0) * u) + 0.03, false), dangerMat, false);
    dangerMesh.renderOrder = 2;
  };

  // the scar left by the noise experiment: permanent, solid yellow
  const scarMat = material("cochlea", COLOR.red, 0);
  let scarMesh: T.Mesh | null = null;

  const peak = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  disposables.push(peak.geometry, peak.material as T.Material);
  parts.cochlea.group.add(peak);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.018, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }),
  );
  disposables.push(ring.geometry, ring.material as T.Material);
  parts.cochlea.group.add(ring);

  const dotGeo = new THREE.SphereGeometry(0.045, 10, 8);
  disposables.push(dotGeo);
  const travel = Array.from({ length: TRAVEL_DOTS }, () => {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    disposables.push(m);
    const o = new THREE.Mesh(dotGeo, m);
    parts.cochlea.group.add(o);
    return o;
  });

  /* ---------------------------------------------------------------- *
   * balance canals
   * ---------------------------------------------------------------- */

  part("vestibular", V(0.3, 0.7, 1));
  const vest = new THREE.Group();
  vest.position.set(0.42, 0.62, -0.25);
  parts.vestibular.group.add(vest);
  const vestMat = material("vestibular", COLOR.vest);
  const loops: [T.Vector3, T.Euler][] = [
    [V(-0.1, 0.32, 0), new THREE.Euler(0, Math.PI / 2, 0)],
    [V(0.3, 0.2, -0.15), new THREE.Euler(0, 0, 0)],
    [V(0.18, -0.06, 0.18), new THREE.Euler(Math.PI / 2, 0, 0)],
  ];
  const fluid: T.Mesh[] = [];
  const fluidMat = material("vestibular", COLOR.vestDeep, 0);
  for (const [at, rot] of loops) {
    const loop = new THREE.Group();
    loop.position.copy(at);
    loop.rotation.copy(rot);
    vest.add(loop);
    const o = mesh("vestibular", new THREE.TorusGeometry(0.3, 0.045, 12, 64), vestMat);
    parts.vestibular.group.remove(o);
    loop.add(o);
    const f = mesh("vestibular", new THREE.SphereGeometry(0.06, 12, 10), fluidMat, false);
    parts.vestibular.group.remove(f);
    loop.add(f);
    fluid.push(f);
  }
  const vestibule = mesh("vestibular", new THREE.SphereGeometry(0.2, 20, 14), vestMat);
  parts.vestibular.group.remove(vestibule);
  vest.add(vestibule);
  vestibule.position.set(-0.12, -0.3, 0.05);
  vestibule.scale.set(1, 0.8, 0.8);

  /* ---------------------------------------------------------------- *
   * nerve, eustachian tube
   * ---------------------------------------------------------------- */

  part("nerve", V(0.5, 0.2, 1));
  const nerveCurve = curve([[C.x, C.y, C.z + 0.25], [1.5, -0.12, -0.3], [2.4, 0.04, -0.55], [3.3, 0.26, -0.78]]);
  mesh("nerve", taper(nerveCurve, 80, 16, (u) => 0.17 - 0.05 * u), material("nerve", COLOR.nerve));
  mesh(
    "nerve",
    taper(curve([[0.3, 0.32, -0.2], [1.5, 0.4, -0.45], [3.2, 0.58, -0.82]]), 60, 10, () => 0.06),
    material("nerve", COLOR.nerveSoft),
  );
  const nerveDots = Array.from({ length: NERVE_DOTS }, (_, i) => {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    disposables.push(m);
    const o = new THREE.Mesh(dotGeo, m);
    o.scale.setScalar(1.5);
    o.position.copy(nerveCurve.getPointAt(i / (NERVE_DOTS - 1)));
    parts.nerve.group.add(o);
    return o;
  });
  const nerveScarMat = material("nerve", COLOR.red, 0);
  mesh("nerve", taper(nerveCurve, 40, 16, (u) => (u < 0.06 || u > 0.3 ? 0.0001 : 0.19)), nerveScarMat, false);

  part("eustachian", V(0.4, -0.5, 1));
  const tubeCurve = curve([[-0.55, -0.32, -0.05], [0.2, -1.0, 0.2], [1.2, -1.7, 0.45], [2.2, -2.25, 0.6]]);
  const tubeMat = material("eustachian", COLOR.tube);
  mesh("eustachian", taper(tubeCurve, 70, 14, (u) => 0.07 + 0.11 * u), tubeMat);
  const tubeOpenMat = material("eustachian", COLOR.tubeOpen, 0);
  mesh("eustachian", taper(tubeCurve, 70, 14, (u) => 0.1 + 0.14 * u), tubeOpenMat, false);

  /* ---------------------------------------------------------------- *
   * sound waves in from outside
   * ---------------------------------------------------------------- */

  const sourceAt = {
    front: V(-6.4, 0.35, 2.4),
    above: V(-4.6, 3.1, 1.2),
    behind: V(-5.6, 0.3, -2.6),
  };
  const waveGeo = new THREE.TorusGeometry(1, 0.012, 6, 80);
  disposables.push(waveGeo);
  const waves = Array.from({ length: MAX_WAVES }, () => {
    const m = new THREE.MeshBasicMaterial({ color: COLOR.wave, transparent: true, opacity: 0, depthWrite: false });
    disposables.push(m);
    const o = new THREE.Mesh(waveGeo, m);
    scene.add(o);
    return o;
  });
  let wavePath = new THREE.CatmullRomCurve3([sourceAt.front.clone(), conchaAt, canalCurve.getPointAt(0.5), drumAt]);

  /* ---------------------------------------------------------------- *
   * measure parts for the camera
   * ---------------------------------------------------------------- */

  ear.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const sphere = new THREE.Sphere();
  for (const id of Object.keys(parts) as PartId[]) {
    box.setFromObject(parts[id].group);
    box.getBoundingSphere(sphere);
    parts[id].center.copy(sphere.center);
    parts[id].radius = Math.max(0.55, sphere.radius);
  }

  // where each tag sits, in ear space
  const anchorLocal: Record<AnchorId, T.Vector3> = {
    outer: pinna.localToWorld(V(-0.4, 1.64, 0)),
    canal: canalCurve.getPointAt(0.45).add(V(0, 0.26, 0)),
    drum: drumAt.clone().add(V(0, -0.36, 0)),
    ossicles: V(-0.7, 0.58, -0.12),
    vestibular: V(0.75, 1.15, -0.25),
    cochlea: spiral(0.0).add(V(0.2, -0.75, 0)),
    nerve: nerveCurve.getPointAt(0.62).add(V(0, 0.24, 0)),
    eustachian: tubeCurve.getPointAt(0.6).add(V(0, -0.25, 0)),
    danger: V(0, 0, 0),
  };
  const anchors = Object.fromEntries(
    Object.keys(anchorLocal).map((k) => [k, { x: 0, y: 0, visible: false }]),
  ) as Record<AnchorId, Anchor>;

  /* ---------------------------------------------------------------- *
   * state from React
   * ---------------------------------------------------------------- */

  let state: EarState = {
    source: "front", bud: false, pressure: 0, stiff: false, peak: 0.4, danger: false,
    waves: 8, amp: 1, noiseDamage: false, synapseLoss: false,
  };
  let hovered: PartId | null = null;
  let selected: PartId | null = null;
  let turnAt = -10;
  let swallowAt = -10;
  let strikeAt = -10;
  let budT = 0;
  let pressureNow = 0;

  const placePeak = () => {
    spiral(state.peak, peak.position);
    ring.position.copy(peak.position);
    const tan = spiral(Math.min(1, state.peak + 0.01)).sub(spiral(Math.max(0, state.peak - 0.01))).normalize();
    ring.lookAt(peak.position.clone().add(tan));
    const end = Math.min(state.peak + 0.02, 1);
    travel.forEach((o, i) => spiral((i / (TRAVEL_DOTS - 1)) * end, o.position));
    anchorLocal.danger.copy(spiral(state.peak)).add(V(0.05, 0.32, 0.2));
  };

  /* ---------------------------------------------------------------- *
   * picking
   * ---------------------------------------------------------------- */

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (e: PointerEvent): PartId | null => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(pickables, false)[0];
    return h ? (h.object.userData["part"] as PartId) : null;
  };
  let lastHover: PartId | null = null;
  let down: { x: number; y: number } | null = null;
  let lastInput = -10;

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || e.buttons) return;
    const id = pick(e);
    canvas.style.cursor = id ? "pointer" : "grab";
    if (id !== lastHover) { lastHover = id; opts.onHover(id); }
  };
  const onLeave = () => { if (lastHover) { lastHover = null; opts.onHover(null); } };
  const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; lastInput = clock; };
  const onUp = (e: PointerEvent) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 6) return;
    const id = pick(e);
    if (id) opts.onSelect(id);
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  let dirGoal: T.Vector3 | null = null;
  const onStart = () => { dirGoal = null; lastInput = clock; };
  controls.addEventListener("start", onStart);

  /* ---------------------------------------------------------------- *
   * size
   * ---------------------------------------------------------------- */

  let w = 1;
  let h = 1;
  const resize = () => {
    w = Math.max(1, host.clientWidth);
    h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // keep the whole ear in frame on narrow, tall stages
    homeDist = 12.5 * Math.pow(Math.max(1, 1.45 / camera.aspect), 0.72);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  camera.position.copy(HOME_TARGET).addScaledVector(HOME_DIR, homeDist);

  /* ---------------------------------------------------------------- *
   * frame
   * ---------------------------------------------------------------- */

  const tmp = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const goal = new THREE.Vector3();
  const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  let clock = 0;

  const paint = (time: number, dt: number) => {
    const { waves: count, amp } = state;
    const shown = selected ?? hovered;

    // waves: a ring travelling from the source, through the canal, to the drum
    const speed = 0.3;
    const cycle = (time * speed) % 1;
    for (let i = 0; i < MAX_WAVES; i++) {
      const o = waves[i]!;
      const m = o.material as T.MeshBasicMaterial;
      if (i >= count) { m.opacity = 0; continue; }
      const t = (cycle + i / count) % 1;
      wavePath.getPointAt(t, o.position);
      wavePath.getTangentAt(t, tmp);
      o.lookAt(tmp.add(o.position));
      // a sealed canal stops the outside world from getting past the bud
      const blocked = budT > 0.5 && t > 0.42;
      const s = (1.5 - 1.3 * easeOut(t * 1.4)) * (0.75 + 0.25 * amp);
      o.scale.set(s, s, s);
      m.opacity = blocked ? 0 : Math.min(t * 5, 1) * (1 - t * 0.6) * 0.75 * (shown && shown !== "outer" && shown !== "canal" ? 0.35 : 1);
    }

    const arrival = (time * speed * count) % 1;
    const thump = (delay: number) => Math.exp(-(((arrival - delay + 1) % 1) * 5.5));
    const conduct = state.stiff ? 0.25 : 1;

    // earbud slides in or out
    budT += ((state.bud ? 1 : 0) - budT) * Math.min(1, dt * 7);
    bud.position.lerpVectors(budOut, budIn, easeOut(budT));
    budMat.opacity = Math.min(1, budT * 3) * parts.canal.vis;
    const budDrive = state.bud ? 1.35 : 1;

    // eardrum: pressure bows it, each wave pushes it
    const swallowing = clock - swallowAt < 1.4;
    if (swallowing) pressureNow += (0 - pressureNow) * Math.min(1, dt * 5);
    else pressureNow += (state.pressure - pressureNow) * Math.min(1, dt * 8);
    const stiffDrum = 1 - Math.abs(pressureNow) * 0.7;
    const strike = Math.exp(-Math.max(0, clock - strikeAt) * 4);
    drum.scale.x = 1 + pressureNow * 1.6 + 0.35 * amp * budDrive * stiffDrum * thump(0) + strike * 0.6;

    // ossicles rock with the drum; stiff bones barely move
    const rock = (0.08 * thump(0.07) * budDrive * stiffDrum + strike * 0.25) * conduct;
    ossicles.rotation.z = -rock * 0.6;
    ossicles.position.x = rock * 0.12;
    ossMat.color.setHex(state.stiff ? COLOR.stiff : COLOR.bone);

    // travelling wave along the cochlea to its place
    const prog = ((arrival + 0.86) % 1) * 1.15;
    travel.forEach((o, i) => {
      const u = i / (TRAVEL_DOTS - 1);
      const k = Math.exp(-Math.pow((u - prog) * 6, 2));
      (o.material as T.MeshBasicMaterial).opacity = 0.95 * k * conduct * parts.cochlea.vis;
      o.scale.setScalar(0.6 + 0.8 * k);
    });
    const hitPeak = thump(0.3) * conduct;
    peak.scale.setScalar(0.8 + 0.9 * hitPeak);
    ring.scale.setScalar(0.7 + 1.1 * hitPeak);
    (ring.material as T.MeshBasicMaterial).opacity = (0.25 + 0.7 * hitPeak) * parts.cochlea.vis;
    (peak.material as T.MeshBasicMaterial).opacity = parts.cochlea.vis;
    (peak.material as T.MeshBasicMaterial).transparent = true;
    dangerMat.color.setHex(state.danger ? COLOR.red : COLOR.redSoft);
    dangerMat.opacity = (state.danger ? 0.95 : 0.5) * parts.cochlea.vis;
    scarMat.opacity = (state.noiseDamage ? 1 : 0) * parts.cochlea.vis;

    // nerve: pulses toward the brain; lost synapses drop most of them
    const nprog = (arrival + 0.55) % 1;
    nerveDots.forEach((o, i) => {
      const u = i / (NERVE_DOTS - 1);
      const lost = state.synapseLoss && i % 3 !== 0;
      const k = Math.exp(-Math.pow((u - nprog) * 5, 2));
      (o.material as T.MeshBasicMaterial).opacity = lost ? 0 : 0.9 * k * conduct * parts.nerve.vis;
    });
    nerveScarMat.opacity = (state.synapseLoss ? 1 : 0) * parts.nerve.vis;

    // balance canals: a head turn leaves the fluid behind, then it catches up
    const sinceTurn = clock - turnAt;
    const turning = sinceTurn < 2.2;
    const lag = turning ? Math.sin(Math.min(1, sinceTurn / 2.2) * Math.PI) : 0;
    fluid.forEach((f, i) => {
      const a = -lag * 1.6 * (1 - i * 0.25) + i * 2.1;
      f.position.set(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0);
    });
    fluidMat.opacity = (turning ? 1 : 0.85) * parts.vestibular.vis;

    // eustachian tube: a swallow flicks it open
    const open = swallowing ? Math.sin(Math.min(1, (clock - swallowAt) / 1.4) * Math.PI) : 0;
    tubeOpenMat.opacity = open * 0.85 * parts.eustachian.vis;

    // highlight and dim
    for (const id of Object.keys(parts) as PartId[]) {
      const p = parts[id];
      const lit = id === hovered || id === selected;
      const vGoal = shown ? (lit ? 1 : 0.16) : 1;
      p.vis += (vGoal - p.vis) * Math.min(1, dt * 9);
      p.glow += ((lit ? 1 : 0) - p.glow) * Math.min(1, dt * 12);
      for (const r of p.mats) {
        if (r.m === budMat || r.m === scarMat || r.m === dangerMat || r.m === nerveScarMat || r.m === fluidMat || r.m === tubeOpenMat) continue;
        r.m.opacity = r.opacity * p.vis;
        r.m.depthWrite = r.opacity > 0.9 && p.vis > 0.9;
        r.m.emissiveIntensity = r.emissive + p.glow * 0.16;
      }
    }

    // idle sway when nobody is handling it
    const idle = !selected && clock - lastInput > 4;
    const swayGoal = idle && !opts.reduced ? Math.sin(time * 0.32) * 0.22 : ear.rotation.y;
    ear.rotation.y += (swayGoal - ear.rotation.y) * Math.min(1, dt * 1.5);
    // a turn spins the whole head a little
    ear.rotation.x = turning && !opts.reduced ? Math.sin(Math.min(1, sinceTurn / 1.1) * Math.PI) * 0.08 : 0;
    const spin = turning && !opts.reduced ? Math.sin(Math.min(1, sinceTurn / 1.1) * Math.PI) * 0.5 : 0;
    ear.rotation.z = spin * 0.05;
    ear.updateMatrixWorld();

    // camera: fly to the selected part, back home when nothing is open
    const sel = selected ? parts[selected] : null;
    if (sel) goal.copy(sel.center).applyMatrix4(ear.matrixWorld);
    else goal.copy(HOME_TARGET);
    const k = Math.min(1, dt * 3.2);
    offset.copy(camera.position).sub(controls.target);
    controls.target.lerp(goal, k);
    const distGoal = sel ? Math.max(3.2, (sel.radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.35) * Math.pow(Math.max(1, 1.2 / camera.aspect), 0.7) : homeDist * frameZoom;
    const len = offset.length();
    if (dirGoal) {
      offset.normalize().lerp(dirGoal, k * 0.8).normalize();
      if (offset.angleTo(dirGoal) < 0.01) dirGoal = null;
    } else offset.normalize();
    offset.multiplyScalar(len + (distGoal - len) * k);
    camera.position.copy(controls.target).add(offset);
    controls.update();

    frameShiftNow += (frameShift - frameShiftNow) * k;
    if (Math.abs(frameShiftNow) > 1e-4) camera.setViewOffset(w, h, -frameShiftNow * w, 0, w, h);
    else if (camera.view?.enabled) camera.clearViewOffset();

    renderer.render(scene, camera);

    // tags
    for (const id of Object.keys(anchorLocal) as AnchorId[]) {
      tmp.copy(anchorLocal[id]).applyMatrix4(ear.matrixWorld).project(camera);
      const a = anchors[id];
      a.x = ((tmp.x + 1) / 2) * w;
      a.y = ((1 - tmp.y) / 2) * h;
      a.visible = tmp.z < 1 && tmp.x > -1.05 && tmp.x < 1.05 && tmp.y > -1.05 && tmp.y < 1.05;
    }
    opts.onFrame(anchors, arrival);
  };

  /* ---------------------------------------------------------------- *
   * loop: an accumulated clock so pausing never lurches forward
   * ---------------------------------------------------------------- */

  let raf = 0;
  let last = performance.now();
  let onScreen = true;
  const loop = (now: number) => {
    // rAF can report a timestamp slightly before the last performance.now()
    const dt = Math.min(Math.max(0, now - last), 50) / 1000;
    last = now;
    clock += dt;
    paint(opts.reduced ? 0.4 : clock, dt);
    raf = requestAnimationFrame(loop);
  };
  const play = () => {
    if (raf || !onScreen || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const pause = () => { cancelAnimationFrame(raf); raf = 0; };
  const onVis = () => (document.hidden ? pause() : play());
  document.addEventListener("visibilitychange", onVis);
  const io = new IntersectionObserver((e) => {
    onScreen = !!e[0]?.isIntersecting;
    if (onScreen) play();
    else pause();
  });
  io.observe(host);
  play();

  return {
    setState(s) {
      const prev = state;
      state = s;
      placePeak();
      if (s.source !== prev.source) {
        wavePath = new THREE.CatmullRomCurve3([sourceAt[s.source].clone(), conchaAt, canalCurve.getPointAt(0.5), drumAt]);
      }
      if (s.noiseDamage && !scarMesh) {
        // the stretch noise kills first, nearest the entrance
        scarMesh = mesh("cochlea", taper(new Spiral(0.02, 0.24), 60, 16, (u) => tubeR(0.02 + 0.22 * u) + 0.035, false), scarMat, false);
      }
    },
    setShown(h, s) {
      hovered = h;
      if (s !== selected) {
        selected = s;
        dirGoal = s ? parts[s].view.clone() : HOME_DIR.clone();
        lastInput = clock;
      }
    },
    pulse(kind) {
      if (kind === "turn") turnAt = clock;
      if (kind === "swallow") swallowAt = clock;
      if (kind === "strike") strikeAt = clock;
    },
    setDangerBand,
    setFrame(shift, zoom) {
      frameShift = shift;
      frameZoom = zoom;
    },
    dispose() {
      pause();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      controls.removeEventListener("start", onStart);
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      envTex.dispose();
      pmrem.dispose();
      ground.geometry.dispose();
      groundMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

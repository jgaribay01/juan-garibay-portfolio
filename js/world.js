/**
 * pitwall — the world, and the audit that fills it.
 *
 * Two layers share one camera: a WebGL corridor drawn analytically in a
 * fragment shader, and a CSS 3D scene of panels holding the real screenshots.
 * They agree about distance because the shader's field of view is derived from
 * the same `perspective` value the stylesheet uses. A shader and a stylesheet
 * that disagree by ten percent read as panels sliding across a picture instead
 * of standing in a place.
 *
 * There is no footage and there are no crossfades, so there are no seams. The
 * eight worldflight legs are a timing spine only: they own scroll, publish the
 * waypoint, and never draw anything.
 *
 * THE AUDIT
 *
 * Nothing in index.html states a measured figure. Every one of them is summed
 * here out of assets/evidence.json while the camera is inside the bay, from
 * rows the reader can download and add up themselves. That is what "provably
 * live" means on this page, and it is worth being exact about what it does not
 * mean: these repositories are private, so the page is not querying GitHub. It
 * is doing the arithmetic in front of you on evidence it ships.
 */
import { SYSTEMS, MONEY, CONTACT, EVIDENCE_PAGE } from './content.js';

const root = document.querySelector('[data-sc-mode="worldflight"]');
const scene = document.querySelector('.scene');
const cam = document.getElementById('cam');
const canvas = document.getElementById('corridor');
const scrim = document.querySelector('.scrim');

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Leg table. The weights are the ones in the markup; duplicating them is not a
   second copy of a fact, it is the same authored number the engine reads, and
   `assertLegs` below fails loudly if the two ever disagree. */
const LEGS = [
  { key: 'arrival',   w: 1.1, label: 'Arrival',        anchor: 'lead'   },
  { key: 'rutero',    w: 1.5, label: 'Rutero TDV',     anchor: 'trail', id: 'rutero-tdv' },
  { key: 'cotizador', w: 1.1, label: 'Cotizador TDV',  anchor: 'lead',  id: 'cotizador-tdv' },
  { key: 'ff',        w: 1.2, label: 'Farmers Fresh',  anchor: 'trail', id: 'cotizador-farmers-fresh' },
  { key: 'dtc',       w: 1.1, label: 'Data Triage',    anchor: 'lead',  id: 'data-triage-center' },
  { key: 'outbound',  w: 1.1, label: 'Outbound Log',   anchor: 'trail', id: 'tdv-outbound-log' },
  { key: 'currents',  w: 1.3, label: 'Currents',       anchor: 'lead',  id: 'currents' },
  { key: 'dark',      w: 0.8, label: 'Dark stretch',   anchor: 'center' },
  { key: 'ledger',    w: 2.6, label: 'The ledger',     anchor: 'lead'   },
  { key: 'end',       w: 1.0, label: 'End wall',       anchor: 'center' },
];

/** World px travelled per viewport-height of scroll. One pace, everywhere:
    a leg is longer because its bay is longer, never because the camera speeds
    up. See worldflight.md §7c. */
const PX_PER_VH = 1250;
const PERSPECTIVE = 1000;
const HW = 900, HH = 560;           // corridor half-extents, world px

let total = 0;
LEGS.forEach((l, i) => { l.i = i; l.c0 = total; total += l.w; l.c1 = total; l.mid = (l.c0 + l.c1) / 2; });
/* Legs are addressed by name, never by index. The ledger moved from position 6
   to position 8 when the paired legs were split, and every `k === 6` in the
   frame loop would have kept pointing at the wrong place. */
const AT = Object.fromEntries(LEGS.map((l, i) => [l.key, i]));
const END_Z = total * PX_PER_VH + 620;

function assertLegs() {
  const authored = [...root.querySelectorAll('[data-sc-segment]')]
    .map((s) => parseFloat(s.getAttribute('data-sc-w')));
  const same = authored.length === LEGS.length && authored.every((w, i) => w === LEGS[i].w);
  if (!same) console.error('[pitwall] leg weights in world.js do not match the markup', authored, LEGS.map((l) => l.w));
  return same;
}

/* ------------------------------------------------------------------ data */

const fmt = (n) => (n === null || n === undefined ? '—' : n.toLocaleString('en-US'));
const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');

let EV = null;
const byId = new Map();

/** Top areas, with the tail folded into one row so the rows still sum exactly. */
function auditRows(repo, keep = 7) {
  const areas = repo.byArea || [];
  if (areas.length <= keep) return areas.map((a) => ({ ...a }));
  const head = areas.slice(0, keep).map((a) => ({ ...a }));
  const tail = areas.slice(keep);
  head.push({
    area: `${tail.length} more`,
    files: tail.reduce((s, a) => s + a.files, 0),
    lines: tail.reduce((s, a) => s + a.lines, 0),
    code: tail.reduce((s, a) => s + a.code, 0),
  });
  return head;
}

/* ---------------------------------------------------------------- the map */

function buildMap() {
  const ol = document.getElementById('map-legs');
  ol.innerHTML = '';
  LEGS.forEach((leg, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'map__leg';
    b.dataset.leg = String(i);
    b.setAttribute('aria-current', String(i === 0));
    // One child only. The ::before is itself a grid item, so appending a
    // second span put the label in the 14px marker column and wrapped it to
    // three lines.
    const label = document.createElement('span');
    label.textContent = leg.label;
    b.append(label);
    b.addEventListener('click', () => {
      scrollTo({ top: trackTop() + leg.c0 * innerHeight + 4, behavior: reduce ? 'auto' : 'smooth' });
    });
    li.append(b);
    ol.append(li);
  });
}

function trackTop() {
  return root.getBoundingClientRect().top + scrollY;
}

/* --------------------------------------------------------------- the bays */

/**
 * Where a panel stands inside its leg.
 *
 * 0.94, not the midpoint. A bay at the midpoint is reached and passed exactly
 * while its copy is ramping up, so by the time the description was legible the
 * thing it described had gone behind the reader: at 16% the copy read "Rutero
 * TDV" and the screen held the two quoting tools. Here the panel approaches
 * through the whole plateau and only passes while the copy is ramping out.
 */
const PANEL_AT = 0.94;
/** Lateral standoff, on the opposite side from the copy. */
const PANEL_X = 620;

const SHAPE = {
  'rutero-tdv':              { w: 820, h: 512 },
  'cotizador-tdv':           { w: 760, h: 474 },
  'cotizador-farmers-fresh': { w: 620, h: 474 },
  'data-triage-center':      { w: 780, h: 487 },
  'tdv-outbound-log':        { w: 720, h: 450 },
  currents:                  { w: 285, h: 613 },
};

const bayEls = [];

function buildBays() {
  LEGS.filter((leg) => leg.id).forEach((leg) => {
    const sys = SYSTEMS[leg.id];
    const repo = byId.get(leg.id);
    const shape = SHAPE[leg.id];
    if (!sys || !shape) return;

    const z = (leg.c0 + leg.w * PANEL_AT) * PX_PER_VH;
    const side = leg.anchor === 'lead' ? 1 : -1;   // opposite the copy
    const rot = -side * 28;

    const el = document.createElement('div');
    el.className = 'bay';
    el.dataset.z = String(z);

    const panel = document.createElement('div');
    panel.className = 'bay__panel';
    panel.style.cssText =
      `width:${shape.w}px;height:${shape.h}px;left:${-shape.w / 2}px;top:${-shape.h / 2}px;` +
      `transform:rotateY(${rot}deg)`;
    const img = document.createElement('img');
    img.src = sys.shot; img.alt = ''; img.width = sys.shotW; img.height = sys.shotH;
    img.loading = 'lazy'; img.decoding = 'async';
    panel.append(img);
    el.append(panel);

    // Gauges: bar heights taken from the same rows the readout sums. Shapes,
    // not text, so nothing is baked into a picture.
    if (repo) {
      const rows = auditRows(repo, 7);
      const max = Math.max(...rows.map((r) => r.lines), 1);
      const g = document.createElement('div');
      g.className = 'bay__gauge';
      g.style.cssText =
        `left:${-shape.w / 2}px;top:${shape.h / 2 + 26}px;height:170px;` +
        `transform:rotateY(${rot}deg);transform-origin:0 0`;
      rows.forEach((r) => {
        const bar = document.createElement('i');
        bar.className = 'bay__bar';
        bar.style.height = Math.max(3, (r.lines / max) * 170) + 'px';
        g.append(bar);
      });
      el.append(g);
    }

    el.style.transform = `translate3d(${side * PANEL_X}px, ${side > 0 ? -40 : 60}px, ${-z}px)`;
    cam.append(el);
    bayEls.push({ el, z });
  });

  // Struts down the whole corridor. They are what makes the travel legible:
  // without something passing at a fixed interval, a fly-through has no speed.
  for (let z = 600; z < END_Z; z += 700) {
    const side = (z / 700) % 2 < 1 ? -1 : 1;
    const s = document.createElement('div');
    s.className = 'bay';
    s.dataset.z = String(z);
    const bar = document.createElement('div');
    bar.className = 'bay__strut';
    bar.style.cssText = `width:5px;height:${HH * 1.9}px;left:${side * (HW - 22)}px;top:${-HH * 0.95}px`;
    s.append(bar);
    s.style.transform = `translate3d(0,0,${-z}px)`;
    cam.append(s);
    bayEls.push({ el: s, z, strut: true });
  }
}

/* ------------------------------------------------------------- the shader */

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision highp float;
uniform vec2  uRes;
uniform float uCam, uTan, uEnd, uDim, uOpen, uVP, uSurge;
uniform vec2  uSway;
uniform vec3  uAccent, uCanvas;

const float HW = ${HW}.0;
const float HH = ${HH}.0;
const float GAP = 300.0;      // gantry spacing
const float TH  = 26.0;       // gantry thickness

// Antialiased line. Width is in screen derivatives, so it holds at every depth.
float rib(float v, float period, float w) {
  float f = abs(fract(v / period - 0.5) - 0.5) * period;
  float d = fwidth(v) * w;
  return 1.0 - smoothstep(0.0, max(d, 0.0001), f);
}

// Antialiased band: 1 inside [a,b], feathered by the local derivative.
float band(float v, float a, float b) {
  float d = fwidth(v);
  return smoothstep(a - d, a + d, v) * (1.0 - smoothstep(b - d, b + d, v));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * uRes.y);
  // The vanishing point does not sit at the centre of the frame. It travels to
  // the side the copy is NOT on, so the deepest part of the corridor is never
  // behind a block of text. uVP is a fraction of viewport width and the
  // stylesheet's perspective-origin is set from the same number.
  uv.x -= (uVP - 0.5) * uRes.x / (0.5 * uRes.y);
  vec3 rd = normalize(vec3(uv.x * uTan, uv.y * uTan, 1.0));
  vec3 ro = vec3(uSway.x, uSway.y, uCam);

  vec3  acc = vec3(0.0);
  float rem = 1.0;                     // how much of the ray is still unpainted

  // ---- the gantries -------------------------------------------------------
  // A rectangular tunnel with the camera on its axis is black in the middle:
  // every centre ray runs to infinity and fogs out. What makes a fly-through
  // read as travel is a repeating frame passing the camera, so the corridor is
  // built out of those and the walls behind them are only a floor for the light.
  if (rd.z > 0.001) {
    float first = (floor((ro.z + 60.0) / GAP) + 1.0) * GAP;
    for (int i = 0; i < 20; i++) {
      float zk = first + float(i) * GAP;
      float te = (zk - ro.z) / rd.z;
      vec3 q = ro + rd * te;
      float ax = abs(q.x), ay = abs(q.y);

      float inside = band(ax, -1.0, HW) * band(ay, -1.0, HH);
      float hollow = band(ax, -1.0, HW - TH) * band(ay, -1.0, HH - TH);
      float frame = inside * (1.0 - hollow);

      // Every fourth frame is a bay marker and carries the accent.
      float m = mod(floor(zk / GAP + 0.5), 4.0);
      float major = 1.0 - step(0.5, m);
      float fog = exp(-te * 0.00052);

      vec3 c = mix(vec3(0.30, 0.44, 0.60), uAccent, 0.25 + major * 0.6 + uSurge * 0.7);
      float a = frame * fog * (0.55 + major * 0.45);
      a = clamp(a, 0.0, 1.0);
      acc += rem * a * c * (1.6 + uOpen * 0.5 + uSurge * 1.5);
      rem *= (1.0 - a);
    }
  }

  // ---- the shell behind them ---------------------------------------------
  float big = 1e9;
  float tx = abs(rd.x) < 1e-5 ? big : ((rd.x > 0.0 ? HW : -HW) - ro.x) / rd.x;
  float ty = abs(rd.y) < 1e-5 ? big : ((rd.y > 0.0 ? HH : -HH) - ro.y) / rd.y;
  float t  = min(tx, ty);
  bool  side = tx < ty;

  vec3 shell = uCanvas;
  if (t < big) {
    vec3 p = ro + rd * t;
    float across = side ? p.y / HH : p.x / HW;
    float rails = rib(p.z, GAP, 1.1);
    float along  = rib(side ? p.y : p.x, 220.0, 0.9);
    // Light runs where the faces meet, which is what sells the box as a box.
    float strip = smoothstep(0.86, 1.0, abs(across));
    vec3 cool = vec3(0.26, 0.40, 0.56);
    shell = cool * (rails * 0.30 + along * 0.14) + uAccent * strip * 0.55;
    float fog = 1.0 - exp(-t * (0.00050 - uOpen * 0.00022));
    shell = mix(shell, uCanvas, clamp(fog, 0.0, 1.0));
  }

  // ---- the end wall -------------------------------------------------------
  // The corridor has to stop somewhere the reader can come to rest, or the last
  // screen is a tunnel receding forever.
  if (rd.z > 0.001) {
    float te = (uEnd - ro.z) / rd.z;
    if (te > 0.0 && te < t) {
      vec3 q = ro + rd * te;
      float plate = band(abs(q.x), -1.0, 820.0) * band(abs(q.y), -1.0, 500.0);
      float inner = band(abs(q.x), -1.0, 796.0) * band(abs(q.y), -1.0, 476.0);
      float grid = max(rib(q.x, 150.0, 1.0), rib(q.y, 150.0, 1.0)) * 0.10;
      vec3 wall = mix(uCanvas, vec3(0.13, 0.16, 0.21), plate) + vec3(grid * 1.6) * plate;
      wall += uAccent * (plate - inner) * 1.8;
      float fog = 1.0 - exp(-te * 0.00046);
      shell = mix(mix(shell, wall, plate * 0.98 + 0.02), uCanvas, clamp(fog, 0.0, 1.0));
    }
  }

  acc += rem * shell;
  gl_FragColor = vec4(acc * uDim, 1.0);
}`;

let gl = null, prog = null, U = {};

function initGL() {
  gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return false;
  // fwidth lives in an extension on WebGL 1. Without it the grid aliases badly,
  // so fall back rather than draw a shimmering mess.
  if (!gl.getExtension('OES_standard_derivatives')) return false;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, type === gl.FRAGMENT_SHADER ? '#extension GL_OES_standard_derivatives : enable\n' + src : src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[pitwall] shader', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return false;

  prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error('[pitwall] link', gl.getProgramInfoLog(prog)); return false; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  ['uRes', 'uCam', 'uTan', 'uEnd', 'uDim', 'uOpen', 'uVP', 'uSurge', 'uSway', 'uAccent', 'uCanvas']
    .forEach((k) => { U[k] = gl.getUniformLocation(prog, k); });

  const css = getComputedStyle(document.documentElement);
  const rgb = (v) => {
    const m = css.getPropertyValue(v).trim().replace('#', '');
    return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
  };
  gl.uniform3fv(U.uAccent, rgb('--sc-accent'));
  gl.uniform3fv(U.uCanvas, rgb('--sc-canvas'));
  gl.uniform1f(U.uEnd, END_Z);
  return true;
}

function sizeGL() {
  if (!gl) return;
  const dpr = Math.min(devicePixelRatio || 1, 1.75);
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  gl.uniform2f(U.uRes, w, h);
  // The shader's field of view is DERIVED from the stylesheet's perspective,
  // which is what keeps the two layers in the same space.
  gl.uniform1f(U.uTan, (innerHeight / 2) / PERSPECTIVE);
}

/* --------------------------------------------------------------- the audit */

const audits = [];

function buildAudit(host, repoId) {
  const repo = byId.get(repoId);
  const sys = SYSTEMS[repoId];
  if (!repo || repo.missing) { host.remove(); return null; }
  const rows = auditRows(repo);

  const head = document.createElement('div');
  head.className = 'audit__head';
  head.innerHTML = `<span>${sys.name}</span><span>lines counted</span>`;

  const body = document.createElement('div');
  body.className = 'audit__rows';
  const rowEls = rows.map((r) => {
    const el = document.createElement('div');
    el.className = 'audit__row';
    el.innerHTML = `<span>${r.area}</span><span>${fmt(r.files)} files</span><b>${fmt(r.lines)}</b>`;
    body.append(el);
    return el;
  });

  const totalEl = document.createElement('div');
  totalEl.className = 'audit__total';
  totalEl.innerHTML = `<span class="audit__total-label">Total</span><span class="audit__total-value">0</span>`;

  const meta = document.createElement('p');
  meta.className = 'audit__meta';

  host.append(head, body, totalEl, meta);

  const a = {
    repo, rows, rowEls, sys,
    valueEl: totalEl.querySelector('.audit__total-value'),
    metaEl: meta,
    shown: -1, sum: 0, metaOn: false,
  };
  audits.push(a);
  return a;
}

function metaText(repo, sys) {
  const bits = [];
  bits.push(`<span><b>${fmt(repo.commits)}</b> commits over <b>${fmt(repo.activeDays)}</b> days</span>`);
  if (repo.suite) {
    const partial = repo.suite.passed !== repo.suite.total;
    bits.push(`<span><b>${fmt(repo.suite.passed)}</b>${partial ? ` of ${fmt(repo.suite.total)}` : ''} tests passing (${repo.suite.runner})</span>`);
  } else {
    bits.push('<span>no test suite</span>');
  }
  if (repo.deck) bits.push(`<span><b>${fmt(repo.deck.cards)}</b> cards, ${fmt(repo.deck.topics)} topics</span>`);
  // 8 — the total is physical lines; the code-only figure is materially lower
  // and was never shown anywhere, which made one number look like both.
  bits.push(`<span><b>${fmt(repo.linesCode)}</b> of those lines are code, the rest blank or comment</span>`);
  bits.push(`<span>counted from ${repo.basis}</span>`);
  // Money last, and labelled, because everything above it was measured and this
  // was not. In the first cut it sat mid-list and inherited "counted from".
  if (sys.money) bits.push(`<span class="audit__quoted"><b>${usd(sys.money.annualUsd)}</b> a year, quoted from the source document, not measured</span>`);
  if (sys.personal) bits.push('<span class="audit__quoted">personal build, earns the business nothing</span>');
  return bits.join('');
}

/** Drive one audit from its leg's local progress. */
function runAudit(a, p) {
  const fill = Math.max(0, Math.min(1, (p - 0.08) / 0.54));
  const want = Math.round(fill * a.rows.length);
  if (want !== a.shown) {
    let sum = 0;
    a.rowEls.forEach((el, i) => {
      const on = i < want;
      el.classList.toggle('is-in', on);
      if (on) sum += a.rows[i].lines;
    });
    a.shown = want;
    a.sum = sum;
    a.valueEl.textContent = fmt(sum);
  }
  const metaOn = p > 0.66;
  if (metaOn !== a.metaOn) {
    a.metaOn = metaOn;
    a.metaEl.innerHTML = metaOn ? metaText(a.repo, a.sys) : '';
  }
}

/* -------------------------------------------------------------- the ledger */

let ledger = null;

function buildLedger() {
  const body = document.getElementById('ledger-body');
  const foot = document.getElementById('ledger-foot');
  const order = ['rutero-tdv', 'cotizador-tdv', 'cotizador-farmers-fresh', 'data-triage-center', 'tdv-outbound-log', 'currents'];
  const rows = order.map((id) => ({ id, repo: byId.get(id), sys: SYSTEMS[id] })).filter((r) => r.repo && !r.repo.missing);

  rows.forEach((r) => {
    const tr = document.createElement('tr');
    const tests = r.repo.suite
      ? (r.repo.suite.passed === r.repo.suite.total
          ? fmt(r.repo.suite.passed)
          : `${fmt(r.repo.suite.passed)} of ${fmt(r.repo.suite.total)}`)
      : 'no suite';
    const money = r.sys.money ? usd(r.sys.money.annualUsd) : 'personal';
    tr.innerHTML =
      `<td>${r.sys.name}</td><td>${fmt(r.repo.linesTotal)}</td><td>${fmt(r.repo.commits)}</td>` +
      `<td class="${r.repo.suite ? '' : 'dim'}">${tests}</td><td class="${r.sys.money ? '' : 'dim'}">${money}</td>`;
    body.append(tr);
    r.tr = tr;
  });

  const sum = (f) => rows.reduce((s, r) => s + (f(r) || 0), 0);
  const totals = {
    lines: sum((r) => r.repo.linesTotal),
    commits: sum((r) => r.repo.commits),
    passed: sum((r) => r.repo.suite?.passed),
    ofTotal: sum((r) => r.repo.suite?.total),
    money: sum((r) => r.sys.money?.annualUsd),
  };
  const tr = document.createElement('tr');
  tr.innerHTML =
    `<td>Summed here, in your browser</td><td>${fmt(totals.lines)}</td><td>${fmt(totals.commits)}</td>` +
    `<td>${totals.passed === totals.ofTotal ? fmt(totals.passed) : `${fmt(totals.passed)} of ${fmt(totals.ofTotal)}`}</td>` +
    `<td>${usd(totals.money)}</td>`;
  foot.append(tr);
  foot.style.opacity = '0';

  const pay = Math.round((totals.money / MONEY.replacementYear1) * 100);
  document.getElementById('excluded').innerHTML =
    `That is <b>${pay}%</b> of what a year of me costs the business, and it comes from the five systems ` +
    `built for it. The sixth row is my own build and earns it nothing. A further system exists and has no ` +
    `row here at all: <b>${MONEY.excluded.name}</b>, worth ${usd(MONEY.excluded.annualUsd)} a year in the ` +
    `source document and ${MONEY.excluded.reason}. Showing it to claim its money would be the exact move ` +
    `the rest of this page argues against, so it comes off with its money.`;

  const failing = rows.filter((r) => r.repo.suite && r.repo.suite.passed !== r.repo.suite.total);
  document.getElementById('caveat').textContent =
    MONEY.caveat + (failing.length
      ? ` Measured ${EV.generatedAt}: ${failing.map((r) => r.sys.name).join(', ')} has a test that is not passing. The evidence file records how many passed and how many ran, not why the difference exists, so that is as far as this sentence goes. The page says it rather than rounding up.`
      : '');

  ledger = {
    rows, foot, shown: -1,
    // The reasoning arrives AFTER the arithmetic. Rendered up front, these two
    // paragraphs put the conclusion on screen while the table was still empty.
    after: [document.getElementById('excluded'), document.getElementById('caveat')],
  };
  ledger.after.forEach((el) => { el.style.opacity = '0'; el.style.transition = 'opacity 320ms var(--sc-ease-out)'; });
}

function runLedger(p) {
  if (!ledger) return;
  const fill = Math.max(0, Math.min(1, (p - 0.12) / 0.52));
  const want = Math.round(fill * ledger.rows.length);
  if (want !== ledger.shown) {
    ledger.rows.forEach((r, i) => r.tr.classList.toggle('is-in', i < want));
    ledger.shown = want;
  }
  ledger.foot.style.opacity = p > 0.72 ? '1' : '0';
  const reasoning = p > 0.80 ? '1' : '0';
  if (reasoning !== ledger.reasoning) {
    ledger.reasoning = reasoning;
    ledger.after.forEach((el) => { el.style.opacity = reasoning; });
  }
}

/* ------------------------------------------------------------------ frame */

/* Where the corridor's deepest point sits, as a fraction of viewport width.
   Lead copy pushes it right, trail copy pushes it left. */
const VP = { lead: 0.66, trail: 0.38, center: 0.52 };
let vp = VP.lead, vpTarget = VP.lead;

let camZ = 0, camTarget = 0;
let swayX = 0, swayY = 0, swayTX = 0, swayTY = 0;
let curLeg = -1;
const runningEl = document.getElementById('running-total');
const mapButtons = () => [...document.querySelectorAll('.map__leg')];

function trackPos() {
  const t = (scrollY - trackTop()) / innerHeight;
  return Math.max(0, Math.min(total, t));
}

function legAt(t) {
  let k = 0;
  for (let i = 0; i < LEGS.length; i++) if (t >= LEGS[i].c0) k = i;
  return k;
}

function frame() {
  const t = trackPos();
  camTarget = t * PX_PER_VH;
  // Damped playhead. A 1:1 camera reproduces every gap in the wheel event
  // stream as a stutter; worldflight.md §7c calls 0.12 the right figure for a
  // flight, and this is the same instrument.
  camZ += (camTarget - camZ) * (reduce ? 1 : 0.12);
  swayX += (swayTX - swayX) * 0.06;
  swayY += (swayTY - swayY) * 0.06;

  vp += (vpTarget - vp) * (reduce ? 1 : 0.04);
  scene.style.perspectiveOrigin = (vp * 100).toFixed(2) + '% 50%';
  cam.style.transform = `translate3d(${(-swayX * 0.25).toFixed(2)}px, ${(-swayY * 0.25).toFixed(2)}px, ${camZ.toFixed(1)}px)`;

  for (const b of bayEls) {
    const d = b.z - camZ;
    const on = d > 30 && d < 3600;
    if (on !== b.on) { b.on = on; b.el.style.visibility = on ? 'visible' : 'hidden'; }
    if (on) {
      // Fade at BOTH ends. Only the far end was faded on the first cut, so a
      // panel about to pass the camera filled half the frame with a blurred
      // fragment of a screenshot behind the copy.
      const far = Math.min(1, Math.max(0, 1 - (d - 2900) / 700));
      const near = Math.min(1, Math.max(0, (d - 40) / 300));
      b.el.style.opacity = String(far * near);
      // Five of the six screens are light-UI applications. A fixed grade that
      // sits correctly at distance floods the frame when the panel is close and
      // large, so the exposure follows the distance: dimmest on the pass.
      if (b.lit !== undefined || b.el.querySelector('.bay__panel')) {
        const lit = (0.34 + Math.min(1, d / 2200) * 0.30).toFixed(3);
        if (lit !== b.lit) { b.lit = lit; b.el.style.setProperty('--lit', lit); }
      }
    }
  }

  const k = legAt(t);
  const leg = LEGS[k];
  const local = Math.max(0, Math.min(1, (t - leg.c0) / leg.w));

  if (gl) {
    gl.uniform1f(U.uCam, camZ);
    gl.uniform2f(U.uSway, swayX, swayY);
    // The dark stretch is authored silence: the lights go down, and they are
    // the only thing that changes, because nothing else is meant to be there.
    const dark = k === AT.dark ? 1 - Math.abs(local - 0.5) * 1.2 : 0;
    gl.uniform1f(U.uDim, 1 - dark * 0.72);
    gl.uniform1f(U.uOpen, k === AT.ledger ? Math.min(1, local * 2.2) : (k > AT.ledger ? 1 : 0));
    gl.uniform1f(U.uVP, vp);
    // The peak, in the world: when the totals land, the corridor lights up.
    // It is the largest change on the page and it happens once.
    // The surge has to live INSIDE the copy block's full-opacity plateau. On
    // the first cut it peaked at local 0.84 while the block was already ramping
    // out at 0.69, so the corridor lit up exactly as the numbers left: the peak
    // was competing with itself.
    const surge = k === AT.ledger
      ? Math.max(0, Math.min(1, (local - 0.68) / 0.10)) * (1 - Math.max(0, Math.min(1, (local - 0.84) / 0.06)))
      : 0;
    gl.uniform1f(U.uSurge, surge);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  for (const a of audits) runAudit(a, a.leg === k ? local : (k > a.leg ? 1 : 0));
  runLedger(k === AT.ledger ? local : (k > AT.ledger ? 1 : 0));

  const running = audits.reduce((s, a) => s + a.sum, 0);
  if (running !== frame.lastRunning) { frame.lastRunning = running; runningEl.textContent = fmt(running); }

  if (k !== curLeg) {
    curLeg = k;
    scrim.dataset.anchor = leg.anchor;
    vpTarget = VP[leg.anchor];
    mapButtons().forEach((b) => b.setAttribute('aria-current', String(+b.dataset.leg === k)));
    // On a phone the waypoint list collapses to ticks, so the name of the
    // place you are in has to be stated somewhere. A map you cannot read is
    // not a map.
    document.getElementById('map-now').textContent = leg.label;
  }

  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------- boot */

function wireCopy() {
  document.querySelectorAll('[data-system]').forEach((block) => {
    const id = block.dataset.system;
    const legIndex = LEGS.findIndex((l) => l.id === id);
    const fill = (sel, sys) => block.querySelectorAll(sel).forEach((el) => {
      const key = el.dataset.field;
      if (key === 'url') {
        if (sys.url) { el.href = sys.url; el.rel = 'noopener'; el.target = '_blank'; }
        else el.hidden = true;
        return;
      }
      el.textContent = sys[key] || '';
    });
    fill('[data-field]', SYSTEMS[id]);

    const host = block.querySelector('[data-audit]');
    if (host) { const a = buildAudit(host, id); if (a) a.leg = legIndex; }
  });
}

/**
 * Keyboard focus inside a copy block that is not on screen.
 *
 * The engine hands pointer-events back only above opacity 0.5, which stops a
 * mouse reaching an invisible link but does nothing for the tab key: a
 * keyboard user tabbed straight into five links at opacity 0. Making them
 * inert would fix the symptom by removing the content. Scrolling the page to
 * wherever the focused thing lives is what a scroll-driven page should do.
 */
function wireFocus() {
  addEventListener('focusin', (e) => {
    const block = e.target.closest?.('[data-sc-copy]');
    if (!block || +block.style.opacity > 0.5) return;
    const spec = (block.getAttribute('data-sc-window') || '').trim();
    let pr;
    if (spec === 'hero') pr = 0;
    else if (spec === 'finale') pr = 0.985;
    else {
      const n = spec.split(/\s+/).map(parseFloat);
      pr = (n[0] + (n[1] || n[0])) / 2;
    }
    scrollTo({ top: trackTop() + pr * total * innerHeight, behavior: reduce ? 'auto' : 'smooth' });
  });
}

function wireEnd() {
  const cta = document.getElementById('cta');
  cta.textContent = CONTACT.label;
  cta.href = `mailto:${CONTACT.address}?subject=${encodeURIComponent(CONTACT.subject)}`;
  document.querySelector('.map__cta').textContent = CONTACT.label;
  document.getElementById('evidence-link').href = EVIDENCE_PAGE;
  document.getElementById('method').textContent =
    `${EV.countingRule} Measured ${EV.generatedAt}.`;
}

/** worldflight.md §7b: the spacer is sized once at mount, and a zero-height
    innerHeight at that moment leaves the page with no scroll track at all. It
    fails silently and looks exactly like success. One resize fixes it. */
function relayout() { dispatchEvent(new Event('resize')); sizeGL(); }

async function boot() {
  // Mounted here rather than from an inline <script>: the deployed site sends
  // script-src 'self' with no unsafe-inline, and an inline mount call is
  // silently blocked, which leaves the page a still image with no scroll track.
  ScrollCraft.mount(document.body);
  assertLegs();
  scene.style.perspective = PERSPECTIVE + 'px';

  const res = await fetch('evidence.json');
  EV = await res.json();
  EV.repos.forEach((r) => byId.set(r.id, r));

  buildMap();
  wireCopy();
  buildLedger();
  buildBays();
  wireEnd();
  wireFocus();

  if (!initGL()) {
    // No WebGL: the corridor is gone, the panels and every number are not.
    canvas.remove();
    document.documentElement.classList.add('no-gl');
  } else {
    sizeGL();
  }

  if (fine && !reduce) {
    addEventListener('pointermove', (e) => {
      swayTX = (e.clientX / innerWidth - 0.5) * 260;
      swayTY = (e.clientY / innerHeight - 0.5) * 160;
    }, { passive: true });
  }

  addEventListener('resize', sizeGL);
  addEventListener('load', relayout);
  if (document.fonts?.ready) document.fonts.ready.then(relayout);
  relayout();
  requestAnimationFrame(frame);
}

boot().catch((err) => {
  console.error('[pitwall] boot failed', err);
  document.documentElement.classList.add('no-evidence');
});

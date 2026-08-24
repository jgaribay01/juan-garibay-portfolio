/**
 * Drift guard.
 *
 * Two pages now. `index.html` is the flight, and it states no figure at all:
 * every number it shows is summed in the browser from `evidence.json`, so
 * there is nothing on it to drift and the guard's job there is to prove that
 * stays true. `evidence.html` is the written portfolio, and it is the page
 * this file was originally written for.
 *
 * evidence.html deliberately repeats some figures that js/data.js also owns: the
 * hero headline and stat strip (so the page does not shift on load), the
 * noscript project list, and the per-project footnotes. Duplication is the
 * right trade there, but it is only safe if drift is caught mechanically —
 * these fallbacks silently fell two measurement rounds behind once, because
 * nothing renders them on a normal load and nobody looks at them.
 *
 * Run with `npm run check`. Exits non-zero on the first mismatch.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => readFileSync(join(here, name), 'utf8');

// data.js is a browser script that assigns a top-level const, so evaluate it
// as an expression and take the value rather than trying to import it.
const dataSource = read('js/data.js');
// eslint-disable-next-line no-eval
const P = (0, eval)(`${dataSource}\nPORTFOLIO;`);

const html = read('evidence.html');

// og-source.html renders img/og.png, the card every link preview shows. Nothing
// on the site displays it, no one reloads it, and it is a screenshot — so it is
// the single most drift-prone surface here, and it drifted: it kept saying six
// systems and $30,748 after the page said five and $28,162. Regenerate the PNG
// after any change this catches, or the preview keeps showing the old figures.
const ogSource = read('og-source.html');

// The point of this guard is the scriptless fallback — the copy nothing renders
// on a normal load, which is exactly why it drifted unnoticed before. Searching
// the whole document defeats that: a stale figure inside <noscript> hides behind
// the correct one in the hero or the og:image:alt tag. So project and
// hard-part assertions run against the fallback text only.
const fallback = (html.match(/<noscript>[\s\S]*?<\/noscript>/g) || []).join('\n');
if (!fallback) {
  console.error('check: evidence.html has no <noscript> fallback to verify');
  process.exit(1);
}

const usd = (n) => `$${n.toLocaleString('en-US')}`;
const systems = P.PROJECTS.filter((p) => !p.personal).length;

// Summed from the cards, exactly as render.js does it. The source document's
// $30,748 and 102% count a sixth system this page excludes, so asserting the
// hero against the source figures would have let the headline claim a benefit
// no card on the page backs up.
const presentedBenefit = P.PROJECTS.reduce((sum, p) => sum + (p.benefit?.annualUsd ?? 0), 0);
const presentedPayback = Math.round((presentedBenefit / P.REPLACEMENT.juanYear1) * 100);

const failures = [];

/** The figure must appear in evidence.html, or the fallback has drifted. */
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const within = (haystack, where) => (label, needle) => {
  if (haystack.includes(needle) || haystack.includes(escape(needle))) return;
  failures.push(`${label}: ${where} is missing ${JSON.stringify(needle)}`);
};
const expect = within(html, 'evidence.html');
const expectFallback = within(fallback, 'the <noscript> fallback');

// The hero repeats figures that now also appear in the prose explaining which
// system is excluded. Searching the whole document let a stale hero hide behind
// the correct figure in that paragraph — the same way a stale noscript figure
// once hid behind the hero. Scope narrowly or the guard proves nothing.
// Split further, because the hero states every figure TWICE — once in the
// headline sentence and once in the stat strip. Searching the hero as one blob
// passes when only one of the two copies is right, which is the drift most
// likely to happen: someone updates the sentence and forgets the tiles.
const region = (pattern, name) => {
  const found = (html.match(pattern) || [''])[0];
  if (!found) {
    console.error(`check: evidence.html has no ${name} to verify`);
    process.exit(1);
  }
  return within(found, name);
};
const expectHeadline = region(/<h1 class="hero-title"[\s\S]*?<\/h1>/, 'the hero headline');
const expectStrip = region(/<div class="stat-strip"[\s\S]*?<\/div>\s*<\/section>/, 'the stat strip');

// — hero, which exists in the markup purely to stop layout shift —
expectHeadline('headline systems count', `${systems} systems running a distribution business`);
expectHeadline('headline benefit', usd(presentedBenefit));
expectHeadline('headline payback', `${presentedPayback}%`);

expectStrip('strip systems count', `>${systems}<`);
expectStrip('strip benefit', usd(presentedBenefit));
expectStrip('strip cash', usd(P.BENEFIT.cashAnnual));
expectStrip('strip agency quote', usd(P.REPLACEMENT.agencyYear1));
expectStrip('strip payback', `>${presentedPayback}%<`);

// The excluded system is stated in prose, and prose drifts as easily as a
// field. If the sum on the page ever changes, the sentence explaining the gap
// has to change with it.
// The method sentence is rendered by render.js AND written into the fallback,
// and the two had drifted: the fallback described the measurement script while
// the rendered copy still described a hand count. Nobody saw it, because the
// rendered copy replaces the fallback the moment JavaScript runs.
const normalise = (t) => t
  .replace(/<[^>]+>/g, '')
  .replace(/&rsquo;|&lsquo;|\u2018|\u2019/g, "'")
  .replace(/&ldquo;|&rdquo;|\u201c|\u201d/g, '"')
  .replace(/&mdash;|\u2014/g, '-')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();
const evidenceStatic = normalise((html.match(/id="evidence-note"[^>]*>([\s\S]*?)<\/p>/) || ['', ''])[1]);
for (const sentence of P.EVIDENCE.method.split('. ')) {
  const needle = normalise(sentence).replace(/\.$/, '');
  if (!needle) continue;
  if (!evidenceStatic.includes(needle)) {
    failures.push(`evidence method: the fallback is missing "${needle.slice(0, 60)}..." — it has drifted from what render.js shows`);
  }
}

expect('excluded system total', usd(P.EXCLUDED.annualUsd));
expect('excluded source total', usd(P.EXCLUDED.sourceTotal));
expect('excluded presented total', usd(presentedBenefit));
if (presentedBenefit + P.EXCLUDED.annualUsd !== P.EXCLUDED.sourceTotal) {
  failures.push(
    `excluded arithmetic: ${usd(presentedBenefit)} shown + ${usd(P.EXCLUDED.annualUsd)} excluded ` +
    `does not reach the source total of ${usd(P.EXCLUDED.sourceTotal)}`,
  );
}
if (P.PROJECTS.some((p) => p.name === P.EXCLUDED.name)) {
  failures.push(`excluded system "${P.EXCLUDED.name}" is still in PROJECTS`);
}

// — the social card, whose figures live only inside an image —
const expectOg = within(ogSource, 'og-source.html (regenerate img/og.png after fixing)');
// The card counts every system the flight shows, including the personal one,
// because that is the number in its headline. It used to count only the five
// built for the business, which meant the preview and the page it links to
// disagreed about how many systems there are.
expectOg('og systems count', `>${P.PROJECTS.length}<`);
expectOg('og benefit', usd(presentedBenefit));
const presentedLines = P.PROJECTS.reduce((sum, p) => sum + (p.loc ?? 0), 0);
expectOg('og lines of source', presentedLines.toLocaleString('en-US'));

// The card's headline test figure is the sum across the systems shown. It used
// to be one project's count, which quietly became wrong the moment a second
// project grew a suite.
const presentedTests = P.PROJECTS.reduce((sum, p) => sum + (p.tests ?? 0), 0);
expectOg('og tests passing', presentedTests.toLocaleString('en-US'));

// img/ is served immutable for a year, so the social card's URL has to change
// when the card does — otherwise a scraper keeps serving the previous reading's
// figures indefinitely. Tying the query to MEASURED_ON means a re-measure busts
// it automatically instead of relying on someone remembering.
for (const tag of ['og:image', 'twitter:image']) {
  const found = html.match(new RegExp(`(?:property|name)="${tag}" content="([^"]+)"`));
  if (!found) { failures.push(`${tag}: not found in evidence.html`); continue; }
  if (!found[1].includes(`?v=${P.MEASURED_ON}`)) {
    failures.push(`${tag}: ${JSON.stringify(found[1])} is not versioned with ?v=${P.MEASURED_ON}, so the cached card will outlive this measurement`);
  }
}
expect('meta description tests', `${presentedTests.toLocaleString('en-US')} tests passing`);
// The card stamps the measurement date. Derived from MEASURED_ON so a
// re-measurement cannot leave the preview claiming the old reading date.
const [ogY, ogM, ogD] = P.MEASURED_ON.split('-');
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
expectOg('og measured date', `${Number(ogD)} ${MONTHS[Number(ogM) - 1]} ${ogY}`);

// — the two hero cards that state measured figures —
//
// These live inside WebP files, which no check can read. The source they are
// rendered from can be read, so it is what gets verified: if it drifts from
// js/data.js the card is stale and must be re-rendered with
// tools/render-heroes.sh. Both cards had already drifted badly — one claimed
// 5,152 lines against 2,671, the other 95 deck cards against 727.
const heroSourcePath = join(here, 'hero-source.html');
if (!existsSync(heroSourcePath)) {
  failures.push('hero-source.html is missing — the hero cards cannot be regenerated');
} else {
  const heroSource = readFileSync(heroSourcePath, 'utf8');
  const expectHero = within(heroSource, 'hero-source.html (re-render with tools/render-heroes.sh)');
  const ff = P.PROJECTS.find((p) => p.id === 'cotizador-farmers-fresh');
  const currents = P.PROJECTS.find((p) => p.id === 'currents');
  if (ff) {
    expectHero('ff hero line count', `${ff.loc.toLocaleString('en-US')} lines`);
    expectHero('ff hero commits', `${ff.commits} commits`);
    expectHero('ff hero tests', `${ff.tests} tests`);
  }
  if (currents?.deck) {
    expectHero('currents hero deck cards', `${currents.deck.cards.toLocaleString('en-US')} cards`);
    expectHero('currents hero deck topics', `${currents.deck.topics} topic streams`);
  }
  for (const asset of ['img/ff-shot.webp', 'img/currents-shot.webp']) {
    if (!existsSync(join(here, asset))) {
      failures.push(`hero asset ${asset} is missing — tools/render-heroes.sh cannot rebuild the cards`);
    }
  }
}

// — every build must be represented in the scriptless fallback, with its
//   measured figures, not an older round's —
P.PROJECTS.forEach((project) => {
  expectFallback(`${project.id} name`, project.name);
  expectFallback(`${project.id} line count`, project.loc.toLocaleString('en-US'));
  if (project.commits !== null) expectFallback(`${project.id} commits`, `${project.commits} commits`);
  if (project.tests !== null) expectFallback(`${project.id} tests`, `${project.tests.toLocaleString('en-US')} tests`);
  // The contract estimate is derived (hours x rate) and restated as prose, so a
  // change to either input silently staled it. Only assert it where it appears.
  const estimate = usd(project.estimatedBuildHours * P.HOURLY_RATE);
  if (fallback.includes(`${project.name} —`) && /Contract estimate/.test(fallback)) {
    const stated = new RegExp(`${project.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,600}?Contract estimate \\$[\\d,]+`);
    const match = fallback.match(stated);
    if (match && !match[0].includes(estimate)) {
      failures.push(`${project.id} contract estimate: fallback states a figure that is not ${estimate}`);
    }
  }
});

// — the hard-part fallback must cover every entry —
P.HARD_PARTS.forEach((entry, index) => {
  // Any one of the cited files is enough: the fallback is a summary, not a copy.
  const cited = entry.evidence.map((file) => file.split(' ')[0]);
  if (!cited.some((file) => fallback.includes(file))) {
    failures.push(
      `hard part ${index + 1} (${entry.system}): no fallback cites any of ${cited.join(', ')}`,
    );
  }
});

// — the structured data is a third copy of the same facts, read only by
//   crawlers, so nothing on a normal load reveals when it goes stale —
const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!ldMatch) {
  failures.push('structured data: evidence.html has no ld+json block');
} else {
  let graph;
  try {
    graph = JSON.parse(ldMatch[1]);
  } catch (error) {
    failures.push(`structured data: ld+json does not parse — ${error.message}`);
  }
  if (graph) {
    const list = (graph['@graph'] || []).find((node) => node['@type'] === 'ItemList');
    const apps = new Map((list?.itemListElement || []).map((entry) => [entry.item?.name, entry.item]));
    P.PROJECTS.forEach((project) => {
      const app = apps.get(project.name);
      if (!app) {
        failures.push(`structured data: ${project.name} is missing from the ld+json ItemList`);
        return;
      }
      if (app.description !== project.desc) {
        failures.push(`structured data: ${project.name} description differs from js/data.js`);
      }
      if ((app.url || null) !== (project.url || null)) {
        failures.push(`structured data: ${project.name} url is ${app.url || 'absent'}, data.js says ${project.url || 'absent'}`);
      }
      apps.delete(project.name);
    });
    apps.forEach((_, name) => failures.push(`structured data: ld+json lists "${name}", which is not in js/data.js`));
  }
}

// — measurement date must be stated on the page, never a bare figure —
expect('measurement date', P.MEASURED_ON);

/* ===========================================================================
   The flight (index.html)
   ---------------------------------------------------------------------------
   The written page duplicates figures and is guarded against drift. The flight
   takes the other route: it states none, and sums them in the browser out of
   evidence.json. That is a stronger guarantee, but only while it holds, and it
   would be easy to "just hardcode this one" later. So the guard here is the
   inverse of the guard above: it fails if a measured figure appears anywhere in
   the flight's own source.
   ========================================================================= */

const flight = read('index.html');
const flightJs = read('js/world.js') + read('js/content.js');
const flightCss = read('css/pitwall.css');

if (!existsSync(join(here, 'evidence.json'))) {
  failures.push('evidence.json is missing: the flight has nothing to derive its figures from');
} else {
  const EV = JSON.parse(read('evidence.json'));
  const live = new Map(EV.repos.filter((r) => !r.missing).map((r) => [r.id, r]));

  // Every measured figure, in both the plain and the grouped spelling.
  const forbidden = [];
  for (const [id, r] of live) {
    for (const n of [r.linesTotal, r.linesCode, r.commits, r.suite?.passed, r.deck?.cards]) {
      if (typeof n === 'number' && n >= 100) forbidden.push([id, n]);
    }
  }
  const totals = {
    lines: [...live.values()].reduce((s, r) => s + r.linesTotal, 0),
    commits: [...live.values()].reduce((s, r) => s + r.commits, 0),
    tests: [...live.values()].reduce((s, r) => s + (r.suite?.passed || 0), 0),
  };
  for (const [k, n] of Object.entries(totals)) forbidden.push([`total ${k}`, n]);

  for (const [label, n] of forbidden) {
    for (const spelling of [String(n), n.toLocaleString('en-US')]) {
      const re = new RegExp(`(^|[^\\d,.])${spelling.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\d,.]|$)`);
      for (const [where, text] of [['index.html', flight], ['js/*.js', flightJs], ['css/pitwall.css', flightCss]]) {
        if (re.test(text)) {
          failures.push(`flight: ${where} contains the measured figure ${spelling} (${label}). ` +
            'The flight must derive every figure from evidence.json, never state one.');
        }
      }
    }
  }

  // The two pages have to be measuring the same repositories on the same day,
  // or the front door and the evidence behind it quietly disagree.
  for (const project of P.PROJECTS) {
    const r = live.get(project.id);
    if (!r) { failures.push(`evidence.json has no record for ${project.id}`); continue; }
    if (r.linesTotal !== project.loc) failures.push(`${project.id}: evidence.json says ${r.linesTotal} lines, js/data.js says ${project.loc}`);
    if ((r.commits ?? null) !== (project.commits ?? null)) failures.push(`${project.id}: evidence.json says ${r.commits} commits, js/data.js says ${project.commits}`);
    const passed = r.suite ? r.suite.passed : null;
    if (passed !== (project.tests ?? null)) failures.push(`${project.id}: evidence.json says ${passed} tests, js/data.js says ${project.tests}`);
    if (project.deck && r.deck && r.deck.cards !== project.deck.cards) {
      failures.push(`${project.id}: evidence.json says ${r.deck.cards} cards, js/data.js says ${project.deck.cards}`);
    }
  }
  if (EV.generatedAt !== P.MEASURED_ON) {
    failures.push(`evidence.json was generated ${EV.generatedAt} but js/data.js says measured ${P.MEASURED_ON}`);
  }
}

// The deployed CSP has no unsafe-inline, so an inline EXECUTABLE <script> is
// dropped and the page becomes a still image with no scroll track. It fails
// silently, which is how ScrollCraft.mount nearly shipped inline.
//
// A data block is not a script. `type="application/ld+json"` carries no
// executable code, browsers do not evaluate it, and script-src does not apply:
// verified against production, where evidence.html has served one under this
// exact header with no violation reported. Blocking it here would have cost
// the front page its structured data for nothing.
const DATA_BLOCK = /type\s*=\s*["'](application\/ld\+json|application\/json|text\/template)["']/i;
for (const tag of flight.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || []) {
  const open = tag.slice(0, tag.indexOf('>') + 1);
  if (/\ssrc\s*=/.test(open)) continue;          // external, allowed by 'self'
  if (DATA_BLOCK.test(open)) continue;            // data, not code
  if (!/>\s*\S/.test(tag.slice(tag.indexOf('>')))) continue;  // empty
  failures.push(`flight: index.html has an inline executable <script>, which the deployed CSP blocks — ${open.slice(0, 60)}`);
}
// The flight is the page people share. Losing its card is invisible from the
// page itself and only shows up in somebody else's chat window.
const SOCIAL = [
  ['canonical', /<link rel="canonical" href="[^"]+"/],
  ['og:title', /property="og:title"/],
  ['og:description', /property="og:description"/],
  ['og:image', /property="og:image"/],
  ['twitter:card', /name="twitter:card"/],
  ['structured data', /<script type="application\/ld\+json">/],
];
for (const [name, re] of SOCIAL) {
  if (!re.test(flight)) failures.push(`flight: index.html has no ${name}, so a shared link renders as a bare URL`);
}
// img/ is immutable for a year, so the card's URL has to move when the card does.
for (const tag of ['og:image', 'twitter:image']) {
  const found = flight.match(new RegExp(`(?:property|name)="${tag}" content="([^"]+)"`));
  if (!found) { failures.push(`flight: ${tag} is missing`); continue; }
  if (!found[1].includes(`?v=${P.MEASURED_ON}`)) {
    failures.push(`flight: ${tag} is not versioned with ?v=${P.MEASURED_ON}, so the cached card outlives the measurement`);
  }
}
// The ld+json names every system and links it. That is a second copy of prose
// the page already owns, so it is checked against the file it renders from.
{
  const ld = flight.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ld) {
    let graph = null;
    try { graph = JSON.parse(ld[1]); } catch (error) { failures.push(`flight: ld+json does not parse — ${error.message}`); }
    if (graph) {
      // Only the SYSTEMS block. Reading the whole file also picks up
      // MONEY.excluded.name, which is the system the page deliberately does
      // not render, and the guard then demanded it appear in the ld+json.
      const source = read('js/content.js');
      const content = source.slice(source.indexOf('export const SYSTEMS'), source.indexOf('export const MONEY'));
      const list = (graph['@graph'] || []).find((n) => n['@type'] === 'ItemList');
      const listed = (list?.itemListElement || []).map((e) => e.item);
      const names = [...content.matchAll(/\n    name: '((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
      for (const n of names) {
        if (!listed.some((i) => i.name === n)) failures.push(`flight: ld+json is missing "${n}", which js/content.js renders`);
      }
      for (const i of listed) {
        if (!names.includes(i.name)) failures.push(`flight: ld+json lists "${i.name}", which is not in js/content.js`);
      }
      if (list && list.numberOfItems !== names.length) {
        failures.push(`flight: ld+json says ${list.numberOfItems} systems, js/content.js has ${names.length}`);
      }
    }
  }
}

if (!/connect-src 'self'/.test(read('vercel.json'))) {
  failures.push("vercel.json: the flight fetches evidence.json, so CSP needs connect-src 'self'");
}

if (failures.length) {
  console.error(`check: ${failures.length} fallback(s) out of step with js/data.js\n`);
  failures.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}

console.log(
  `check: fallbacks and structured data match js/data.js — ${P.PROJECTS.length} builds, ` +
    `${P.HARD_PARTS.length} engineering notes, measured ${P.MEASURED_ON}`,
);

/**
 * Drift guard for the static fallbacks in index.html.
 *
 * index.html deliberately repeats some figures that js/data.js also owns: the
 * hero headline and stat strip (so the page does not shift on load), the
 * noscript project list, and the per-project footnotes. Duplication is the
 * right trade there, but it is only safe if drift is caught mechanically —
 * these fallbacks silently fell two measurement rounds behind once, because
 * nothing renders them on a normal load and nobody looks at them.
 *
 * Run with `npm run check`. Exits non-zero on the first mismatch.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => readFileSync(join(here, name), 'utf8');

// data.js is a browser script that assigns a top-level const, so evaluate it
// as an expression and take the value rather than trying to import it.
const dataSource = read('js/data.js');
// eslint-disable-next-line no-eval
const P = (0, eval)(`${dataSource}\nPORTFOLIO;`);

const html = read('index.html');

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
  console.error('check: index.html has no <noscript> fallback to verify');
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

/** The figure must appear in index.html, or the fallback has drifted. */
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const within = (haystack, where) => (label, needle) => {
  if (haystack.includes(needle) || haystack.includes(escape(needle))) return;
  failures.push(`${label}: ${where} is missing ${JSON.stringify(needle)}`);
};
const expect = within(html, 'index.html');
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
    console.error(`check: index.html has no ${name} to verify`);
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
expectOg('og systems count', `>${systems}<`);
expectOg('og benefit', usd(presentedBenefit));
expectOg('og cash', usd(P.BENEFIT.cashAnnual));
// The card stamps the measurement date. Derived from MEASURED_ON so a
// re-measurement cannot leave the preview claiming the old reading date.
const [ogY, ogM, ogD] = P.MEASURED_ON.split('-');
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
expectOg('og measured date', `${Number(ogD)} ${MONTHS[Number(ogM) - 1]} ${ogY}`);

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
  failures.push('structured data: index.html has no ld+json block');
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

if (failures.length) {
  console.error(`check: ${failures.length} fallback(s) out of step with js/data.js\n`);
  failures.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}

console.log(
  `check: fallbacks and structured data match js/data.js — ${P.PROJECTS.length} builds, ` +
    `${P.HARD_PARTS.length} engineering notes, measured ${P.MEASURED_ON}`,
);

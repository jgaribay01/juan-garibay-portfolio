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

const failures = [];

/** The figure must appear in index.html, or the fallback has drifted. */
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const within = (haystack, where) => (label, needle) => {
  if (haystack.includes(needle) || haystack.includes(escape(needle))) return;
  failures.push(`${label}: ${where} is missing ${JSON.stringify(needle)}`);
};
const expect = within(html, 'index.html');
const expectFallback = within(fallback, 'the <noscript> fallback');

// — hero, which exists in the markup purely to stop layout shift —
expect('hero systems count', `${systems} systems running a distribution business`);
expect('hero benefit', usd(P.BENEFIT.baseAnnual));
expect('hero cash', usd(P.BENEFIT.cashAnnual));
expect('hero agency quote', usd(P.REPLACEMENT.agencyYear1));
expect('hero payback', `${P.REPLACEMENT.payingPercentOfSalary}%`);

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

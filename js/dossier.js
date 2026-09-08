/**
 * The case pack, rendered.
 *
 * Every figure on this page is derived here, in the browser, from two files
 * that already own it:
 *
 *   evidence.json   files, lines, commits, tests, active days — measured
 *   js/data.js      money, levers, status, stack, the hard parts — quoted
 *
 * js/cases.js carries the prose and nothing else. Sentences that need a
 * measured number carry a token instead of the number, and this file fills it
 * in. So the pack cannot state a figure that the evidence file does not, and
 * check.mjs fails the build if anyone types one in anyway.
 *
 * The page renders nothing until the evidence file arrives. That is deliberate:
 * a case pack that paints its figures before it has read them is a case pack
 * that can show the wrong ones.
 */

import { CASES, CASE_ORDER, PREAMBLE } from './cases.js';

const { PROJECTS, HARD_PARTS, BENEFIT, EXCLUDED, SPEND, RATES, EVIDENCE, MEASURED_ON } = PORTFOLIO;

const byId = new Map(PROJECTS.map((project) => [project.id, project]));

const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const num = (n) => Number(n).toLocaleString('en-US');

/** Cases that map to a measured repository. CS-06 is a control layer, not a
    codebase, so it is not one of them. */
const measuredIds = CASE_ORDER.filter((id) => !CASES[id].standalone);

const el = (tag, className, html) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
};

const list = (items, className) => {
  const ul = el('ul', className || 'tight');
  items.forEach((item) => ul.append(el('li', null, item)));
  return ul;
};

/** One schema row: the field name on the left, its content on the right. */
const field = (label, content, modifier) => {
  const row = el('div', modifier ? `field field--${modifier}` : 'field');
  row.append(el('dt', null, label));
  const dd = el('dd');
  (Array.isArray(content) ? content : [content]).forEach((part) => {
    dd.append(typeof part === 'string' ? el('p', null, part) : part);
  });
  row.append(dd);
  return row;
};

const figures = (entries) => {
  const dl = el('dl', 'figures');
  entries.forEach(({ label, value, small }) => {
    const cell = el('div');
    cell.append(el('dt', null, label));
    cell.append(el('dd', small ? 'small' : null, value));
    dl.append(cell);
  });
  return dl;
};

/* ── tokens ─────────────────────────────────────────────────────────────── */

const tokensFor = (repo) => {
  if (!repo) return {};
  const sql = (repo.byExtension || []).find((row) => row.ext === '.sql');
  return {
    files: num(repo.files),
    loc: num(repo.linesTotal),
    code: num(repo.linesCode),
    commits: num(repo.commits),
    activeDays: num(repo.activeDays),
    testFiles: num(repo.testFiles),
    tests: repo.suite ? num(repo.suite.passed) : null,
    sqlFiles: sql ? num(sql.files) : null,
    sqlLines: sql ? num(sql.lines) : null,
  };
};

const fill = (text, tokens) =>
  text.replace(/\{(\w+)\}/g, (whole, key) => (tokens[key] == null ? whole : `<b>${tokens[key]}</b>`));

/* ── the pack ───────────────────────────────────────────────────────────── */

const statusClass = (status) => {
  const value = (status || '').toLowerCase();
  return value.includes('production') || value.includes('live') ? 'live' : 'use';
};

function renderCase(id, evidence) {
  const spec = CASES[id];
  const project = byId.get(id);
  const repo = (evidence.repos || []).find((row) => row.id === id);
  const tokens = tokensFor(repo);

  const name = spec.name || project.name;
  const cat = spec.cat || project.cat;
  const stack = spec.stack || project?.stack || [];
  const status = spec.status || project?.status || '';
  // Only a declared open risk in js/data.js changes the status pill. A flagged
  // risk is not the same thing: CS-01 carries a flag about a measurement that
  // could not be taken, which says nothing about whether the system is gated.
  const openRisk = Boolean(project?.openRisk);

  const article = el('article', 'case');
  article.id = spec.ref.toLowerCase();

  /* — head — */
  const head = el('div', 'case-head');
  const meta = el('div', 'case-meta');
  meta.append(el('span', 'id', spec.ref));
  meta.append(el('span', null, cat));
  if (repo) {
    meta.append(el('span', null,
      `${repo.firstCommit} to ${repo.lastCommit} · ${tokens.activeDays} active days`));
  }
  meta.append(el('span', `pill pill--${openRisk ? 'gate' : statusClass(status)}`,
    openRisk ? 'Live — access control open' : status));
  head.append(meta);

  const title = el('h3', null, name);
  title.append(el('span', 'type', spec.subtitle));
  head.append(title);
  article.append(head);

  /* — the twelve blocks — */
  const schema = el('dl', 'schema');

  schema.append(field('Business problem', spec.problem));
  schema.append(field('Objective', spec.objective));
  schema.append(field('Input data', spec.inputs));

  const techBlock = [el('p', 'stack', stack.join(' · '))];
  if (spec.techNote) techBlock.push(el('p', 'stack stack--note', spec.techNote));
  schema.append(field('Technology', techBlock));

  schema.append(field('Solution delivered', spec.delivered.map((line) => fill(line, tokens))));

  /* Impact: the stated figures, then the money, then the levers. The money is
     appended here rather than written into js/cases.js so that the page and
     the ledger cannot disagree about what a system is worth. */
  const impact = [];
  const cells = [...spec.impact];
  if (project?.benefit?.annualUsd) {
    cells.push({ label: 'Modelled annual benefit', value: usd(project.benefit.annualUsd) });
    if (project.benefit.cashUsd) {
      cells.push({ label: 'Cash component', value: usd(project.benefit.cashUsd) });
    }
  }
  impact.push(figures(cells));

  if (project?.benefit?.levers?.length) {
    const scroller = el('div', 'scroller');
    const table = el('table', 'levers');
    table.innerHTML =
      '<thead><tr><th>Lever</th><th>Type</th><th class="num">Annual USD</th></tr></thead>';
    const body = el('tbody');
    project.benefit.levers.forEach((lever) => {
      const tr = el('tr');
      tr.append(el('td', null, lever.name));
      tr.append(el('td', 'kind', lever.kind === 'cash' ? 'Cash' : 'Freed hours'));
      tr.append(el('td', 'num', num(lever.annualUsd)));
      body.append(tr);
    });
    table.append(body);
    scroller.append(table);
    impact.push(scroller);
  }

  if (spec.impactNote) impact.push(el('p', 'caption', spec.impactNote));
  schema.append(field('Results / impact', impact, 'impact'));

  schema.append(field('Other business value', list(spec.value)));
  schema.append(field('Sustainability / control', spec.control));

  const statusLine = project?.url
    ? `${status} — <a href="${project.url}" rel="noopener">${project.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>`
    : `${status}${spec.standalone ? '' : ' — internal tool, no public URL'}`;
  schema.append(field('Status', statusLine));

  const risk = [];
  if (spec.risks.flag) {
    const flag = el('div', 'flag');
    flag.append(el('b', null, spec.risks.flag.title));
    flag.append(el('span', null, spec.risks.flag.body));
    risk.push(flag);
  }
  risk.push(list(spec.risks.items));
  schema.append(field('Risk &amp; limitations', risk, 'risk'));

  schema.append(field('Next improvements', list(spec.next)));
  article.append(schema);

  /* — the hard parts, in full, from js/data.js — */
  const notes = HARD_PARTS.filter((entry) => entry.system === name);
  if (notes.length) {
    const wrap = el('div', 'eng');
    wrap.append(el('h4', null, notes.length > 1
      ? 'Engineering notes — the data problems solved'
      : 'Engineering note — the data problem solved'));
    notes.forEach((entry) => {
      const note = el('div', 'prob');
      note.append(el('h5', null, entry.title));
      const dl = el('dl');
      [['Problem', entry.problem], ['Why it is hard', entry.whyHard], ['Built', entry.built]]
        .forEach(([label, text]) => {
          const cell = el('div');
          cell.append(el('dt', null, label));
          cell.append(el('dd', null, text));
          dl.append(cell);
        });
      note.append(dl);
      const cites = el('div', 'evidence');
      entry.evidence.forEach((path) => cites.append(el('span', 'path', path)));
      note.append(cites);
      wrap.append(note);
    });
    article.append(wrap);
  }

  return article;
}

/* ── the chart ──────────────────────────────────────────────────────────── */

function renderChart(mount) {
  const rows = measuredIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((project) => ({
      name: project.name,
      total: project.benefit?.annualUsd ?? 0,
      cash: project.benefit?.cashUsd ?? 0,
    }))
    .sort((a, b) => b.total - a.total);

  const max = Math.max(...rows.map((row) => row.total));
  const chart = el('div', 'chart');

  rows.forEach((row) => {
    const line = el('div', 'crow');
    line.append(el('span', 'name', row.name));
    const track = el('span', 'track');
    if (row.total > 0) {
      const bar = el('span', 'bar');
      bar.style.width = `${(row.total / max) * 100}%`;
      if (row.cash > 0) {
        const cash = el('span', 'seg seg--cash');
        cash.style.width = `${(row.cash / row.total) * 100}%`;
        bar.append(cash);
      }
      const hours = el('span', 'seg seg--hours');
      hours.style.width = `${((row.total - row.cash) / row.total) * 100}%`;
      bar.append(hours);
      track.append(bar);
    }
    line.append(track);
    line.append(el('span', row.total ? 'val' : 'val val--zero', usd(row.total)));
    chart.append(line);
  });

  mount.append(chart);

  const shown = rows.reduce((sum, row) => sum + row.total, 0);
  const cash = rows.reduce((sum, row) => sum + row.cash, 0);

  const axis = el('div', 'axis');
  [0, max / 2, max].forEach((tick, index) => {
    axis.append(el('span', null, index === 0 ? '0' : num(Math.round(tick))));
  });
  mount.append(axis);

  const legend = el('div', 'legend');
  legend.innerHTML =
    `<span><i class="swatch swatch--cash"></i> Cash — ${usd(cash)}</span>` +
    `<span><i class="swatch swatch--hours"></i> Freed hours — ${usd(shown - cash)}</span>`;
  mount.append(legend);

  const zero = rows.find((row) => row.total === 0);
  if (zero) {
    mount.append(el('p', 'note',
      `${zero.name} carries <b>no lever of its own by design</b>. It protects the catalogue ` +
      'quality every other lever depends on; assigning it a number would double-count savings ' +
      'already claimed by the systems downstream of it. Its measured outputs stand as the ' +
      'evidence instead.'));
  }

  return { shown, cash };
}

/* ── boot ───────────────────────────────────────────────────────────────── */

async function main() {
  const root = document.getElementById('pack');
  const evidence = await fetch('evidence.json', { cache: 'no-cache' }).then((r) => r.json());

  const live = (evidence.repos || []).filter((repo) => measuredIds.includes(repo.id));
  const total = (pick) => live.reduce((sum, repo) => sum + (pick(repo) || 0), 0);

  /* — masthead — */
  document.getElementById('pack-title').textContent = PREAMBLE.title;
  document.getElementById('pack-standfirst').textContent = PREAMBLE.standfirst;
  document.getElementById('measured-on').textContent = `Figures measured ${evidence.generatedAt}`;

  const shownBenefit = measuredIds.reduce(
    (sum, id) => sum + (byId.get(id)?.benefit?.annualUsd ?? 0), 0);

  const strip = document.getElementById('totals');
  [
    { label: 'Systems in scope', value: String(CASE_ORDER.length), note: `${measuredIds.length} tools + 1 control layer` },
    { label: 'Authored lines', value: num(total((r) => r.linesTotal)), note: `git ls-files · ${num(total((r) => r.files))} files` },
    { label: 'Tests passing', value: num(total((r) => r.suite?.passed)), note: 'as each runner reported' },
    { label: 'Commits', value: num(total((r) => r.commits)), note: `over ${num(total((r) => r.activeDays))} active days` },
    { label: 'Modelled benefit', value: usd(shownBenefit), note: 'per year · systems shown' },
    { label: 'Tooling spend', value: usd(SPEND.actualUsd), note: `per month · ${SPEND.label}` },
  ].forEach(({ label, value, note }) => {
    const cell = el('div');
    cell.append(el('dt', null, label));
    cell.append(el('dd', null, `${value}<small>${note}</small>`));
    strip.append(cell);
  });

  /* — how to read the figures — */
  const reading = document.getElementById('reading');
  PREAMBLE.reading.forEach((paragraph) => reading.append(el('p', 'note', paragraph)));
  reading.append(el('p', 'note',
    `Hours are priced at ${usd(RATES.ownerHourly)} an hour, from a ${usd(RATES.ownerMonthlySalary)} ` +
    `month over ${RATES.hoursPerMonth} hours. The source model puts the base case at ` +
    `<b>${usd(BENEFIT.baseAnnual)} a year across ${EXCLUDED.sourceSystems} systems</b>. This pack ` +
    `shows ${measuredIds.length} tools; the remaining one — ${EXCLUDED.name.toLowerCase()}, worth ` +
    `${usd(EXCLUDED.annualUsd)} — is excluded because it was ${EXCLUDED.reason}. Every total here ` +
    `is summed from what is actually shown, which is why it reads ${usd(shownBenefit)} and not ` +
    `${usd(EXCLUDED.sourceTotal)}.`));

  renderChart(document.getElementById('benefit-chart'));

  /* — rail and cases — */
  const rail = document.getElementById('rail-list');
  CASE_ORDER.forEach((id) => {
    const spec = CASES[id];
    const name = spec.name || byId.get(id)?.name || id;
    const item = el('li');
    item.innerHTML =
      `<a href="#${spec.ref.toLowerCase()}"><span class="id">${spec.ref}</span><span>${name}</span></a>`;
    rail.append(item);
  });

  CASE_ORDER.forEach((id) => root.append(renderCase(id, evidence)));

  /* — footer — */
  document.getElementById('method').innerHTML =
    `${EVIDENCE.method} Measured ${evidence.generatedAt}; the money is quoted from ` +
    `${BENEFIT.source} and is not measurable from a repository. ` +
    '<a href="evidence.json" download>Download the file these figures came from</a>, or ' +
    '<a href="/evidence.html">read the written portfolio</a>.';

  document.documentElement.dataset.packReady = 'true';
  if (evidence.generatedAt !== MEASURED_ON) {
    console.warn(`dossier: evidence.json is ${evidence.generatedAt}, js/data.js says ${MEASURED_ON}`);
  }
}

main().catch((error) => {
  const fallback = document.getElementById('pack-error');
  if (fallback) fallback.hidden = false;
  console.error('dossier: could not render the pack', error);
});

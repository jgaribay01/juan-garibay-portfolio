/**
 * Re-measures every engineering figure this site claims.
 *
 * The line counts, commit counts and test counts in js/data.js were originally
 * taken by hand, once. That is why they could not be re-checked: `check.mjs`
 * proves the page agrees with the data file, but nothing proved the data file
 * agreed with the disk. A number can be perfectly consistent everywhere and
 * still be wrong, and this project has already shipped two that were.
 *
 * This script is the missing half. It re-derives the figures from the repos
 * themselves so a re-measurement is one command instead of an afternoon.
 *
 *   node measure.mjs            compare the repos against js/data.js
 *   node measure.mjs --json     emit the raw measurements
 *
 * THE COUNTING RULE
 *
 * Authored source only: no dependencies, no build output, no vendored copies,
 * no generated files, no notes, no data files, no agent scratch.
 *
 * The basis is `git ls-files`, not a directory walk, and that choice does most
 * of the work: it excludes node_modules, dist and untracked scratch for free.
 * It matters more than it sounds. Walking the Rutero tree finds 4,435 test
 * cases, but 3,168 of them live in `.claude/worktrees` — copies of the suite
 * made by agents working in parallel. A filesystem count would have inflated
 * the headline test figure nearly four-fold.
 *
 * Two line totals are reported because they answer different questions and the
 * site has to name which one it means. `linesTotal` counts every physical line;
 * `linesCode` drops blank lines and whole-line comments. They differ by about a
 * quarter, which is why the site states its method next to the number.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, relative, sep } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const HOME = process.env.HOME;

/** Source we wrote. Everything else is excluded by omission, not by blocklist. */
const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.swift', '.py', '.rb', '.go', '.rs', '.java', '.kt',
  '.sql', '.sh', '.bash', '.zsh',
  '.css', '.scss', '.html', '.gs', '.vue', '.svelte',
]);

/**
 * Path prefixes that are never authored source, in any repo.
 *
 * The Obsidian entries are not paranoia: the Rutero repository has a personal
 * knowledge vault committed at its root, so `00 Atlas/`, `01 Projects/` and
 * their siblings sit alongside the application. They are notes. Counting them
 * as engineering output would be the most flattering possible error, which is
 * exactly why it is named here rather than left to judgement.
 */
const ALWAYS_EXCLUDE = [
  'node_modules/', 'vendor/', 'third_party/', 'bower_components/',
  'dist/', 'build/', 'out/', '.next/', '.nuxt/', 'coverage/', '.vercel/',
  // All of `.claude/`, deliberately. Some of what lives there is authored —
  // guard hooks, SQL run-books — and excluding it makes these numbers smaller
  // than they could be. It is still the right call: it is tooling around the
  // product rather than the product, the same judgement is applied to every
  // repo, and the alternative invites arguing each directory upward one at a
  // time. It also removes any question about the agent worktrees underneath it.
  '.claude/', '.agents/', '.codex/', '.playwright-mcp/', '.xcodebuildmcp/',
  '.obsidian/', '.github/', '.githooks/',
  'backups/', 'test-results/', 'playwright-report/',
  '00 Atlas/', '01 Projects/', '02 Areas/', '03 Resources/', '04 ', '05 Graphs/',
  '06 Maps/', '07 Templates/', '08 Daily/', '09 Canvases/', '90 System/',
  // Design Composer exports its own design-system bundle next to the page it
  // produced. `_ds/` is that bundle; `design-ref/` is where one repo parks the
  // whole export.
  '_ds/', 'design-ref/',
  // The web app is built to a single file and synced into the native shells by
  // `npm run sync:mac` and `sync:ios`. Those are build output that happens to
  // live in the source tree — the same app already counted under app/.
  'Resources/Web/',
];

/**
 * A Design Composer export duplicates the page it came from.
 *
 * In the TDV quoting tool, `index.html` and `Cotizador TDV v8.dc.html` are
 * byte-identical — same md5, 2,353 lines each. Counting both does not measure
 * twice as much work, it measures the same work twice, and it would have
 * doubled that project's entire line count.
 */
const EXPORT_DUPLICATE = /\.dc\.html$/i;

/**
 * Generated, vendored or minified, judged by filename.
 *
 * `_generated_` earns its place: one migration is named
 * `..._generated_territories_and_routes.sql` and is 624 lines of which 468 are
 * literal customer-roster tuples emitted by a script. A pattern matching only
 * `.generated.` with dots walked straight past it.
 */
const GENERATED_NAME =
  /(\.min\.(js|css)|\.bundle\.|_bundle\.|-lock\.|\.d\.ts$|\.generated\.|_generated_|\.production\.)/i;

/**
 * Generated, judged by what the file says about itself.
 *
 * Filename rules are not enough and this is not hypothetical. The same 1,911
 * line file ships as `design-ref/support.js`, `support.js` and
 * `public/support.js` across three of these repos — an innocent name, an
 * ordinary extension, and a first line reading "GENERATED from dc-runtime —
 * do not edit". Counted by name alone it added 1,911 lines to three different
 * projects, which is most of what two of them appear to be.
 *
 * The same applies to a file that names its own origin. One stylesheet opens
 * "design system (importado de Claude Design)" — it was imported, so it is not
 * authored source here, whatever the filename suggests.
 *
 * These markers have to be specific. An earlier version also matched the
 * English "imported from", which threw away an authored test helper whose
 * header comment happened to say a file was "kept separate rather than
 * imported from there". A rule that silently deletes real work is worse than
 * one that misses a copy.
 */
const GENERATED_HEADER =
  /^(?:.{0,200}\n){0,5}?.{0,200}(@generated|GENERATED from|do not edit|DO NOT EDIT|Auto-generated|autogenerated|importado de)/i;

/**
 * A line so long it cannot have been typed. Catches bundled or minified files
 * that carry an innocent extension and would otherwise dominate a line count.
 */
const MACHINE_LINE = 2000;

const REPOS = [
  { id: 'rutero-tdv', path: `${HOME}/Documents/OPTIMIZADOR DE RUTAS` },
  { id: 'cotizador-tdv', path: `${HOME}/Documents/Cotizador TDV v8` },
  { id: 'data-triage-center', path: `${HOME}/Documents/Data Triage Center` },
  { id: 'tdv-outbound-log', path: `${HOME}/tdv-outbound-log` },
  { id: 'cotizador-farmers-fresh', path: `${HOME}/Documents/Cotizador Farmers Fresh` },
  { id: 'currents', path: `${HOME}/Documents/Projects/currents` },
];

const git = (cwd, args) => {
  try {
    return execFileSync('git', ['-C', cwd, ...args], {
      encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

const isExcluded = (rel) => {
  const norm = rel.split(sep).join('/');
  // Match anywhere in the path, not just at the front. `Resources/Web/` sits
  // several levels down, and a nested node_modules is normal — anchoring at
  // position 0 silently excluded neither.
  if (ALWAYS_EXCLUDE.some((p) => norm === p.slice(0, -1) || norm.startsWith(p) || norm.includes(`/${p}`))) return true;
  if (GENERATED_NAME.test(norm)) return true;
  if (EXPORT_DUPLICATE.test(norm)) return true;
  return false;
};

/** Every file under a directory, for repos with no git history to ask. */
async function walk(root, acc = [], base = root) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(root, entry.name);
    const rel = relative(base, full);
    if (isExcluded(entry.isDirectory() ? `${rel}/` : rel)) continue;
    if (entry.name === '.git') continue;
    if (entry.isDirectory()) await walk(full, acc, base);
    else acc.push(rel);
  }
  return acc;
}

/** Blank lines and whole-line comments are not code, but they are lines. */
function countLines(absolute) {
  let text;
  try {
    text = readFileSync(absolute, 'utf8');
  } catch {
    return null;
  }
  if (GENERATED_HEADER.test(text)) return { machine: true };
  const lines = text.split('\n');
  // A trailing newline yields a final empty element that is not a line.
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  if (lines.some((l) => l.length > MACHINE_LINE)) return { machine: true };
  let code = 0;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^(\/\/|#(?!!)|--|\/\*|\*\/|\*)/.test(t)) continue;
    code += 1;
  }
  return { total: lines.length, code, machine: false };
}

/**
 * Run the suite and read the number off the runner.
 *
 * "Tests passing" has to mean the tests were run. Counting `it(` and `test(`
 * with a regex looked close enough and was not: on Currents it gave 284 here
 * and 312 from a second implementation, while the runner reports 300. Regexes
 * miss `test.each`, count commented-out cases, and cannot know which files the
 * `npm test` script actually includes.
 *
 * Returns null when a project has no suite, which is different from zero and
 * is displayed differently: "no suite" rather than a count of none.
 */
function runSuite(repoPath) {
  const pkgPaths = [join(repoPath, 'package.json'), join(repoPath, 'app', 'package.json')];
  for (const pkgPath of pkgPaths) {
    if (!existsSync(pkgPath)) continue;
    let pkg;
    try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); } catch { continue; }
    if (!pkg.scripts?.test) continue;
    const cwd = dirname(pkgPath);
    let output;
    try {
      output = execFileSync('npm', ['test', '--silent'], {
        cwd, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'], timeout: 600_000,
      });
    } catch (error) {
      // A failing suite still reports its totals; a suite that cannot start does not.
      output = `${error.stdout || ''}${error.stderr || ''}`;
    }
    // vitest: "Tests  1228 passed (1228)"   node:test: "ℹ pass 300" / "ℹ fail 0"
    const vitest = output.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
    if (vitest) return { passed: Number(vitest[1]), total: Number(vitest[2]), runner: 'vitest', cwd };
    const pass = output.match(/^[^\n]*\bpass\s+(\d+)/m);
    const fail = output.match(/^[^\n]*\bfail\s+(\d+)/m);
    if (pass) {
      const passed = Number(pass[1]);
      const failed = fail ? Number(fail[1]) : 0;
      return { passed, total: passed + failed, runner: 'node:test', cwd };
    }
    return { passed: null, total: null, runner: 'unknown', cwd, output: output.slice(-400) };
  }
  return null;
}

/**
 * Static count, kept only as a cross-check on the runner. Where the two
 * disagree the runner wins — it is the one that actually executed something.
 */
function countTestCases(absolute) {
  let text;
  try {
    text = readFileSync(absolute, 'utf8');
  } catch {
    return 0;
  }
  return (text.match(/^[ \t]*(?:it|test)(?:\.\w+)?[ \t]*\(/gm) || []).length;
}

const isTestFile = (rel) =>
  /\.(test|spec)\.[jt]sx?$/.test(rel) ||
  /(^|\/)(tests?|e2e|__tests__)\//.test(rel) ||
  // Currents names its suites `tools/test-deck.mjs`. A regex looking only for
  // `.test.` found zero of its 300-odd cases and reported the project as
  // having no tests at all.
  /(^|\/)test-[\w-]+\.(mjs|cjs|[jt]sx?)$/.test(rel);

async function measure(repo) {
  if (!existsSync(repo.path)) return { ...repo, missing: true };

  /**
   * Content already counted in this repo, by hash.
   *
   * Copies are the dominant source of inflation here and no filename rule
   * catches them all. One project keeps `index.html` and a byte-identical
   * `.dc.html` export beside it; another commits the same built bundle under
   * both the Mac and the iOS shell, plus three more copies of an older version
   * of itself. Hashing the content counts the work once no matter what the
   * copies are called.
   */
  const seenContent = new Set();
  const duplicates = [];

  const tracked = git(repo.path, ['ls-files']);
  const basis = tracked === null ? 'filesystem walk' : 'git ls-files';
  const files = tracked === null
    ? await walk(repo.path)
    : tracked.split('\n').filter(Boolean).filter((f) => !isExcluded(f));

  const source = files.filter((f) => SOURCE_EXTENSIONS.has(extname(f).toLowerCase()));

  let linesTotal = 0;
  let linesCode = 0;
  const byExtension = new Map();
  const machineGenerated = [];

  for (const rel of source) {
    const abs = join(repo.path, rel);
    if (!existsSync(abs) || !statSync(abs).isFile()) continue;
    const counted = countLines(abs);
    if (!counted) continue;
    if (counted.machine) { machineGenerated.push(rel); continue; }
    const hash = createHash('sha1').update(readFileSync(abs)).digest('hex');
    if (seenContent.has(hash)) { duplicates.push(rel); continue; }
    seenContent.add(hash);
    linesTotal += counted.total;
    linesCode += counted.code;
    const ext = extname(rel).toLowerCase();
    const bucket = byExtension.get(ext) || { files: 0, lines: 0 };
    bucket.files += 1;
    bucket.lines += counted.total;
    byExtension.set(ext, bucket);
  }

  const testFiles = source.filter(isTestFile);
  const testCasesStatic = testFiles.reduce((sum, rel) => sum + countTestCases(join(repo.path, rel)), 0);
  const suite = process.argv.includes('--no-tests') ? null : runSuite(repo.path);
  const testCases = suite?.passed ?? null;

  const log = git(repo.path, ['log', '--format=%as']);
  const dates = log ? log.split('\n').filter(Boolean) : [];
  const uniqueDays = new Set(dates);
  const authors = git(repo.path, ['shortlog', '-sne', 'HEAD']);

  return {
    id: repo.id,
    path: repo.path,
    basis,
    files: source.length - machineGenerated.length,
    linesTotal,
    linesCode,
    byExtension: [...byExtension.entries()]
      .map(([ext, v]) => ({ ext, ...v }))
      .sort((a, b) => b.lines - a.lines),
    machineGenerated,
    duplicates,
    testFiles: testFiles.length,
    testCases,
    testCasesStatic,
    suite,
    commits: dates.length || null,
    firstCommit: dates.length ? dates[dates.length - 1] : null,
    lastCommit: dates.length ? dates[0] : null,
    activeDays: uniqueDays.size || null,
    authors: authors ? authors.split('\n').map((l) => l.trim()) : [],
  };
}

const results = [];
for (const repo of REPOS) results.push(await measure(repo));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

// — compare against what the site currently claims —
const dataSource = readFileSync(join(here, 'js', 'data.js'), 'utf8');
// eslint-disable-next-line no-eval
const P = (0, eval)(`${dataSource}\nPORTFOLIO;`);
const claimed = new Map(P.PROJECTS.map((p) => [p.id, p]));

const n = (v) => (v === null || v === undefined ? '—' : v.toLocaleString('en-US'));
const pad = (v, w) => String(v).padStart(w);

console.log(`\nmeasured ${new Date().toISOString().slice(0, 10)} — site claims measured ${P.MEASURED_ON}\n`);
console.log(
  `  ${'project'.padEnd(24)}${pad('claimed', 9)}${pad('lines', 9)}${pad('code', 9)}` +
  `${pad('commits', 9)}${pad('claimed', 9)}${pad('tests', 8)}${pad('claimed', 8)}  basis`,
);

let drifted = 0;
for (const r of results) {
  if (r.missing) { console.log(`  ${r.id.padEnd(24)} REPO NOT FOUND at ${r.path}`); drifted += 1; continue; }
  const c = claimed.get(r.id);
  const flag = (a, b) => (a === null || b === null || b === undefined ? ' ' : a === b ? ' ' : '*');
  const mark = [flag(r.linesTotal, c?.loc), flag(r.commits, c?.commits), flag(r.testCases, c?.tests)]
    .some((m) => m === '*') ? '*' : ' ';
  if (mark === '*') drifted += 1;
  console.log(
    `${mark} ${r.id.padEnd(24)}${pad(n(c?.loc), 9)}${pad(n(r.linesTotal), 9)}${pad(n(r.linesCode), 9)}` +
    `${pad(n(r.commits), 9)}${pad(n(c?.commits), 9)}${pad(n(r.testCases), 8)}${pad(n(c?.tests), 8)}  ${r.basis}`,
  );
}

console.log(`\n  '*' marks a figure that no longer matches js/data.js.`);
for (const r of results) {
  if (r.missing) continue;
  if (r.machineGenerated.length) {
    console.log(`  ${r.id}: skipped ${r.machineGenerated.length} machine-generated file(s): ${r.machineGenerated.slice(0, 3).join(', ')}`);
  }
  if (r.duplicates.length) {
    console.log(`  ${r.id}: skipped ${r.duplicates.length} byte-identical duplicate(s): ${r.duplicates.slice(0, 3).join(', ')}`);
  }
  if (r.authors.length > 1) {
    console.log(`  ${r.id}: ${r.authors.length} author identities — ${r.authors.join(' | ')}`);
  }
}

console.log(
  drifted
    ? `\nmeasure: ${drifted} project(s) out of step with js/data.js. Update it, then run npm run check.\n`
    : `\nmeasure: js/data.js matches the repos.\n`,
);

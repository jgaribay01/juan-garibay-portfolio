/**
 * Portfolio data — single source of truth.
 *
 * Re-measured 2026-08-18 from git history and the file system. Line counts use
 * one fixed method across all seven records: authored .ts/.tsx/.js/.jsx/.py/
 * .html/.css/.sql only, excluding node_modules, build output, coverage, caches,
 * third-party libraries and tool-generated files. Counting any other way moves
 * these figures by up to 3x, so the method travels with the number.
 * Several systems are still under active development: figures are a snapshot,
 * not a ceiling. Ported from ~/portfolio/assets/js/data.js.
 *
 * Honesty rules kept from the source file:
 *  - `measured` fields come from git / disk. Nothing rounded up.
 *  - `estimatedBuildHours` is a stated judgement, with `estimateBasis` attached
 *    so a reader can argue with it instead of guessing.
 *  - Traditional cost = estimatedBuildHours x HOURLY_RATE. Nothing else.
 */

const PORTFOLIO = (() => {
  'use strict';

  const MEASURED_ON = '2026-08-18';

  /** US contract developer rate, public market range 2026. Retained for the
      build-cost figures, which are no longer the page's headline argument. */
  const HOURLY_RATE = 95;

  /**
   * What an hour of the reclaimed time actually costs the business.
   *
   * Two kinds of time are saved: the owner's and warehouse/admin staff's.
   * Every figure on this page is priced at the OWNER rate, which is the lower
   * of the two — so the stated saving is the conservative floor. The same
   * hours valued at the staff rate would be worth materially more.
   */
  const RATES = {
    ownerMonthlySalary: 2500,
    hoursPerMonth: 173.3,
    get ownerHourly() {
      return this.ownerMonthlySalary / this.hoursPerMonth;
    },
    staffLow: 20,
    staffHigh: 30,
    basis:
      'Owner salary of $2,500/month ($30,000/year) over a 173.3-hour month is $14.43/hour. ' +
      'Source: FUENTE_DE_VERDAD.md, 13 August 2026 — the meeting package\'s single source of ' +
      'truth. No figure appears on this page that is not in that file or measured from disk.',
  };

  /**
   * Recurring benefit, taken lever by lever from FUENTE_DE_VERDAD.md section 3.
   * The base case totals $30,748/year. Two things this model does that a simple
   * hours-saved figure does not:
   *
   *  - It separates CASH ($11,412 — fuel and avoided shelf licences) from FREED
   *    HOURS ($18,506). Freed hours only become money if they are redeployed
   *    into more stops, less overtime, or work that is not getting done today.
   *  - It carries a range, because several inputs are still low-confidence and
   *    have measurement dates booked against them.
   */
  const BENEFIT = {
    conservativeAnnual: 19876,
    baseAnnual: 30748,
    optimisticAnnual: 43458,
    cashAnnual: 11412,
    freedHoursAnnual: 18506,
    source: 'FUENTE_DE_VERDAD.md §3, 13 August 2026',
    caveat:
      'Freed hours are not cash until they are redeployed. Several inputs (miles per route, ' +
      'driving hours, cost per mile) are rated low confidence with measurement dates of 21 and ' +
      '28 August; OIS and quoting volumes are measured 11 September.',
  };

  /** What replacing this capability would cost, per FUENTE_DE_VERDAD.md §5. */
  const REPLACEMENT = {
    juanYear1: 30000, juanYear3: 90000,
    agencyYear1: 315000, agencyYear3: 441000,
    employeeYear1: 180550, employeeYear3: 491050,
    agencyMaintenanceAnnual: 63000,
    rampMonths: '13 to 15',
    payingPercentOfSalary: 102,
  };

  /** One-off costs already avoided, per §4. Market value, NOT cash saved. */
  const AVOIDED = {
    conservative: 122872,
    base: 158184,
    warning:
      'Market value of what has already been delivered, not cash that left the business. ' +
      'Never added to the recurring benefit.',
  };

  /**
   * Actual tooling spend: one month of Claude Max 20x, confirmed by the owner.
   * `apiListEquivalentUsd` is not an estimate — it is every retained assistant
   * turn on this machine priced at published per-model API list rates
   * (input, output, cache write at 1.25x input, cache read at 0.1x input).
   */
  const SPEND = {
    actualUsd: 200,
    label: 'Claude Max 20x',
    apiListEquivalentUsd: 1918,
  };

  /**
   * Measured from the Claude Code transcripts on this machine, 2026-08-07.
   *
   * Caveat kept deliberately visible: 96% of this usage was logged with the
   * home directory as the working directory, so it CANNOT be split per
   * project. These are machine-wide totals for all work in the window, not
   * the five tools alone.
   */
  const COST = {
    from: '2026-07-02',
    to: '2026-08-07',
    activeDays: 33,
    sessions: 551,
    assistantTurns: 9661,
    toolCalls: 4690,
    engagedHours: 28.8,
    outputTokens: 8_709_920,
    promptTokens: 1_911_668_078,
    cacheReadTokens: 1_811_765_933,
    byModel: [
      { model: 'Claude Opus 4.8', usd: 717 },
      { model: 'Claude Fable 5', usd: 704 },
      { model: 'Claude Opus 5', usd: 280 },
      { model: 'Claude Sonnet 5', usd: 205 },
      { model: 'Claude Haiku 4.5', usd: 10 },
      { model: 'Claude Sonnet 4.6', usd: 2 },
    ],
    caveat:
      'Machine-wide totals. 96% of the logged usage ran with the home directory as the ' +
      'working directory, so it cannot be attributed to individual projects — this covers ' +
      'all work in the window, not only the five tools above.',
  };

  /**
   * Transcript caveats only. The session and turn counts live in COST above and
   * are quoted from there in both places they appear, so sections 03 and 04 can
   * never drift apart.
   */
  const EVIDENCE = {
    caveat:
      'Claude Code prunes old transcripts, so this window is a floor, not a lifetime total. ' +
      'Project timelines come from git history, which reaches further back.',
  };

  const PROJECTS = [
    {
      id: 'rutero-tdv',
      name: 'Rutero TDV',
      cat: 'Route operations',
      desc: 'Route planning, driver dispatch and field-sales prospecting for a real distribution fleet.',
      status: 'Live in production',
      url: 'https://rutero-tdv.vercel.app/',
      period: { from: '2026-07-08', to: '2026-08-17' },
      activeDays: 21,
      loc: 63036,
      commits: 267,
      tests: 1186,
      verified: '267 commits over 21 days, sole author (git shortlog), 18 Aug 2026',
      stack: ['TypeScript', 'React', 'Vite', 'Node', 'Supabase', 'Docker', 'Mapbox', 'Vercel'],
      estimatedBuildHours: 480,
      estimateBasis:
        'Three role-scoped front ends, an authenticated Node sync service, containerised deploy, ' +
        'bilingual UI and 1,186 tests. Costed as one full-stack developer for three months at 40 h/week.',
      before: 'Routes drawn by hand every morning',
      after: 'One build, three apps: driver, sales, admin',
      benefit: {
        annualUsd: 25324,
        cashUsd: 11412,
        levers: [
          { name: 'Driving hours', annualUsd: 11000, kind: 'hours' },
          { name: 'Fuel and wear', annualUsd: 7500, kind: 'cash' },
          { name: 'Shelf licences avoided', annualUsd: 3912, kind: 'cash' },
          { name: 'Supervision hours', annualUsd: 2912, kind: 'hours' },
        ],
        was: '2 hours every morning',
        now: 'about 15 minutes',
      },
      image: 'img/rutero-hero.webp',
      imageSize: { width: 900, height: 562 },
      imageAlt:
        'Rutero TDV guided setup screen, showing the four-step workspace activation flow. ' +
        'The username field is blurred.',
    },
    {
      id: 'cotizador-tdv',
      name: 'Cotizador TDV v8',
      cat: 'Logistics quoting',
      desc: 'Generates priced logistics quotes and exports them straight to PDF.',
      status: 'Live in production',
      // Verified 2026-08-07: HTTP 200, serves the real app.
      url: 'https://cotizador-logistico-tdv-deploy.vercel.app/',
      period: { from: '2026-07-29', to: '2026-08-03' },
      activeDays: 6,
      loc: 2590,
      commits: null,
      tests: null,
      verified: 'Authored on this machine, 2026-07-29 to 2026-08-03; no version control',
      stack: ['React', 'jsPDF', 'Vercel'],
      estimatedBuildHours: 90,
      estimateBasis:
        'Pricing engine, 13-column dense catalogue table, print and PDF output paths.',
      before: 'Quotes retyped into a spreadsheet',
      after: 'Priced quote to PDF in one view',
      benefit: {
        // FUENTE carries one quoting lever ($1,188) covering both cotizadores.
        // Split evenly rather than assigned to whichever looks better alone.
        annualUsd: 594,
        cashUsd: 0,
        levers: [{ name: 'Quoting time (half of the shared lever)', annualUsd: 594, kind: 'hours' }],
        was: 'quotes retyped into a spreadsheet',
        now: 'minutes per quote',
      },
      image: 'img/cotizador-hero.webp',
      imageSize: { width: 900, height: 562 },
      imageAlt:
        'Cotizador TDV v8 primary-costs screen: Mexico to McAllen leg with freight, customs and ' +
        'insurance line items in MXN and USD. Commercially sensitive figures are blurred.',
    },
    {
      id: 'data-triage-center',
      name: 'Data Triage Center',
      cat: 'Catalogue triage',
      desc: 'Cleans product catalogue rows and validates UPCs, one keystroke at a time.',
      status: 'In use',
      url: null,
      period: { from: '2026-07-21', to: '2026-08-06' },
      activeDays: 2,
      loc: 1302,
      commits: 6,
      tests: null,
      verified: '6 commits over 2 days, sole author (git shortlog), 18 Aug 2026',
      stack: ['Vanilla JS', 'Google Apps Script', 'localStorage'],
      estimatedBuildHours: 40,
      estimateBasis:
        'Triage rules engine, barcode upload, offline-first UI and a Sheets write-back path.',
      before: 'Catalogue cleaned by hand, row by row',
      after: 'Save & Next keyboard flow, UPCs validated on entry',
      benefit: {
        // FUENTE assigns this system no lever of its own: it protects catalogue
        // quality, which the other levers depend on. Counting it again would
        // double-count. Its measured outputs are the evidence instead.
        annualUsd: 0,
        cashUsd: 0,
        levers: [],
        was: 'catalogue cleaned by hand, row by row',
        now: '276 SKUs with 0 empty critical fields, 0 formula errors',
      },
      image: 'img/dtc-hero.webp',
      imageSize: { width: 900, height: 562 },
      imageAlt:
        'Data Triage Center three-pane view: unresolved queue, the record being fixed with its ' +
        'missing-UPC flags, and the live workbook.',
    },
    {
      id: 'tdv-outbound-log',
      name: 'TDV Outbound Log',
      cat: 'Shipment logging',
      desc: 'Scans and logs outbound shipments against a barcode-indexed catalogue.',
      status: 'Live in production',
      // Verified 2026-08-07: HTTP 200, title "TDV Outbound Log".
      url: 'https://tdv-outbound-log.vercel.app/',
      period: { from: '2026-08-10', to: '2026-08-13' },
      activeDays: 2,
      loc: 1513,
      commits: 12,
      tests: null,
      verified: '12 commits over 2 days, sole author (git shortlog), 18 Aug 2026',
      stack: ['React', 'Vercel'],
      estimatedBuildHours: 20,
      estimateBasis: 'Single-screen scanning UI over a pre-built barcode index.',
      before: 'Paper and spreadsheet outbound logs',
      after: 'Scanned against the catalogue at the door',
      benefit: {
        annualUsd: 1650,
        cashUsd: 0,
        levers: [{ name: 'Warehouse close', annualUsd: 1650, kind: 'hours' }],
        was: 'paper and spreadsheet outbound logs',
        now: 'scanned against the catalogue at the door',
      },
      image: 'img/outbound-hero.webp',
      imageSize: { width: 900, height: 562 },
      imageAlt:
        'TDV Outbound Log scanning screen: barcode field, catalogue search and the day\'s movement ' +
        'list, with 361 products synced.',
    },
    {
      id: 'cotizador-farmers-fresh',
      name: 'Cotizador Farmers Fresh',
      cat: 'Logistics quoting',
      desc: 'A second quoting engine, rebuilt from scratch for a different importer and its lanes.',
      status: 'Live in production',
      // Verified 2026-08-13: HTTP 200, title "Cotizador Farmers Fresh · México → McAllen".
      url: 'https://cotizador-farmers-fresh.vercel.app/',
      period: { from: '2026-08-11', to: '2026-08-14' },
      activeDays: 4,
      loc: 2154,
      commits: 24,
      tests: null,
      verified: '24 commits over 4 days, sole author (git shortlog), 18 Aug 2026',
      stack: ['Vanilla JS', 'Google Sheets', 'PDF export', 'Vercel'],
      estimatedBuildHours: 60,
      estimateBasis:
        'Pricing engine, sheet sync, PDF output, a data migration path and its own design system.',
      before: 'A second importer quoted from spreadsheets',
      after: 'Its own quoting tool, shipped in three days',
      benefit: {
        annualUsd: 594,
        cashUsd: 0,
        levers: [{ name: 'Quoting time (half of the shared lever)', annualUsd: 594, kind: 'hours' }],
        was: 'a second importer quoting from spreadsheets',
        now: 'its own quoting tool',
      },
      // Declared open risk in FUENTE_DE_VERDAD §9: access control is not active.
      openRisk: 'Access control disabled — middleware pending FF_CLAVE. Client-side gate only.',
      // Deployed but gated: the public URL only exposes the sign-in screen, so
      // the card pairs that screen with what is behind it. The operator name in
      // the username field is blurred.
      image: 'img/ff-hero.webp',
      imageSize: { width: 900, height: 562 },
      imageAlt:
        'Cotizador Farmers Fresh shown in a browser frame at its live URL, on the team sign-in ' +
        'screen, beside its line count, commit count and feature list.',
    },
    {
      id: 'currents',
      name: 'Currents',
      // Recorded from the live app on 2026-08-21: onboarding, the card feed,
      // and the Learn view. No account, no business data — Currents is the one
      // build here that is public by design, which is why it is the one shown
      // moving. `preload: none`, so it costs nothing until someone asks for it.
      demo: {
        mp4: 'img/currents-demo.mp4',
        webm: 'img/currents-demo.webm',
        poster: 'img/currents-demo-poster.webp',
        label: 'Screen recording of Currents: choosing topics, reading cards in the feed, and the Learn view with streak and XP.',
      },
      cat: 'Consumer PWA',
      desc: 'A swipe-driven learning feed that installs to a phone home screen and works offline.',
      status: 'Live — installable',
      // Verified 2026-08-13: 200, title "Currents", with the manifest, service
      // worker and card content all serving. `currents.vercel.app` belongs to
      // someone else; this is the project's own alias.
      url: 'https://currents-weld.vercel.app/',
      period: { from: '2026-08-11', to: '2026-08-18' },
      activeDays: 7,
      loc: 9362,
      commits: 119,
      tests: null,
      verified: '119 commits over 7 days, sole author (git shortlog), 18 Aug 2026',
      stack: ['PWA', 'Service Worker', 'Vanilla JS', 'Offline-first'],
      estimatedBuildHours: 50,
      estimateBasis:
        'Offline-first service worker, installable manifest, a swipe feed UI, quiz generation and ' +
        'a content pipeline with its own tooling.',
      before: 'Nothing like it existed',
      after: 'Installable, offline, swipe-to-learn',
      // Not part of the Tr3s del Valle portfolio and absent from
      // FUENTE_DE_VERDAD. Shown as a personal build, contributing nothing to
      // the business benefit.
      benefit: null,
      personal: true,
      image: 'img/currents-hero.webp',
      imageSize: { width: 900, height: 562 },
      imageAlt:
        'Currents running on a phone: a full-screen learning card from the feed, with the topic ' +
        'tabs, card counter and swipe affordance visible.',
    },
    {
      id: 'ois-data-layer',
      name: 'Data layer & OIS connectors',
      cat: 'Data infrastructure',
      desc: 'The connectors and canonical data model the other systems depend on. Partly built.',
      status: 'Partly built',
      url: null,
      period: { from: '2026-07-09', to: '2026-08-13' },
      activeDays: 6,
      loc: 1471,
      commits: null,
      tests: null,
      verified: 'Authored on this machine, no version control; system #6 in FUENTE_DE_VERDAD.md',
      stack: ['Node', 'Playwright', 'n8n', 'Chrome MV3', 'Python', 'SQLite'],
      estimatedBuildHours: 72,
      estimateBasis:
        'Browser automation against the warehouse product form, a Sheets-to-OIS connector, and ' +
        'the machine-wide file index behind the canonical data model.',
      before: 'Every product keyed into the warehouse system by hand',
      after: 'Form filled from the workflow — a human still clicks Save',
      benefit: {
        annualUsd: 2586,
        cashUsd: 0,
        levers: [
          { name: 'Monthly sales close', annualUsd: 1008, kind: 'hours' },
          { name: 'Cost of carrying receivables', annualUsd: 830, kind: 'hours' },
          { name: 'OIS recapture and product creation', annualUsd: 748, kind: 'hours' },
        ],
        was: 'manual keying and month-end reconciliation',
        now: 'connectors, with the flow still to be completed',
      },
      openRisk: 'Declared "a medias" in FUENTE_DE_VERDAD — the full OIS creation flow is unfinished.',
    },
  ];

  /** Cloned to run and learn from, not authored. Listed for honesty. */
  const TOOLS_I_RUN = [
    { name: 'ECC', author: 'Affaan Mustafa', note: 'Agent, skill and hook framework' },
    { name: 'AgentShield', author: 'Affaan Mustafa', note: 'Security auditor for agent configs' },
    { name: 'Jarvis AI Assistant', author: 'Akshay Aggarwal', note: 'Local voice dictation for Mac' },
    { name: 'claude-howto', author: 'Luong Nguyen', note: 'Reference playbook' },
  ];


  /**
   * The hard part.
   *
   * Line counts and test counts prove volume, not judgement. These are the
   * constraints that actually took thinking, written so a non-engineer can
   * follow them. Every entry names the file where the reasoning is committed
   * next to the fix, so none of it has to be taken on trust. Sourced by
   * re-reading the repositories on 2026-08-19, not from memory.
   */
  const HARD_PARTS = Object.freeze([
    {
      system: 'Rutero TDV',
      title: 'A delivery confirmed with no signal, while the office changes its mind',
      problem:
        'A driver marks an order delivered in a dead zone. The phone retries when it reconnects \u2014 ' +
        'by which time the office may already have reopened or cancelled that same order.',
      whyHard:
        'Retrying until the server says yes either records the delivery twice or quietly undoes ' +
        "the office's decision. Both are silent: nothing in the data shows it happened.",
      built:
        'Every close is conditioned on the exact row version the driver saw. A retry of a close ' +
        'that already applied matches zero rows and succeeds as a no-op; a stale close queued ' +
        'before a reopen matches nothing and is dropped. The version token is the server\u2019s own ' +
        'timestamp, so a phone cannot forge it.',
      evidence: [
        'supabase/migrations/20260814060000_orders_write_discipline.sql',
        'supabase/tests/015_order_close_conditional_write.sql',
      ],
    },
    {
      system: 'Rutero TDV',
      title: 'Several reps, one shared phone, no connection',
      problem:
        'Reps share a handset. Each goes offline, records visits, corrects themselves more than ' +
        'once, and reconnects in whatever order the day allows.',
      whyHard:
        'The first version deleted the local copy whenever the queued one had already been ' +
        'replaced \u2014 treating \u201Cgone from the queue\u201D as \u201Csafely delivered\u201D. When that ' +
        'assumption was wrong, it destroyed the only remaining proof the visit happened.',
      built:
        'Each queued change carries its owner, and a sync pass touches only the signed-in rep\u2019s ' +
        'items, reporting the rest as skipped rather than failed. Data is re-read at the moment of ' +
        'sending, so a correction made mid-sync is not overwritten by a stale copy \u2014 and an entry ' +
        'that disappears for any reason other than being superseded stays in the queue.',
      evidence: ['app/src/services/visitSync.ts'],
    },
    {
      system: 'Rutero TDV',
      title: 'Widening one permission opened a door nobody had checked',
      problem:
        'Giving drivers access to all six territories turned a theoretical gap into a real one: a ' +
        "stolen driver login could erase another rep's visit and sign it as that rep.",
      whyHard:
        'Database access rules combine with OR \u2014 a new rule can grant, but it can never forbid. ' +
        'The fix had to keep the legitimate case working, where a driver and a rep both mark the ' +
        'same stop on the same day, while blocking forged authorship.',
      built:
        'A trigger silently restores the original author on any non-admin attempt to change it, so ' +
        'shared edits keep working but are always attributed to whoever actually made them. Photo ' +
        'overwrites got the same ownership check, and a new constraint rejects the impossible ' +
        'coordinates the interface had been passing straight through into distance maths.',
      evidence: [
        'supabase/migrations/20260813180000_visit_author_and_photo_owner_hardening.sql',
        'supabase/tests/014_visit_author_frozen_and_photo_owner.sql',
      ],
    },
    {
      system: 'Cotizador TDV v8',
      title: 'Splitting one truck\u2019s freight fairly across everything on it',
      problem:
        'A truck runs Mexico to McAllen, then McAllen to North Carolina, carrying a mix of Mexican ' +
        'and US-bought product. The shared cost of each leg has to land on every product on board ' +
        '\u2014 even though some ride only one leg, and prices are quoted in two currencies.',
      whyHard:
        'Each leg needs its own cost pool, and a product that never rides a leg must not dilute ' +
        'it. A hand-set price on one line cannot be allowed to distort what every other line is ' +
        'charged. Get any of it wrong and the quote silently over- or under-charges freight \u2014 the ' +
        'kind of error that surfaces as a margin problem months later.',
      built:
        'Two independent cost pools, one per leg, divided by whichever basis the user picks: units, ' +
        'cases, weight or value. Manual price and manual margin overrides are layered on top in a ' +
        'fixed order of precedence, so an override changes that line without moving the pool ' +
        'underneath the others. All arithmetic stays in one currency internally; the toggle is a ' +
        'display-time conversion, which is what keeps rounding drift out of the total.',
      evidence: ['Cotizador TDV v8.dc.html \u2014 calc(), share(), pxOf(), quoteMoney()'],
    },
    {
      system: 'TDV Outbound Log',
      title: 'Printing a barcode a cheap scanner will actually read',
      problem:
        'Some products have no manufacturer barcode, so the system has to print its own \u2014 and a ' +
        '$30 laser scanner at the warehouse door has to read it back as exactly the right product ' +
        'code, every time.',
      whyHard:
        'Code 128 means building bar widths from a 107-entry pattern table, computing a weighted ' +
        'checksum, and emitting an exact stop pattern. An off-by-one anywhere produces a barcode ' +
        'that scans as garbage or not at all. There was no scanner on the desk to test against ' +
        'during development \u2014 only a printed sheet.',
      built:
        'A hand-written encoder with no library dependency, plus a self-test that closes the loop ' +
        'without hardware: it pulls the encoder out of the shipped page, renders a barcode for ' +
        'every code-less product, measures the bar and space widths back out of the drawing, and ' +
        'decodes them against the same table \u2014 checking the start code, the checksum, the stop ' +
        'code, and that the text that comes back matches the product code that went in.',
      evidence: ['public/index.html \u2014 code128()', 'verify-barcodes.js'],
    },
    {
      system: 'Data Triage Center',
      title: 'A barcode can be valid and still be wrong',
      problem:
        'Thousands of products arrive from a warehouse export and a live spreadsheet. Each barcode ' +
        'has to be checked for being mathematically valid, for already belonging to a different ' +
        'product, and for being assigned to the wrong brand entirely.',
      whyHard:
        'The check-digit maths alone spans four barcode formats with different padding, plus a ' +
        'known accounting-export quirk that strips a leading zero. The real difficulty is that no ' +
        'barcode can be judged on its own: it has to be checked against every other row in the ' +
        'sheet and against every unsaved edit still sitting in the queue \u2014 two live sources that ' +
        'disagree.',
      built:
        'Check-digit validation across all four formats with the stripped-zero repair. Duplicate ' +
        'product codes collapse to whichever record is most complete, since write-back matches on ' +
        'that code and a doubled one is ambiguous. Collisions are searched across both the sheet ' +
        'and the unsaved queue, and brand prefixes are cross-referenced to catch a barcode ' +
        'attached to the wrong brand.',
      evidence: ['catalog-logic.js \u2014 verifyUpc(), buildIndexes(), findCollision(), attributeBrand()'],
    },
    {
      system: 'Currents',
      title: 'Knowing what day it is, on someone else\u2019s phone',
      problem:
        'Streaks and the heat map depend on which calendar day it is where the reader is \u2014 not ' +
        'where the server is.',
      whyHard:
        'The obvious timestamp is UTC, so an evening session in Mexico is stamped with tomorrow\u2019s ' +
        'date, breaking the streak and misplacing the cell. Storing local dates instead ' +
        're-introduces the bug at the other end: a clock-change day is 23 or 25 hours long and ' +
        'rounds to the wrong number of days.',
      built:
        'The day key is built from local calendar fields and never from a UTC timestamp. ' +
        'Differences between two keys are then read as UTC midnights, deliberately discarding the ' +
        'offset so the count is exact across a clock change. The streak logic takes \u201Ctoday\u201D as an ' +
        'argument and holds no clock of its own, which is what makes every branch testable.',
      evidence: ['src/lib/streak.js'],
    },
  ]);

  // Frozen so the read-only contract is enforced, not just documented.
  PROJECTS.forEach((project) => {
    Object.freeze(project.stack);
    Object.freeze(project.period);
    Object.freeze(project);
  });
  Object.freeze(PROJECTS);
  TOOLS_I_RUN.forEach(Object.freeze);
  Object.freeze(TOOLS_I_RUN);

  HARD_PARTS.forEach((entry) => {
    Object.freeze(entry.evidence);
    Object.freeze(entry);
  });

  COST.byModel.forEach(Object.freeze);
  Object.freeze(COST.byModel);

  return Object.freeze({
    MEASURED_ON,
    HOURLY_RATE,
    RATES: Object.freeze(RATES),
    BENEFIT: Object.freeze(BENEFIT),
    REPLACEMENT: Object.freeze(REPLACEMENT),
    AVOIDED: Object.freeze(AVOIDED),
    SPEND: Object.freeze(SPEND),
    COST: Object.freeze(COST),
    EVIDENCE: Object.freeze(EVIDENCE),
    PROJECTS,
    HARD_PARTS,
    TOOLS_I_RUN,
  });
})();

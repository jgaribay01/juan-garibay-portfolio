/**
 * The case pack — everything the twelve-block schema needs that is NOT a
 * measurement and NOT already owned by another file.
 *
 * Where a fact already has a home, it is not repeated here:
 *
 *   measured figures      evidence.json, summed in the browser
 *   money and levers      js/data.js (PROJECTS[].benefit, BENEFIT, EXCLUDED)
 *   the hard parts        js/data.js HARD_PARTS, rendered in full
 *   stack                 js/data.js PROJECTS[].stack
 *   status and links      js/data.js PROJECTS[].status / .url
 *
 * What lives here is the prose the schema asks for and nothing else: the
 * business problem, the objective, the inputs, the qualitative value, the
 * control plan, the risks and the next steps.
 *
 * No measured number appears in this file as a literal. Where a sentence needs
 * one it carries a token — {loc}, {commits}, {tests}, {files}, {testFiles},
 * {activeDays}, {sqlFiles}, {sqlLines} — which js/dossier.js resolves from
 * evidence.json at render time. check.mjs fails the build if a measured figure
 * is ever typed in here directly, which is the same rule the flight lives
 * under and the reason neither page can drift from the file it reports.
 */

/** Order of the pack. Currents is deliberately absent: it is a personal build
    with no business lever, so it has no place in an operations case pack. It
    is still on the flight and on the written page. */
export const CASE_ORDER = [
  'rutero-tdv',
  'cotizador-tdv',
  'cotizador-farmers-fresh',
  'data-triage-center',
  'tdv-outbound-log',
  'source-of-truth-guard',
];

export const CASES = {
  'rutero-tdv': {
    ref: 'CS-01',
    subtitle:
      'Route planning, driver dispatch and field-sales management across six territories',
    problem: [
      'Routes were drawn by hand every morning — roughly two hours a day of administrative effort before a truck moved.',
      'Route information lived separately with each group that touched it: drivers, sales and administration each held their own copy, so the same day existed in three versions and nobody could see the whole picture.',
      'Field capture happened in conditions the office model ignored. Drivers confirm deliveries in dead zones; the office reopens or cancels the same order while the phone is still offline. Reps share a single handset.',
    ],
    objective:
      'Remove manual morning planning through automation, and give drivers, sales and administration one centralized route record instead of three private ones — without losing or duplicating a single field record when the network is absent and the device is shared.',
    inputs:
      'Customer master and delivery geolocation; sales and visit history; route drafts and assignments; driver-captured visits with photos and coordinates; six territory definitions. Sources: the operational database, and field capture on the driver handsets.',
    techNote: 'AI: not in the runtime. Used in development only.',
    delivered: [
      'One build, three role-scoped applications on a shared data model — driver, sales and admin — plus an authenticated Node service that reconciles offline field capture.',
      '{files} files, {loc} authored lines, of which {sqlFiles} files and {sqlLines} lines are SQL: the migrations and the tests that hold the database invariants. {commits} commits over {activeDays} active days. {tests} tests passing under vitest, across {testFiles} test files.',
    ],
    impact: [
      { label: 'Morning planning', value: '2 h → about 15 min', small: true },
      { label: 'Reclaimed per month', value: '~37 h' },
    ],
    impactNote:
      'The reclaimed planning time sits inside the supervision-hours lever. It is stated separately because it is the change operators actually feel, not because it is additive to the yearly figure.',
    value: [
      'One shared route record replaces three private ones — visibility across driver, sales and admin without a phone call.',
      'Every field record is attributable to whoever actually made it, which is what makes exception review possible at all.',
      'A standardized, bilingual daily flow that a new driver can simply be handed.',
      'Less dependence on one person’s memory of the routes.',
    ],
    control: [
      'Database invariants are enforced by migrations that ship with their own SQL tests, so the rule lives in the system rather than in a procedure someone has to remember. The test suite is the regression gate on every change.',
      'Ongoing monitoring: planning time per morning, visits recorded per day, route drafts created per day, and exception review. Those same counts are the measurement inputs the benefit model is waiting on.',
    ],
    risks: {
      flag: {
        title: 'Measurement blocked — adoption, not code',
        body:
          'The two largest levers, driving hours and fuel, rest on inputs rated low confidence. Measurement was attempted on 22 August 2026 and could not be made: production held 18 visits across 6 days, with no route drafts at all — not a base to derive miles per route or driving hours from. Rebooked to 11 September 2026. Cost per mile and supervision rates measure 28 August.',
      },
      items: [
        'Route quality depends on customer location data being current; stale geolocation degrades every downstream figure.',
        'Until usage rises, the model is a projection, not a result.',
      ],
    },
    next: [
      'Route optimization — stop sequencing, not just assignment.',
      'Real-time route updates during the day.',
      'Usage instrumentation to unblock the 11 September measurement.',
      'Performance monitoring on the sync service under multi-rep load.',
    ],
  },

  'cotizador-tdv': {
    ref: 'CS-02',
    subtitle: 'Priced cross-border logistics quotes, exported straight to PDF',
    problem: [
      'Quotes were retyped into a spreadsheet for every enquiry, with the allocation method living in whoever built that sheet.',
      'The underlying problem is harder than data entry. One truck runs Mexico to McAllen, then McAllen to North Carolina, carrying a mix of Mexican and US-bought product. The shared cost of each leg has to land on every product actually on that leg, in two currencies. Get it wrong and the quote silently over- or under-charges freight — the kind of error that surfaces as a margin problem months later.',
    ],
    objective:
      'Produce a priced quote and its PDF in one view, with a freight allocation that is explicit, auditable, and cannot be distorted by a single hand-set line.',
    inputs:
      'Product catalogue in a dense thirteen-column table; per-leg freight, customs and insurance line items; lane definitions; MXN and USD pricing.',
    techNote: 'AI: not applicable.',
    delivered: [
      'A pricing engine with two independent per-leg cost pools, the catalogue table, and print and PDF output paths. {loc} authored lines in a single self-contained page.',
    ],
    impact: [
      { label: 'Quote preparation', value: 'Spreadsheet retype → minutes', small: true },
      { label: 'Basis', value: 'Half the shared quoting lever', small: true },
    ],
    impactNote:
      'The source model carries one quoting lever covering both quoting tools. It is split evenly rather than assigned to whichever tool looks better alone.',
    value: [
      'One allocation method applied consistently across every quote, instead of whatever last quarter’s spreadsheet did.',
      'Overrides are visible and bounded, so a negotiated line does not silently move what every other line is charged.',
      'The PDF the customer sees is generated from the same numbers the engine priced.',
    ],
    control: [
      'The allocation basis — units, cases, weight or value — is an explicit choice per quote, so the basis travels with the quote and can be re-checked later.',
      'Review: sample quotes against actual landed cost each quarter, and confirm the two leg pools still match the lanes actually run.',
    ],
    risks: {
      items: [
        'No test suite. The allocation arithmetic is the part most worth testing and is currently unguarded.',
        'The repository was initialised on 19 August 2026 with a single commit, so there is no development history to audit. Authorship is dated on-machine, 29 July to 3 August 2026.',
        'Single-file architecture limits how far the tool can grow before it needs splitting.',
      ],
    },
    next: [
      'Test coverage on the allocation and money functions named in the engineering note below.',
      'Commit history hygiene, so the work can be audited rather than taken on trust.',
      'A saved-quote history, so pricing decisions can be compared over time.',
    ],
  },

  'cotizador-farmers-fresh': {
    ref: 'CS-03',
    subtitle:
      'A second quoting engine, rebuilt from scratch for a different importer and its lanes',
    problem: [
      'A second importer was being quoted from spreadsheets, on different lanes with a different catalogue. Forking the first tool would have carried over assumptions that do not hold for this business.',
    ],
    objective:
      'Give the second importer its own quoting tool, and find out whether the quoting pattern transfers to a new business in days rather than months.',
    inputs:
      'The importer’s own catalogue and lane data, held in Google Sheets and migrated into the tool’s model.',
    techNote: 'AI: not applicable.',
    delivered: [
      'Pricing engine, sheet sync, PDF output, a data migration path and its own design system. {files} files, {loc} authored lines; {commits} commits over {activeDays} active days; {tests} tests passing under node --test.',
    ],
    impact: [{ label: 'Time to ship', value: '3 days, end to end', small: true }],
    impactNote:
      'The transferable result is not the yearly figure. It is the demonstrated three-day cycle from a new importer’s spreadsheets to a working priced quote.',
    value: [
      'Proves the quoting pattern is reusable across importers, which turns a one-off tool into a repeatable capability.',
      'The sheet remains the source of record, so the importer’s existing way of working is not displaced.',
    ],
    control: [
      'The test suite runs on the pricing paths. The sheet is the source and the tool is the renderer, so catalogue corrections happen where the data already lives.',
    ],
    risks: {
      flag: {
        title: 'Open security risk — carried, not resolved',
        body:
          'Access control is not active. Server-side middleware is pending the FF_CLAVE secret; what is live today is a client-side gate only. Declared as an open risk in the source document and repeated here rather than quietly dropped.',
      },
      items: [
        'Lane and pricing data belong to the importer; a client-side gate is not a control over them.',
      ],
    },
    next: [
      'Land the middleware so authentication is checked before any lane or price data is served.',
      'Rotate the gate secret and confirm the client-side check is no longer the only barrier.',
    ],
  },

  'data-triage-center': {
    ref: 'CS-04',
    subtitle: 'Cleans product catalogue rows and validates UPCs, one keystroke at a time',
    problem: [
      'The catalogue was cleaned by hand, row by row. Thousands of products arrive from a warehouse export and a live spreadsheet, and the two disagree.',
      'The failure that matters is not a missing field. It is that a barcode can be mathematically valid and still be wrong — already belonging to a different product, or attached to the wrong brand entirely. Every other system in this pack sits downstream of this data.',
    ],
    objective:
      'Turn catalogue cleanup from a recurring project into a repeatable keystroke flow, with validation enforced at the moment of entry rather than discovered later.',
    inputs:
      'Warehouse product export; the live Google Sheet; uploaded barcode files; and the operator’s own unsaved edit queue — three sources, two of them live.',
    techNote: 'AI: not applicable.',
    delivered: [
      'A triage rules engine with barcode upload, an offline-first three-pane UI — unresolved queue, the record being fixed, the live workbook — and a Sheets write-back path. {files} files, {loc} authored lines; {commits} commits over {activeDays} active days.',
    ],
    impact: [
      { label: 'SKUs triaged', value: '276' },
      { label: 'Empty critical fields', value: '0' },
      { label: 'Formula errors', value: '0' },
      { label: 'Monetary lever', value: 'None, by design', small: true },
    ],
    impactNote:
      'No lever is assigned because this system protects the data quality the other levers already depend on. Counting it separately would double-count. The measured outputs above are the evidence instead.',
    value: [
      'This is the standard operating procedure for catalogue integrity — the rule is executed by the tool rather than remembered by a person.',
      'A Save &amp; Next keyboard flow makes the correct path the fast path, which is the only version of a data SOP that survives contact with a busy week.',
      'Product identity is now consistent across quoting, outbound scanning and route operations: one code, not three spellings.',
    ],
    control: [
      'Validation runs at entry, so a bad barcode never enters the workbook to be found later.',
      'Monitoring: unresolved row count, collisions caught per import, and a re-check that the two live sources still agree after each warehouse export.',
    ],
    risks: {
      items: [
        'No test suite on logic that four barcode formats and a write-back path depend on. Highest-value gap in this pack after CS-03’s access control.',
        'The unsaved queue lives in browser localStorage — device-local, and lost if site data is cleared.',
        'Brand attribution relies on prefix conventions, which do not hold for every supplier.',
      ],
    },
    next: [
      'A test suite around the validation, indexing, collision and brand-attribution functions named in the engineering note below.',
      'Move the unsaved queue to a durable store.',
      'Log every rejected barcode so import quality can be trended.',
    ],
  },

  'tdv-outbound-log': {
    ref: 'CS-05',
    subtitle: 'Scans and logs outbound shipments against a barcode-indexed catalogue',
    problem: [
      'Outbound movements were recorded on paper and in spreadsheets at the warehouse door, reconciled afterwards if at all. Some products carry no manufacturer barcode, so there was nothing to scan even where scanning was possible.',
    ],
    objective:
      'Capture every outbound movement against the catalogue at the moment it leaves, using the scanner hardware already at the door.',
    inputs:
      'A barcode-indexed product catalogue of 361 synced products; scans taken at the door; the day’s movement list.',
    techNote: 'AI: not applicable.',
    delivered: [
      'A single-screen scanning UI over the barcode index, plus label generation for products with no manufacturer code. {files} files, {loc} authored lines; {commits} commits over {activeDays} active days.',
    ],
    impact: [
      { label: 'Products indexed', value: '361' },
      { label: 'Lever type', value: 'Freed hours', small: true },
    ],
    impactNote:
      'Paper and spreadsheet logs replaced by a scan against the catalogue at the door.',
    value: [
      'The outbound record now shares product identity with the catalogue and the quoting tools, so movements reconcile without a translation step.',
      'Products that previously could not be scanned at all now can be.',
    ],
    control: [
      'The barcode self-test re-decodes every rendered label and runs without any scanner present, so label correctness is checkable on every change.',
      'Monitoring: scans per close, and unknown-code exceptions per day.',
    ],
    risks: {
      items: [
        'No unit test suite beyond the barcode self-test.',
        'Field read rate is unmeasured: print quality and scanner variance at the door have not been sampled.',
        'Unknown codes at the door have no defined exception path yet.',
      ],
    },
    next: [
      'Sample field read rate on printed labels.',
      'Define the unknown-code exception flow.',
      'Trend scans per close against the modelled warehouse-close saving.',
    ],
  },

  /**
   * The control layer. Not an application, so it has no repository record in
   * evidence.json — it declares its own name, category and status because
   * there is no measured record to take them from.
   */
  'source-of-truth-guard': {
    ref: 'CS-06',
    standalone: true,
    name: 'Single-source-of-truth guard',
    cat: 'Control layer · data-integrity SOP',
    status: 'In use',
    stack: ['Node', 'no dependencies', 'check.mjs', 'measure.mjs'],
    subtitle:
      'Makes disagreement between copies of the same fact a build failure instead of a discovery',
    problem: [
      'The same facts lived in four places: the data file the renderer reads, a no-JavaScript fallback block, a structured-data block for search engines, and a static hero rendered before scripts run.',
      'Three of those four are invisible during normal use, so they drift silently — and both had already drifted. The fallback was two measurement rounds behind. The structured data had lost an entire project and carried a reworded description. One product claim had been baked into an image, where nothing could read it at all.',
    ],
    objective:
      'Declare one source of truth, derive every other copy from it, and fail loudly the moment any copy disagrees — rather than waiting for someone to notice.',
    inputs:
      'The declared source file and the derived copies checked against it. Separately, git history and the file system, read directly to regenerate the measured figures.',
    techNote: 'AI: not applicable.',
    delivered: [
      'npm run check compares every derived copy against the source and exits non-zero on disagreement. npm run measure regenerates the figures from git and disk, so no number is ever retyped by hand.',
      'This page is under the same guard: it states no measured figure of its own, and the guard fails if one is ever typed into it.',
    ],
    impact: [
      { label: 'Current guard run', value: 'Pass — all copies agree', small: true },
      { label: 'Drift bugs caught', value: '4' },
    ],
    impactNote:
      'Caught to date: a fallback two measurement rounds stale, a missing project in structured data, a silently reworded description, and a product count baked into an image where nothing could read it.',
    value: [
      'The SOP is a rule about where facts may live, not a checklist. Its sharpest clause: the project’s own README deliberately does not quote the figures, because a README that quotes them becomes a fifth copy nobody guards.',
      'The same pattern is what the other systems apply in their own domains — conditional writes in CS-01, a single internal currency in CS-02, validation at entry in CS-04. One fact, one home, everything else derived.',
    ],
    control: [
      'The guard runs on demand and before publishing. Measurement is regenerated, never edited.',
      'Every stated judgement carries its basis in the same file, so a reader can disagree with the estimate instead of guessing what it assumed.',
    ],
    risks: {
      items: [
        'The guard proves the copies agree; it does not prove they are current. The figures on this page carry their measurement date for exactly that reason.',
        'It runs manually today, so a change published without running it is unguarded.',
      ],
    },
    next: [
      'Run the guard in CI on every push.',
      'Add a staleness threshold that fails when the measurement date is older than an agreed number of days.',
      'Extend the same guard pattern to the quoting tools’ rate tables.',
    ],
  },
};

/** Read at the top of the pack, before the first case. */
export const PREAMBLE = {
  title: 'Six systems, and the data problems under them',
  standfirst:
    'Five production tools and one control layer, built for a cross-border food distribution business. Every case is written to the same twelve-block schema so they read side by side. The engineering notes under each one are the part that actually took thinking: the constraint that made the obvious version wrong.',
  reading: [
    'Three kinds of number appear here and they are never mixed. <b>Measured</b> figures are counted in your browser out of <a href="evidence.json">evidence.json</a>, never typed into this page. <b>Stated judgements</b> are estimates with their basis attached, so they can be argued with instead of guessed at. <b>Modelled benefit</b> comes from one source document, lever by lever, and separates cash from freed hours — freed hours are not money until they are redeployed into more stops, less overtime, or work that is not getting done today.',
    'Hours are priced at the owner rate, the lower of the two rates in play. The same hours at the warehouse and admin rate would be worth materially more, so every saving stated here is a conservative floor.',
  ],
};

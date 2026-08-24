/**
 * Everything on this page that is NOT a measurement.
 *
 * The split is the point. Prose, money and links live here; every engineering
 * figure — lines, files, commits, tests, deck size — comes from
 * assets/evidence.json and is summed in the browser. So there is exactly one
 * copy of every measured number in this build, and a number with one copy
 * cannot drift from itself.
 *
 * The money figures do have one copy here, because they are not measurable
 * from a repository: they come from FUENTE_DE_VERDAD.md, the meeting package's
 * source of truth, and they are quoted with their caveats attached.
 */
export const REPO_ORDER = [
  'rutero-tdv',
  'cotizador-tdv',
  'cotizador-farmers-fresh',
  'data-triage-center',
  'tdv-outbound-log',
  'currents',
];

export const SYSTEMS = {
  'rutero-tdv': {
    name: 'Rutero TDV',
    cat: 'Route operations',
    line: 'Routes were drawn by hand every morning. Now one build runs three apps: driver, sales, admin.',
    hard: 'A delivery confirmed with no signal, while the office changes its mind.',
    url: 'https://rutero-tdv.vercel.app/',
    shot: 'img/rutero-hero.webp',
    shotW: 900, shotH: 562,
    alt: 'Rutero TDV guided setup screen, showing the four-step workspace activation flow.',
    money: { annualUsd: 25324, cashUsd: 11412 },
    was: '2 hours every morning', now: 'about 15 minutes',
  },
  'cotizador-tdv': {
    name: 'Cotizador TDV v8',
    cat: 'Logistics quoting',
    line: 'One truck, two legs, two currencies. Freight has to land fairly on everything on board.',
    hard: 'Splitting one truck’s freight across everything riding it.',
    url: 'https://cotizador-logistico-tdv-deploy.vercel.app/',
    shot: 'img/cotizador-hero.webp',
    shotW: 900, shotH: 562,
    alt: 'Cotizador TDV v8 primary-costs screen, Mexico to McAllen, with sensitive figures blurred.',
    money: { annualUsd: 594, cashUsd: 0 },
    was: 'quotes retyped into a spreadsheet', now: 'minutes per quote',
  },
  'cotizador-farmers-fresh': {
    name: 'Cotizador Farmers Fresh',
    cat: 'Logistics quoting',
    line: 'A second importer, its own lanes, its own design system. Empty folder to production in three days.',
    hard: 'Rebuilding a pricing engine from scratch rather than forking one.',
    url: 'https://cotizador-farmers-fresh.vercel.app/',
    shot: 'img/ff-shot.webp',
    shotW: 390, shotH: 298,
    alt: 'Cotizador Farmers Fresh at its live URL, on the team sign-in screen.',
    money: { annualUsd: 594, cashUsd: 0 },
    was: 'a second importer quoting from spreadsheets', now: 'its own quoting tool',
    risk: 'Access control is not active. Client-side gate only, middleware pending.',
  },
  'data-triage-center': {
    name: 'Data Triage Center',
    cat: 'Catalogue triage',
    line: 'Cleans catalogue rows and validates UPCs one keystroke at a time. It earns nothing, and it is here anyway.',
    hard: 'It protects the catalogue every other lever depends on, so counting it again would double-count.',
    url: null,
    shot: 'img/dtc-hero.webp',
    shotW: 900, shotH: 562,
    alt: 'Data Triage Center three-pane view: unresolved queue, the record being fixed, the live workbook.',
    money: { annualUsd: 0, cashUsd: 0 },
    was: 'catalogue cleaned by hand, row by row', now: '276 SKUs, no empty critical fields',
  },
  'tdv-outbound-log': {
    name: 'TDV Outbound Log',
    cat: 'Shipment logging',
    line: 'Scanned against the catalogue at the door, instead of onto paper.',
    hard: 'The smallest system here, and the one with the clearest before and after.',
    url: 'https://tdv-outbound-log.vercel.app/',
    shot: 'img/outbound-hero.webp',
    shotW: 900, shotH: 562,
    alt: 'TDV Outbound Log scanning screen: barcode field, catalogue search and the day’s movements.',
    money: { annualUsd: 1650, cashUsd: 0 },
    was: 'paper and spreadsheet outbound logs', now: 'scanned at the door',
  },
  currents: {
    name: 'Currents',
    cat: 'Consumer PWA',
    line: 'The one build here that is public by design. Installs to a home screen and keeps working with no network.',
    hard: 'Offline-first, so the failure modes are all about what happens when the network comes back.',
    url: 'https://currents-weld.vercel.app/',
    shot: 'img/currents-shot.webp',
    shotW: 214, shotH: 460,
    alt: 'Currents running on a phone: a full-screen learning card with topic tabs and swipe affordance.',
    money: null,
    personal: true,
    was: 'nothing like it existed', now: 'installable, offline, swipe to learn',
  },
};

/** From FUENTE_DE_VERDAD.md. Not measurable from a repository. */
export const MONEY = {
  source: 'FUENTE_DE_VERDAD.md §3, 13 August 2026',
  replacementYear1: 30000,
  excluded: {
    name: 'Data layer and OIS connectors',
    annualUsd: 2586,
    sourceTotal: 30748,
    sourceSystems: 6,
    reason: 'never finished, and used by two people',
  },
  caveat:
    'Freed hours are not cash until they are redeployed. The two largest levers here, driving ' +
    'hours and fuel, rest on inputs rated low confidence: the measurement was attempted on 22 ' +
    'August and could not be made, because the route system holds 18 visits in production and ' +
    'no route drafts at all. Those inputs move to 11 September.',
};

export const CONTACT = {
  label: 'Email Juan',
  address: 'jgaribay@tr3sdelvalle.com',
  subject: 'Saw the portfolio',
};

export const EVIDENCE_PAGE = '/evidence.html';

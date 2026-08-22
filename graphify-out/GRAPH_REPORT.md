# Graph Report - /Users/juangaribay/portfolio-showcase  (2026-08-22)

## Corpus Check
- Corpus is ~23,339 words - fits in a single context window. You may not need a graph.

## Summary
- 262 nodes · 368 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 72% EXTRACTED · 24% INFERRED · 4% AMBIGUOUS · INFERRED: 88 edges (avg confidence: 0.84)
- Token cost: 923,825 input · 22,000 output

## Community Hubs (Navigation)
- Portfolio Claims And Provenance
- Drift Guard (check.mjs)
- Freight Quoting UI
- Currents Feed UI
- Measurement Script (measure.mjs)
- Catalog Triage UI
- Currents Demo Poster
- Outbound Scanning UI
- Rutero Onboarding UI
- Social Card Figures
- Farmers Fresh Case Card
- Page Rendering Layer
- Performance And Typography
- NPM Scripts
- Favicon Mark
- Repository Facts
- Deployment Headers
- Render Failure Banner
- Single Source Of Truth
- Demo Encoding Pipeline

## God Nodes (most connected - your core abstractions)
1. `TDV Outbound Log (warehouse outbound tracking app)` - 12 edges
2. `Portfolio Open Graph Social Card` - 11 edges
3. `JSON-LD entity markup (Person + ItemList of SoftwareApplication)` - 10 edges
4. `"For you" feed screen` - 10 edges
5. `el()` - 9 edges
6. `measure()` - 9 edges
7. `js/data.js — single source of truth for every figure` - 9 edges
8. `Screen: Costos primarios de la operacion` - 9 edges
9. `check.mjs consistency guard (npm run check)` - 8 edges
10. `Cotizador Farmers Fresh` - 8 edges

## Surprising Connections (you probably didn't know these)
- `check.mjs consistency guard (npm run check)` --semantically_similar_to--> `Hard part — a barcode a cheap scanner will read`  [INFERRED] [semantically similar]
  README.md → index.html
- `npm run measure provenance note` --semantically_similar_to--> `Figures are measured and carry their measurement date`  [INFERRED] [semantically similar]
  index.html → README.md
- `Google Fonts CDN for the card render` --semantically_similar_to--> `Self-hosted type with two preloaded faces`  [INFERRED] [semantically similar]
  og-source.html → index.html
- `What each tool replaced — comparison table` --shares_data_with--> `js/data.js — single source of truth for every figure`  [INFERRED]
  index.html → README.md
- `What it costs to run — token cost breakdown` --shares_data_with--> `js/data.js — single source of truth for every figure`  [INFERRED]
  index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The four copies of every figure, and the guard over them** — readme_js_data_js, index_static_hero, index_noscript_projects, index_jsonld_entity_markup, readme_check_mjs_guard [EXTRACTED 1.00]
- **Production tools built by Juan J Garibay** — index_juan_j_garibay, index_rutero_tdv, index_cotizador_tdv_v8, index_data_triage_center, index_tdv_outbound_log, index_cotizador_farmers_fresh, index_currents [EXTRACTED 1.00]
- **The hard part — constraints that took judgement rather than volume** — index_hard_offline_delivery_confirm, index_hard_shared_phone_visit_sync, index_hard_visit_author_hardening, index_hard_freight_cost_split, index_hard_code128_encoder, index_hard_upc_check_digit, index_hard_local_day_keys [EXTRACTED 1.00]

## Communities (20 total, 4 thin omitted)

### Community 0 - "Portfolio Claims And Provenance"
Cohesion: 0.08
Nodes (37): What each tool replaced — comparison table, What it costs to run — token cost breakdown, Cotizador Farmers Fresh — second quoting engine, Cotizador TDV v8 — logistics quoting, Currents — swipe-driven learning PWA, Data Triage Center — catalogue triage, Hard part — a barcode a cheap scanner will read, Hard part — splitting one truck's freight fairly (+29 more)

### Community 1 - "Drift Guard (check.mjs)"
Cohesion: 0.08
Nodes (22): dataSource, escape(), evidenceStatic, expect, expectFallback, expectHeadline, expectOg, expectStrip (+14 more)

### Community 2 - "Freight Quoting UI"
Cohesion: 0.15
Nodes (20): Toolbar actions: Rutas, T-C abierto, USD/MXN, Imprimir, Restablecer, Visual style: blueprint grid with plus-corner markers, uppercase mono eyebrow labels, muted blue accent on light gray, Blurred monetary values (portfolio redaction of client cost data), Cost concepts: Flete terrestre Mexico, Aduana Mexico, Comercializadora, Custodia, Chismografos, Etiquetas, Extras origen, Screen: Costos primarios de la operacion, Cotizador 1 - Freight Cost Quoting Web App, Per-line currency selectors and global USD/MXN toggle, Empty state: 0 cajas, 0 SKUs, sin unidades capturadas (+12 more)

### Community 3 - "Currents Feed UI"
Cohesion: 0.15
Nodes (20): Right Action Rail: Share / Shuffle / Settings, Card Position Counter (1 / 40), 95 Cards Across Eight Topic Streams, Insight Card Reader, Content Pipeline (Generation + Quiz Tooling), Currents (Consumer PWA), Dark Editorial Theme With Mono Accents, Go Deeper CTA (+12 more)

### Community 4 - "Measurement Script (measure.mjs)"
Cohesion: 0.16
Nodes (16): ALWAYS_EXCLUDE, claimed, countLines(), countTestCases(), dataSource, git(), here, isExcluded() (+8 more)

### Community 5 - "Catalog Triage UI"
Cohesion: 0.18
Nodes (17): Dark Navy UI with Teal Accents Design System, Data Hygiene Workflow - resolve missing UPC, brand, category per SKU, Data Triage Center (DTC) - QuickBooks Catalog Cleanup App, Queue Filter Chips - All 374, Missing UPC 61, N/D Brand 0, No Category 0, Item Detail Panel - Bucket Comodin BKT001 field readout, Portfolio Showcase Site (hero screenshot asset), Mexican Snack/Candy Product Catalog Data (Bubbaloo, Ricolino, De La Rosa, Duvalin, Kinder), Queue Panel - 374 unresolved, 0 dupes, searchable SKU/item list (+9 more)

### Community 6 - "Currents Demo Poster"
Cohesion: 0.20
Nodes (15): Right action rail: Share / Shuffle / Settings, Currents (learning feed app), Dark teal photographic-background visual style, Currents demo video poster frame, Fact card: @ symbol email origin (Ray Tomlinson, 1971), "For you" feed screen, "Go deeper" call to action, Mobile-first portrait layout (+7 more)

### Community 7 - "Outbound Scanning UI"
Cohesion: 0.24
Nodes (15): Barcode Scan Input ("Scan barcode here (or type UPC / SKU + Enter)"), Manual Catalog Search Field (name, brand, or SKU), Date Navigator (prev / next / Today, Fri Aug 7 2026), Empty State ("Nothing logged yet. Scan the first item that leaves the warehouse."), Log a Return Action, Movements Ledger (per-day lines and products counter), Portfolio Showcase Site, Product Catalog (361 products) (+7 more)

### Community 8 - "Rutero Onboarding UI"
Cohesion: 0.22
Nodes (15): Dual Activation Modes: Activar Rutero TDV vs Conectar equipo TDV, Step 01 Acceso de empresa Form (Servidor seguro, Codigo de empresa, Usuario, PIN), Guided First-Time Setup Wizard (Configuracion guiada, 4 pasos, 0% avance), Local-First Data Note (datos quedan en este dispositivo hasta conectar un espacio de equipo), PIN Authentication (6 a 8 digitos, sent over HTTPS, never stored on device), Portfolio Showcase Site (Hero Asset Usage), Rutero TDV (Route Planning System for Distribution), Rutero TDV Onboarding Screenshot (Hero Image) (+7 more)

### Community 9 - "Social Card Figures"
Cohesion: 0.32
Nodes (13): Juan J Garibay, Builder: 1, Portfolio Open Graph Social Card, Of That, Cash: $11,412, Dark terminal-grid card design with green accent metric, Headline: Five systems running a real distribution business, Measured 22 Aug 2026, Tr3s del Valle (distribution business) (+5 more)

### Community 10 - "Farmers Fresh Case Card"
Cohesion: 0.23
Nodes (12): Build Metrics: 5,152 lines, 18 commits, sole author, 3 days to production, Farmers Fresh Hero Case Card (Portfolio Showcase), Cotizador Farmers Fresh, Cotizador Full Loads (internal import-team web app), Dark Split Case-Study Layout With Browser Chrome Mockup, Login Form (Usuario / Clave fields), Pricing Engine With Its Own Design System, Quote = One Trip With One or More Products (domain model) (+4 more)

### Community 11 - "Page Rendering Layer"
Cohesion: 0.44
Nodes (11): bindSort(), el(), mount(), renderCost(), renderHardParts(), renderHero(), renderMedia(), renderNotes() (+3 more)

### Community 12 - "Performance And Typography"
Cohesion: 0.20
Nodes (10): Self-hosted type with two preloaded faces, No image preload — the LCP element is the h1, index.html — portfolio page, Skip-to-projects link, og-source.html — Open Graph card source, Google Fonts CDN for the card render, Keep the card's source so it can be rebuilt, Contrast is computed, not eyeballed (+2 more)

### Community 13 - "NPM Scripts"
Cohesion: 0.20
Nodes (9): description, name, private, scripts, check, measure, test, type (+1 more)

### Community 14 - "Favicon Mark"
Cohesion: 0.39
Nodes (8): Portfolio Favicon Mark, 32x32 ViewBox Icon Canvas, Accent Green #4ade80, Concentric Orbit Motif, Solid Green Core Dot, Near-Black Surface #0a0b0d, Translucent Orbit Ring, Rounded Square Dark Backdrop

### Community 15 - "Repository Facts"
Cohesion: 0.50
Nodes (4): No dependencies, no build step, no framework, No licence granted, juan-garibay-portfolio (repo overview), README deliberately restates no figures

## Ambiguous Edges - Review These
- `Accent Green #4ade80` → `Concentric Orbit Motif`  [AMBIGUOUS]
  favicon.svg · relation: conceptually_related_to
- `Blurred monetary values (portfolio redaction of client cost data)` → `Empty state: 0 cajas, 0 SKUs, sin unidades capturadas`  [AMBIGUOUS]
  img/cotizador-hero.webp · relation: conceptually_related_to
- `"Go deeper" call to action` → `Vertical full-bleed swipe feed pattern`  [AMBIGUOUS]
  img/currents-demo-poster.webp · relation: conceptually_related_to
- `Right action rail: Share / Shuffle / Settings` → `Vertical full-bleed swipe feed pattern`  [AMBIGUOUS]
  img/currents-demo-poster.webp · relation: semantically_similar_to
- `Swipe-Driven Learning Feed` → `Right Action Rail: Share / Shuffle / Settings`  [AMBIGUOUS]
  img/currents-hero.webp · relation: conceptually_related_to
- `95 Cards Across Eight Topic Streams` → `Card Position Counter (1 / 40)`  [AMBIGUOUS]
  img/currents-hero.webp · relation: shares_data_with
- `Content Pipeline (Generation + Quiz Tooling)` → `Card Source Attribution Line`  [AMBIGUOUS]
  img/currents-hero.webp · relation: shares_data_with
- `Smart Form - one-click auto-suggestions for category, brand, type, UPC` → `Mexican Snack/Candy Product Catalog Data (Bubbaloo, Ricolino, De La Rosa, Duvalin, Kinder)`  [AMBIGUOUS]
  img/dtc-hero.webp · relation: shares_data_with
- `Quick Type Actions - Equipment / Buy & Sell shortcut buttons` → `QuickBooks Catalog Connection`  [AMBIGUOUS]
  img/dtc-hero.webp · relation: conceptually_related_to
- `Yearly Benefit: $28,162` → `Dark terminal-grid card design with green accent metric`  [AMBIGUOUS]
  img/og.png · relation: conceptually_related_to
- `Yearly Benefit: $28,162` → `Tests Passing: 1,590`  [AMBIGUOUS]
  img/og.png · relation: shares_data_with
- `TDV Outbound Log (warehouse outbound tracking app)` → `Product Catalog (361 products)`  [AMBIGUOUS]
  img/outbound-hero.webp · relation: conceptually_related_to
- `Rutero TDV (Route Planning System for Distribution)` → `Per-Company Secure Server Endpoint (https://rutas.miempresa.com)`  [AMBIGUOUS]
  img/rutero-hero.webp · relation: conceptually_related_to
- `Setup Steps: Identidad de la empresa, Bodega y GPS, Accesos del equipo, Catalogo de productos` → `Shared Team Workspace (Workspace exclusivo TDV / espacio compartido)`  [AMBIGUOUS]
  img/rutero-hero.webp · relation: shares_data_with

## Knowledge Gaps
- **66 isolated node(s):** `here`, `dataSource`, `P`, `html`, `ogSource` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Accent Green #4ade80` and `Concentric Orbit Motif`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Blurred monetary values (portfolio redaction of client cost data)` and `Empty state: 0 cajas, 0 SKUs, sin unidades capturadas`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `"Go deeper" call to action` and `Vertical full-bleed swipe feed pattern`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Right action rail: Share / Shuffle / Settings` and `Vertical full-bleed swipe feed pattern`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Swipe-Driven Learning Feed` and `Right Action Rail: Share / Shuffle / Settings`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `95 Cards Across Eight Topic Streams` and `Card Position Counter (1 / 40)`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `Content Pipeline (Generation + Quiz Tooling)` and `Card Source Attribution Line`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
# juan-garibay-portfolio

The source of **[juan-garibay-portfolio.vercel.app](https://juan-garibay-portfolio.vercel.app)** — a
portfolio of seven internal tools built for a food distribution business, published with the
evidence behind each one rather than a description of it.

No dependencies, no build step, no framework. Plain HTML, CSS and JavaScript, served as files.

---

## The problem this repo actually solves

A portfolio that publishes measured figures has a failure mode that a portfolio of screenshots does
not: **the numbers go stale and nothing tells you.**

The same facts live in four places here, and only one of them is visible on a normal page load:

| Where | Read by | Visible when it goes wrong |
|---|---|---|
| `js/data.js` | the renderer | yes — the page shows it |
| the `<noscript>` block | crawlers, scriptless readers | **no** |
| the JSON-LD block | search engines | **no** |
| the static hero in `index.html` | the browser, before JS runs | briefly |

Three of those four are invisible during normal use, so they drift silently. Both did, in this
repo, before the guard existed: the fallback was two measurement rounds behind, and the structured
data had lost a whole project and carried a reworded description.

So `check.mjs` reads `js/data.js` and fails if any copy disagrees with it:

```bash
npm run check
```

```
check: fallbacks and structured data match js/data.js — N builds, N engineering notes, measured <date>
```

(The real output names the counts and the measurement date. They are elided here on purpose —
a README that quotes them becomes the fifth copy nobody guards.)

It checks the scriptless fallback **scoped to the `<noscript>` block**, not the whole document —
an earlier version searched the page globally, which meant a stale figure in the fallback could
hide behind a correct one in the hero. That is the kind of bug a guard is supposed to catch, not
have.

**This README deliberately restates no figures.** It would become a fifth copy, and nothing would
guard it.

---

## Running it

```bash
python3 -m http.server 4322   # then open http://localhost:4322
npm run check                 # verify no copy has drifted from js/data.js
```

`node check.mjs` is the whole tooling story. There is nothing to install.

## Layout

```
index.html        markup, the static hero, the noscript fallbacks, the JSON-LD
js/data.js        every figure on the site, and the only place any of them is authored
js/render.js      builds the DOM from that data — createElement and textContent only
css/tokens.css    palette, type scale, component classes
css/page.css      layout, accessibility corrections, the print stylesheet
check.mjs         fails if any copy of the data drifts from js/data.js
og-source.html    source for img/og.png; re-render it when the headline figures move
```

## Decisions worth knowing about

**Figures are measured, and carry the date they were measured.** Line counts use one fixed method
across all seven builds — authored source only, excluding dependencies, build output, third-party
libraries and generated files. Counting another way moves the numbers by up to three times, so the
method travels with them. Several of these systems are still in active development, so the figures
are a snapshot rather than a ceiling; the site says so.

**Contrast is computed, not eyeballed.** Every token was checked against the background it is
actually painted on, not against the page ground. A colour that passes on the page body can fail on
a card, and one did.

**Layout shift is fixed at the source.** The hero is written into the HTML as real markup rather
than reserved with a `min-height`, because the placeholder headline was one line and the real one
is five. Measured CLS on a throttled load went from 0.110 to 0 on desktop and tablet. What remains
on a narrow viewport is webfont swap, not layout — it measures 0 with fonts blocked.

**A failed render says so.** If the script throws, the page shows a banner instead of letting a
reader take the stored fallback for current figures, and the thrown error names the stage that
failed.

**It is built to be printed.** Someone will print this for a meeting, so the print stylesheet
inverts to ink on paper, drops the screenshots, and resolves every link to its destination, since
paper cannot be clicked.

## Honesty

The business case on the site rests on assumptions that the source document rates *low confidence*,
with measurement dates still ahead of them. Those are marked as such on the page and in the source
data, and they are estimates until the dates pass. The engineering figures — line counts, commits,
tests, contrast, layout shift — are measured, reproducible, and dated.

## Licence

No licence granted. The code is published to be read, not reused.

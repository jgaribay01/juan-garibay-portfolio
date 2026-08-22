/**
 * Renders the portfolio from PORTFOLIO (js/data.js).
 *
 * Everything is built with createElement + textContent, so project copy is
 * never interpolated into HTML. No dependencies, no build step.
 *
 * Static markup in index.html carries a readable fallback for every region this
 * script fills, so a script failure degrades instead of blanking the page.
 */

(() => {
  'use strict';

  const { HOURLY_RATE, RATES, BENEFIT, REPLACEMENT, AVOIDED, SPEND, COST, EVIDENCE, PROJECTS,
    HARD_PARTS, TOOLS_I_RUN, MEASURED_ON } = PORTFOLIO;

  const CONTACT_EMAIL = 'jgaribay@tr3sdelvalle.com';

  /** The first render is not a user action, so it must not announce. */
  let sortAnnounced = false;

  const SORTS = {
    featured: (list) => [...list],
    'cost avoided': (list) => [...list].sort((a, b) => tradCost(b) - tradCost(a)),
    'build time': (list) => [...list].sort((a, b) => a.activeDays - b.activeDays),
  };

  // — helpers —

  const tradCost = (project) => project.estimatedBuildHours * HOURLY_RATE;

  const usd = (value) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const locLabel = (loc) => (loc >= 1000 ? `${(loc / 1000).toFixed(1)}k` : String(loc));

  const dayLabel = (days) => `${days} ${days === 1 ? 'day' : 'days'}`;

  const monthDay = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const windowLabel = (period) =>
    period.from === period.to
      ? monthDay(period.from)
      : `${monthDay(period.from)} – ${monthDay(period.to)}`;

  /** el('div', {class: 'x'}, [child, 'text']) */
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) return;
      if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    });
    (Array.isArray(children) ? children : [children])
      .filter((child) => child !== null && child !== undefined && child !== false)
      .forEach((child) => node.append(child));
    return node;
  }

  /** Fail loudly at the seam rather than silently rendering half a page. */
  function mount(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`render: missing #${id} in index.html`);
    return node;
  }

  // — totals —

  /** Recurring benefit per system, lever by lever, from FUENTE_DE_VERDAD §3. */
  const annualBenefit = (project) => project.benefit?.annualUsd ?? 0;
  const monthlyBenefit = (project) => annualBenefit(project) / 12;
  const cashBenefit = (project) => project.benefit?.cashUsd ?? 0;

  const tdvSystems = PROJECTS.filter((p) => !p.personal);

  const totals = {
    projects: tdvSystems.length,
    allBuilds: PROJECTS.length,
    loc: PROJECTS.reduce((sum, p) => sum + p.loc, 0),
    buildDays: PROJECTS.reduce((sum, p) => sum + p.activeDays, 0),
    tradCost: PROJECTS.reduce((sum, p) => sum + tradCost(p), 0),
    annualBenefit: PROJECTS.reduce((sum, p) => sum + annualBenefit(p), 0),
    cashBenefit: PROJECTS.reduce((sum, p) => sum + cashBenefit(p), 0),
    quantified: PROJECTS.filter((p) => annualBenefit(p) > 0).length,
  };
  totals.monthlyBenefit = totals.annualBenefit / 12;
  // FUENTE states cash and freed hours explicitly. They deliberately do not sum
  // to the total: the $830 cost of carrying receivables is neither.
  totals.freedHours = BENEFIT.freedHoursAnnual;
  totals.otherBenefit = totals.annualBenefit - totals.cashBenefit - totals.freedHours;

  // Derived, not typed. The source document's 102% counts a system this page
  // does not show, and a hand-copied percentage is how every other figure here
  // went stale.
  totals.paybackPercent = Math.round((totals.annualBenefit / REPLACEMENT.juanYear1) * 100);
  totals.netPerMonth = totals.monthlyBenefit - SPEND.actualUsd;
  totals.multiple = totals.monthlyBenefit / SPEND.actualUsd;
  totals.paybackDays = (SPEND.actualUsd / totals.monthlyBenefit) * 30;

  // — sections —

  function renderHero() {
    mount('hero-title').textContent =
      `${totals.projects} systems running a distribution business. ` +
      `${usd(totals.annualBenefit)} a year returned. They pay ` +
      `${totals.paybackPercent}% of the salary that built them.`;

    const stats = [
      { value: String(totals.projects), label: 'Systems in the business' },
      { value: usd(totals.annualBenefit), label: 'Recurring benefit, yearly' },
      { value: usd(totals.cashBenefit), label: 'Of that, cash' },
      { value: usd(REPLACEMENT.agencyYear1), label: 'Agency quote to replace, year 1' },
      {
        value: `${totals.paybackPercent}%`,
        label: 'Of salary, paid back yearly',
        accent: true,
      },
    ];

    mount('stat-strip').replaceChildren(
      ...stats.map((stat) =>
        el('div', { class: 'stat' }, [
          el('div', { class: `stat-value${stat.accent ? ' stat-value--accent' : ''}`, text: stat.value }),
          el('div', { class: 'stat-label', text: stat.label }),
        ]),
      ),
    );
  }

  function renderMedia(project, index) {
    if (project.demo) {
      // Click to play, not autoplay: the file is ~400KB and the page has spent
      // real effort staying light. The poster carries the same visual weight as
      // the screenshots on the other cards until someone chooses to watch.
      const video = el('video', {
        class: 'project-video',
        poster: project.demo.poster,
        controls: '',
        preload: 'none',
        playsinline: '',
        muted: '',
        loop: '',
        width: 360,
        height: 780,
        'aria-label': project.demo.label,
      }, [
        el('source', { src: project.demo.webm, type: 'video/webm' }),
        el('source', { src: project.demo.mp4, type: 'video/mp4' }),
      ]);
      return el('div', { class: 'project-media project-media--video' }, [video]);
    }
    if (project.image) {
      return el('div', { class: 'project-media grayscale' }, [
        el('img', {
          src: project.image,
          alt: project.imageAlt || `${project.name} screenshot`,
          // Intrinsic size, so the box is reserved before the bytes land.
          width: project.imageSize?.width ?? null,
          height: project.imageSize?.height ?? null,
          // The first card is above the fold in every sort order.
          loading: index === 0 ? 'eager' : 'lazy',
          fetchpriority: index === 0 ? 'high' : null,
        }),
      ]);
    }
    return el('div', { class: 'project-media project-media--empty', text: 'No screenshot on file' });
  }

  function specRow(key, value, accent = false) {
    return el('div', { class: 'spec-row' }, [
      el('span', { class: 'spec-key', text: key }),
      el('span', { class: `spec-val${accent ? ' spec-val--accent' : ''}`, text: value }),
    ]);
  }

  function renderProject(project, index) {
    const evidence = [
      `${locLabel(project.loc)} LOC`,
      project.commits != null ? `${project.commits} commits` : null,
      project.tests != null ? `${project.tests} tests` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const nameNode = project.url
      ? el('a', { href: project.url, rel: 'noopener noreferrer', target: '_blank', text: project.name })
      : project.name;

    return el('article', { class: 'project' }, [
      renderMedia(project, index),
      el('div', { class: 'project-head' }, [
        el('span', { class: 'card-kicker', text: project.cat }),
        el('span', { class: 'project-index', text: String(index + 1).padStart(2, '0') }),
      ]),
      el('h3', { class: 'project-name' }, [nameNode]),
      el('p', { class: 'project-desc', text: project.desc }),
      el('div', { class: 'spec' }, [
        specRow('Status', project.status),
        specRow('The old way', project.benefit ? project.benefit.was : project.before),
        specRow('Now', project.benefit ? project.benefit.now : project.after),
        specRow(
          'Recurring benefit',
          annualBenefit(project) ? `${usd(annualBenefit(project))} / year` : 'No lever claimed',
          annualBenefit(project) > 0,
        ),
        project.openRisk
          ? specRow('Open risk', project.openRisk)
          : specRow('Of that, cash', cashBenefit(project) ? usd(cashBenefit(project)) : 'freed hours'),
      ]),
      el(
        'div',
        { class: 'tag-row' },
        project.stack.map((tech) => el('span', { class: 'tag tag-neutral', text: tech })),
      ),
      el('div', { class: 'card-meta', text: evidence }),
      el('div', { class: 'card-meta', text: `Verified: ${project.verified}` }),
    ]);
  }

  function renderProjects(sortBy) {
    const sorted = (SORTS[sortBy] || SORTS.featured)(PROJECTS);

    mount('project-grid').replaceChildren(
      ...sorted.map((project, index) => renderProject(project, index)),
    );

    mount('comparison-body').replaceChildren(
      ...sorted.map((project) =>
        el('tr', {}, [
          el('td', { class: 'cell-strong', text: project.name }),
          el('td', {}, [
            el('span', { class: 'text-muted', text: project.before }),
            ' ',
            el('span', { class: 'table-arrow', text: '→' }),
            ` ${project.after}`,
          ]),
          el('td', { text: project.benefit ? project.benefit.was : '—' }),
          el('td', { text: project.benefit?.levers?.length ? project.benefit.levers.map((l) => l.name).join(', ') : '—' }),
          el('td', {
            class: annualBenefit(project) ? 'cell-strong' : null,
            text: annualBenefit(project) ? `${usd(annualBenefit(project))} / yr` : 'No lever claimed',
          }),
        ]),
      ),
    );

    mount('comparison-total').replaceChildren(
      // Only the row label is a header; the rest are values, and marking them
      // th scope="col" told assistive tech they head their columns.
      el('th', { scope: 'row', text: 'Base case' }),
      el('td', { class: 'cell-strong', text: `${usd(BENEFIT.conservativeAnnual)} – ${usd(BENEFIT.optimisticAnnual)} range` }),
      el('td', { text: '' }),
      el('td', { class: 'cell-strong', text: `${usd(totals.cashBenefit)} cash · ${usd(totals.freedHours)} hours · ${usd(totals.otherBenefit)} finance` }),
      el('td', { class: 'cell-strong', text: `${usd(totals.annualBenefit)} / yr` }),
    );

    // Only speak after a user actually sorts. Writing this during the first
    // render makes a polite live region announce itself right after the page
    // title, interrupting the reading order for no reason.
    if (sortAnnounced) {
      mount('sort-status').textContent =
        `Showing ${sorted.length} projects, sorted by ${sortBy}.`;
    }
    sortAnnounced = true;
  }

  function renderCost() {
    const bigNumber = (n) =>
      n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : locLabel(n);

    const stats = [
      { value: usd(SPEND.actualUsd), label: 'Paid, 1 month' },
      { value: usd(SPEND.apiListEquivalentUsd), label: 'Same usage at API list' },
      { value: bigNumber(COST.promptTokens), label: 'Prompt tokens processed' },
      { value: bigNumber(COST.outputTokens), label: 'Output tokens written' },
      { value: String(COST.toolCalls.toLocaleString('en-US')), label: 'Tool calls' },
    ];

    mount('cost-strip').replaceChildren(
      ...stats.map((stat) =>
        el('div', { class: 'stat' }, [
          el('div', { class: 'stat-value', text: stat.value }),
          el('div', { class: 'stat-label', text: stat.label }),
        ]),
      ),
    );

    mount('cost-models').replaceChildren(
      ...COST.byModel.map((row) =>
        el('tr', {}, [
          el('td', { class: 'cell-strong', text: row.model }),
          el('td', { text: usd(row.usd) }),
        ]),
      ),
    );

    mount('cost-models-total').replaceChildren(
      el('th', { scope: 'row', text: 'Total at API list' }),
      el('td', { class: 'cell-strong', text: usd(SPEND.apiListEquivalentUsd) }),
    );

    const toolingMultiple = SPEND.apiListEquivalentUsd / SPEND.actualUsd;
    mount('cost-compare').replaceChildren(
      specRow('Recurring benefit', `${usd(totals.annualBenefit)} / year (base case)`, true),
      specRow('Range', `${usd(BENEFIT.conservativeAnnual)} – ${usd(BENEFIT.optimisticAnnual)}`),
      specRow('Of that, cash', usd(totals.cashBenefit)),
      specRow('Of that, freed hours', `${usd(totals.freedHours)} — only money if redeployed`),
      specRow('Neither', `${usd(totals.otherBenefit)} — cost of carrying receivables`),
      specRow('What runs it', `${usd(REPLACEMENT.juanYear1)} / year`),
      specRow('Agency to replace', `${usd(REPLACEMENT.agencyYear1)} year 1 · ${usd(REPLACEMENT.agencyYear3)} over 3`),
      specRow('New hire to replace', `${usd(REPLACEMENT.employeeYear1)} year 1 · ${REPLACEMENT.rampMonths} months to ramp`),
      specRow('One-off cost already avoided', `${usd(AVOIDED.conservative)} — market value, not cash`),
      specRow('Tooling', `${usd(SPEND.actualUsd)} / month · ${SPEND.label}`),
    );

    mount('cost-caveat').textContent =
      `Measured ${MEASURED_ON} across ${COST.sessions} sessions and ` +
      `${COST.assistantTurns.toLocaleString('en-US')} assistant turns ` +
      `(${COST.from} to ${COST.to}, ${COST.activeDays} active days, ` +
      `${COST.engagedHours} engaged hours). ${COST.caveat}`;
  }

  function renderNotes() {
    mount('rate-note').textContent =
      `${RATES.basis} ${BENEFIT.caveat} ${AVOIDED.warning} Source for every benefit and ` +
      `replacement figure: ${BENEFIT.source}.`;

    mount('evidence-note').textContent =
      `Project metrics are re-derived from the repositories by \`npm run measure\`, last run on ` +
      `${MEASURED_ON}. ${EVIDENCE.method} Cost and usage come from ${COST.sessions} Claude Code ` +
      `session transcripts (${COST.from} to ${COST.to}), read the same day. ${EVIDENCE.caveat}`;

    mount('tools-i-run').replaceChildren(
      ...TOOLS_I_RUN.map((tool) =>
        el('li', { class: 'honesty-item' }, [
          el('strong', { text: tool.name }),
          ` — ${tool.author}. ${tool.note}.`,
        ]),
      ),
    );

    document.querySelectorAll('[data-email]').forEach((node) => {
      node.setAttribute('href', `mailto:${CONTACT_EMAIL}`);
      if (node.dataset.email === 'text') node.textContent = CONTACT_EMAIL;
    });
  }

  /**
   * The hard part.
   *
   * Deliberately plain: a numbered problem, the reason it resisted the obvious
   * fix, what was actually built, and the file that proves it. No screenshots,
   * no diagrams — the claim here is reasoning, and reasoning reads.
   */
  function renderHardParts() {
    const list = mount('hard-list');
    list.replaceChildren(
      ...HARD_PARTS.map((entry, index) =>
        el('article', { class: 'hard' }, [
          el('header', { class: 'hard-head' }, [
            el('span', { class: 'hard-index', text: String(index + 1).padStart(2, '0') }),
            el('span', { class: 'hard-system', text: entry.system }),
          ]),
          el('h3', { class: 'hard-title', text: entry.title }),
          el('p', { class: 'hard-problem', text: entry.problem }),
          el('div', { class: 'hard-cols' }, [
            el('div', { class: 'hard-col' }, [
              el('h4', { class: 'hard-label', text: 'Why it resisted the obvious fix' }),
              el('p', { class: 'hard-body', text: entry.whyHard }),
            ]),
            el('div', { class: 'hard-col' }, [
              el('h4', { class: 'hard-label', text: 'What was built' }),
              el('p', { class: 'hard-body', text: entry.built }),
            ]),
          ]),
          el('footer', { class: 'hard-evidence' }, [
            el('span', { class: 'hard-label', text: 'Evidence' }),
            el(
              'ul',
              { class: 'hard-files' },
              entry.evidence.map((file) => el('li', { class: 'hard-file', text: file })),
            ),
          ]),
        ]),
      ),
    );
  }

  function bindSort() {
    document.querySelectorAll('input[name="sortBy"]').forEach((input) => {
      input.addEventListener('change', () => renderProjects(input.value));
    });
  }

  const stages = [
    ['hero', renderHero],
    ['hard parts', renderHardParts],
    ['cost', renderCost],
    ['notes', renderNotes],
    ['projects', () => renderProjects('featured')],
    ['sort binding', bindSort],
  ];

  try {
    for (const [name, run] of stages) {
      try {
        run();
      } catch (error) {
        // Name the stage. Without this the only diagnostic is a stack trace,
        // and a half-rendered page looks like a whole one to a reader.
        throw new Error(`render failed at the ${name} stage: ${error.message}`, { cause: error });
      }
    }
  } catch (error) {
    // The static fallback stays on screen, so the attribute reveals the banner
    // in index.html rather than letting a visitor read stale figures as current.
    document.documentElement.setAttribute('data-render-failed', 'true');
    console.error(error);
    throw error;
  }
})();

/**
 * The read.
 *
 * The site's one idea: it is a scanner, and it is reading its own evidence in
 * front of you. Every moving part here serves that and nothing else.
 *
 *   boot     the instrument acquires evidence.json and reports what it counted
 *   hero     bars resolve into type as the first read completes
 *   scroll   one normalised progress value drives the GL beam; the DOM follows
 *   figures  numbers count up to the value that was actually fetched
 *   cases    each case is wiped in by a scan line, not faded in
 *   cursor   a reticle; passing over something readable pulses the field
 *
 * The rule the rest of the repo lives under holds here too: this file states
 * no measured figure. Every number it animates was read out of the DOM that
 * js/dossier.js built from evidence.json, so the motion cannot show a value
 * the evidence file does not.
 *
 * Everything below is progressive enhancement. With this file removed the
 * document is complete, ordered and readable; with prefers-reduced-motion set
 * it renders fully composed and still.
 */

import { createScanner } from './gl-scanner.js';

/** Split "$28,162" into its prefix, its digits and its suffix.

    Declared here, at the top, and not beside the function that uses it: the
    reading can already be parked when this module is evaluated, in which case
    start() runs during evaluation and reaches countFigures() before a const
    further down the file has initialised. That threw, which stopped
    ScrollTrigger.refresh() from ever running, which left every case clipped
    shut — a blank page from a variable declared eleven lines too late. */
const NUMERIC = /^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/s;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ── the GL field ───────────────────────────────────────────────────────── */

const canvas = document.getElementById('gl');
const scanner = canvas ? createScanner(canvas) : null;
if (!scanner) root.dataset.gl = 'off';

/* ── boot ───────────────────────────────────────────────────────────────── */

/* The overlay ships hidden and is revealed here. If this module never runs —
   no modules, a syntax error, a blocked file — the document is simply visible,
   rather than sitting behind a loader that will never lift. */
const boot = document.getElementById('boot');
if (boot) boot.hidden = false;

const bootBar = document.getElementById('boot-bar');
const bootLog = document.getElementById('boot-log');

const say = (text) => {
  if (!bootLog) return;
  const line = document.createElement('span');
  line.textContent = text;
  bootLog.append(line);
};

const progress = (value) => {
  if (bootBar) bootBar.style.setProperty('--p', String(value));
  if (scanner) scanner.setReveal(Math.min(1, value * 1.1));
};

progress(0.08);
say('booting instrument');

if (document.fonts) document.fonts.ready.then(() => progress(0.24));

/* ── the read ───────────────────────────────────────────────────────────── */

function report(detail) {
  const { generatedAt, repos, files, cases } = detail || {};
  say('acquired evidence.json');
  progress(0.55);
  if (files && repos) say(`counted ${files} files across ${repos} repositories`);
  if (cases) say(`${cases} cases resolved`);
  if (generatedAt) say(`reading dated ${generatedAt}`);
  progress(1);
  start();
}

/* Late or early, the reading is picked up exactly once. An already-parked
   reading is taken on a microtask rather than inline, so the rest of this
   module has finished evaluating before any of it is called. */
if (window.PACK_READING) {
  queueMicrotask(() => report(window.PACK_READING));
} else {
  document.addEventListener('pack:ready', (event) => report(event.detail), { once: true });
}

/* If the evidence never arrives, the instrument says so and gets out of the
   way rather than holding the page behind a loader forever. */
setTimeout(() => {
  if (!root.dataset.started) {
    say('no reading — the document is below');
    progress(1);
    start();
  }
}, 6000);

/* ── the composed page ──────────────────────────────────────────────────── */

function start() {
  if (root.dataset.started) return;
  root.dataset.started = 'true';

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (!gsap) {
    if (boot) boot.hidden = true;
    root.dataset.composed = 'true';
    if (scanner) { scanner.setReveal(1); scanner.still(reduced); }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if (reduced) {
    /* Not shorter animations — no animations. The page arrives composed. */
    if (boot) boot.hidden = true;
    root.dataset.composed = 'true';
    if (scanner) { scanner.setReveal(1); scanner.setScroll(0.12); scanner.still(true); }
    return;
  }

  smoothScroll(gsap, ScrollTrigger);
  revealPage(gsap);
  wireScroll(gsap, ScrollTrigger);
  countFigures(gsap, ScrollTrigger);
  wireCursor(gsap);
}

/* ── smooth scroll ──────────────────────────────────────────────────────── */

function smoothScroll(gsap, ScrollTrigger) {
  const Lenis = window.Lenis;
  if (!Lenis) return;

  /* Anchors, Home/End, find-in-page and the rail all still have to work, so
     the wheel is smoothed and nothing else about scrolling is taken over. */
  const lenis = new Lenis({ duration: 0.9, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -24 });
    });
  });
}

/* ── the reveal ─────────────────────────────────────────────────────────── */

function revealPage(gsap) {
  const SplitText = window.SplitText;
  const title = document.getElementById('pack-title');
  const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (boot) {
    timeline
      .to('#boot-log', { opacity: 0, duration: 0.3 }, 0)
      .to(boot, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 0.9,
        ease: 'power4.inOut',
        onComplete: () => { boot.hidden = true; },
      }, 0.15);
  }

  /* The headline is the moment the bars become type, so it is split to
     characters and swept in left to right at the speed of the beam. */
  if (title && SplitText) {
    const split = new SplitText(title, { type: 'chars,words' });
    timeline.from(split.chars, {
      opacity: 0,
      yPercent: 40,
      filter: 'blur(6px)',
      duration: 0.6,
      stagger: 0.012,
      onComplete: () => split.revert(),
    }, 0.5);
  } else if (title) {
    timeline.from(title, { opacity: 0, y: 18, duration: 0.7 }, 0.5);
  }

  timeline
    .from('.kicker span', { opacity: 0, y: 8, duration: 0.5, stagger: 0.06 }, 0.45)
    .from('#pack-standfirst', { opacity: 0, y: 14, duration: 0.6 }, 0.75)
    .from('.totals > div', {
      opacity: 0,
      yPercent: 18,
      duration: 0.55,
      stagger: 0.05,
      onStart: () => { root.dataset.composed = 'true'; },
    }, 0.85)
    .from('.hero-cue', { opacity: 0, duration: 0.6 }, 1.3);
}

/* ── scroll ─────────────────────────────────────────────────────────────── */

function wireScroll(gsap, ScrollTrigger) {
  /* One normalised value for the whole page. The GL layer never listens to a
     scroll event of its own and never learns what a section is. */
  let ticked = false;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      ticked = true;
      if (scanner) scanner.setScroll(self.progress);
      root.style.setProperty('--read', self.progress.toFixed(4));
    },
  });

  /* The reveal below clips each case shut until its trigger fires. That is a
     reveal while the page is running and a BLANK PAGE if it is not: a tab
     opened in the background gets no rAF, so no trigger ever fires and the
     document is there but clipped to nothing. Observed exactly that.

     So the clip is treated as an enhancement with a deadline. If the master
     trigger has not updated once by the time this fires, the reveal is
     abandoned and every case is restored — the worst case becomes a page that
     simply appears, which is what it would have done with no script at all. */
  setTimeout(() => {
    if (ticked) return;
    gsap.utils.toArray('.case').forEach((node) => {
      gsap.set(node, { clearProps: 'clipPath,opacity' });
      gsap.set(node.querySelectorAll('.field'), { clearProps: 'opacity,x' });
    });
    gsap.utils.toArray('.prob').forEach((node) => gsap.set(node, { clearProps: 'opacity,y' }));
    ScrollTrigger.refresh();
  }, 4000);

  /* Each case is wiped in by a scan line rather than faded: the clip edge is
     the beam, and the content behind it is already laid out. */
  gsap.utils.toArray('.case').forEach((node) => {
    gsap.fromTo(node,
      { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0.25 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: node, start: 'top 82%', once: true },
      });

    gsap.from(node.querySelectorAll('.field'), {
      opacity: 0,
      x: -10,
      duration: 0.45,
      stagger: 0.035,
      ease: 'power2.out',
      scrollTrigger: { trigger: node, start: 'top 74%', once: true },
    });
  });

  /* The engineering notes are the payload. They arrive one at a time. */
  gsap.utils.toArray('.prob').forEach((node) => {
    gsap.from(node, {
      opacity: 0,
      y: 22,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: node, start: 'top 86%', once: true },
    });
  });

  /* The chart draws itself from zero, to the width it was rendered with. */
  gsap.utils.toArray('.bar').forEach((bar) => {
    const width = bar.style.width;
    gsap.fromTo(bar, { width: '0%' }, {
      width,
      duration: 1.1,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: bar.closest('.chart') || bar, start: 'top 78%', once: true },
    });
  });

  /* The rail tracks which case is being read. */
  const railLinks = new Map();
  document.querySelectorAll('#rail-list a').forEach((link) => {
    railLinks.set(link.getAttribute('href').slice(1), link);
  });
  gsap.utils.toArray('.case').forEach((node) => {
    ScrollTrigger.create({
      trigger: node,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => {
        const link = railLinks.get(node.id);
        if (link) link.classList.toggle('is-reading', self.isActive);
      },
    });
  });
}

/* ── figures ────────────────────────────────────────────────────────────── */

function countFigures(gsap, ScrollTrigger) {
  const targets = document.querySelectorAll(
    '.totals dd, .figures dd, .levers td.num, .crow .val');

  targets.forEach((node) => {
    const small = node.querySelector('small');
    const label = small ? small.outerHTML : '';
    const text = (small ? node.childNodes[0]?.textContent : node.textContent) || '';
    const parts = text.trim().match(NUMERIC);
    if (!parts) return;

    const [, prefix, digits, suffix] = parts;
    const target = Number(digits.replace(/,/g, ''));
    if (!Number.isFinite(target) || target === 0) return;

    const decimals = (digits.split('.')[1] || '').length;
    const counter = { value: 0 };
    const paint = () => {
      const shown = counter.value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      node.innerHTML = `${prefix}${shown}${suffix}${label}`;
    };

    gsap.to(counter, {
      value: target,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: paint,
      scrollTrigger: { trigger: node, start: 'top 92%', once: true },
    });
  });

  ScrollTrigger.refresh();
}

/* ── cursor ─────────────────────────────────────────────────────────────── */

function wireCursor(gsap) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const reticle = document.getElementById('reticle');
  if (!reticle) return;
  reticle.hidden = false;

  const x = gsap.quickTo(reticle, 'x', { duration: 0.22, ease: 'power3' });
  const y = gsap.quickTo(reticle, 'y', { duration: 0.22, ease: 'power3' });

  window.addEventListener('pointermove', (event) => {
    reticle.dataset.live = 'true';
    x(event.clientX);
    y(event.clientY);
    if (scanner) {
      const aspect = window.innerWidth / window.innerHeight;
      scanner.setPointer(
        (event.clientX / window.innerWidth - 0.5) * aspect,
        0.5 - event.clientY / window.innerHeight,
      );
    }
  }, { passive: true });

  /* Passing over something the page considers readable is a read: the
     reticle opens and the field pulses where the cursor is. */
  const readable = 'a, button, .case-head, .prob, .figures > div, .totals > div';
  document.addEventListener('pointerover', (event) => {
    if (!event.target.closest(readable)) return;
    reticle.dataset.reading = 'true';
    if (scanner) scanner.pulse();
  });
  document.addEventListener('pointerout', (event) => {
    if (event.target.closest(readable)) delete reticle.dataset.reading;
  });
}

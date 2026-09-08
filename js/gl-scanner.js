/**
 * The scanner field.
 *
 * One canvas for the whole page, one fullscreen triangle, one draw call. No 3D
 * library: everything here is a fragment shader, which is why the GL layer
 * costs a few kilobytes instead of the several hundred a scene graph would
 * have cost to draw exactly one rectangle.
 *
 * What it draws is the subject of CS-05. Code 128 encodes a value as bars of
 * four widths, and a cheap laser scanner reads those widths back out. The
 * field is bands of such bars at four depths, and a beam that sweeps them.
 * Scroll drives the beam and the parallax between bands, so the page reads as
 * one continuous surface being scanned rather than a stack of sections.
 *
 * The DOM is the document. This is decoration on top of it: pointer-events
 * none, aria-hidden, and every fact the page states is real text in the
 * markup. Remove the canvas and nothing is lost.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform vec2  uPointer;
uniform float uTime;
uniform float uScroll;
uniform float uReveal;
uniform float uPulse;
uniform float uStill;

const vec3 ACCENT = vec3(0.290, 0.871, 0.502);
const vec3 WARM   = vec3(0.941, 0.722, 0.447);

float hash(float n) { return fract(sin(n) * 43758.5453123); }

/* One band of Code 128-ish bars. The duty cycle per column is quantised to
   four widths, which is what makes it read as a barcode rather than as a
   generic stripe pattern. */
float bars(float x, float seed) {
  float i = floor(x);
  float r = hash(i + seed * 91.7);
  float w = 0.18 + floor(r * 4.0) * 0.19;
  return step(fract(x), w);
}

/* Gaussian sweep: how strongly the beam lights this column. */
float beam(float x, float centre, float width) {
  float d = (x - centre) / width;
  return exp(-d * d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p  = uv - 0.5;
  p.x *= uRes.x / uRes.y;

  float t = uTime * (1.0 - uStill);
  vec3 col = vec3(0.0);

  /* Four bands at four depths. The far ones are denser, dimmer and drift
     slower, and that is the entire depth cue — no fog, no perspective. */
  for (int b = 0; b < 4; b++) {
    float fb = float(b);
    float depth = 1.0 + fb * 0.9;

    float density = 26.0 * depth;
    float drift = t * (0.045 / depth) + uScroll * (1.9 / depth);
    float mask = bars(uv.x * density + drift * density * 0.12, fb);

    /* Bands occupy horizontal slabs, offset per depth so they interleave
       instead of stacking into one solid block. */
    float centreY = 0.5 + sin(fb * 2.4) * 0.34;
    float slab = exp(-pow((uv.y - centreY) * (2.4 + fb * 0.7), 2.0));

    /* The beam runs left to right as the page is read, plus a slow idle pass
       so the field is never completely dead. */
    float sweep = fract(uScroll * 1.35 + t * 0.055 + fb * 0.17);
    float lit = beam(uv.x, sweep, 0.045 + fb * 0.010);

    float base = 0.055 / depth;
    col += ACCENT * mask * slab * (base + lit * (1.35 / depth));
  }

  /* The read pulse: a ring left behind wherever the cursor passes over
     something the page considers readable. */
  if (uPulse > 0.001) {
    float r = length(p - uPointer);
    float ring = exp(-pow((r - uPulse * 0.55) * 9.0, 2.0));
    col += ACCENT * ring * (1.0 - uPulse) * 0.5;
  }

  /* One warm line along the top edge, in the colour the rest of the site
     reserves for a caveat. */
  float edge = exp(-pow((uv.y - 0.985) * 220.0, 2.0));
  col += WARM * edge * 0.05;

  /* Grain first, so the vignette darkens it too. */
  float g = hash(gl_FragCoord.x + gl_FragCoord.y * 313.0 + floor(t * 24.0));
  col += (g - 0.5) * 0.035;

  float vig = 1.0 - dot(p, p) * 0.38;
  col *= clamp(vig, 0.0, 1.0);

  gl_FragColor = vec4(col * uReveal, 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'shader failed to compile');
  }
  return shader;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {object|null} the field's controls, or null when there is no WebGL
 */
export function createScanner(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'program failed to link');
    }
  } catch (error) {
    console.warn('scanner: no GL layer —', error.message);
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = {};
  for (const name of ['uRes', 'uPointer', 'uTime', 'uScroll', 'uReveal', 'uPulse', 'uStill']) {
    u[name] = gl.getUniformLocation(program, name);
  }

  /* A fullscreen fragment shader charges for every pixel, so the backing
     store is capped below devicePixelRatio. The field is soft by design and
     nobody can tell — it is the difference between sixty frames and a
     slideshow on a phone. */
  const cap = window.matchMedia('(max-width: 760px)').matches ? 1 : 1.35;
  const state = { scroll: 0, reveal: 0, pointer: [0, 0], pulse: 0, still: 0 };
  let raf = 0;
  let frames = 0;
  const started = performance.now();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function frame() {
    resize();
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform2f(u.uPointer, state.pointer[0], state.pointer[1]);
    gl.uniform1f(u.uTime, (performance.now() - started) / 1000);
    gl.uniform1f(u.uScroll, state.scroll);
    gl.uniform1f(u.uReveal, state.reveal);
    gl.uniform1f(u.uPulse, state.pulse);
    gl.uniform1f(u.uStill, state.still);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frames += 1;

    if (state.pulse > 0) state.pulse = Math.max(0, state.pulse - 0.022);
    raf = state.still ? 0 : requestAnimationFrame(frame);
  }

  /* Nothing renders while the tab is hidden. A backgrounded canvas that keeps
     drawing is the most common way a page like this eats a battery. */
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf && !state.still) {
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  raf = requestAnimationFrame(frame);

  return {
    setScroll(v) { state.scroll = v; },
    setReveal(v) { state.reveal = v; },
    setPointer(x, y) { state.pointer[0] = x; state.pointer[1] = y; },
    pulse() { state.pulse = 1; },
    still(on) {
      state.still = on ? 1 : 0;
      if (on) { cancelAnimationFrame(raf); raf = 0; frame(); }
      else if (!raf) raf = requestAnimationFrame(frame);
    },
    get drawCalls() { return 1; },
    get frames() { return frames; },
    dispose() {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    },
  };
}

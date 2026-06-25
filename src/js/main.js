// ---------------------------------------------------------------------------
// main.js — WebGL2 driver + shader assembler
// ---------------------------------------------------------------------------
// Loads the shared GLSL libs once, then builds one program per engine by
// concatenating: preamble + complex.glsl + oklch.glsl + functions/<engine> +
// display.frag. Programs are cached, so switching presets is instant after the
// first build. Renders a single fullscreen triangle; all the work is in the
// fragment shader. No build step, no dependencies — open index.html via a
// static server (see README) and it runs.
// ---------------------------------------------------------------------------

import { ENGINES, ViewState } from './function-selector.js';

const SHADER_ROOT = 'src/shaders';

// Uniform preamble prepended to every assembled program. Declares the full
// uniform surface so any engine file can reference any tunable.
const PREAMBLE = `#version 300 es
precision highp float;
precision highp int;

uniform vec2  u_resolution;
uniform vec2  u_center;
uniform float u_zoom;
uniform float u_aspect;
uniform float u_time;

uniform float u_n;
uniform float u_m;
uniform vec2  u_c;
uniform int   u_variant;
uniform vec2  u_period1;
uniform vec2  u_period2;
uniform vec2  u_mob_a;
uniform vec2  u_mob_b;
uniform vec2  u_mob_c;
uniform vec2  u_mob_d;

uniform bool  u_contours;
uniform int   u_colorMode;

in  vec2 v_uv;
out vec4 fragColor;
`;

const VERTEX_SRC = `#version 300 es
precision highp float;
// Fullscreen triangle: 3 verts, no buffers needed (gl_VertexID trick).
out vec2 v_uv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  v_uv = p;                          // 0..2 across two of the verts
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.text();
}

function compile(gl, type, src, label) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    // Prefix each line with its number to make GLSL errors locatable.
    const numbered = src.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n');
    console.error(`[${label}] compile error:\n${log}\n---\n${numbered}`);
    throw new Error(`${label} compile failed: ${log}`);
  }
  return sh;
}

function link(gl, vs, fs) {
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('link failed: ' + gl.getProgramInfoLog(prog));
  }
  return prog;
}

class Renderer {
  constructor(gl, libs) {
    this.gl = gl;
    this.libs = libs;                 // { complex, oklch, display, vs }
    this.programs = new Map();        // engine name -> { prog, uniforms }
    this.functionSrc = new Map();     // engine name -> frag source
  }

  /** Build (or fetch from cache) the program for an engine. */
  async program(engine) {
    if (this.programs.has(engine)) return this.programs.get(engine);

    if (!this.functionSrc.has(engine)) {
      const src = await fetchText(`${SHADER_ROOT}/functions/${ENGINES[engine].file}`);
      this.functionSrc.set(engine, src);
    }

    const fragSrc = [
      PREAMBLE,
      this.libs.complex,
      this.libs.oklch,
      this.functionSrc.get(engine),
      this.libs.display,
    ].join('\n');

    const gl = this.gl;
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc, engine);
    const prog = link(gl, this.libs.vs, fs);

    const names = [
      'u_resolution', 'u_center', 'u_zoom', 'u_aspect', 'u_time',
      'u_n', 'u_m', 'u_c', 'u_variant', 'u_period1', 'u_period2',
      'u_mob_a', 'u_mob_b', 'u_mob_c', 'u_mob_d',
      'u_contours', 'u_colorMode',
    ];
    const uniforms = {};
    for (const n of names) uniforms[n] = gl.getUniformLocation(prog, n);

    const entry = { prog, uniforms };
    this.programs.set(engine, entry);
    return entry;
  }

  async draw(view, w, h, time) {
    const gl = this.gl;
    const { prog, uniforms: u } = await this.program(view.engine);
    gl.useProgram(prog);

    const p = view.params;
    gl.uniform2f(u.u_resolution, w, h);
    gl.uniform2f(u.u_center, view.center[0], view.center[1]);
    gl.uniform1f(u.u_zoom, view.zoom);
    gl.uniform1f(u.u_aspect, w / h);
    gl.uniform1f(u.u_time, time);

    gl.uniform1f(u.u_n, p.n);
    gl.uniform1f(u.u_m, p.m);
    gl.uniform2f(u.u_c, p.c[0], p.c[1]);
    gl.uniform1i(u.u_variant, p.variant | 0);
    gl.uniform2f(u.u_period1, p.period1[0], p.period1[1]);
    gl.uniform2f(u.u_period2, p.period2[0], p.period2[1]);
    gl.uniform2f(u.u_mob_a, p.mob_a[0], p.mob_a[1]);
    gl.uniform2f(u.u_mob_b, p.mob_b[0], p.mob_b[1]);
    gl.uniform2f(u.u_mob_c, p.mob_c[0], p.mob_c[1]);
    gl.uniform2f(u.u_mob_d, p.mob_d[0], p.mob_d[1]);

    gl.uniform1i(u.u_contours, view.contours ? 1 : 0);
    gl.uniform1i(u.u_colorMode, view.colorMode);

    gl.viewport(0, 0, w, h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

async function main() {
  const canvas = document.getElementById('gl');
  const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
  if (!gl) {
    document.getElementById('overlay').textContent = 'WebGL2 not available in this browser.';
    return;
  }

  // Load shared libs + presets in parallel.
  const [complex, oklch, display, presetsRaw] = await Promise.all([
    fetchText(`${SHADER_ROOT}/lib/complex.glsl`),
    fetchText(`${SHADER_ROOT}/lib/oklch.glsl`),
    fetchText(`${SHADER_ROOT}/display.frag`),
    fetchText('src/data/presets.json'),
  ]);
  const presetData = JSON.parse(presetsRaw);

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC, 'vertex');
  const renderer = new Renderer(gl, { complex, oklch, display, vs });
  // Empty VAO so drawArrays is legal in core WebGL2.
  gl.bindVertexArray(gl.createVertexArray());

  const view = new ViewState();
  view.applyPreset(presetData.presets.rosette);

  // Pre-warm program caches so preset switches never stutter.
  await Promise.all(Object.keys(ENGINES).map((e) => renderer.program(e)));

  const overlay = document.getElementById('overlay');
  function status() {
    overlay.textContent =
      `domain_coloring · ${view.engine} · zoom ${view.zoom.toFixed(2)} · ` +
      `center (${view.center[0].toFixed(2)}, ${view.center[1].toFixed(2)}) · ` +
      `${view.colorMode === 0 ? 'OKLCH' : 'HSV'}${view.contours ? ' · contours' : ''}\n` +
      `1-7 presets · scroll zoom · drag/click center · c color · x contours · [ ] n`;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  // --- interaction --------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    const preset = presetData.keymap[e.key];
    if (preset) view.applyPreset(presetData.presets[preset]);
    else if (e.key === 'c') view.colorMode ^= 1;
    else if (e.key === 'x') view.contours = !view.contours;
    else if (e.key === '[') view.params.n = Math.max(2, view.params.n - 1);
    else if (e.key === ']') view.params.n = Math.min(8, view.params.n + 1);
    status();
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    view.zoomBy(e.deltaY > 0 ? 1.1 : 1 / 1.1);
    status();
  }, { passive: false });

  // Click (or drag) to recenter on the complex coordinate under the cursor.
  function recenter(ev) {
    const rect = canvas.getBoundingClientRect();
    const uvx = (ev.clientX - rect.left) / rect.width - 0.5;
    const uvy = 0.5 - (ev.clientY - rect.top) / rect.height;
    const aspect = canvas.width / canvas.height;
    view.center[0] += uvx * aspect * view.zoom;
    view.center[1] += uvy * view.zoom;
    status();
  }
  let dragging = false;
  canvas.addEventListener('mousedown', (e) => { dragging = true; recenter(e); });
  canvas.addEventListener('mousemove', (e) => { if (dragging) recenter(e); });
  window.addEventListener('mouseup', () => { dragging = false; });

  // --- render loop --------------------------------------------------------
  const start = performance.now();
  function frame() {
    const t = (performance.now() - start) / 1000;
    renderer.draw(view, canvas.width, canvas.height, t);
    requestAnimationFrame(frame);
  }
  status();
  frame();
}

main().catch((err) => {
  console.error(err);
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.textContent = 'Error: ' + err.message + ' (see console)';
});

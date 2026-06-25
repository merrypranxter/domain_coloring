# Architecture

How the pixels actually get painted. Read `repo_seed.txt` first for the creative
brief; this is the wiring.

## Run it

The app fetches its shaders and presets at runtime, so it needs an HTTP origin
(a `file://` URL fails CORS):

```bash
npm start          # zero-dependency static server → http://localhost:8080
```

No build step, no bundler, no `node_modules`. Vanilla ES modules + WebGL2.

## The shader-assembly trick

GLSL has no `#include`. Rather than write one giant monolithic shader (or one
hand-maintained shader per function), `main.js` **assembles** a fragment program
at load time by string-concatenating, in order:

```
1. PREAMBLE            // #version, precision, the full uniform surface, v_uv, fragColor
2. lib/complex.glsl    // the spine: cmul, cdiv, cexp, cpow, csin, cgamma, …
3. lib/oklch.glsl      // perceptual phase wheel (stand-in for color_systems)
4. functions/<engine>  // defines exactly one: vec2 f(vec2 z)
5. display.frag        // main(): pixel→z, evaluate f, color, post
```

Because every engine file declares the *same* entry point — `vec2 f(vec2 z)` —
`display.frag` can call `f(z)` without knowing which engine it is. Swapping
engines = swapping slot 4 and relinking. Programs are cached per engine and
pre-warmed at startup, so preset switches are instant.

```
        ┌─────────────┐
pixel → │  display.frag│ ── calls ──▶ f(z)  ◀── one of functions/*.frag
        │   (main)     │ ◀─ uses ─── complex.glsl, oklch.glsl
        └─────────────┘
```

### Why this layout

- **One spine, no duplication.** `complex.glsl` is included by every program, so
  complex arithmetic is defined exactly once (the seed's hard rule).
- **Engines are data.** Adding a function is one `.frag` file plus one line in
  the `ENGINES` registry in `function-selector.js`. No JS changes to the
  renderer, no new uniforms unless the math needs them.
- **Color is swappable.** `oklch.glsl` mirrors the shared `color_systems`
  OKLCH ramp so it can be replaced by the real sibling repo without touching
  the pipeline.

## Uniform surface

All tunables are declared once in the `PREAMBLE` so any engine can reference any
of them (unused uniforms are simply optimized out per program):

| uniform | type | meaning |
|---|---|---|
| `u_center` / `u_zoom` / `u_aspect` | vec2/float/float | view → complex-plane mapping |
| `u_n` / `u_m` / `u_c` | float/float/vec2 | power & rational parameters |
| `u_variant` | int | exp_trig branch: 0 sin · 1 exp · 2 log · 3 tan |
| `u_period1` / `u_period2` | vec2 | elliptic full periods |
| `u_mob_a…d` | vec2×4 | Möbius coefficients |
| `u_contours` / `u_colorMode` | bool/int | enhancement + OKLCH/HSV toggle |
| `u_time` | float | reserved for animated parameters |

## Coloring pipeline (`display.frag`)

1. `v_uv` → complex `z = u_center + (uv − ½)·aspect·zoom`.
2. `w = f(z)`.
3. `hue = arg(w)/2π`; `lightness` from a `tanh`-compressed `log|w|` so zeros
   stay dark and poles bright without crushing the hue.
4. Optional contours: sawtooth on `log₂|w|` (magnitude rings) + 12 phase spokes
   at `π/6`.
5. OKLCH (perceptual) or HSV (raw) → sRGB.
6. Gentle vignette.

## Gotchas (carried from the seed, confirmed in code)

- **float32 zoom floor.** `ViewState.zoomBy` clamps zoom to `[1e-2, 1e4]`; below
  that, single-precision coordinates band. float64 emulation is a future stretch.
- **Phase wrap is a feature.** The ±π jump in `arg` draws branch cuts — see
  `log(z)` in `branch_neon`.
- **GLSL forbids recursion.** `cgamma`'s reflection calls a separate
  `cgamma_lanczos` core, not itself.
- **zeta needs analytic continuation.** Dirichlet-eta partial sums cover the
  critical strip; the functional equation handles `Re(s) < ½`. Naive `Σ 1/nˢ`
  would diverge.
- **elliptic truncation.** `℘` is a finite ±4 lattice sum; accuracy falls off
  far from the origin. Raise `LATTICE_N` for wider views at quadratic cost.

# domain_coloring

> every pixel is a complex number. paint it by where the function sends it.

## what it does

Treat each pixel as `z = x + iy`. Evaluate a complex function `f(z)`. Color it: hue = arg(f(z)), brightness = |f(z)|. Poles, zeros, and branch cuts bloom into psychedelic rosettes. Absorbs the unbuilt `complex_function_viz`.

## engines

- `power.glsl` — `f(z)=z^n` → clean n-fold rosettes. n ∈ [2,8].
- `rational.glsl` — `f(z)=(z^n − 1)/(z^m + c)` → zeros bloom, poles suck.
- `mobius.glsl` — `(az+b)/(cz+d)` → conformal warps.
- `exp_trig.glsl` — `sin(z)`, `exp(z)`, `log(z)` → periodic stripes + branch cuts.
- `elliptic.glsl` — Weierstrass ℘ / Jacobi sn,cn → doubly-periodic wallpaper.
- `zeta.glsl` — Riemann ζ via Riemann–Siegel. the critical strip.
- `newton.glsl` — Newton's method basins → root-coloring fractal.

**Spine:** `src/shaders/lib/complex.glsl` — `cmul`, `cdiv`, `cexp`, `clog`, `cpow`, `csin`, `ccos`. GLSL has no native complex type.

## pipeline

1. pixel → complex coord (`u_center`, `u_zoom`).
2. evaluate `f(z)` via chosen function + `complex.glsl`.
3. `arg(f)` → hue; `|f|` → log-scaled lightness.
4. sawtooth shading on `log|f|` (magnitude contours), phase contours at π/6.
5. **phase wheel via `color_systems`:** OKLCH hue wheel (perceptual) or raw HSV toggle.
6. house post (light chromatic + vignette).

## aesthetic regimes

- `rosette` — power, n=5, OKLCH wheel, contours on.
- `pole_bloom` — rational, n=3 m=2, c=0.4+0.3i. neon whirlpools.
- `zeta_strip` — zeta, Re∈[−5,40] Im∈[−20,20]. the haunted one.
- `elliptic_tiling` — elliptic, half-periods (1, i). seamless wallpaper.
- `branch_neon` — exp_trig `log(z)`, branch cut lit hot magenta.

## parameters

```
function: power | rational | mobius | exp_trig | elliptic | zeta | newton
n: 2–8 (for power)
zoom: 0.1–1000.0
center: complex
color_mode: oklch | hsv
contours: true | false
```

## gotchas

- float32 limits zoom depth — cap zoom or note float64-emulation stretch.
- phase wrap at ±π is a feature (draws branch cut).
- `zeta` needs real approximation, not naive summation.
- Newton basins overlap `fractals` — scope as phase-portrait take.

## run

The app loads shaders + presets at runtime, so it needs an HTTP origin
(`file://` fails CORS). Zero dependencies:

```bash
npm start          # static server on http://localhost:8080
```

Then: `1`–`7` switch presets, `scroll` zooms, `click`/drag recenters, `c`
toggles OKLCH/HSV, `x` toggles contours, `[` / `]` change `n`.

No build step. For the smallest possible taste with no server, open
[`examples/minimal.html`](examples/minimal.html) directly.

## layout

```
index.html                    canvas + overlay, loads src/js/main.js
serve.mjs                     zero-dep static server (npm start)
src/js/main.js                WebGL2 driver + shader assembler
src/js/function-selector.js   engine registry + live parameter state
src/shaders/lib/complex.glsl  the spine: complex arithmetic + Lanczos Γ
src/shaders/lib/oklch.glsl    perceptual phase wheel (color_systems stand-in)
src/shaders/functions/*.frag  one vec2 f(vec2 z) per engine
src/shaders/display.frag      pipeline tail: color + contours + post
src/data/presets.json         the aesthetic regimes + keymap
examples/                     minimal demo, bonus engines, PNG export, CPU ref
docs/                         math reference, visual targets, architecture
```

See [`docs/architecture.md`](docs/architecture.md) for how shader assembly works.

## ecosystem

**Consumes:** `color_systems` (OKLCH wheel) — vendored locally as
`src/shaders/lib/oklch.glsl` so the repo runs standalone; swap in the shared lib
when checked out (same `oklch_to_srgb` signature).  
**Consumed by:** none  
**Adjacent:** `fractals`, `kleinian_groups`, `noneuclidean`, `hopf_fibration`, `quasicrystals`  
**Absorbs:** `complex_function_viz`  
**Lane:** 2 (color as math)

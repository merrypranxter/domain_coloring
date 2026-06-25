# Examples

Standalone snippets and demos that sit alongside the main app. None of them are
required to run `domain_coloring` — they're here to learn from, copy, and extend.

| file | what it is | how to run |
|---|---|---|
| [`minimal.html`](minimal.html) | The whole idea in ~90 self-contained lines: one function, inlined shaders, no dependencies, no server. | Double-click it (works from `file://`). |
| [`extra-functions.glsl`](extra-functions.glsl) | A shelf of bonus engines — Joukowski, Blaschke product, Γ(z), `exp(1/z)` essential singularity, custom Newton cubic, a 10-fold rational mandala. | Copy a block into `src/shaders/functions/` and register it (instructions in the file header). |
| [`export-png.js`](export-png.js) | Save the live canvas to a PNG. Relies on the app's `preserveDrawingBuffer`. | Import `savePNG()` or press `s` in the app. |
| [`cpu-reference.mjs`](cpu-reference.mjs) | A pure-Node mirror of the pipeline (same math, no WebGL) that writes a PNG. Sanity-checks the shaders and renders stills headlessly. | `node examples/cpu-reference.mjs power 512 out.png` |

## Adding your own engine

1. Write `vec2 f(vec2 z)` using only the helpers in `src/shaders/lib/complex.glsl`.
2. Save it as `src/shaders/functions/<name>.frag`.
3. Register it in `src/js/function-selector.js` → `ENGINES`.
4. Optionally add a preset + keymap entry in `src/data/presets.json`.

See [`extra-functions.glsl`](extra-functions.glsl) for six ready-made bodies and
[`../docs/architecture.md`](../docs/architecture.md) for how assembly works.

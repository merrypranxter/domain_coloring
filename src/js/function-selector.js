// ---------------------------------------------------------------------------
// function-selector.js — engine registry + live parameter state
// ---------------------------------------------------------------------------
// Owns the catalogue of complex-function engines and the mutable parameter
// block that feeds shader uniforms. No WebGL here — main.js consumes this and
// pushes the values to the GPU. Keeping the registry data-only means new
// engines are a one-line addition plus a .frag file.
// ---------------------------------------------------------------------------

/**
 * Catalogue of available engines. `file` is the fragment shader under
 * src/shaders/functions/ that defines `vec2 f(vec2 z)`.
 * @type {Record<string, {file: string, label: string}>}
 */
export const ENGINES = {
  power:    { file: 'power.frag',    label: 'Power z^n' },
  rational: { file: 'rational.frag', label: 'Rational (z^n-1)/(z^m+c)' },
  mobius:   { file: 'mobius.frag',   label: 'Möbius (az+b)/(cz+d)' },
  exp_trig: { file: 'exp_trig.frag', label: 'Exp / Trig / Log' },
  elliptic: { file: 'elliptic.frag', label: 'Weierstrass ℘' },
  zeta:     { file: 'zeta.frag',     label: 'Riemann ζ' },
  newton:   { file: 'newton.frag',   label: 'Newton basins' },
};

/** Default value for every parameter uniform. */
export function defaultParams() {
  return {
    n: 5.0,
    m: 2.0,
    c: [0.4, 0.3],
    variant: 0,                 // exp_trig: 0 sin, 1 exp, 2 log, 3 tan
    period1: [2.0, 0.0],        // elliptic full periods
    period2: [0.0, 2.0],
    mob_a: [1.0, 0.0],          // Möbius coefficients
    mob_b: [0.0, 1.0],
    mob_c: [-1.0, 0.0],
    mob_d: [1.0, 0.0],
  };
}

/**
 * Live view + render state. Mutated in place by interaction handlers and
 * preset application; read once per frame by the renderer.
 */
export class ViewState {
  constructor() {
    this.engine = 'power';
    this.center = [0.0, 0.0];
    this.zoom = 4.0;
    this.colorMode = 0;         // 0 = oklch, 1 = hsv
    this.contours = true;
    this.params = defaultParams();
  }

  /** Apply a preset object (parsed from presets.json) onto this state. */
  applyPreset(preset) {
    this.engine = preset.function;
    this.center = preset.center.slice();
    this.zoom = preset.zoom;
    this.colorMode = preset.colorMode === 'hsv' ? 1 : 0;
    this.contours = !!preset.contours;
    this.params = defaultParams();
    for (const [k, v] of Object.entries(preset.params || {})) {
      this.params[k] = Array.isArray(v) ? v.slice() : v;
    }
    return this;
  }

  /** Clamp zoom to the float32-safe window noted in the gotchas. */
  zoomBy(factor) {
    this.zoom = Math.min(Math.max(this.zoom * factor, 1e-2), 1e4);
  }
}

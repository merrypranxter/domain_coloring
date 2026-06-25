// ===========================================================================
// extra-functions.glsl — bonus engines (copy-paste gallery)
// ===========================================================================
// Each block below is a complete drop-in body for a new engine. To wire one
// into the main app:
//   1. Save the block as src/shaders/functions/<name>.frag (just the f()).
//   2. Add it to ENGINES in src/js/function-selector.js, e.g.
//        joukowski: { file: 'joukowski.frag', label: 'Joukowski' },
//   3. (optional) add a preset in src/data/presets.json + a keymap entry.
// All of these use only helpers already in lib/complex.glsl — no new uniforms
// unless noted. They are NOT compiled as-is (multiple f() in one file); they're
// a reference shelf.
// ===========================================================================


// --- Joukowski map: f(z) = ½(z + 1/z) ------------------------------------
// The classic airfoil/conformal map. Two zeros at ±i blooming, a pole at the
// origin, and the unit circle maps to the segment [−1, 1]. Lovely lens shapes.
vec2 f_joukowski(vec2 z) {
  return 0.5 * (z + cinv(z));
}


// --- Finite Blaschke product (3 zeros on the unit disk) ------------------
// B(z) = Π (z − aₖ)/(1 − conj(aₖ)·z). Maps the unit disk to itself; every
// zero is mirrored to a pole outside. Hypnotic inside |z| < 1.
vec2 f_blaschke(vec2 z) {
  vec2 a[3];
  a[0] = vec2( 0.4,  0.2);
  a[1] = vec2(-0.3,  0.5);
  a[2] = vec2( 0.1, -0.45);
  vec2 prod = vec2(1.0, 0.0);
  for (int k = 0; k < 3; k++) {
    vec2 num = z - a[k];
    vec2 den = vec2(1.0, 0.0) - cmul(conj(a[k]), z);
    prod = cmul(prod, cdiv(num, den));
  }
  return prod;
}


// --- The Gamma function Γ(z) itself --------------------------------------
// Poles at every non-positive integer (0, −1, −2, …) marching off to the left,
// each a tight rainbow vortex. Uses the Lanczos cgamma() from the spine.
vec2 f_gamma(vec2 z) {
  return cgamma(z);
}


// --- tan(z): periodic poles + zeros --------------------------------------
// Zeros at z = kπ, poles at z = (k+½)π. A horizontal ladder of alternating
// blooms and vortices; doubly striped because tan is π-periodic.
vec2 f_tan(vec2 z) {
  return ctan(z);
}


// --- Essential singularity: exp(1/z) -------------------------------------
// The Casorati–Weierstrass nightmare. Near the origin the function takes every
// value infinitely often, so the phase wheel goes berserk — an infinitely
// detailed swirl that never resolves. Zoom in forever.
vec2 f_essential(vec2 z) {
  return cexp(cinv(z));
}


// --- Newton fractal for a custom polynomial p(z) = z^3 − 2z + 2 ----------
// A non-convergent cycle makes this one notoriously chaotic — great basins.
// (Variant of functions/newton.frag with a hardcoded cubic.)
vec2 f_newton_cubic(vec2 z) {
  for (int i = 0; i < 40; i++) {
    vec2 z2 = csqr(z);
    vec2 z3 = cmul(z2, z);
    vec2 p  = z3 - 2.0 * z + vec2(2.0, 0.0);   // z^3 − 2z + 2
    vec2 dp = 3.0 * z2 - vec2(2.0, 0.0);       // 3z^2 − 2
    vec2 step = cdiv(p, dp);
    z -= step;
    if (dot(step, step) < 1e-12) break;
  }
  return z;
}


// --- Rational "phase mandala": (z^5 − 1)/(z^5 + 1) ------------------------
// Five zeros and five poles interleaved on a ring — a perfectly symmetric
// 10-fold mandala. The most decorative one-liner in the shelf.
vec2 f_mandala(vec2 z) {
  vec2 z5 = cpow(z, 5.0);
  return cdiv(z5 - vec2(1.0, 0.0), z5 + vec2(1.0, 0.0));
}

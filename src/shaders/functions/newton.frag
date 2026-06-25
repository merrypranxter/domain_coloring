// newton.frag — Newton's-method basins of attraction → root-colored fractal.
// Iterate  z ← z - p(z)/p'(z)  for p(z) = z^n - 1. Each starting pixel flows to
// one of the n roots of unity; we return the converged root so the standard
// phase coloring paints each basin a distinct hue (the roots sit at evenly
// spaced angles). This is domain_coloring's *phase-portrait* take on a shape
// that also lives in `fractals` — scoped, not duplicated.
// u_n sets the polynomial degree; NEWTON_ITERS caps the flow.
const int NEWTON_ITERS = 40;

vec2 f(vec2 z) {
  float n = u_n;
  for (int i = 0; i < NEWTON_ITERS; i++) {
    vec2 zn   = cpow(z, n);                       // z^n
    vec2 p    = zn - vec2(1.0, 0.0);              // p(z)  = z^n - 1
    vec2 dp   = n * cpow(z, n - 1.0);             // p'(z) = n·z^(n-1)
    vec2 step = cdiv(p, dp);
    z -= step;
    if (dot(step, step) < 1e-12) break;           // converged to a root
  }
  return z;
}

// power.frag — f(z) = z^n  → clean n-fold rosettes (the win-condition shape).
// Uniform u_n (2..8) sets petal count. n=5 is the canonical "flower of light".
// Single zero of order n at the origin; no poles. The smoothest engine — start
// here when sanity-checking the pipeline.
vec2 f(vec2 z) {
  return cpow(z, u_n);
}

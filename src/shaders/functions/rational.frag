// rational.frag — f(z) = (z^n - 1) / (z^m + c)  → the money shot.
// Zeros of (z^n - 1) are the n-th roots of unity: they bloom as bright spots.
// Roots of (z^m + c) are poles: they suck inward as dark vortices.
// Tunables: u_n (numerator order), u_m (denominator order), u_c (complex shift).
// Preset pole_bloom: n=3, m=2, c=0.4+0.3i.
vec2 f(vec2 z) {
  vec2 num = cpow(z, u_n) - vec2(1.0, 0.0);
  vec2 den = cpow(z, u_m) + u_c;
  return cdiv(num, den);
}

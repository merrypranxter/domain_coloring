// elliptic.frag — Weierstrass ℘(z; ω1, ω2)  → doubly-periodic wallpaper.
//   ℘(z) = 1/z² + Σ_{ω≠0} [ 1/(z-ω)² - 1/ω² ]
// summed over the lattice ω = m·L1 + n·L2. Doubly periodic ⇒ the image tiles
// the plane seamlessly (the `elliptic_tiling` target). Half-periods (1, i) ⇒
// full periods L1 = 2, L2 = 2i, set via u_period1 / u_period2.
//
// Truncation: a finite ±LATTICE_N window. Larger N = better far-field accuracy
// but quadratically more work; 4 is a good speed/quality balance at default
// zoom. Double poles of order 2 sit at every lattice node.
const int LATTICE_N = 4;

vec2 f(vec2 z) {
  vec2 sum = cinv(csqr(z));               // 1/z^2 (the node at the origin)
  for (int m = -LATTICE_N; m <= LATTICE_N; m++) {
    for (int n = -LATTICE_N; n <= LATTICE_N; n++) {
      if (m == 0 && n == 0) continue;
      vec2 w = float(m) * u_period1 + float(n) * u_period2;
      vec2 dz = z - w;
      sum += cinv(csqr(dz)) - cinv(csqr(w));
    }
  }
  return sum;
}

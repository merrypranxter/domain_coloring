// zeta.frag — Riemann ζ(s)  → the haunted one, the critical strip.
// Naive Σ 1/n^s diverges for Re(s) ≤ 1, so we use the Dirichlet eta function
//   η(s) = Σ (-1)^(n-1) / n^s ,   ζ(s) = η(s) / (1 - 2^(1-s))
// η converges (conditionally) for Re(s) > 0, covering the whole critical strip
// Re∈(0,1). For Re(s) < 0.5 we reflect through the functional equation
//   ζ(s) = 2^s · π^(s-1) · sin(πs/2) · Γ(1-s) · ζ(1-s)
// so the `zeta_strip` view box Re∈[-5,40] renders correctly on both sides.
// The nontrivial zeros on Re=1/2 show up as points where every hue converges.
const int ZETA_TERMS = 64;

// n^(-s) = exp(-ln(n) · s)
vec2 cnpow_neg(float nf, vec2 s) {
  return cexp(-log(nf) * s);
}

vec2 eta(vec2 s) {
  vec2 acc = vec2(0.0);
  float sign = 1.0;
  for (int n = 1; n <= ZETA_TERMS; n++) {
    acc += sign * cnpow_neg(float(n), s);
    sign = -sign;
  }
  return acc;
}

vec2 zeta_direct(vec2 s) {
  // ζ = η / (1 - 2^(1-s)),  2^(1-s) = exp((1-s)·ln2)
  vec2 two_pow = cexp((vec2(1.0, 0.0) - s) * log(2.0));
  return cdiv(eta(s), vec2(1.0, 0.0) - two_pow);
}

vec2 f(vec2 z) {
  if (z.x >= 0.5) {
    return zeta_direct(z);
  }
  // reflection for the left half-plane
  vec2 s   = z;
  vec2 oms = vec2(1.0, 0.0) - s;                 // 1 - s
  vec2 chi = cmul(cexp(s * log(2.0)),            // 2^s
             cmul(cexp((s - vec2(1.0, 0.0)) * log(PI)),  // π^(s-1)
             cmul(csin(0.5 * PI * s),            // sin(πs/2)
                  cgamma(oms))));                // Γ(1-s)
  return cmul(chi, zeta_direct(oms));
}

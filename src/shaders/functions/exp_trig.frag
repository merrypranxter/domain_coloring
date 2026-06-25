// exp_trig.frag — sin(z) / exp(z) / log(z)  → periodic stripes + branch cuts.
// u_variant selects: 0 = sin(z), 1 = exp(z), 2 = log(z), 3 = tan(z).
// log(z) is the `branch_neon` target: the principal cut on the negative real
// axis is a hard phase wrap from +PI to -PI — lit hot magenta by the coloring.
// exp(z) gives horizontal periodic stripes (period 2πi); sin(z) gives a grid
// of zeros at z = kπ.
vec2 f(vec2 z) {
  if (u_variant == 0) return csin(z);
  if (u_variant == 1) return cexp(z);
  if (u_variant == 2) return clog(z);
  return ctan(z);
}

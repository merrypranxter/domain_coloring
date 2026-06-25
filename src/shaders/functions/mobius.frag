// mobius.frag — f(z) = (a·z + b) / (c·z + d)  → conformal warp.
// A Möbius transform: one zero (-b/a), one pole (-d/c), maps circles to
// circles. Shares its algebra with kleinian_groups. The phase portrait of a
// Möbius map is a single smooth swirl from zero to pole.
// Uniforms u_mob_a, u_mob_b, u_mob_c, u_mob_d are complex coefficients.
vec2 f(vec2 z) {
  vec2 num = cmul(u_mob_a, z) + u_mob_b;
  vec2 den = cmul(u_mob_c, z) + u_mob_d;
  return cdiv(num, den);
}

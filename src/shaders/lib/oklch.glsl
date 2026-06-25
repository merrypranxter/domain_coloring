// ---------------------------------------------------------------------------
// oklch.glsl  —  perceptual phase wheel
// ---------------------------------------------------------------------------
// In the Color Lab ecosystem this mirrors the shared `color_systems` OKLCH
// ramp. It lives here as a self-contained GLSL stand-in so domain_coloring
// runs without the sibling repo checked out. If color_systems is available,
// swap oklch_to_srgb() for its export — the signature is intentionally the
// same: vec3(L, C, h01) where L in [0,1], C is chroma, h01 is hue in [0,1].
//
// Why OKLCH and not HSV for phase: OKLCH is perceptually uniform, so equal
// steps in arg(f) become equal *perceived* color steps. HSV crams too much
// of the wheel into yellow/green and the phase rosette looks lopsided.
// ---------------------------------------------------------------------------

#ifndef OKLCH_GLSL
#define OKLCH_GLSL

// OKLab -> linear sRGB (Bjorn Ottosson's matrices)
vec3 oklab_to_linear_srgb(vec3 lab) {
  float l_ = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m_ = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s_ = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;

  float l = l_ * l_ * l_;
  float m = m_ * m_ * m_;
  float s = s_ * s_ * s_;

  return vec3(
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 linear_to_srgb(vec3 c) {
  vec3 lo = 12.92 * c;
  vec3 hi = 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(0.0031308, c));
}

// L in [0,1], C is chroma (~0.0-0.37 in gamut), h01 is hue fraction in [0,1].
vec3 oklch_to_srgb(vec3 lch) {
  float L = lch.x;
  float C = lch.y;
  float h = lch.z * TAU;
  vec3 lab = vec3(L, C * cos(h), C * sin(h));
  vec3 lin = oklab_to_linear_srgb(lab);
  return clamp(linear_to_srgb(lin), 0.0, 1.0);
}

// raw HSV fallback (the `color_mode: hsv` toggle)
vec3 hsv_to_srgb(vec3 hsv) {
  vec3 p = abs(fract(hsv.x + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return hsv.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), hsv.y);
}

#endif // OKLCH_GLSL

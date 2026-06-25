// ---------------------------------------------------------------------------
// display.frag — the pipeline tail
// ---------------------------------------------------------------------------
// The assembler (main.js) concatenates, in order:
//   1. a #version + precision + uniform preamble
//   2. lib/complex.glsl
//   3. lib/oklch.glsl
//   4. ONE functions/*.frag  (defines vec2 f(vec2 z))
//   5. this file               (defines main(), calls f)
// So `f`, the complex helpers, and the OKLCH helpers are all in scope here.
//
// Pipeline (matches README):
//   pixel → complex coord → evaluate f → arg→hue, log|f|→lightness
//         → magnitude + phase contours → OKLCH/HSV → vignette
// ---------------------------------------------------------------------------

// arg(w) wrapped to [0,1) for the hue wheel
float phase01(vec2 w) {
  return carg(w) / TAU + 0.5;
}

// sawtooth on log2|w|: bright bands at every power of two (magnitude contours)
float magContour(float logmag) {
  float t = fract(logmag);
  // soft triangle wave so the bands read as ripples, not hard lines
  return 0.85 + 0.15 * smoothstep(0.0, 0.5, abs(t - 0.5) * 2.0);
}

// phase grid lines every π/6 (12 spokes) — the "phase contour" enhancement
float phaseContour(vec2 w) {
  float spokes = 12.0;                       // 2π / (π/6)
  float a = carg(w) / TAU * spokes;
  float d = abs(fract(a) - 0.5) * 2.0;
  return 0.9 + 0.1 * smoothstep(0.0, 0.15, d);
}

void main() {
  // 1. pixel → complex plane (aspect-corrected, centered, zoomed)
  vec2 uv = (v_uv - 0.5) * vec2(u_aspect, 1.0);
  vec2 z  = u_center + uv * u_zoom;

  // 2. evaluate the chosen engine
  vec2 w = f(z);

  // 3. phase → hue, log-magnitude → lightness
  //    Keep lightness in a mid band (zeros darker, poles lighter, but never
  //    crushed to black/white) so the phase hue stays saturated everywhere.
  float hue    = phase01(w);
  float mag    = length(w);
  float logmag = log2(mag + 1e-9);
  float light  = 0.55 + 0.17 * tanh(0.35 * logmag);

  // 4. contour enhancement (toggle via u_contours)
  if (u_contours) {
    light *= magContour(logmag);
    light *= phaseContour(w);
  }

  // 5. color: OKLCH perceptual wheel, or raw HSV
  vec3 rgb;
  if (u_colorMode == 0) {
    // High, near-constant chroma for the neon look; ease off only at the very
    // ends of the lightness band where OKLCH runs out of gamut.
    float chroma = 0.155 * smoothstep(0.0, 0.30, light) * smoothstep(1.0, 0.78, light);
    rgb = oklch_to_srgb(vec3(light, max(chroma, 0.05), hue));
  } else {
    rgb = hsv_to_srgb(vec3(hue, 0.9, clamp(light + 0.1, 0.0, 1.0)));
  }

  // 6. house post: gentle vignette
  float r = length(v_uv - 0.5);
  rgb *= 1.0 - 0.22 * r * r;

  fragColor = vec4(rgb, 1.0);
}

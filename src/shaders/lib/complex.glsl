// ---------------------------------------------------------------------------
// complex.glsl  —  the spine
// ---------------------------------------------------------------------------
// GLSL has no native complex type. We model z = x + iy as vec2(x, y) where
// .x = real, .y = imaginary. Every engine in src/shaders/functions/ leans on
// these. Do NOT reimplement complex arithmetic downstream — import this.
//
// All functions are branch-cut aware: arg() uses atan(y, x) with the principal
// cut on the negative real axis, which is exactly the discontinuity domain
// coloring wants to draw (see exp_trig / log).
// ---------------------------------------------------------------------------

#ifndef COMPLEX_GLSL
#define COMPLEX_GLSL

const float PI  = 3.14159265358979323846;
const float TAU = 6.28318530717958647693;

// --- constructors / accessors --------------------------------------------
#define creal(z) ((z).x)
#define cimag(z) ((z).y)

vec2 conj(vec2 z)  { return vec2(z.x, -z.y); }
float carg(vec2 z) { return atan(z.y, z.x); }     // (-PI, PI]
float cabs(vec2 z) { return length(z); }
float cabs2(vec2 z){ return dot(z, z); }           // |z|^2, no sqrt

// --- ring operations ------------------------------------------------------
vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y,
              a.x * b.y + a.y * b.x);
}

// a / b = a * conj(b) / |b|^2
// The tiny epsilon keeps poles (b -> 0) as large finite values instead of
// NaN/Inf, which some drivers render as black/white holes.
vec2 cdiv(vec2 a, vec2 b) {
  float d = dot(b, b) + 1e-20;
  return vec2(a.x * b.x + a.y * b.y,
              a.y * b.x - a.x * b.y) / d;
}

vec2 cinv(vec2 z) { return conj(z) / (dot(z, z) + 1e-20); }

vec2 csqr(vec2 z) { return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y); }

// --- transcendentals ------------------------------------------------------
vec2 cexp(vec2 z) { return exp(z.x) * vec2(cos(z.y), sin(z.y)); }

// principal log: branch cut on the negative real axis
vec2 clog(vec2 z) { return vec2(log(length(z)), atan(z.y, z.x)); }

// real exponent (polar). Fast path used by power/rational rosettes.
vec2 cpow(vec2 z, float n) {
  float r  = length(z);
  float th = atan(z.y, z.x);
  return pow(r, n) * vec2(cos(n * th), sin(n * th));
}

// complex exponent: z^w = exp(w * log z)
vec2 cpowc(vec2 z, vec2 w) { return cexp(cmul(w, clog(z))); }

vec2 csqrt(vec2 z) {
  float r = length(z);
  // r >= |z.x| analytically, but max(0.0, ...) guards float rounding from
  // pushing the argument slightly negative -> NaN.
  float a = sqrt(max(0.0, 0.5 * (r + z.x)));
  float b = sqrt(max(0.0, 0.5 * (r - z.x))) * sign(z.y == 0.0 ? 1.0 : z.y);
  return vec2(a, b);
}

// --- trig / hyperbolic ----------------------------------------------------
vec2 csin(vec2 z) { return vec2(sin(z.x) * cosh(z.y),  cos(z.x) * sinh(z.y)); }
vec2 ccos(vec2 z) { return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y)); }
vec2 ctan(vec2 z) { return cdiv(csin(z), ccos(z)); }

vec2 csinh(vec2 z) { return vec2(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y)); }
vec2 ccosh(vec2 z) { return vec2(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y)); }

// --- Lanczos complex gamma (g=7, n=9) -------------------------------------
// Needed by zeta's functional equation. GLSL forbids recursion, so the core
// Lanczos sum (valid for Re(z) ≥ 0.5) is split from the reflection wrapper.
vec2 cgamma_lanczos(vec2 z) {
  const float g = 7.0;
  float c[9];
  c[0] =  0.99999999999980993;
  c[1] =  676.5203681218851;
  c[2] = -1259.1392167224028;
  c[3] =  771.32342877765313;
  c[4] = -176.61502916214059;
  c[5] =  12.507343278686905;
  c[6] = -0.13857109526572012;
  c[7] =  9.9843695780195716e-6;
  c[8] =  1.5056327351493116e-7;

  vec2 zz = z - vec2(1.0, 0.0);
  vec2 a  = vec2(c[0], 0.0);
  vec2 t  = zz + vec2(g + 0.5, 0.0);
  for (int i = 1; i < 9; i++) {
    a += cdiv(vec2(c[i], 0.0), zz + vec2(float(i), 0.0));
  }
  // sqrt(2π) * t^(zz+0.5) * exp(-t) * a
  vec2 tpow = cpowc(t, zz + vec2(0.5, 0.0));
  vec2 res  = cmul(tpow, cexp(-t));
  res = cmul(res, a);
  return sqrt(TAU) * res;
}

vec2 cgamma(vec2 z) {
  if (z.x < 0.5) {
    // reflection: Γ(z)Γ(1-z) = π / sin(πz)  → no self-recursion
    vec2 sinpz = csin(PI * z);
    vec2 g1mz  = cgamma_lanczos(vec2(1.0, 0.0) - z);
    return cdiv(vec2(PI, 0.0), cmul(sinpz, g1mz));
  }
  return cgamma_lanczos(z);
}

#endif // COMPLEX_GLSL

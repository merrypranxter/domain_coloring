# Math Reference

## Complex Arithmetic
- `z = x + iy` stored as `vec2(x, y)`
- `cmul(a,b) = (a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x)`
- `cdiv(a,b) = (a·b̄, a×b̄) / |b|²`
- `cpow(z,n) = |z|^n * (cos(nθ), sin(nθ))`

## Phase and Magnitude Coloring
```
hue = atan(Im(f(z)), Re(f(z))) / (2π)
lightness = 0.5 + 0.1 * log(|f(z)| + 1)
```

## Contour Enhancement
- Magnitude: sawtooth on `log|f(z)|` at powers of 2
- Phase: lines at `arg(f(z)) = kπ/6`

## OKLCH Phase Wheel
Perceptual hue wheel via `color_systems`. Even color steps, no yellow dominance.

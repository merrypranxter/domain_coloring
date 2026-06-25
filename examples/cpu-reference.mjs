// ===========================================================================
// cpu-reference.mjs — headless domain coloring on the CPU, no WebGL
// ===========================================================================
// A pure-Node mirror of the GPU pipeline: same complex arithmetic, same
// phase→hue / log|f|→lightness mapping, written out as a PNG. Useful as a
// math sanity check (if the CPU and GPU images disagree, a shader is wrong)
// and as a way to batch-render stills in CI with no browser.
//
//   node examples/cpu-reference.mjs [function] [size] [out.png]
//   functions: power | rational | mandala   (default: power)
//
// PNG is encoded with Node's built-in zlib — zero dependencies.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

// --- complex arithmetic (mirrors lib/complex.glsl) ------------------------
const cmul = (a, b) => [a[0]*b[0] - a[1]*b[1], a[0]*b[1] + a[1]*b[0]];
const cdiv = (a, b) => { const d = b[0]*b[0] + b[1]*b[1];
  return [(a[0]*b[0] + a[1]*b[1])/d, (a[1]*b[0] - a[0]*b[1])/d]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const carg = (a) => Math.atan2(a[1], a[0]);
const cpow = (z, n) => { const r = cabs(z), t = carg(z);
  return [Math.pow(r, n)*Math.cos(n*t), Math.pow(r, n)*Math.sin(n*t)]; };

// --- engines (mirrors src/shaders/functions/*) ----------------------------
const ENGINES = {
  power:    (z) => cpow(z, 5),
  rational: (z) => cdiv([cpow(z,3)[0]-1, cpow(z,3)[1]], [cpow(z,2)[0]+0.4, cpow(z,2)[1]+0.3]),
  mandala:  (z) => { const z5 = cpow(z,5); return cdiv([z5[0]-1,z5[1]],[z5[0]+1,z5[1]]); },
};

// --- HSV coloring (matches the minimal example) ---------------------------
function hsv(h, s, v) {
  const i = Math.floor(h*6), f = h*6 - i;
  const p = v*(1-s), q = v*(1-f*s), t = v*(1-(1-f)*s);
  const [r,g,b] = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
  return [r*255|0, g*255|0, b*255|0];
}

// --- minimal PNG encoder (truecolor, no filter) ---------------------------
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(width, height, rgb) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;                       // 8-bit, truecolor RGB
  const raw = Buffer.alloc(height * (1 + width*3));
  for (let y = 0; y < height; y++) {
    raw[y*(1+width*3)] = 0;                        // filter type 0
    rgb.copy(raw, y*(1+width*3)+1, y*width*3, (y+1)*width*3);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- render ---------------------------------------------------------------
const name = process.argv[2] || 'power';
const size = parseInt(process.argv[3] || '512', 10);
const out  = process.argv[4] || `cpu-${name}.png`;
const f = ENGINES[name];
if (!f) { console.error(`unknown function "${name}". options: ${Object.keys(ENGINES).join(', ')}`); process.exit(1); }

const ZOOM = 4;
const rgb = Buffer.alloc(size * size * 3);
for (let py = 0; py < size; py++) {
  for (let px = 0; px < size; px++) {
    const x = (px/size - 0.5) * ZOOM;
    const y = (0.5 - py/size) * ZOOM;
    const w = f([x, y]);
    const hue = carg(w)/(2*Math.PI) + 0.5;
    const L = 0.5 + 0.5*Math.tanh(0.3*Math.log2(cabs(w) + 1e-9));
    const [r,g,b] = hsv(((hue%1)+1)%1, 0.9, Math.max(0, Math.min(1, L)));
    const i = (py*size + px)*3;
    rgb[i] = r; rgb[i+1] = g; rgb[i+2] = b;
  }
}
writeFileSync(out, encodePNG(size, size, rgb));
console.log(`wrote ${out} (${size}×${size}, ${name})`);

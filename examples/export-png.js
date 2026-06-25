// ===========================================================================
// export-png.js — save the current frame as a PNG
// ===========================================================================
// The main app creates its WebGL2 context with { preserveDrawingBuffer: true },
// which is exactly what makes canvas.toBlob() return real pixels instead of a
// blank image. Paste this into the browser console while the app is running, or
// import savePNG() and wire it to a key.
//
// Note: call it right after a draw (e.g. inside the requestAnimationFrame loop,
// or via requestAnimationFrame here) — otherwise the buffer may have been
// cleared depending on browser timing.

/**
 * Download the current canvas as a PNG.
 * @param {string} [filename='domain_coloring.png']
 * @param {string} [selector='#gl']
 * @returns {Promise<void>}
 */
export function savePNG(filename = 'domain_coloring.png', selector = '#gl') {
  const canvas = document.querySelector(selector);
  return new Promise((resolve, reject) => {
    // Defer to the next frame so we capture a freshly rendered buffer.
    requestAnimationFrame(() => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('toBlob returned null'));
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: filename });
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    });
  });
}

// Optional: hold-to-save on the "s" key. Remove if you don't want the binding.
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 's' && !e.repeat) savePNG();
  });
}

// Console one-liner (no import): copy the body of savePNG and call it directly.

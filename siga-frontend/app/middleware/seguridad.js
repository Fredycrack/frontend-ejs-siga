/**
 * Encabezados de seguridad de las respuestas (RNF06).
 * La politica de contenido solo permite scripts servidos por SIGA: las
 * librerias de graficas (Chart.js) y del lector QR (jsQR) se
 * incluyen en public/js/vendor, de modo que tambien funcionan sin internet.
 */
const POLITICA = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

export const encabezadosSeguridad = (req, res, next) => {
  res.set({
    'Content-Security-Policy': POLITICA,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(self), geolocation=(self), microphone=()'
  });
  next();
};

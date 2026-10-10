import { Router } from 'express';
import { config } from '../config/env.js';

/**
 * Puente /api -> API REST del backend.
 * El navegador llama a /api/... en el mismo dominio del frontend y este
 * servidor reenvia la peticion agregando el token guardado en la sesion.
 * Asi el token nunca queda expuesto al codigo del navegador.
 */
const router = Router();
const PUBLICAS = [/^\/seguimiento\/[A-Za-z0-9]+$/];

router.use(async (req, res) => {
  const publica = req.method === 'GET' && PUBLICAS.some((r) => r.test(req.path));
  if (/^\/(portal\/)?login$/.test(req.path)) {
    return res.status(404).json({ error: 'Use el formulario de inicio de sesion' });
  }
  if (!publica && !req.session?.token) {
    return res.status(401).json({ error: 'La sesion expiro. Inicie sesion de nuevo.' });
  }
  // Proteccion contra peticiones de otros sitios: las operaciones que
  // modifican datos deben venir del codigo propio de SIGA (encabezado X-SIGA)
  if (!['GET', 'HEAD'].includes(req.method) && req.get('X-SIGA') !== '1') {
    return res.status(403).json({ error: 'Solicitud no permitida' });
  }
  const headers = { Accept: req.get('Accept') || 'application/json' };
  if (req.session?.token) headers.Authorization = `Bearer ${req.session.token}`;
  const conCuerpo = !['GET', 'HEAD', 'DELETE'].includes(req.method) || (req.body && Object.keys(req.body).length);
  if (conCuerpo) headers['Content-Type'] = 'application/json';
  try {
    const r = await fetch(`${config.apiUrl}${req.url}`, {
      method: req.method,
      headers,
      body: conCuerpo ? JSON.stringify(req.body || {}) : undefined,
      signal: AbortSignal.timeout(90000)
    });
    if (r.status === 401) req.session = null;
    res.status(r.status);
    for (const h of ['content-type', 'content-disposition']) {
      const v = r.headers.get(h);
      if (v) res.set(h, v);
    }
    res.set('Cache-Control', 'no-store');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch {
    res.status(503).json({ error: 'No fue posible conectar con el servidor de la API' });
  }
});

export default router;

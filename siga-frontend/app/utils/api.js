import { config } from '../config/env.js';

/**
 * Cliente de la API REST del backend.
 * El token JWT vive en la sesion del servidor (cookie firmada y httpOnly):
 * el navegador nunca lo ve, y cada consulta lo agrega en el encabezado.
 */
export class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export const llamarApi = async (req, metodo, ruta, cuerpo) => {
  const headers = { Accept: 'application/json' };
  if (req.session?.token) headers.Authorization = `Bearer ${req.session.token}`;
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  let respuesta;
  try {
    respuesta = await fetch(`${config.apiUrl}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: AbortSignal.timeout(60000)
    });
  } catch {
    throw new ErrorApi(503, 'No fue posible conectar con el servidor de la API. Intente de nuevo en unos segundos.');
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, datos.error || `Error ${respuesta.status}`);
  return datos;
};

export const api = {
  get: (req, ruta) => llamarApi(req, 'GET', ruta),
  post: (req, ruta, cuerpo = {}) => llamarApi(req, 'POST', ruta, cuerpo)
};

/**
 * Carga varias rutas de la API en paralelo.
 * fuentes: { nombre: '/ruta' } o { nombre: { ruta, opcional: true } }.
 * Las fuentes opcionales devuelven [] si el rol no tiene permiso o fallan.
 */
export const cargar = async (req, fuentes) => {
  const nombres = Object.keys(fuentes);
  const valores = await Promise.all(nombres.map(async (n) => {
    const f = typeof fuentes[n] === 'string' ? { ruta: fuentes[n] } : fuentes[n];
    try {
      return await api.get(req, f.ruta);
    } catch (e) {
      if (f.opcional && e.estado !== 401) return f.vacio ?? [];
      throw e;
    }
  }));
  return Object.fromEntries(nombres.map((n, i) => [n, valores[i]]));
};

// Arma una cadena de consulta con los filtros que tengan valor
export const consulta = (filtros = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) if (v !== undefined && v !== null && v !== '') p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
};

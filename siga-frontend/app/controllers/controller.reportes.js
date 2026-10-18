import { pagina } from '../utils/pagina.js';
import { consulta } from '../utils/api.js';
import { hoy, inicioAnio } from '../utils/formato.js';

/**
 * Modulo 8 - Reportes y estadisticas: rentabilidad (RF38), exportacion
 * (RF39) y productividad del personal (RF40).
 */
const rango = (q) => ({ desde: q.desde || inicioAnio(), hasta: q.hasta || hoy() });

export const indice = (req, res) => res.render('reportes/indice', { titulo: 'Reportes', rango: rango(req.query) });

export const rentabilidad = pagina('reportes/rentabilidad', (req) => ({
  reporte: `/reportes/rentabilidad${consulta({ ...rango(req.query), agrupar: req.query.agrupar === 'servicio' ? 'servicio' : 'cliente' })}`
}));

export const productividad = pagina('reportes/productividad', (req) => ({
  reporte: `/reportes/productividad${consulta({ ...rango(req.query), rol: req.query.rol })}`
}));

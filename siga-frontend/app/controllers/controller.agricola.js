import { pagina } from '../utils/pagina.js';
import { consulta } from '../utils/api.js';
import { sumarDias } from '../utils/formato.js';

/**
 * Modulo 1 - Servicios agricolas: programacion y seguimiento de labores
 * (RF07 a RF12).
 */
const catalogos = {
  contratos: '/contratos?estado=Vigente',
  servicios: '/servicios?tipo_servicio=Agricola&estado=Activo',
  trabajadores: '/empleados?rol=Trabajador de Campo&estado=Activo'
};

export const listar = pagina('agricola/labores', (req) => ({
  labores: `/labores${consulta({
    estado: req.query.estado, fecha: req.query.fecha, id_contrato: req.query.id_contrato,
    id_empleado: req.query.id_empleado, desde: req.query.desde, hasta: req.query.hasta
  })}`,
  contratos: { ruta: '/contratos', opcional: true },
  trabajadores: { ruta: '/empleados?rol=Trabajador de Campo', opcional: true }
}));

export const nueva = pagina('agricola/form', catalogos, (req) => ({ labor: { fecha_programada: req.query.fecha || '' } }));

export const editar = pagina('agricola/form', (req) => ({ ...catalogos, labor: `/labores/${req.params.id}` }));

export const detalle = pagina('agricola/detalle', (req) => ({
  labor: `/labores/${req.params.id}`,
  evidencias: `/labores/${req.params.id}/evidencias`
}));

// RF11 - Avance de las labores por contrato
export const avance = pagina('agricola/avance', (req) => ({
  resumen: `/labores/resumen${consulta({ desde: req.query.desde, hasta: req.query.hasta })}`
}));

// RF08 a RF10 y RF12 - Vista movil del trabajador de campo (funciona sin conexion)
export const misLabores = pagina('agricola/mis-labores', () => ({
  labores: `/labores?desde=${sumarDias(-7)}`
}));

import { pagina, formulario } from '../utils/pagina.js';
import { consulta } from '../utils/api.js';
import { hoy, sumarDias, inicioAnio } from '../utils/formato.js';
import * as F from '../config/formularios.js';

/**
 * Modulo 6 - Seguridad y salud en el trabajo: capacitaciones (RF29),
 * entrega de EPP (RF30), incidentes (RF31) e indicadores (RF32).
 */
export const capacitaciones = pagina('sst/capacitaciones', (req) => ({
  capacitaciones: `/capacitaciones${consulta({ estado: req.query.estado })}`
}));

export const capacitacion = pagina('sst/capacitacion', (req) => ({
  capacitacion: `/capacitaciones/${req.params.id}`,
  empleados: '/empleados?estado=Activo'
}));

export const nuevaCapacitacion = formulario(() => ({
  titulo: 'Programar capacitacion', subtitulo: 'RF29: seleccione los trabajadores convocados.',
  migas: [['Capacitaciones', '/capacitaciones']], campos: F.CAPACITACION,
  fuentes: { empleados: '/empleados?estado=Activo' }, valores: { fecha_capacitacion: sumarDias(3), hora_inicio: '14:00', hora_fin: '16:00' },
  api: '/api/capacitaciones', volver: '/capacitaciones/{id}', cancelar: '/capacitaciones', boton: 'Programar'
}));

export const editarCapacitacion = formulario((req) => ({
  titulo: (c) => `Editar: ${c.tema}`, migas: [['Capacitaciones', '/capacitaciones']], campos: F.CAPACITACION,
  fuentes: { capacitacion: `/capacitaciones/${req.params.id}` }, registro: 'capacitacion',
  api: `/api/capacitaciones/${req.params.id}`, volver: `/capacitaciones/${req.params.id}`, cancelar: `/capacitaciones/${req.params.id}`
}));

export const epp = pagina('sst/epp', (req) => ({
  entregas: `/epp${consulta({ id_empleado: req.query.id_empleado })}`,
  empleados: '/empleados?estado=Activo',
  elementos: { ruta: '/inventario?categoria=EPP&estado=Activo', opcional: true }
}));

export const incidentes = pagina('sst/incidentes', (req) => ({
  incidentes: `/incidentes${consulta({ estado: req.query.estado, tipo: req.query.tipo })}`
}));

export const incidente = pagina('sst/incidente', (req) => ({ incidente: `/incidentes/${req.params.id}` }));

export const nuevoIncidente = formulario(() => ({
  titulo: 'Reportar incidente o accidente', subtitulo: 'RF31: registre el evento lo antes posible; el responsable SST hace el seguimiento.',
  migas: [['Incidentes', '/incidentes']], campos: F.INCIDENTE,
  fuentes: { empleados: '/empleados?estado=Activo' }, valores: { fecha_evento: `${hoy()} ${new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(11, 16)}` },
  api: '/api/incidentes', volver: '/incidentes/{id}', cancelar: '/incidentes', boton: 'Registrar reporte'
}));

export const indicadores = pagina('sst/indicadores', (req) => ({
  datos: `/reportes/sst${consulta({ desde: req.query.desde || inicioAnio(), hasta: req.query.hasta || hoy() })}`
}));

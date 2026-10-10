import { pagina, formulario } from '../utils/pagina.js';
import { consulta } from '../utils/api.js';
import { hoy, sumarDias } from '../utils/formato.js';
import * as F from '../config/formularios.js';

/**
 * Modulo 4 - Gestion de personal: asistencia con QR (RF19), tareas
 * (RF20, RF21), nomina (RF22) y consultas personales del empleado.
 */
export const asistencia = pagina('personal/asistencia', (req) => ({
  registros: `/asistencia${consulta({
    desde: req.query.desde || sumarDias(-6), hasta: req.query.hasta || hoy(), id_empleado: req.query.id_empleado
  })}`,
  empleados: '/empleados?estado=Activo'
}));

export const kiosco = (req, res) => res.render('personal/kiosco', { titulo: 'Lector QR de asistencia' });

export const tareas = pagina('personal/tareas', (req) => ({
  tareas: `/tareas${consulta({ estado: req.query.estado, prioridad: req.query.prioridad, id_empleado: req.query.id_empleado })}`,
  empleados: '/empleados?estado=Activo'
}));

export const nuevaTarea = formulario((req) => ({
  titulo: 'Asignar tarea', subtitulo: 'RF20: la tarea aparece en "Mis tareas" del responsable.',
  migas: [['Tareas', '/tareas']], campos: F.TAREA, fuentes: { empleados: '/empleados?estado=Activo' },
  valores: { fecha_inicio: hoy(), fecha_limite: sumarDias(1), id_empleado: req.query.id_empleado },
  api: '/api/tareas', volver: '/tareas', cancelar: '/tareas', boton: 'Asignar tarea'
}));

export const editarTarea = formulario((req) => ({
  titulo: (t) => `Editar tarea: ${t.titulo}`, migas: [['Tareas', '/tareas']], campos: F.TAREA,
  fuentes: { empleados: '/empleados?estado=Activo', tareas: '/tareas' },
  registro: (d) => d.tareas.find((t) => String(t.id_tarea) === req.params.id),
  api: `/api/tareas/${req.params.id}`, volver: '/tareas', cancelar: '/tareas'
}));

export const nomina = pagina('personal/nomina', (req) => {
  const fuentes = { periodos: '/nomina/periodos' };
  if (req.query.periodo_inicio) {
    fuentes.liquidaciones = `/nomina${consulta({ periodo_inicio: req.query.periodo_inicio, periodo_fin: req.query.periodo_fin })}`;
  }
  return fuentes;
}, () => ({ sugerido: { inicio: `${hoy().slice(0, 8)}01`, fin: hoy() } }));

// ---------- Consultas personales del empleado ----------
export const misTareas = pagina('personal/mis-tareas', { tareas: '/tareas/mias' });

export const miRegistro = pagina('personal/mi-registro', {
  asistencia: '/asistencia/mia',
  nomina: '/nomina/mia'
});

export const miSST = pagina('personal/mi-sst', {
  capacitaciones: '/capacitaciones/mias',
  epp: '/epp/mias'
});

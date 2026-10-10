import { cargar } from '../utils/api.js';
import { ROLES } from '../config/menu.js';
import { hoy } from '../utils/formato.js';

/**
 * Pagina de inicio: muestra la informacion mas util para cada rol.
 * Gerente y Administrador ven el tablero de indicadores (RF37).
 */
export const inicio = async (req, res, next) => {
  const { rol } = req.session.usuario;
  const fecha = hoy();
  const fuentes = { tareas: { ruta: '/tareas/mias', opcional: true } };
  const admin = rol === ROLES.ADMIN;

  if (admin || rol === ROLES.GERENTE) {
    Object.assign(fuentes, {
      tablero: '/reportes/dashboard',
      resumen: '/labores/resumen',
      solicitudes: '/solicitudes?estado=Pendiente',
      alertas: '/inventario/alertas'
    });
  }
  if (rol === ROLES.SUPERVISOR) {
    Object.assign(fuentes, {
      laboresHoy: `/labores?fecha=${fecha}`,
      resumen: '/labores/resumen',
      asistenciaHoy: '/asistencia/hoy',
      solicitudes: '/solicitudes?estado=Pendiente',
      tareasEquipo: '/tareas?estado=Pendiente'
    });
  }
  if (rol === ROLES.CAMPO) fuentes.misLabores = `/labores?desde=${fecha}`;
  if (rol === ROLES.TECNICO) Object.assign(fuentes, { equipos: '/equipos', alertas: '/inventario/alertas' });
  if (rol === ROLES.INVENTARIO) Object.assign(fuentes, { alertas: '/inventario/alertas', ordenes: '/ordenes?estado=Pendiente' });
  if (rol === ROLES.SST) {
    Object.assign(fuentes, {
      indicadores: '/reportes/sst',
      capacitaciones: '/capacitaciones?estado=Programada',
      incidentes: '/incidentes',
      epp: '/epp'
    });
  }
  try {
    const datos = await cargar(req, fuentes);
    res.render('inicio', { titulo: 'Inicio', fecha, ...datos });
  } catch (e) {
    next(e);
  }
};

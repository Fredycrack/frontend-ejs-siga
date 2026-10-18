import { pagina } from '../utils/pagina.js';
import { consulta } from '../utils/api.js';

/**
 * Modulo 2 - Servicios tecnologicos: recepcion, diagnostico y reparacion
 * de equipos electronicos (RF13 a RF17).
 */
export const listar = pagina('tecnologico/equipos', (req) => ({
  equipos: `/equipos${consulta({ estado: req.query.estado, id_cliente: req.query.id_cliente })}`,
  clientes: { ruta: '/clientes', opcional: true }
}));

export const nuevo = pagina('tecnologico/form', { clientes: '/clientes?estado=Activo' }, () => ({ equipo: {} }));

export const editar = pagina('tecnologico/form', (req) => ({
  clientes: '/clientes',
  equipo: `/equipos/${req.params.id}`
}));

export const detalle = pagina('tecnologico/detalle', (req) => ({
  equipo: `/equipos/${req.params.id}`,
  repuestos: { ruta: '/inventario?categoria=Repuesto electronico&estado=Activo', opcional: true }
}));

// RF18 - Trabajo del tecnico con soporte sin conexion
export const miTaller = pagina('tecnologico/mi-taller', (req) => ({
  equipos: `/equipos?id_tecnico=${req.session.usuario.id}`,
  repuestos: '/inventario?categoria=Repuesto electronico&estado=Activo'
}));

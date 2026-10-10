import { pagina, formulario } from '../utils/pagina.js';
import { consulta } from '../utils/api.js';
import * as F from '../config/formularios.js';

/**
 * Modulo 5 - Inventario: existencias, movimientos, alertas de stock minimo
 * y ordenes de compra (RF23 a RF28).
 */
export const listar = pagina('inventario/productos', (req) => ({
  productos: `/inventario${consulta({ categoria: req.query.categoria, estado: req.query.estado, bajo_minimo: req.query.bajo_minimo })}`
}));

export const detalle = pagina('inventario/producto', (req) => ({ producto: `/inventario/${req.params.id}` }));

export const nuevo = formulario(() => ({
  titulo: 'Nuevo producto', migas: [['Inventario', '/inventario']], campos: F.PRODUCTO,
  api: '/api/inventario', volver: '/inventario/{id}', cancelar: '/inventario', boton: 'Registrar producto'
}));

export const editar = formulario((req) => ({
  titulo: (p) => `Editar ${p.nombre_producto}`, migas: [['Inventario', '/inventario']], campos: F.PRODUCTO,
  fuentes: { producto: `/inventario/${req.params.id}` }, registro: 'producto',
  api: `/api/inventario/${req.params.id}`, volver: `/inventario/${req.params.id}`, cancelar: `/inventario/${req.params.id}`,
  aviso: 'La existencia no se edita aqui: registre ingresos o consumos para conservar la trazabilidad.'
}));

export const ordenes = pagina('inventario/ordenes', (req) => ({
  ordenes: `/ordenes${consulta({ estado: req.query.estado })}`,
  productos: { ruta: '/inventario?estado=Activo', opcional: true }
}));

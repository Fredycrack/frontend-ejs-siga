import { pagina } from '../utils/pagina.js';
import { consulta } from '../utils/api.js';

/**
 * Modulo 7 - Facturacion: facturas (RF33), envio (RF34), pagos y cartera (RF35).
 */
export const listar = pagina('facturacion/facturas', (req) => ({
  facturas: `/facturas${consulta({ estado: req.query.estado, id_cliente: req.query.id_cliente, desde: req.query.desde, hasta: req.query.hasta })}`,
  clientes: { ruta: '/clientes', opcional: true }
}));

export const detalle = pagina('facturacion/factura', (req) => ({ factura: `/facturas/${req.params.id}` }));

export const nueva = pagina('facturacion/nueva', {
  clientes: '/clientes?estado=Activo',
  contratos: '/contratos',
  servicios: '/servicios?estado=Activo'
});

export const desdeLabores = pagina('facturacion/desde-labores', (req) => {
  const fuentes = { contratos: '/contratos' };
  if (req.query.id_contrato) {
    fuentes.pendientes = `/facturas/pendientes-labores${consulta({ id_contrato: req.query.id_contrato, desde: req.query.desde, hasta: req.query.hasta })}`;
  }
  return fuentes;
});

export const cartera = pagina('facturacion/cartera', {
  cartera: '/cartera',
  vencidas: '/facturas'
}, (req, d) => ({ vencidas: d.vencidas.filter((f) => f.vencida && Number(f.saldo) > 0) }));

import { pagina } from '../utils/pagina.js';

/**
 * Portal de clientes: resumen, solicitudes de servicio (RF06), labores
 * programadas, equipos en reparacion (RF17) y facturas (RF36).
 */
export const resumen = pagina('portal/resumen', {
  resumen: '/portal/resumen',
  facturas: '/portal/facturas',
  equipos: '/portal/equipos',
  solicitudes: '/portal/solicitudes'
});

export const solicitudes = pagina('portal/solicitudes', {
  solicitudes: '/portal/solicitudes',
  servicios: '/portal/servicios'
});

export const labores = pagina('portal/labores', { labores: '/portal/labores' });

export const equipos = pagina('portal/equipos', { equipos: '/portal/equipos' });

export const facturas = pagina('portal/facturas', { facturas: '/portal/facturas' });

export const factura = pagina('portal/factura', (req) => ({ factura: `/portal/facturas/${req.params.id}` }));

export const perfil = (req, res) => res.render('portal/perfil', { titulo: 'Mi cuenta' });

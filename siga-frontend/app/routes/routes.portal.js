import { Router } from 'express';
import { verificarCliente } from '../middleware/auth.middleware.js';
import * as c from '../controllers/controller.portal.js';

/**
 * Paginas del portal de clientes (montadas en /portal).
 */
const router = Router();
router.use(verificarCliente);

router.get('/', c.resumen);
router.get('/solicitudes', c.solicitudes);       // RF06
router.get('/labores', c.labores);
router.get('/equipos', c.equipos);               // RF17
router.get('/facturas', c.facturas);             // RF36
router.get('/facturas/:id(\\d+)', c.factura);
router.get('/perfil', c.perfil);

export default router;

import { Router } from 'express';
import { verificarCliente } from '../middleware/auth.middleware.js';

/**
 * Paginas del portal de clientes (montadas en /portal).
 */
const router = Router();
router.use(verificarCliente);

export default router;

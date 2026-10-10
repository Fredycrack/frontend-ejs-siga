import { Router } from 'express';
import * as c from '../controllers/controller.auth.js';
import { verificarSesion } from '../middleware/auth.middleware.js';

/**
 * Rutas de acceso (CU3.7) y paginas publicas.
 */
const router = Router();

router.get('/', c.verLogin);
router.post('/login', c.login);
router.get('/portal/login', c.verLoginCliente);
router.post('/portal/login', c.loginCliente);
router.get('/logout', c.logout);
router.get('/seguimiento', c.seguimiento);                 // RF17 consulta publica
router.get('/perfil', verificarSesion, c.perfil);          // RF04

// Archivo del modo sin conexion (PWA)
router.get('/offline', (req, res) => res.render('offline'));

export default router;

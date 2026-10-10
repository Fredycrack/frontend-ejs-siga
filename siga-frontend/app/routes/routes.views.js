import { Router } from 'express';
import { verificarSesion, rol, soloAdmin } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/menu.js';
import { inicio } from '../controllers/controller.inicio.js';

/**
 * Paginas de los empleados, agrupadas por modulo del sistema.
 * rol(...) limita cada pagina a los roles que la API autoriza;
 * el Administrador tiene acceso a todas.
 */
const { SUPERVISOR: S, CAMPO: C, TECNICO: T, INVENTARIO: I, SST, GERENTE: G } = ROLES;
const ID = ':id(\\d+)';
const router = Router();
router.use(verificarSesion);

router.get('/inicio', inicio);

// ---------- Mi trabajo (todos los empleados) ----------

// ---------- Modulo 1: servicios agricolas ----------

// ---------- Modulo 2: servicios tecnologicos ----------

// ---------- Modulo 3: gestion administrativa ----------

// ---------- Modulo 4: gestion de personal ----------

// ---------- Modulo 5: inventario ----------

// ---------- Modulo 6: seguridad y salud en el trabajo ----------

// ---------- Modulo 7: facturacion ----------

// ---------- Modulo 8: reportes ----------

export default router;

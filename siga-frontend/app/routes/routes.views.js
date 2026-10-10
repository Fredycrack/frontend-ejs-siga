import { Router } from 'express';
import { verificarSesion, rol, soloAdmin } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/menu.js';
import { inicio } from '../controllers/controller.inicio.js';
import * as agricola from '../controllers/controller.agricola.js';
import * as tecnologico from '../controllers/controller.tecnologico.js';

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
router.get('/mis-labores', rol(C), agricola.misLabores);             // RF08 a RF10, RF12
router.get('/labores', rol(S, G), agricola.listar);
router.get('/labores/avance', rol(S, G), agricola.avance);           // RF11
router.get('/labores/nueva', rol(S), agricola.nueva);                // RF07
router.get(`/labores/${ID}`, rol(S, G, C), agricola.detalle);
router.get(`/labores/${ID}/editar`, rol(S), agricola.editar);

// ---------- Modulo 2: servicios tecnologicos ----------
router.get('/mi-taller', rol(T), tecnologico.miTaller);              // RF18 (sin conexion)
router.get('/equipos', rol(T, G), tecnologico.listar);
router.get('/equipos/nuevo', rol(T), tecnologico.nuevo);             // RF13
router.get(`/equipos/${ID}`, rol(T, G), tecnologico.detalle);        // RF14 a RF16
router.get(`/equipos/${ID}/editar`, rol(T), tecnologico.editar);

// ---------- Modulo 3: gestion administrativa ----------

// ---------- Modulo 4: gestion de personal ----------

// ---------- Modulo 5: inventario ----------

// ---------- Modulo 6: seguridad y salud en el trabajo ----------

// ---------- Modulo 7: facturacion ----------

// ---------- Modulo 8: reportes ----------

export default router;

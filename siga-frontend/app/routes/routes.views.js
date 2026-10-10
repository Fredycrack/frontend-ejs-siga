import { Router } from 'express';
import { verificarSesion, rol, soloAdmin } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/menu.js';
import { inicio } from '../controllers/controller.inicio.js';
import * as agricola from '../controllers/controller.agricola.js';
import * as tecnologico from '../controllers/controller.tecnologico.js';
import * as admin from '../controllers/controller.administrativo.js';
import * as personal from '../controllers/controller.personal.js';
import * as inventario from '../controllers/controller.inventario.js';
import * as sst from '../controllers/controller.sst.js';

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
router.get('/mis-tareas', personal.misTareas);                       // RF21
router.get('/mi-registro', personal.miRegistro);
router.get('/mi-sst', personal.miSST);

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
router.get('/empleados', rol(S, G, SST, I), admin.empleados);        // RF03
router.get('/empleados/nuevo', soloAdmin, admin.nuevoEmpleado);
router.get(`/empleados/${ID}/editar`, soloAdmin, admin.editarEmpleado);
router.get(`/empleados/${ID}/carne`, soloAdmin, admin.carneEmpleado);
router.get('/clientes', rol(S, G, T), admin.clientes);               // RF01
router.get('/clientes/nuevo', soloAdmin, admin.nuevoCliente);
router.get(`/clientes/${ID}/editar`, soloAdmin, admin.editarCliente);
router.get('/contratos', rol(S, G), admin.contratos);                // RF02
router.get('/contratos/nuevo', soloAdmin, admin.nuevoContrato);
router.get(`/contratos/${ID}`, rol(S, G), admin.contrato);
router.get(`/contratos/${ID}/editar`, soloAdmin, admin.editarContrato);
router.get('/servicios', rol(S, G), admin.servicios);
router.get('/servicios/nuevo', soloAdmin, admin.nuevoServicio);
router.get(`/servicios/${ID}/editar`, soloAdmin, admin.editarServicio);
router.get('/solicitudes', rol(S, G), admin.solicitudes);            // RF06
router.get('/auditoria', soloAdmin, admin.auditoria);                // RNF07
router.get('/respaldo', soloAdmin, admin.respaldo);                  // RF05

// ---------- Modulo 4: gestion de personal ----------
router.get('/asistencia', rol(S, G), personal.asistencia);           // RF19
router.get('/asistencia/kiosco', rol(S), personal.kiosco);
router.get('/tareas', rol(S, G), personal.tareas);                   // RF20
router.get('/tareas/nueva', rol(S), personal.nuevaTarea);
router.get(`/tareas/${ID}/editar`, rol(S), personal.editarTarea);
router.get('/nomina', rol(G), personal.nomina);                      // RF22

// ---------- Modulo 5: inventario ----------
router.get('/inventario', rol(I, T, S, SST, G), inventario.listar);  // RF24, RF25
router.get('/inventario/nuevo', rol(I), inventario.nuevo);
router.get(`/inventario/${ID}`, rol(I, T, S, SST, G), inventario.detalle);
router.get(`/inventario/${ID}/editar`, rol(I), inventario.editar);
router.get('/ordenes', rol(I, G), inventario.ordenes);               // RF27, RF28

// ---------- Modulo 6: seguridad y salud en el trabajo ----------
router.get('/capacitaciones', rol(SST, S, G), sst.capacitaciones);   // RF29
router.get('/capacitaciones/nueva', rol(SST), sst.nuevaCapacitacion);
router.get(`/capacitaciones/${ID}`, rol(SST, S, G), sst.capacitacion);
router.get(`/capacitaciones/${ID}/editar`, rol(SST), sst.editarCapacitacion);
router.get('/epp', rol(SST, S, G), sst.epp);                         // RF30
router.get('/incidentes', rol(SST, S, G), sst.incidentes);           // RF31
router.get('/incidentes/nuevo', rol(SST, S), sst.nuevoIncidente);
router.get(`/incidentes/${ID}`, rol(SST, S, G), sst.incidente);
router.get('/sst/indicadores', rol(SST, G), sst.indicadores);        // RF32

// ---------- Modulo 7: facturacion ----------

// ---------- Modulo 8: reportes ----------

export default router;

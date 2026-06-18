import { Router } from "express";
import {
  getLogin, postLogin,
  getMenu, logout,
  getEmpleados,
  getNuevoEmpleado, postCrearEmpleado,
  getEditarEmpleado, postEditarEmpleado,
  postEliminarEmpleado
} from "../controllers/controller.views.js";
import { verificarSesion } from "../middleware/auth.middleware.js";

const router = Router();

// ============================================
// AUTENTICACION (sin proteccion)
// ============================================
router.get("/", getLogin);
router.post("/login", postLogin);

// ============================================
// RUTAS PROTEGIDAS (requieren sesion activa)
// ============================================
router.get("/menu", verificarSesion, getMenu);
router.get("/logout", logout);

// CRUD de Empleados
router.get("/empleados", verificarSesion, getEmpleados);
router.get("/empleados/nuevo", verificarSesion, getNuevoEmpleado);
router.post("/empleados/crear", verificarSesion, postCrearEmpleado);
router.get("/empleados/editar/:id", verificarSesion, getEditarEmpleado);
router.post("/empleados/editar", verificarSesion, postEditarEmpleado);
router.post("/empleados/eliminar", verificarSesion, postEliminarEmpleado);

export default router;

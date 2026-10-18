import { pagina, formulario } from '../utils/pagina.js';
import { consulta } from '../utils/api.js';
import * as F from '../config/formularios.js';

/**
 * Modulo 3 - Gestion administrativa: empleados (RF03), clientes (RF01),
 * contratos (RF02), servicios, solicitudes (RF06), auditoria y respaldo (RF05).
 */

// ---------- Empleados ----------
export const empleados = pagina('administrativo/empleados', (req) => ({
  empleados: `/empleados${consulta({ rol: req.query.rol, estado: req.query.estado })}`
}));

export const nuevoEmpleado = formulario(() => ({
  titulo: 'Nuevo empleado', subtitulo: 'Cree el usuario y asigne su rol en el sistema.',
  migas: [['Empleados', '/empleados']], campos: F.EMPLEADO,
  api: '/api/empleados', volver: '/empleados', cancelar: '/empleados', boton: 'Crear empleado'
}));

export const editarEmpleado = formulario((req) => ({
  titulo: (e) => `Editar a ${e.nombre}`, migas: [['Empleados', '/empleados']], campos: F.EMPLEADO,
  fuentes: { empleado: `/empleados/${req.params.id}` }, registro: 'empleado',
  api: `/api/empleados/${req.params.id}`, volver: '/empleados', cancelar: '/empleados',
  aviso: 'La contrasena no se modifica aqui: use "Restablecer contrasena" en la lista de empleados.'
}));

export const carneEmpleado = pagina('administrativo/carne', (req) => ({
  empleado: `/empleados/${req.params.id}`,
  qr: `/empleados/${req.params.id}/qr`
}));

// ---------- Clientes ----------
export const clientes = pagina('administrativo/clientes', (req) => ({
  clientes: `/clientes${consulta({ estado: req.query.estado, tipo_cliente: req.query.tipo_cliente })}`
}));

export const nuevoCliente = formulario(() => ({
  titulo: 'Nuevo cliente', subtitulo: 'RF01: registre los datos del cliente y, si lo desea, su acceso al portal.',
  migas: [['Clientes', '/clientes']], campos: F.CLIENTE,
  api: '/api/clientes', volver: '/clientes', cancelar: '/clientes', boton: 'Registrar cliente'
}));

export const editarCliente = formulario((req) => ({
  titulo: (c) => `Editar ${c.nombre_cliente}`, migas: [['Clientes', '/clientes']], campos: F.CLIENTE,
  fuentes: { cliente: `/clientes/${req.params.id}` }, registro: 'cliente',
  api: `/api/clientes/${req.params.id}`, volver: '/clientes', cancelar: '/clientes'
}));

// ---------- Contratos ----------
export const contratos = pagina('administrativo/contratos', (req) => ({
  contratos: `/contratos${consulta({ estado: req.query.estado, id_cliente: req.query.id_cliente })}`,
  clientes: { ruta: '/clientes', opcional: true }
}));

export const contrato = pagina('administrativo/contrato', (req) => ({
  contrato: `/contratos/${req.params.id}`,
  labores: { ruta: `/labores?id_contrato=${req.params.id}`, opcional: true },
  facturas: { ruta: '/facturas', opcional: true }
}));

export const nuevoContrato = formulario((req) => ({
  titulo: 'Nuevo contrato', subtitulo: 'RF02: registre el contrato de servicios con el cliente.',
  migas: [['Contratos', '/contratos']], campos: F.CONTRATO,
  fuentes: { clientes: '/clientes?estado=Activo' }, valores: { id_cliente: req.query.id_cliente },
  api: '/api/contratos', volver: '/contratos/{id}', cancelar: '/contratos', boton: 'Registrar contrato'
}));

export const editarContrato = formulario((req) => ({
  titulo: (k) => `Editar contrato ${k.numero_contrato}`, migas: [['Contratos', '/contratos']], campos: F.CONTRATO,
  fuentes: { clientes: '/clientes', contrato: `/contratos/${req.params.id}` }, registro: 'contrato',
  api: `/api/contratos/${req.params.id}`, volver: `/contratos/${req.params.id}`, cancelar: `/contratos/${req.params.id}`
}));

// ---------- Servicios ----------
export const servicios = pagina('administrativo/servicios', { servicios: '/servicios' });

export const nuevoServicio = formulario(() => ({
  titulo: 'Nuevo servicio', migas: [['Servicios', '/servicios']], campos: F.SERVICIO,
  api: '/api/servicios', volver: '/servicios', cancelar: '/servicios', boton: 'Registrar servicio'
}));

export const editarServicio = formulario((req) => ({
  titulo: (s) => `Editar ${s.nombre_servicio}`, migas: [['Servicios', '/servicios']], campos: F.SERVICIO,
  fuentes: { servicio: `/servicios/${req.params.id}` }, registro: 'servicio',
  api: `/api/servicios/${req.params.id}`, volver: '/servicios', cancelar: '/servicios'
}));

// ---------- Solicitudes de los clientes (RF06) ----------
export const solicitudes = pagina('administrativo/solicitudes', (req) => ({
  solicitudes: `/solicitudes${consulta({ estado: req.query.estado })}`
}));

// ---------- Auditoria (RNF07) y respaldo (RF05) ----------
export const auditoria = pagina('administrativo/auditoria', (req) => ({
  registros: `/auditoria?limite=${Math.min(Number(req.query.limite) || 300, 1000)}`
}));

export const respaldo = (req, res) => res.render('administrativo/respaldo', { titulo: 'Respaldo de datos' });

/**
 * Menu lateral segun el rol del usuario (RF03).
 * Refleja los permisos de la API: si un rol no ve una opcion aqui,
 * la API tambien le negaria la consulta. El Administrador ve todo.
 */
export const ROLES = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  CAMPO: 'Trabajador de Campo',
  TECNICO: 'Tecnico Electronico',
  INVENTARIO: 'Jefe de Inventario',
  SST: 'Responsable SST',
  GERENTE: 'Gerente'
};
const { SUPERVISOR: S, CAMPO: C, TECNICO: T, INVENTARIO: I, SST, GERENTE: G } = ROLES;
const TODOS = null; // cualquier empleado

export const MENU = [
  { titulo: 'General', items: [
    { texto: 'Inicio', ruta: '/inicio', roles: TODOS }
  ] },
  { titulo: 'Mi trabajo', items: [
    { texto: 'Mis labores', ruta: '/mis-labores', roles: [C], soloRol: true },
    { texto: 'Mi taller', ruta: '/mi-taller', roles: [T], soloRol: true },
    { texto: 'Mis tareas', ruta: '/mis-tareas', roles: TODOS },
    { texto: 'Mi asistencia y nomina', ruta: '/mi-registro', roles: TODOS },
    { texto: 'Mis capacitaciones y EPP', ruta: '/mi-sst', roles: TODOS }
  ] },
  { titulo: 'Servicios agricolas', items: [
    { texto: 'Labores', ruta: '/labores', roles: [S, G] },
    { texto: 'Avance por contrato', ruta: '/labores/avance', roles: [S, G] }
  ] },
  { titulo: 'Servicios tecnologicos', items: [
    { texto: 'Equipos en taller', ruta: '/equipos', roles: [T, G] }
  ] },
  { titulo: 'Administracion', items: [
    { texto: 'Empleados', ruta: '/empleados', roles: [S, G, SST, I] },
    { texto: 'Clientes', ruta: '/clientes', roles: [S, G, T] },
    { texto: 'Contratos', ruta: '/contratos', roles: [S, G] },
    { texto: 'Catalogo de servicios', ruta: '/servicios', roles: [S, G] },
    { texto: 'Solicitudes de clientes', ruta: '/solicitudes', roles: [S, G] },
    { texto: 'Auditoria', ruta: '/auditoria', roles: [] },
    { texto: 'Respaldo de datos', ruta: '/respaldo', roles: [] }
  ] },
  { titulo: 'Personal', items: [
    { texto: 'Asistencia', ruta: '/asistencia', roles: [S, G] },
    { texto: 'Lector QR', ruta: '/asistencia/kiosco', roles: [S] },
    { texto: 'Tareas', ruta: '/tareas', roles: [S, G] },
    { texto: 'Nomina', ruta: '/nomina', roles: [G] }
  ] },
  { titulo: 'Inventario', items: [
    { texto: 'Productos', ruta: '/inventario', roles: [I, T, S, SST, G] },
    { texto: 'Ordenes de compra', ruta: '/ordenes', roles: [I, G] }
  ] },
  { titulo: 'Seguridad y salud', items: [
    { texto: 'Capacitaciones', ruta: '/capacitaciones', roles: [SST, S, G] },
    { texto: 'Entregas de EPP', ruta: '/epp', roles: [SST, S, G] },
    { texto: 'Incidentes', ruta: '/incidentes', roles: [SST, S, G] },
    { texto: 'Indicadores SST', ruta: '/sst/indicadores', roles: [SST, G] }
  ] },
  { titulo: 'Facturacion', items: [
    { texto: 'Facturas', ruta: '/facturas', roles: [G] },
    { texto: 'Cartera', ruta: '/cartera', roles: [G] }
  ] },
  { titulo: 'Reportes', items: [
    { texto: 'Rentabilidad', ruta: '/reportes/rentabilidad', roles: [G] },
    { texto: 'Productividad', ruta: '/reportes/productividad', roles: [G, S] },
    { texto: 'Exportar reportes', ruta: '/reportes', roles: [G, S, SST, I] }
  ] }
];

export const MENU_PORTAL = [
  { titulo: 'Portal de clientes', items: [
    { texto: 'Resumen', ruta: '/portal' },
    { texto: 'Solicitar servicio', ruta: '/portal/solicitudes' },
    { texto: 'Labores programadas', ruta: '/portal/labores' },
    { texto: 'Mis equipos', ruta: '/portal/equipos' },
    { texto: 'Mis facturas', ruta: '/portal/facturas' }
  ] }
];

// El Administrador puede todo, salvo las opciones exclusivas de otro rol
export const puede = (rol, item) => {
  if (item.roles === TODOS) return true;
  if (item.soloRol) return item.roles.includes(rol);
  return rol === ROLES.ADMIN || item.roles.includes(rol);
};

export const menuPara = (usuario) => {
  if (!usuario) return [];
  if (usuario.tipo === 'cliente') return MENU_PORTAL;
  return MENU
    .map((s) => ({ ...s, items: s.items.filter((i) => puede(usuario.rol, i)) }))
    .filter((s) => s.items.length);
};

import * as formato from '../utils/formato.js';
import { menuPara, ROLES } from '../config/menu.js';

/**
 * Variables disponibles en todas las vistas: usuario, menu segun el rol,
 * opcion activa del menu y funciones de formato.
 */
export const locales = (req, res, next) => {
  const usuario = req.session?.usuario || null;
  const menu = menuPara(usuario);
  const rutas = menu.flatMap((s) => s.items.map((i) => i.ruta));
  res.locals.usuario = usuario;
  res.locals.menu = menu;
  res.locals.rutaMenu = rutas
    .filter((r) => req.path === r || req.path.startsWith(`${r}/`))
    .sort((a, b) => b.length - a.length)[0];
  res.locals.f = formato;
  res.locals.ROLES = ROLES;
  // es('Supervisor', ...) indica si el usuario tiene alguno de los roles (el Administrador siempre)
  res.locals.es = (...roles) => !!usuario && usuario.tipo === 'empleado' && (usuario.rol === ROLES.ADMIN || roles.includes(usuario.rol));
  res.locals.q = req.query;
  next();
};

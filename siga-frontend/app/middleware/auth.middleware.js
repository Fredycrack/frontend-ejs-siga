import { ROLES } from '../config/menu.js';

/**
 * Control de acceso del frontend.
 * La validacion definitiva del token y del rol la hace la API;
 * aqui solo se evita mostrar paginas a quien no inicio sesion.
 */
export function verificarSesion(req, res, next) {
  if (req.session?.token && req.session.usuario?.tipo === 'empleado') return next();
  if (req.session?.usuario?.tipo === 'cliente') return res.redirect('/portal');
  req.session = null;
  const destino = req.method === 'GET' ? `?volver=${encodeURIComponent(req.originalUrl)}` : '';
  res.redirect(`/${destino}`);
}

export function verificarCliente(req, res, next) {
  if (req.session?.token && req.session.usuario?.tipo === 'cliente') return next();
  res.redirect('/portal/login');
}

// Restringe una pagina a ciertos roles (el Administrador siempre pasa)
export const rol = (...roles) => (req, res, next) => {
  const actual = req.session.usuario.rol;
  if (actual === ROLES.ADMIN || roles.includes(actual)) return next();
  res.status(403).render('error', {
    titulo: 'Acceso restringido',
    codigo: 403,
    mensaje: 'Su rol no tiene permiso para ver esta pagina. Si lo necesita, solicitelo al administrador del sistema.'
  });
};

// Solo el Administrador
export const soloAdmin = rol();

import { llamarApi, api } from '../utils/api.js';
import { destinoSeguro, pagina } from '../utils/pagina.js';
import { ROLES } from '../config/menu.js';

/**
 * Autenticacion (CU3.7): el login obtiene el token JWT de la API y lo
 * guarda en una cookie de sesion firmada y httpOnly.
 */
const AVISO_EXPIRADA = 'Su sesion expiro por seguridad. Inicie sesion de nuevo.';

export const verLogin = (req, res) => {
  if (req.session?.usuario?.tipo === 'empleado') return res.redirect('/inicio');
  res.render('cuenta/login', {
    error: null, email: '', volver: req.query.volver || '',
    aviso: req.query.expirada ? AVISO_EXPIRADA : null
  });
};

export const login = async (req, res) => {
  const { email = '', password = '', volver = '' } = req.body;
  try {
    const r = await llamarApi(req, 'POST', '/login', { email: email.trim(), password });
    const e = r.empleado;
    req.session = {
      token: r.token,
      usuario: { tipo: 'empleado', id: e.id_empleado, nombre: e.nombre, email: e.email, rol: e.rol }
    };
    res.redirect(destinoSeguro(volver) || (e.rol === ROLES.CAMPO ? '/mis-labores' : '/inicio'));
  } catch (err) {
    res.status(err.estado === 401 ? 401 : 200).render('cuenta/login', { error: err.message, email, volver, aviso: null });
  }
};

export const verLoginCliente = (req, res) => {
  if (req.session?.usuario?.tipo === 'cliente') return res.redirect('/portal');
  res.render('portal/login', {
    error: null, email: '', volver: req.query.volver || '',
    aviso: req.query.expirada ? AVISO_EXPIRADA : null
  });
};

export const loginCliente = async (req, res) => {
  const { email = '', password = '', volver = '' } = req.body;
  try {
    const r = await llamarApi(req, 'POST', '/portal/login', { email: email.trim(), password });
    const c = r.cliente;
    req.session = {
      token: r.token,
      usuario: { tipo: 'cliente', id: c.id_cliente, nombre: c.nombre, email: c.email, rol: 'Cliente' }
    };
    res.redirect(destinoSeguro(volver)?.startsWith('/portal') ? volver : '/portal');
  } catch (err) {
    res.status(err.estado === 401 ? 401 : 200).render('portal/login', { error: err.message, email, volver, aviso: null });
  }
};

export const logout = (req, res) => {
  const cliente = req.session?.usuario?.tipo === 'cliente';
  req.session = null;
  res.redirect(cliente ? '/portal/login' : '/');
};

// Perfil del empleado: datos, codigo QR y cambio de contrasena (RF04)
export const perfil = pagina('cuenta/perfil', {
  perfil: '/perfil',
  qr: { ruta: '/perfil/qr', opcional: true, vacio: null }
});

// RF17 - Consulta publica del estado de un equipo con el codigo de seguimiento
export const seguimiento = async (req, res, next) => {
  const codigo = String(req.query.codigo || '').trim().toUpperCase();
  let equipo = null;
  let error = null;
  if (codigo) {
    if (!/^[A-Z0-9]{6,12}$/.test(codigo)) error = 'El codigo de seguimiento tiene 8 letras o numeros.';
    else {
      try {
        equipo = await api.get({ session: null }, `/seguimiento/${codigo}`);
      } catch (e) {
        if (e.estado === 404) error = 'No encontramos un equipo con ese codigo. Verifique el comprobante de recepcion.';
        else return next(e);
      }
    }
  }
  res.render('tecnologico/seguimiento', { codigo, equipo, error });
};

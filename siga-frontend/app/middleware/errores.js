import { ErrorApi } from '../utils/api.js';

const TITULOS = {
  400: 'Solicitud no valida',
  403: 'Acceso restringido',
  404: 'Registro no encontrado',
  409: 'Operacion no permitida',
  503: 'Servicio no disponible'
};

export const noEncontrado = (req, res) => {
  res.status(404).render('error', {
    titulo: 'Pagina no encontrada', codigo: 404,
    mensaje: 'La direccion que busca no existe o fue movida.'
  });
};

// Manejo central de errores de las paginas
export const manejarErrores = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof ErrorApi) {
    if (err.estado === 401) {
      const cliente = req.session?.usuario?.tipo === 'cliente';
      req.session = null;
      return res.redirect(`${cliente ? '/portal/login' : '/'}?expirada=1&volver=${encodeURIComponent(req.originalUrl)}`);
    }
    return res.status(err.estado).render('error', {
      titulo: TITULOS[err.estado] || 'No fue posible completar la solicitud',
      codigo: err.estado,
      mensaje: err.message
    });
  }
  console.error('[SIGA]', err);
  res.status(500).render('error', {
    titulo: 'Error interno', codigo: 500,
    mensaje: 'Ocurrio un error inesperado. Si el problema continua, informe al administrador del sistema.'
  });
};

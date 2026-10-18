import { cargar, ErrorApi } from './api.js';

/**
 * Crea un controlador de pagina: consulta la API y renderiza la vista.
 *   fuentes: objeto { nombre: ruta } o funcion (req) => objeto
 *   extra:   funcion (req, datos) => datos adicionales para la vista
 * Los errores de la API (sesion vencida, permisos, no encontrado) los
 * resuelve el manejador central de errores.
 */
export const pagina = (vista, fuentes, extra) => async (req, res, next) => {
  try {
    const f = typeof fuentes === 'function' ? fuentes(req) : (fuentes || {});
    const datos = await cargar(req, f);
    const adicionales = extra ? await extra(req, datos) : {};
    res.render(vista, { ...datos, ...adicionales, q: req.query });
  } catch (e) {
    next(e);
  }
};

// Solo permite redirecciones a rutas internas (evita redirecciones abiertas)
export const destinoSeguro = (ruta) => (typeof ruta === 'string' && /^\/(?!\/)[\w\-/?=&%.]*$/.test(ruta) ? ruta : null);

/**
 * Crea un controlador para un formulario generico de registro o edicion.
 * opciones(req) devuelve: { titulo, campos(datos), fuentes, registro, api,
 * volver, cancelar, migas, subtitulo, aviso, boton, valores }.
 * Si "registro" indica el nombre de una fuente, el formulario es de edicion (PUT).
 */
export const formulario = (opciones) => async (req, res, next) => {
  try {
    const o = opciones(req);
    const datos = await cargar(req, o.fuentes || {});
    const editando = !!o.registro;
    let valores = o.valores || {};
    if (editando) {
      valores = typeof o.registro === 'function' ? o.registro(datos) : datos[o.registro];
      if (!valores) throw new ErrorApi(404, 'El registro que intenta editar no existe');
    }
    const texto = (v) => (typeof v === 'function' ? v(valores) : v);
    res.render('form-generico', {
      titulo: texto(o.titulo),
      subtitulo: texto(o.subtitulo) || '',
      migas: o.migas || null,
      aviso: texto(o.aviso) || null,
      campos: o.campos(datos),
      valores,
      editando,
      api: o.api,
      metodo: editando ? 'PUT' : 'POST',
      volver: o.volver,
      cancelar: o.cancelar,
      boton: o.boton || (editando ? 'Guardar cambios' : 'Registrar')
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Middleware que verifica si existe una sesion activa.
 * A diferencia del backend, aqui solo se comprueba que exista el token
 * guardado en la sesion del servidor. La validacion del JWT la hace el backend.
 */
export function verificarSesion(req, res, next) {
  if (req.session.token) {
    next();
  } else {
    res.redirect("/");
  }
}

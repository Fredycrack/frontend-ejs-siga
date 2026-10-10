/**
 * Configuracion del frontend leida de variables de entorno.
 * En produccion (Render) se definen en el panel del servicio:
 *   API_URL         URL de la API, por ejemplo https://backend-api-siga.onrender.com/api
 *   SESSION_SECRET  clave para firmar la cookie de sesion
 */
const enProduccion = process.env.NODE_ENV === 'production';

export const config = {
  puerto: Number(process.env.PORT) || 4000,
  apiUrl: (process.env.API_URL || 'http://localhost:3000/api').replace(/\/$/, ''),
  secretoSesion: process.env.SESSION_SECRET || 'siga_sesion_desarrollo',
  // La cookie dura lo mismo que el token del backend (2 horas)
  duracionSesion: Number(process.env.SESSION_HORAS || 2) * 60 * 60 * 1000,
  enProduccion,
  // La cookie solo viaja por HTTPS en produccion; COOKIE_SEGURA=false permite
  // probar el despliegue con Docker en http://localhost
  cookieSegura: process.env.COOKIE_SEGURA ? process.env.COOKIE_SEGURA === 'true' : enProduccion,
  limiteCuerpo: '12mb'
};

if (enProduccion && !process.env.SESSION_SECRET) {
  console.warn('[SIGA] Advertencia: SESSION_SECRET no esta definida; se usa la clave de desarrollo.');
}

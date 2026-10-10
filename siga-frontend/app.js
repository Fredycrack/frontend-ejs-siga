import express from 'express';
import cookieSession from 'cookie-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './app/config/env.js';
import { encabezadosSeguridad } from './app/middleware/seguridad.js';
import { locales } from './app/middleware/locales.js';
import { manejarErrores, noEncontrado } from './app/middleware/errores.js';
import rutasAcceso from './app/routes/routes.auth.js';
import rutasProxy from './app/routes/routes.proxy.js';
import rutasVistas from './app/routes/routes.views.js';
import rutasPortal from './app/routes/routes.portal.js';

/**
 * Aplicacion web (frontend) de SIGA con Express y EJS.
 * Se separa de index.js para poder probarla sin abrir un puerto.
 */
const dir = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // Render y Apache terminan HTTPS delante de la aplicacion
app.set('view engine', 'ejs');
app.set('views', path.join(dir, 'views'));

app.use(encabezadosSeguridad);
app.use(express.static(path.join(dir, 'public'), { maxAge: config.enProduccion ? '1h' : 0 }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.json({ limit: config.limiteCuerpo }));

// Sesion en cookie firmada: guarda el token JWT y los datos basicos del usuario
app.use(cookieSession({
  name: 'siga_sesion',
  keys: [config.secretoSesion],
  maxAge: config.duracionSesion,
  httpOnly: true,
  sameSite: 'lax',
  secure: config.cookieSegura
}));

app.use('/api', rutasProxy);
app.use(locales);
app.use(rutasAcceso);
app.use('/portal', rutasPortal);
app.use(rutasVistas);

app.use(noEncontrado);
app.use(manejarErrores);

export default app;

import app from './app.js';
import { config } from './app/config/env.js';

/**
 * Punto de entrada del frontend de SIGA.
 * Requiere que la API este disponible en API_URL (por defecto http://localhost:3000/api).
 */
app.listen(config.puerto, () => {
  console.log(`Frontend SIGA corriendo en el puerto ${config.puerto} (API: ${config.apiUrl})`);
});

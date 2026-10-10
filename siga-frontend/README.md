# Frontend EJS - Sistema Integrado de Gestion AGROSERVICES (SIGA) v2.0

Interfaz web del **Sistema Integrado de Gestion AGROSERVICES (SIGA)** construida con
**Node.js + Express + EJS**. Consume la API REST del repositorio
[`backend-api-siga`](https://github.com/Fredycrack/backend-api-siga) e implementa las pantallas
de los **ocho modulos**, el **portal de clientes** y la **consulta publica** del estado de los equipos.

## Funcionalidades por rol

| Rol | Pantallas principales |
|---|---|
| Administrador | Todo el sistema: empleados y roles, clientes, contratos, servicios, facturacion, nomina, aprobacion de ordenes, auditoria y respaldo |
| Gerente | Tablero con graficas, rentabilidad, productividad, cartera, facturas y consulta de los demas modulos |
| Supervisor | Programacion y avance de labores, solicitudes de clientes, lector QR de asistencia, tareas e incidentes |
| Trabajador de Campo | **Mis labores** en el celular: inicio con GPS, fotos y finalizacion, **aun sin conexion** |
| Tecnico Electronico | **Mi taller** (funciona sin conexion), recepcion de equipos, diagnostico, cotizacion, repuestos y estados |
| Jefe de Inventario | Productos, ingresos y consumos, alertas de stock minimo y ordenes de compra |
| Responsable SST | Capacitaciones con asistencia y certificado, entregas de EPP, incidentes e indicadores |
| Cliente (portal) | Solicitudes de servicio, labores programadas, equipos y aprobacion de cotizaciones, facturas en PDF |

Todos los empleados tienen ademas: mis tareas, mi asistencia y nomina, mis capacitaciones y EPP,
cambio de contrasena y su carne con codigo QR.

## Arquitectura

```
Navegador ──> Frontend (Express + EJS, puerto 4000) ──> API REST (puerto 3000) ──> MySQL / TiDB
                 │  sesion en cookie firmada (httpOnly) con el token JWT
                 └─ /api/*  puente hacia la API: agrega el token de la sesion
```

- Las paginas se generan en el servidor con EJS a partir de los datos de la API.
- Los formularios y botones de accion llaman a `/api/...` en el mismo dominio; el servidor del
  frontend reenvia la peticion agregando el token, de modo que **el token nunca llega al codigo del
  navegador**. Las operaciones que modifican datos exigen el encabezado `X-SIGA` (proteccion CSRF).
- Encabezados de seguridad con politica de contenido (CSP) que solo admite scripts propios.
- Modo sin conexion (RNF10): un *service worker* guarda las paginas "Mis labores" y "Mi taller";
  las operaciones se guardan en IndexedDB y se sincronizan en orden al volver la senal (RF12, RF18).

## Estructura

```
siga-frontend/
├── app/
│   ├── config/        env.js, menu.js (menu por rol) y formularios.js (campos de los formularios)
│   ├── controllers/   un controlador por modulo (controller.agricola.js, controller.facturacion.js, ...)
│   ├── middleware/    sesion y roles, encabezados de seguridad, variables de las vistas, errores
│   ├── routes/        routes.auth.js, routes.views.js, routes.portal.js y routes.proxy.js (/api)
│   └── utils/         cliente de la API, formatos (moneda, fechas) y generador de paginas
├── views/             vistas EJS por modulo y partials (plantilla, formulario generico, estados)
├── public/
│   ├── css/siga.css   estilos (adaptados a celular)
│   ├── js/            siga.js (comun), cola-offline.js, campo.js, taller.js, kiosco.js, factura.js, tablero.js
│   ├── js/vendor/     Chart.js y html5-qrcode (servidos localmente)
│   ├── sw.js          service worker del modo sin conexion
│   └── manifest.webmanifest
├── tests/             pruebas del servidor (node:test) y recorrido de extremo a extremo (Playwright)
├── app.js, index.js
└── Dockerfile
```

## Instalacion local

1. Inicie primero la API (`backend-api-siga`, puerto 3000).
2. Instale las dependencias: `npm install`
3. Copie `.env.example` como `.env` (por defecto usa `http://localhost:3000/api`).
4. Inicie el frontend: `npm run dev` y abra `http://localhost:4000`.

Los usuarios de demostracion (uno por rol) se describen en el README de la API.

## Pruebas

```bash
npm test                     # 18 pruebas del servidor; no requieren la API
BASE_URL=http://localhost:4000 npm run e2e   # recorrido completo en Chromium (API y base de demostracion)
```

El recorrido de extremo a extremo (31 pasos) usa un navegador real: crea usuarios, clientes y
contratos; programa una labor, la inicia con GPS desde un celular simulado, toma una foto, la
finaliza **sin conexion** y verifica la sincronizacion; hace lo mismo con un diagnostico en
"Mi taller"; recorre el taller, inventario, SST, facturacion, portal de clientes y reportes; y
comprueba que no haya errores de JavaScript ni bloqueos de la politica de seguridad. Con
`CAPTURAS=carpeta` guarda una captura de cada pantalla (utiles para el manual de usuario).

## Variables de entorno

| Variable | Uso |
|---|---|
| `PORT` | Puerto del servidor (4000) |
| `API_URL` | URL de la API, por ejemplo `https://backend-api-siga.onrender.com/api` |
| `SESSION_SECRET` | Clave para firmar la cookie de sesion (obligatoria en produccion) |
| `NODE_ENV` | `production` activa la cookie segura (solo HTTPS) |
| `COOKIE_SEGURA` | `false` para probar con Docker en `http://localhost` |

## Despliegue

Ver la guia `DESPLIEGUE.md` del repositorio de la API (Render + TiDB Cloud) o use
`docker compose up -d --build` desde `backend-api-siga` con ambos repositorios clonados uno al lado del otro.

Autor: Fredy Alexander Vargas Suarez - SENA, Analisis y Desarrollo de Software (ficha 3186583).

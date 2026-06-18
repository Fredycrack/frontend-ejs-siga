# Frontend EJS - Modulo de Empleados (SIGA)

Aplicacion web construida con **Node.js + Express + EJS** que consume la API REST del
backend (`backend-api-siga`) mediante `node-fetch`. Forma parte del **Sistema Integrado
de Gestion AGROSERVICES (SIGA)** de AGROSERVICES P&D SAS.

Implementa la interfaz del modulo de **administracion de empleados** (entidad `EMPLEADO`
del MER) con autenticacion por sesion: el login obtiene un token JWT del backend y lo
guarda en la sesion del servidor para consumir las rutas protegidas.

- El backend corre en el puerto **3000**.
- El frontend corre en el puerto **4000**.
- Ambos deben estar ejecutandose en terminales separadas.

## Estructura

```
frontend-ejs/
├── index.js                       # Punto de entrada del servidor
├── package.json
├── app/
│   ├── controllers/
│   │   └── controller.views.js    # Funciones de cada vista (consumen el backend)
│   ├── middleware/
│   │   └── auth.middleware.js     # Verificacion de sesion activa
│   └── routes/
│       └── routes.views.js        # Definicion de rutas
├── views/
│   ├── login.ejs                  # Inicio de sesion
│   ├── menu.ejs                   # Menu principal
│   ├── listar.ejs                 # Lista de empleados
│   ├── crear.ejs                  # Formulario de creacion
│   └── editar.ejs                 # Formulario de edicion
└── public/
    └── style.css                  # Estilos
```

## Instalacion

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Asegurarse de que el backend este corriendo en el puerto 3000.
3. Levantar el frontend:
   ```bash
   npm run dev
   ```
   Aplicacion en: http://localhost:4000

## Acceso

Usuario de ejemplo: `admin@agroservices.com` / `1234`

import express from "express";
import session from "express-session";
import rutas from "./app/routes/routes.views.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Configurar EJS como motor de plantillas
app.set("view engine", "ejs");
app.set("views", "./views");

// Archivos estaticos (CSS)
app.use(express.static("public"));

// Parseo de datos de formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuracion de sesiones (2 horas de duracion)
app.use(session({
  secret: "siga_secreto_super_seguro",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 2 * 60 * 60 * 1000 }
}));

// Registrar rutas
app.use("/", rutas);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Frontend SIGA corriendo en el puerto ${PORT}`);
});
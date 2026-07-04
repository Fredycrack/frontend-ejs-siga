import fetch from "node-fetch";

const API_URL = process.env.API_URL || "http://localhost:3000/api";

// ============================================
// LOGIN  (CU3.7 Gestionar Autenticacion)
// ============================================
export const getLogin = (req, res) => {
  if (req.session.token) {
    return res.redirect("/menu");
  }
  res.render("login", { error: null });
};

export const postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.render("login", { error: data.error || "Credenciales invalidas" });
    }

    req.session.token = data.token;
    req.session.empleado = data.empleado;
    res.redirect("/menu");
  } catch (error) {
    console.error("Error en login:", error);
    res.render("login", { error: "Error de conexion con el servidor" });
  }
};

// ============================================
// MENU PRINCIPAL
// ============================================
export const getMenu = (req, res) => {
  res.render("menu", { empleado: req.session.empleado });
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Error al cerrar sesion:", err);
    res.redirect("/");
  });
};

// ============================================
// LISTAR EMPLEADOS
// ============================================
export const getEmpleados = async (req, res) => {
  try {
    const response = await fetch(`${API_URL}/empleados`, {
      headers: { "Authorization": `Bearer ${req.session.token}` }
    });

    if (!response.ok) {
      throw new Error("Error al obtener empleados");
    }

    const empleados = await response.json();
    res.render("listar", { empleados });
  } catch (error) {
    console.error("Error:", error);
    res.render("listar", { empleados: [] });
  }
};

// ============================================
// CREAR EMPLEADO
// ============================================
export const getNuevoEmpleado = (req, res) => {
  res.render("crear", { error: null });
};

export const postCrearEmpleado = async (req, res) => {
  const {
    nombre, documento, email, telefono, password,
    rol, salario_base, codigo_qr, estado, fecha_ingreso
  } = req.body;

  try {
    const response = await fetch(`${API_URL}/empleados`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${req.session.token}`
      },
      body: JSON.stringify({
        nombre, documento, email, telefono, password,
        rol, salario_base, codigo_qr, estado, fecha_ingreso
      })
    });

    if (!response.ok) {
      const data = await response.json();
      return res.render("crear", { error: data.error || "Error al crear empleado" });
    }
    res.redirect("/empleados");
  } catch (error) {
    console.error("Error:", error);
    res.render("crear", { error: "Error de conexion con el servidor" });
  }
};

// ============================================
// EDITAR EMPLEADO
//
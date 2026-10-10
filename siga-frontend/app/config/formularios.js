/**
 * Definicion de los campos de los formularios de registro y edicion.
 * La vista partials/formulario.ejs dibuja cada campo segun su tipo.
 * Los nombres coinciden con las columnas que acepta la API.
 */
const ROLES = ['Administrador', 'Supervisor', 'Trabajador de Campo', 'Tecnico Electronico', 'Jefe de Inventario', 'Responsable SST', 'Gerente'];
const ESTADO = { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: ['Activo', 'Inactivo'], sinVacio: true, soloEditar: true };

export const EMPLEADO = () => [
  { nombre: 'nombre', etiqueta: 'Nombre completo', requerido: true, maxlength: 100 },
  { nombre: 'documento', etiqueta: 'Numero de documento', requerido: true, maxlength: 20 },
  { nombre: 'email', etiqueta: 'Correo electronico (usuario)', tipo: 'email', requerido: true, maxlength: 100 },
  { nombre: 'telefono', etiqueta: 'Telefono', tipo: 'tel', maxlength: 20 },
  { nombre: 'rol', etiqueta: 'Rol en el sistema', tipo: 'select', opciones: ROLES, requerido: true, ayuda: 'El rol define los modulos y operaciones que puede usar (RF03).' },
  { nombre: 'salario_base', etiqueta: 'Salario base mensual (COP)', tipo: 'number', min: 0, paso: 100 },
  { nombre: 'fecha_ingreso', etiqueta: 'Fecha de ingreso', tipo: 'date' },
  { nombre: 'codigo_qr', etiqueta: 'Codigo QR de asistencia', maxlength: 50, omitirVacio: true, ayuda: 'Si lo deja vacio se genera automaticamente (QR-EMP-###).' },
  { nombre: 'password', etiqueta: 'Contrasena inicial', tipo: 'password', requerido: true, minlength: 8, soloCrear: true, autocompletar: 'new-password', ayuda: 'Minimo 8 caracteres con mayuscula, minuscula y numero. El empleado puede cambiarla despues.' },
  ESTADO
];

export const CLIENTE = () => [
  { nombre: 'nombre_cliente', etiqueta: 'Nombre o razon social', requerido: true, maxlength: 150, ancho: true },
  { nombre: 'tipo_cliente', etiqueta: 'Tipo de cliente', tipo: 'select', opciones: ['Empresa floricultora', 'Empresa', 'Persona natural'], requerido: true, sinVacio: true },
  { nombre: 'documento', etiqueta: 'NIT o cedula', requerido: true, maxlength: 20 },
  { nombre: 'email', etiqueta: 'Correo electronico', tipo: 'email', requerido: true, maxlength: 100, ayuda: 'Es el usuario del portal de clientes y el destino de las facturas.' },
  { nombre: 'telefono', etiqueta: 'Telefono', tipo: 'tel', maxlength: 20 },
  { nombre: 'direccion', etiqueta: 'Direccion', maxlength: 150 },
  { nombre: 'ciudad', etiqueta: 'Municipio', maxlength: 60, lista: ['Madrid', 'Facatativa', 'Mosquera', 'Funza', 'Bojaca', 'El Rosal', 'Subachoque'] },
  { nombre: 'representante', etiqueta: 'Representante o contacto', maxlength: 100 },
  { nombre: 'password', etiqueta: 'Contrasena del portal (opcional)', tipo: 'password', minlength: 8, soloCrear: true, omitirVacio: true, autocompletar: 'new-password', ayuda: 'Si la asigna, el cliente podra ingresar al portal de clientes.' },
  ESTADO
];

export const CONTRATO = ({ clientes = [] }) => [
  { nombre: 'numero_contrato', etiqueta: 'Numero de contrato', requerido: true, maxlength: 30, placeholder: 'CT-2026-003' },
  { nombre: 'id_cliente', etiqueta: 'Cliente', tipo: 'select', requerido: true, opciones: clientes.map((c) => [c.id_cliente, c.nombre_cliente]) },
  { nombre: 'tipo_contrato', etiqueta: 'Tipo de contrato', tipo: 'select', requerido: true, opciones: ['Labores agricolas', 'Servicios tecnologicos', 'Mixto'] },
  { nombre: 'valor_total', etiqueta: 'Valor total (COP)', tipo: 'number', min: 0, paso: 1000, defecto: 0 },
  { nombre: 'fecha_inicio', etiqueta: 'Fecha de inicio', tipo: 'date', requerido: true },
  { nombre: 'fecha_fin', etiqueta: 'Fecha de terminacion', tipo: 'date', requerido: true },
  { nombre: 'descripcion', etiqueta: 'Objeto del contrato', tipo: 'textarea', maxlength: 500, ancho: true },
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: ['Vigente', 'Finalizado', 'Cancelado'], sinVacio: true, soloEditar: true }
];

export const SERVICIO = () => [
  { nombre: 'nombre_servicio', etiqueta: 'Nombre del servicio', requerido: true, maxlength: 100 },
  { nombre: 'tipo_servicio', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: ['Agricola', 'Tecnologico'] },
  { nombre: 'unidad_medida', etiqueta: 'Unidad de cobro', requerido: true, maxlength: 30, defecto: 'Hora', lista: ['Hora', 'Jornal', 'Millar', 'Cama', 'Bloque', 'Servicio', 'Equipo'] },
  { nombre: 'tarifa_base', etiqueta: 'Tarifa por unidad (COP)', tipo: 'number', min: 0, paso: 100, requerido: true },
  { nombre: 'descripcion', etiqueta: 'Descripcion', tipo: 'textarea', maxlength: 300, ancho: true },
  ESTADO
];

export const PRODUCTO = () => [
  { nombre: 'codigo_producto', etiqueta: 'Codigo', requerido: true, maxlength: 30, placeholder: 'INS-010' },
  { nombre: 'nombre_producto', etiqueta: 'Nombre del producto', requerido: true, maxlength: 120 },
  { nombre: 'categoria', etiqueta: 'Categoria', tipo: 'select', requerido: true, opciones: ['Insumo agricola', 'Repuesto electronico', 'Herramienta', 'EPP'] },
  { nombre: 'unidad', etiqueta: 'Unidad de medida', requerido: true, maxlength: 20, defecto: 'Unidad', lista: ['Unidad', 'Litro', 'Kg', 'Par', 'Caja', 'Rollo', 'Galon'] },
  { nombre: 'cantidad_disponible', etiqueta: 'Existencia inicial', tipo: 'number', min: 0, paso: 0.01, defecto: 0, soloCrear: true, ayuda: 'Las entradas posteriores se registran como ingresos.' },
  { nombre: 'cantidad_minima', etiqueta: 'Stock minimo', tipo: 'number', min: 0, paso: 0.01, defecto: 0, ayuda: 'Al llegar a este valor se genera la orden de compra (RF27).' },
  { nombre: 'precio_unitario', etiqueta: 'Precio unitario (COP)', tipo: 'number', min: 0, paso: 1, defecto: 0 },
  { nombre: 'proveedor', etiqueta: 'Proveedor', maxlength: 100 },
  { nombre: 'ubicacion_almacen', etiqueta: 'Ubicacion en bodega', maxlength: 60, lista: ['Bodega A', 'Bodega B', 'Taller', 'Almacen EPP'] },
  ESTADO
];

export const TAREA = ({ empleados = [] }) => [
  { nombre: 'titulo', etiqueta: 'Tarea', requerido: true, maxlength: 120, ancho: true },
  { nombre: 'id_empleado', etiqueta: 'Responsable', tipo: 'select', requerido: true, opciones: empleados.map((e) => [e.id_empleado, `${e.nombre} (${e.rol})`]) },
  { nombre: 'prioridad', etiqueta: 'Prioridad', tipo: 'select', opciones: ['Alta', 'Media', 'Baja'], sinVacio: true, defecto: 'Media' },
  { nombre: 'fecha_inicio', etiqueta: 'Fecha de inicio', tipo: 'date', requerido: true },
  { nombre: 'fecha_limite', etiqueta: 'Fecha limite', tipo: 'date', requerido: true },
  { nombre: 'descripcion', etiqueta: 'Descripcion', tipo: 'textarea', maxlength: 500, ancho: true },
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: ['Pendiente', 'En proceso', 'Completada'], sinVacio: true, soloEditar: true }
];

export const CAPACITACION = ({ empleados = [] }) => [
  { nombre: 'tema', etiqueta: 'Tema', requerido: true, maxlength: 150, ancho: true },
  { nombre: 'fecha_capacitacion', etiqueta: 'Fecha', tipo: 'date', requerido: true },
  { nombre: 'instructor', etiqueta: 'Instructor', maxlength: 100 },
  { nombre: 'hora_inicio', etiqueta: 'Hora de inicio', tipo: 'time' },
  { nombre: 'hora_fin', etiqueta: 'Hora de finalizacion', tipo: 'time' },
  { nombre: 'ubicacion', etiqueta: 'Lugar', maxlength: 100 },
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: ['Programada', 'Realizada', 'Cancelada'], sinVacio: true, soloEditar: true },
  { nombre: 'descripcion', etiqueta: 'Contenido', tipo: 'textarea', maxlength: 500, ancho: true },
  { nombre: 'participantes', etiqueta: 'Trabajadores convocados', tipo: 'casillas', ancho: true, soloCrear: true, opciones: empleados.map((e) => [e.id_empleado, `${e.nombre} - ${e.rol}`]) }
];

export const INCIDENTE = ({ empleados = [] }) => [
  { nombre: 'tipo', etiqueta: 'Tipo de evento', tipo: 'select', requerido: true, opciones: ['Incidente', 'Accidente'], ayuda: 'Accidente: hubo lesion. Incidente: pudo haberla y no la hubo.' },
  { nombre: 'fecha_evento', etiqueta: 'Fecha y hora del evento', tipo: 'datetime-local', requerido: true },
  { nombre: 'lugar', etiqueta: 'Lugar', requerido: true, maxlength: 150, placeholder: 'Bloque 5, bodega, poscosecha...' },
  { nombre: 'id_empleado', etiqueta: 'Trabajador involucrado', tipo: 'select', vacio: 'Ninguno', opciones: empleados.map((e) => [e.id_empleado, e.nombre]) },
  { nombre: 'gravedad', etiqueta: 'Gravedad', tipo: 'select', opciones: ['Leve', 'Moderado', 'Grave', 'Mortal'], sinVacio: true },
  { nombre: 'dias_incapacidad', etiqueta: 'Dias de incapacidad', tipo: 'number', min: 0, paso: 1, defecto: 0 },
  { nombre: 'descripcion', etiqueta: 'Descripcion de lo ocurrido', tipo: 'textarea', requerido: true, maxlength: 800, ancho: true },
  { nombre: 'causas', etiqueta: 'Causas identificadas', tipo: 'textarea', maxlength: 500, ancho: true }
];

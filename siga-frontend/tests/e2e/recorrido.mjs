/**
 * Prueba de extremo a extremo de la interfaz de SIGA con Playwright.
 * Recorre los flujos principales de cada rol en un navegador real.
 *
 * Requisitos: API y frontend en ejecucion, base de datos recien creada con
 * los datos de demostracion (SEED_DEMO), y Chromium instalado para Playwright.
 *   BASE_URL=http://localhost:4000 npm run e2e
 * Con CAPTURAS=carpeta guarda una captura de cada pantalla visitada.
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const BASE = (process.env.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const CLAVE = process.env.CLAVE_DEMO || 'Siga2026*';
const CAPTURAS = process.env.CAPTURAS || '';
const dir = path.dirname(fileURLToPath(import.meta.url));
const FOTO = path.join(dir, 'archivos', 'evidencia.jpg');
const hoy = new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
const LUGAR = { latitude: 4.7381, longitude: -74.2689 }; // Bloque de la finca de prueba (Madrid, Cundinamarca)

if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const resultados = [];
let numeroCaptura = 0;

// ---------- Utilidades ----------
async function nuevaSesion({ movil = false } = {}) {
  const contexto = await navegador.newContext({
    viewport: movil ? { width: 390, height: 844 } : { width: 1366, height: 900 },
    deviceScaleFactor: 1,
    isMobile: movil,
    hasTouch: movil,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    permissions: ['geolocation'],
    geolocation: LUGAR,
    acceptDownloads: true
  });
  const pagina = await contexto.newPage();
  pagina.errores = [];
  pagina.on('pageerror', (e) => pagina.errores.push(`Error de JavaScript: ${e.message}`));
  pagina.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource: the server responded with a status of (4\d\d)/.test(m.text())) {
      pagina.errores.push(`Consola: ${m.text()}`);
    }
  });
  return { contexto, pagina };
}

async function ingresar(pagina, email, { portal = false } = {}) {
  await pagina.goto(`${BASE}${portal ? '/portal/login' : '/'}`);
  await pagina.fill('#email', email);
  await pagina.fill('#password', CLAVE);
  await Promise.all([pagina.waitForURL((u) => !/\/(portal\/login)?$/.test(u.pathname)), pagina.click('button[type=submit]')]);
}

async function ir(pagina, ruta) {
  await pagina.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle' });
}

async function capturar(pagina, nombre) {
  if (!CAPTURAS) return;
  numeroCaptura += 1;
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForTimeout(250);
  await pagina.screenshot({ path: path.join(CAPTURAS, `${String(numeroCaptura).padStart(2, '0')}-${nombre}.png`), fullPage: true });
}

// Confirma el dialogo propio de SIGA y espera la recarga o redireccion
async function confirmarYEsperar(pagina) {
  await pagina.waitForSelector('#dialogo-confirmar[open]');
  await Promise.all([pagina.waitForNavigation(), pagina.click('#confirmar-si')]);
  await pagina.waitForLoadState('networkidle');
}

async function enviarFormulario(pagina, selector = 'form[data-api] button[type=submit]') {
  await Promise.all([pagina.waitForNavigation(), pagina.click(selector)]);
  await pagina.waitForLoadState('networkidle');
}

function verificar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

async function paso(nombre, fn) {
  const inicio = Date.now();
  try {
    await fn();
    resultados.push({ nombre, ok: true, ms: Date.now() - inicio });
    console.log(`  ✔ ${nombre} (${Date.now() - inicio} ms)`);
  } catch (e) {
    resultados.push({ nombre, ok: false, error: e.message });
    console.log(`  ✖ ${nombre}\n      ${e.message.split('\n')[0]}`);
  }
}

// Devuelve el texto de todas las notificaciones visibles (espera la primera)
const textoNotificacion = async (pagina) => {
  await pagina.waitForSelector('.notificacion', { timeout: 8000 });
  await pagina.waitForTimeout(150);
  return (await pagina.locator('.notificacion').allTextContents()).join(' | ');
};

// ---------- Recorrido ----------
console.log(`Prueba de la interfaz de SIGA en ${BASE}\n`);

const adm = await nuevaSesion();
await paso('Inicio de sesion: rechaza una contrasena incorrecta', async () => {
  await ir(adm.pagina, '/');
  await capturar(adm.pagina, 'login');
  await adm.pagina.fill('#email', 'admin@agroservices.com');
  await adm.pagina.fill('#password', 'incorrecta');
  await Promise.all([adm.pagina.waitForNavigation(), adm.pagina.click('button[type=submit]')]);
  verificar(await adm.pagina.isVisible('.aviso.error'), 'No se mostro el mensaje de error');
});

await paso('Administrador: tablero de indicadores con graficas', async () => {
  await ingresar(adm.pagina, 'admin@agroservices.com');
  verificar(adm.pagina.url().endsWith('/inicio'), 'No llego al inicio');
  await adm.pagina.waitForFunction(() => document.querySelectorAll('canvas').length === 3 && window.Chart);
  await capturar(adm.pagina, 'tablero-administrador');
});

await paso('RF03: crear un empleado con su rol', async () => {
  await ir(adm.pagina, '/empleados/nuevo');
  await adm.pagina.fill('[name=nombre]', 'Lucia Prueba Ramirez');
  await adm.pagina.fill('[name=documento]', '1099887766');
  await adm.pagina.fill('[name=email]', 'lucia.prueba@agroservices.com');
  await adm.pagina.selectOption('[name=rol]', 'Trabajador de Campo');
  await adm.pagina.fill('[name=salario_base]', '1423500');
  await adm.pagina.fill('[name=password]', 'Lucia2026x');
  await capturar(adm.pagina, 'empleado-nuevo');
  await enviarFormulario(adm.pagina);
  verificar(adm.pagina.url().endsWith('/empleados'), 'No volvio a la lista de empleados');
  verificar(await adm.pagina.isVisible('text=Lucia Prueba Ramirez'), 'El empleado no aparece en la lista');
  await capturar(adm.pagina, 'empleados');
});

await paso('RF03: el formulario muestra los errores de la API (documento duplicado)', async () => {
  await ir(adm.pagina, '/empleados/nuevo');
  await adm.pagina.fill('[name=nombre]', 'Duplicado');
  await adm.pagina.fill('[name=documento]', '1099887766');
  await adm.pagina.fill('[name=email]', 'otro.correo@agroservices.com');
  await adm.pagina.selectOption('[name=rol]', 'Supervisor');
  await adm.pagina.fill('[name=password]', 'Lucia2026x');
  await adm.pagina.click('form[data-api] button[type=submit]');
  await adm.pagina.waitForSelector('.aviso-formulario:not(.oculto)');
  verificar(/ya estan registrados/i.test(await adm.pagina.textContent('.aviso-formulario')), 'Mensaje de duplicado incorrecto');
});

await paso('RF01 y RF02: registrar cliente y contrato', async () => {
  await ir(adm.pagina, '/clientes/nuevo');
  await adm.pagina.fill('[name=nombre_cliente]', 'Rosas de la Sabana S.A.S.');
  await adm.pagina.fill('[name=documento]', '901555222-4');
  await adm.pagina.fill('[name=email]', 'compras@rosasdelasabana.com.co');
  await adm.pagina.fill('[name=ciudad]', 'Madrid');
  await adm.pagina.fill('[name=password]', 'Portal2026x');
  await enviarFormulario(adm.pagina);
  await ir(adm.pagina, '/contratos/nuevo');
  await adm.pagina.fill('[name=numero_contrato]', 'CT-2026-050');
  await adm.pagina.selectOption('[name=id_cliente]', { label: 'Rosas de la Sabana S.A.S.' });
  await adm.pagina.selectOption('[name=tipo_contrato]', 'Labores agricolas');
  await adm.pagina.fill('[name=valor_total]', '24000000');
  await adm.pagina.fill('[name=fecha_inicio]', hoy);
  await adm.pagina.fill('[name=fecha_fin]', `${Number(hoy.slice(0, 4)) + 1}${hoy.slice(4)}`);
  await capturar(adm.pagina, 'contrato-nuevo');
  await enviarFormulario(adm.pagina);
  verificar(/\/contratos\/\d+$/.test(adm.pagina.url()), 'No abrio el detalle del contrato');
  verificar(await adm.pagina.isVisible('h1:has-text("CT-2026-050")'), 'No se ve el contrato creado');
});

// ---------- Modulo 1 ----------
const sup = await nuevaSesion();
let idLabor;
await paso('RF07: el supervisor programa una labor', async () => {
  await ingresar(sup.pagina, 'supervisor@agroservices.com');
  await capturar(sup.pagina, 'inicio-supervisor');
  await ir(sup.pagina, '/labores/nueva');
  await sup.pagina.selectOption('[name=id_contrato]', { label: 'CT-2026-001 - Floricultora Bella Rosa S.A.S.' });
  await sup.pagina.selectOption('[name=id_servicio]', { label: 'Desbotone' });
  verificar((await sup.pagina.inputValue('[name=tipo_labor]')) === 'Desbotone', 'No copio el nombre del servicio');
  await sup.pagina.selectOption('[name=id_empleado]', { label: 'Carlos Gomez' });
  await sup.pagina.fill('[name=fecha_programada]', hoy);
  await sup.pagina.fill('[name=hora_programada]', '05:30');
  await sup.pagina.fill('[name=ubicacion]', 'Bloque 8, camas 1 a 30');
  await sup.pagina.fill('[name=cantidad]', '6');
  await sup.pagina.click('[data-gps]');
  await sup.pagina.waitForFunction(() => document.querySelector('[name=latitud]').value !== '');
  await sup.pagina.fill('[name=descripcion]', 'Desbotone de rosa variedad Freedom. Usar guantes de nitrilo.');
  await capturar(sup.pagina, 'labor-nueva');
  await enviarFormulario(sup.pagina);
  const m = sup.pagina.url().match(/\/labores\/(\d+)$/);
  verificar(m, 'No abrio el detalle de la labor');
  idLabor = Number(m[1]);
  await capturar(sup.pagina, 'labor-detalle-programada');
});

await paso('RF07: impide programar dos labores a la misma hora', async () => {
  await ir(sup.pagina, '/labores/nueva');
  await sup.pagina.selectOption('[name=id_contrato]', { label: 'CT-2026-001 - Floricultora Bella Rosa S.A.S.' });
  await sup.pagina.selectOption('[name=id_servicio]', { label: 'Corte de flor' });
  await sup.pagina.selectOption('[name=id_empleado]', { label: 'Carlos Gomez' });
  await sup.pagina.fill('[name=fecha_programada]', hoy);
  await sup.pagina.fill('[name=hora_programada]', '05:30');
  await sup.pagina.fill('[name=ubicacion]', 'Bloque 9');
  await sup.pagina.click('form[data-api] button[type=submit]');
  await sup.pagina.waitForSelector('.aviso-formulario:not(.oculto)');
  verificar(/ya tiene una labor/i.test(await sup.pagina.textContent('.aviso-formulario')), 'No informo el cruce de horario');
});

const campo = await nuevaSesion({ movil: true });
await paso('RF08: el trabajador inicia la labor con GPS desde el celular', async () => {
  await ingresar(campo.pagina, 'campo@agroservices.com');
  verificar(campo.pagina.url().endsWith('/mis-labores'), 'El trabajador no llego a Mis labores');
  await campo.pagina.waitForSelector(`[data-operar=iniciar][data-labor="${idLabor}"]`);
  await capturar(campo.pagina, 'mis-labores-movil');
  await campo.pagina.click(`[data-operar=iniciar][data-labor="${idLabor}"]`);
  await confirmarYEsperar(campo.pagina);
  await campo.pagina.waitForSelector(`[data-operar=evidencia][data-labor="${idLabor}"]`);
  verificar(/Inicio de la labor registrado/.test(await textoNotificacion(campo.pagina)), 'No confirmo el inicio');
});

await paso('RF09: registra una evidencia fotografica comprimida', async () => {
  await campo.pagina.click(`[data-operar=evidencia][data-labor="${idLabor}"]`);
  await campo.pagina.setInputFiles('#foto', FOTO);
  await campo.pagina.waitForSelector('#vista-foto:not(.oculto)');
  await campo.pagina.fill('#comentario', 'Camas 1 a 15 terminadas');
  await capturar(campo.pagina, 'evidencia-movil');
  await Promise.all([campo.pagina.waitForNavigation(), campo.pagina.click('#form-evidencia button[type=submit]')]);
  await campo.pagina.waitForLoadState('networkidle');
  verificar(/Evidencia registrada/.test(await textoNotificacion(campo.pagina)), 'No confirmo la evidencia');
});

await paso('RF12: sin conexion guarda la finalizacion y la sincroniza al volver la senal', async () => {
  await campo.contexto.setOffline(true);
  await campo.pagina.evaluate(() => window.dispatchEvent(new Event('offline')));
  await campo.pagina.click(`[data-operar=finalizar][data-labor="${idLabor}"]`);
  await campo.pagina.fill('#resultado', 'Bloque 8 terminado sin senal');
  await campo.pagina.locator('#porcentaje_cumplimiento').fill('95');
  await campo.pagina.click('#form-finalizar button[type=submit]');
  await campo.pagina.waitForSelector('#caja-pendientes:not(.oculto)');
  verificar((await campo.pagina.textContent('#num-pendientes')).trim() === '1', 'No quedo 1 registro pendiente');
  await capturar(campo.pagina, 'sin-conexion-pendiente');
  // La pagina sigue abriendo sin internet gracias al trabajador de servicio
  await campo.pagina.reload();
  await campo.pagina.waitForSelector('#lista-labores article');
  verificar(await campo.pagina.isVisible('text=pendiente de enviar'), 'Sin conexion no se muestra el registro pendiente');
  await campo.contexto.setOffline(false);
  await Promise.all([
    campo.pagina.waitForNavigation({ timeout: 20000 }),
    campo.pagina.evaluate(() => window.dispatchEvent(new Event('online')))
  ]);
  await campo.pagina.waitForLoadState('networkidle');
  await campo.pagina.waitForSelector('.notificacion:has-text("sincronizado")', { timeout: 15000 }).catch(() => null);
  const aviso = await textoNotificacion(campo.pagina);
  verificar(/1 registro\(s\) sincronizado/.test(aviso), `No sincronizo el registro: ${aviso}`);
  verificar((await campo.pagina.textContent('#num-pendientes')).trim() === '0', 'Quedaron registros pendientes');
});

await paso('RF10 y RF11: el supervisor ve la labor finalizada con evidencia y GPS', async () => {
  await ir(sup.pagina, `/labores/${idLabor}`);
  verificar(await sup.pagina.isVisible('.etiqueta:has-text("Finalizada")'), 'La labor no aparece finalizada');
  verificar(await sup.pagina.isVisible('text=Registrada sin conexion') || await sup.pagina.isVisible('text=se hizo sin conexion'), 'No indica el registro sin conexion');
  verificar(await sup.pagina.locator('.galeria img').count() === 1, 'No muestra la evidencia');
  await capturar(sup.pagina, 'labor-detalle-finalizada');
  await ir(sup.pagina, '/labores/avance');
  await capturar(sup.pagina, 'avance-contratos');
});

// ---------- Modulo 4 ----------
await paso('RF19: lector de asistencia registra la entrada con el codigo del carne', async () => {
  await ir(sup.pagina, '/asistencia/kiosco');
  await sup.pagina.fill('#codigo-manual', 'QR-EMP-003');
  await sup.pagina.click('#form-codigo button');
  await sup.pagina.waitForSelector('#resultado strong');
  verificar(/Carlos Gomez/.test(await sup.pagina.textContent('#resultado')), 'No registro la asistencia');
  await capturar(sup.pagina, 'lector-qr');
});

await paso('RF20 y RF21: asignar una tarea y completarla', async () => {
  await ir(sup.pagina, '/tareas/nueva');
  await sup.pagina.fill('[name=titulo]', 'Afilar tijeras de poda del bloque 8');
  await sup.pagina.selectOption('[name=id_empleado]', { label: 'Carlos Gomez (Trabajador de Campo)' });
  await sup.pagina.selectOption('[name=prioridad]', 'Alta');
  await enviarFormulario(sup.pagina);
  await ir(campo.pagina, '/mis-tareas');
  await capturar(campo.pagina, 'mis-tareas-movil');
  await campo.pagina.click('h3:has-text("Afilar tijeras") >> xpath=ancestor::div[contains(@class,"tarjeta")] >> button:has-text("Marcar como completada")');
  await confirmarYEsperar(campo.pagina);
  verificar(/Tarea completada/.test(await textoNotificacion(campo.pagina)), 'No completo la tarea');
});

await paso('RF22: calcular la nomina del periodo', async () => {
  await ir(adm.pagina, '/nomina');
  await adm.pagina.click('form[data-api] button[type=submit]');
  await confirmarYEsperar(adm.pagina);
  verificar(/periodo_inicio=/.test(adm.pagina.url()), 'No mostro el detalle del periodo');
  verificar(await adm.pagina.locator('tbody tr').count() >= 9, 'La liquidacion no incluye a los empleados');
  await capturar(adm.pagina, 'nomina');
});

// ---------- Modulo 2 ----------
const tec = await nuevaSesion();
let codigo;
await paso('RF13 a RF16: recepcion, diagnostico, cotizacion, reparacion y repuesto', async () => {
  await ingresar(tec.pagina, 'tecnico@agroservices.com');
  await ir(tec.pagina, '/equipos/nuevo');
  await tec.pagina.selectOption('[name=id_cliente]', { label: 'Floricultora Bella Rosa S.A.S. (900456123-1)' });
  await tec.pagina.fill('[name=tipo_equipo]', 'Portatil');
  await tec.pagina.fill('[name=marca]', 'Lenovo');
  await tec.pagina.fill('[name=modelo]', 'ThinkPad E14');
  await tec.pagina.fill('[name=problema_reportado]', 'No carga la bateria y se apaga');
  await enviarFormulario(tec.pagina);
  codigo = (await tec.pagina.textContent('p.mono')).trim();
  verificar(/^[A-Z0-9]{8}$/.test(codigo), `Codigo de seguimiento invalido: ${codigo}`);
  await tec.pagina.fill('[name=diagnostico]', 'Puerto de carga averiado; memoria con falla intermitente');
  await tec.pagina.fill('[name=valor_cotizacion]', '210000');
  await enviarFormulario(tec.pagina, 'form[data-api*="diagnostico"] button[type=submit]');
  await tec.pagina.click('button:has-text("Registrar aprobacion del cliente")');
  await confirmarYEsperar(tec.pagina);
  await tec.pagina.click('button:has-text("Iniciar reparacion")');
  await confirmarYEsperar(tec.pagina);
  await tec.pagina.selectOption('[name=id_inventario]', { index: 1 });
  await enviarFormulario(tec.pagina, 'form[data-api*="repuestos"] button[type=submit]');
  verificar(await tec.pagina.locator('table >> text=Subtotal').count() >= 1, 'No se registro el repuesto');
  await capturar(tec.pagina, 'equipo-detalle');
});

await paso('RF18: el tecnico registra un diagnostico sin conexion y se sincroniza', async () => {
  await ir(tec.pagina, '/mi-taller');
  const tarjeta = tec.pagina.locator('article', { hasText: 'T4N8WQ2D' });
  await tarjeta.waitFor();
  await tec.contexto.setOffline(true);
  await tec.pagina.evaluate(() => window.dispatchEvent(new Event('offline')));
  await tarjeta.locator('button:has-text("Registrar diagnostico")').click();
  await tec.pagina.fill('#t-diag', 'Disco duro con sectores danados; se recomienda SSD');
  await tec.pagina.fill('#t-valor', '230000');
  await tec.pagina.click('#form-diagnostico button[type=submit]');
  await tec.pagina.waitForSelector('#caja-pendientes:not(.oculto)');
  verificar(await tarjeta.locator('text=pendientes de enviar').isVisible(), 'No marca el cambio pendiente');
  await capturar(tec.pagina, 'mi-taller-sin-conexion');
  await tec.contexto.setOffline(false);
  await Promise.all([
    tec.pagina.waitForNavigation({ timeout: 20000 }),
    tec.pagina.evaluate(() => window.dispatchEvent(new Event('online')))
  ]);
  await tec.pagina.waitForSelector('.notificacion:has-text("sincronizado")', { timeout: 15000 });
  verificar(await tec.pagina.locator('article', { hasText: 'T4N8WQ2D' }).locator('text=En diagnostico').isVisible(), 'El equipo no quedo en diagnostico');
});

await paso('RF17: consulta publica del estado con el codigo de seguimiento', async () => {
  const pub = await nuevaSesion({ movil: true });
  await ir(pub.pagina, `/seguimiento?codigo=${codigo.toLowerCase()}`);
  verificar(await pub.pagina.isVisible('.etiqueta:has-text("En proceso")'), 'No muestra el estado');
  verificar(!(await pub.pagina.isVisible('text=Bella Rosa')), 'La consulta publica muestra datos del cliente');
  await capturar(pub.pagina, 'seguimiento-publico');
  await pub.contexto.close();
});

// ---------- Modulo 5 ----------
const inv = await nuevaSesion();
await paso('RF23 y RF27: ingreso de mercancia y generacion de ordenes de compra', async () => {
  await ingresar(inv.pagina, 'inventario@agroservices.com');
  await ir(inv.pagina, '/inventario');
  await inv.pagina.click('tr:has-text("INS-002") >> button:has-text("Ingreso")');
  await inv.pagina.fill('#mv-cantidad', '50');
  await inv.pagina.fill('#mv-ref', 'Factura de compra 4620');
  await enviarFormulario(inv.pagina, '#dlg-movimiento button[type=submit]');
  verificar(/Ingreso registrado/.test(await textoNotificacion(inv.pagina)), 'No confirmo el ingreso');
  await capturar(inv.pagina, 'inventario');
  await ir(inv.pagina, '/ordenes');
  await inv.pagina.click('button:has-text("Generar ordenes automaticas")');
  await confirmarYEsperar(inv.pagina);
  await capturar(inv.pagina, 'ordenes-compra');
});

await paso('RF28: el administrador aprueba la orden y el almacen la recibe', async () => {
  await ir(adm.pagina, '/ordenes?estado=Pendiente');
  await adm.pagina.locator('button:has-text("Aprobar")').first().click();
  await confirmarYEsperar(adm.pagina);
  await ir(inv.pagina, '/ordenes?estado=Aprobada');
  await inv.pagina.locator('button:has-text("Registrar recepcion")').first().click();
  await confirmarYEsperar(inv.pagina);
  verificar(/recibida/i.test(await textoNotificacion(inv.pagina)), 'No registro la recepcion');
});

// ---------- Modulo 6 ----------
const sst = await nuevaSesion();
await paso('RF29: programar capacitacion, convocar y registrar asistencia', async () => {
  await ingresar(sst.pagina, 'sst@agroservices.com');
  await ir(sst.pagina, '/capacitaciones/nueva');
  await sst.pagina.fill('[name=tema]', 'Prevencion de riesgo biomecanico en poscosecha');
  await sst.pagina.fill('[name=instructor]', 'ARL Sura');
  await sst.pagina.fill('[name=ubicacion]', 'Sala de reuniones');
  await sst.pagina.check('label:has-text("Carlos Gomez") input');
  await sst.pagina.check('label:has-text("Andres Pinto") input');
  await enviarFormulario(sst.pagina);
  await sst.pagina.click('tr:has-text("Carlos Gomez") >> button:has-text("Marcar asistencia")');
  await sst.pagina.waitForNavigation();
  verificar(await sst.pagina.isVisible('text=CERT-'), 'No genero el certificado');
  await capturar(sst.pagina, 'capacitacion-detalle');
});

await paso('RF30: entrega de EPP descontando inventario', async () => {
  await ir(sst.pagina, '/epp');
  await sst.pagina.click('button:has-text("Registrar entrega")');
  await sst.pagina.selectOption('#e-emp', { label: 'Lucia Prueba Ramirez - Trabajador de Campo' });
  await sst.pagina.selectOption('#e-inv', { index: 1 });
  await enviarFormulario(sst.pagina, '#dlg-epp button[type=submit]');
  verificar(await sst.pagina.isVisible('td:has-text("Lucia Prueba Ramirez")'), 'No registro la entrega');
});

await paso('RF31: reporte de incidente y cierre con acciones correctivas', async () => {
  await ir(sup.pagina, '/incidentes/nuevo');
  await sup.pagina.selectOption('[name=tipo]', 'Incidente');
  await sup.pagina.fill('[name=lugar]', 'Cuarto frio de poscosecha');
  await sup.pagina.fill('[name=descripcion]', 'Piso mojado sin senalizacion; un trabajador resbalo sin lesion');
  await enviarFormulario(sup.pagina);
  const ruta = new URL(sup.pagina.url()).pathname;
  await ir(sst.pagina, ruta);
  await sst.pagina.selectOption('#s-estado', 'Cerrado');
  await sst.pagina.click('form[data-api] button[type=submit]');
  await sst.pagina.waitForSelector('.aviso-formulario:not(.oculto)');
  await sst.pagina.fill('#s-acciones', 'Senalizacion permanente y tapete antideslizante');
  await enviarFormulario(sst.pagina);
  verificar(await sst.pagina.isVisible('.etiqueta:has-text("Cerrado")'), 'No cerro el incidente');
  await ir(sst.pagina, '/sst/indicadores');
  await capturar(sst.pagina, 'indicadores-sst');
});

// ---------- Modulo 7 ----------
let idFactura;
await paso('RF33: factura a partir de las labores finalizadas del contrato', async () => {
  await ir(adm.pagina, '/facturas/desde-labores');
  await adm.pagina.selectOption('#id_contrato', { label: 'CT-2026-001 - Floricultora Bella Rosa S.A.S. (Vigente)' });
  await Promise.all([adm.pagina.waitForNavigation(), adm.pagina.click('button:has-text("Ver labores pendientes")')]);
  verificar(await adm.pagina.locator('tbody tr').count() >= 2, 'No lista las labores pendientes');
  await capturar(adm.pagina, 'facturar-labores');
  await enviarFormulario(adm.pagina);
  const m = adm.pagina.url().match(/\/facturas\/(\d+)$/);
  verificar(m, 'No abrio la factura');
  idFactura = m[1];
});

await paso('RF35: registrar un abono y descargar el PDF', async () => {
  await adm.pagina.click('button:has-text("Registrar pago")');
  await adm.pagina.fill('#p-valor', '500000');
  await adm.pagina.fill('#p-ref', 'TRF-889120');
  await enviarFormulario(adm.pagina, '#dlg-pago button[type=submit]');
  verificar(await adm.pagina.isVisible('.etiqueta:has-text("Pagada parcialmente")'), 'El estado no cambio');
  await capturar(adm.pagina, 'factura-detalle');
  const [descarga] = await Promise.all([adm.pagina.waitForEvent('download'), adm.pagina.click('a:has-text("Descargar PDF")')]);
  verificar(/\.pdf$/.test(descarga.suggestedFilename()), 'La descarga no es un PDF');
});

await paso('RF33: factura manual con calculo de IVA', async () => {
  await ir(adm.pagina, '/facturas/nueva');
  await adm.pagina.selectOption('[name=id_cliente]', { label: 'Juan Carlos Moreno' });
  await adm.pagina.selectOption('#items tbody tr:first-child [data-campo=id_servicio]', { label: 'Mantenimiento preventivo' });
  verificar((await adm.pagina.inputValue('#items tbody tr:first-child [data-campo=valor_unitario]')) === '80000', 'No tomo la tarifa del servicio');
  await adm.pagina.fill('#items tbody tr:first-child [data-campo=cantidad]', '2');
  await adm.pagina.click('#agregar-item');
  await adm.pagina.fill('#items tbody tr:nth-child(2) [data-campo=descripcion]', 'Cable de poder');
  await adm.pagina.fill('#items tbody tr:nth-child(2) [data-campo=valor_unitario]', '25000');
  await capturar(adm.pagina, 'factura-nueva');
  await enviarFormulario(adm.pagina);
  verificar(/\/facturas\/\d+$/.test(adm.pagina.url()), 'No creo la factura');
});

// ---------- Portal de clientes ----------
const cli = await nuevaSesion();
await paso('RF06 y RF36: el cliente solicita un servicio y consulta sus facturas', async () => {
  await ingresar(cli.pagina, 'compras@bellarosa.com.co', { portal: true });
  await capturar(cli.pagina, 'portal-resumen');
  await ir(cli.pagina, '/portal/solicitudes');
  await cli.pagina.selectOption('#s-serv', { index: 1 });
  const manana = new Date(Date.now() + 19 * 3600 * 1000).toISOString().slice(0, 10);
  await cli.pagina.fill('#s-fecha', manana);
  await cli.pagina.fill('#s-ubic', 'Bloque 12');
  await enviarFormulario(cli.pagina);
  verificar(await cli.pagina.isVisible('td:has-text("Bloque 12")'), 'No registro la solicitud');
  await ir(cli.pagina, '/portal/facturas');
  verificar(await cli.pagina.locator('tbody tr').count() >= 2, 'No muestra las facturas del cliente');
});

await paso('El cliente aprueba la cotizacion pendiente de su equipo', async () => {
  await ir(tec.pagina, '/equipos/nuevo');
  await tec.pagina.selectOption('[name=id_cliente]', { label: 'Floricultora Bella Rosa S.A.S. (900456123-1)' });
  await tec.pagina.fill('[name=tipo_equipo]', 'Impresora termica');
  await tec.pagina.fill('[name=problema_reportado]', 'Imprime en blanco');
  await enviarFormulario(tec.pagina);
  await tec.pagina.fill('[name=diagnostico]', 'Cinta de transferencia agotada y cabezal sucio');
  await tec.pagina.fill('[name=valor_cotizacion]', '65000');
  await enviarFormulario(tec.pagina, 'form[data-api*="diagnostico"] button[type=submit]');
  await ir(cli.pagina, '/portal/equipos');
  await cli.pagina.click('button:has-text("Aprobar cotizacion")');
  await confirmarYEsperar(cli.pagina);
  verificar(/Cotizacion aprobada/.test(await textoNotificacion(cli.pagina)), 'No aprobo la cotizacion');
  await capturar(cli.pagina, 'portal-equipos');
});

// ---------- Modulo 8 ----------
const ger = await nuevaSesion();
await paso('RF37 a RF40: el gerente consulta reportes y exporta a Excel', async () => {
  await ingresar(ger.pagina, 'gerente@agroservices.com');
  await ir(ger.pagina, '/reportes/rentabilidad');
  verificar(await ger.pagina.locator('tbody tr').count() >= 1, 'Sin filas de rentabilidad');
  await capturar(ger.pagina, 'rentabilidad');
  await ir(ger.pagina, '/reportes/productividad');
  await capturar(ger.pagina, 'productividad');
  await ir(ger.pagina, '/reportes');
  const [descarga] = await Promise.all([ger.pagina.waitForEvent('download'), ger.pagina.locator('a:has-text("Descargar Excel")').first().click()]);
  verificar(/\.xlsx$/.test(descarga.suggestedFilename()), 'La descarga no es un Excel');
});

await paso('Control de acceso: un rol sin permiso ve la pagina de acceso restringido', async () => {
  const r = await campo.pagina.goto(`${BASE}/facturas`);
  verificar(r.status() === 403, `Se esperaba 403 y llego ${r.status()}`);
});

await paso('RF04: cambio de contrasena desde el perfil', async () => {
  const lu = await nuevaSesion();
  await lu.pagina.goto(`${BASE}/`);
  await lu.pagina.fill('#email', 'lucia.prueba@agroservices.com');
  await lu.pagina.fill('#password', 'Lucia2026x');
  await Promise.all([lu.pagina.waitForNavigation(), lu.pagina.click('button[type=submit]')]);
  await ir(lu.pagina, '/perfil');
  await lu.pagina.fill('#actual', 'Lucia2026x');
  await lu.pagina.fill('#nueva', 'Lucia2026y');
  await lu.pagina.fill('#confirmacion', 'Lucia2026z');
  await lu.pagina.click('form[data-api] button[type=submit]');
  await lu.pagina.waitForSelector('.aviso-formulario:not(.oculto)');
  await lu.pagina.fill('#confirmacion', 'Lucia2026y');
  await enviarFormulario(lu.pagina);
  verificar(/Contrasena actualizada/i.test(await textoNotificacion(lu.pagina)), 'No confirmo el cambio');
  await lu.contexto.close();
});

// Errores de JavaScript o de la politica de seguridad en cualquier pagina
await paso('Sin errores de JavaScript ni bloqueos de la politica de seguridad', async () => {
  const todos = [adm, sup, campo, tec, inv, sst, cli, ger].flatMap((s) => s.pagina.errores);
  verificar(!todos.length, todos.slice(0, 5).join('\n'));
});

await navegador.close();
const fallidos = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallidos.length} de ${resultados.length} pasos correctos`);
process.exit(fallidos.length ? 1 : 0);

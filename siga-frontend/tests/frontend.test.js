/**
 * Pruebas del servidor del frontend (node:test). No requieren la API:
 * verifican formatos, permisos del menu, control de sesion, encabezados
 * de seguridad y el puente /api.
 * Ejecucion: npm test
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.API_URL = 'http://127.0.0.1:9/api'; // puerto cerrado: simula la API caida
const { default: app } = await import('../app.js');
const f = await import('../app/utils/formato.js');
const { menuPara, puede, MENU } = await import('../app/config/menu.js');
const { destinoSeguro } = await import('../app/utils/pagina.js');
const { consulta } = await import('../app/utils/api.js');

let servidor;
let base;
before(async () => {
  await new Promise((ok) => { servidor = app.listen(0, ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => servidor.close());

const pedir = (ruta, opciones = {}) => fetch(`${base}${ruta}`, { redirect: 'manual', ...opciones });

describe('Formatos de las vistas', () => {
  test('moneda colombiana sin decimales', () => {
    assert.equal(f.pesos(3791340), '$ 3.791.340');
    assert.equal(f.pesos(null), '—');
  });
  test('fechas y horas en espanol sin corrimiento de zona horaria', () => {
    assert.equal(f.fecha('2026-10-01'), '1 oct 2026');
    assert.equal(f.fecha('2026-12-31 23:59:00'), '31 dic 2026');
    assert.equal(f.hora('07:05:00'), '7:05 a. m.');
    assert.equal(f.hora('2026-10-10 15:30:00'), '3:30 p. m.');
    assert.equal(f.hora('12:00:00'), '12:00 p. m.');
  });
  test('color de la etiqueta segun el estado', () => {
    assert.equal(f.color('Finalizada'), 'verde');
    assert.equal(f.color('En proceso'), 'azul');
    assert.equal(f.color('Pendiente'), 'ambar');
    assert.equal(f.color('Anulada'), 'rojo');
    assert.equal(f.color('Otro'), 'gris');
  });
  test('suma de dias y cadena de consulta', () => {
    assert.equal(f.sumarDias(1, '2026-12-31'), '2027-01-01');
    assert.equal(f.sumarDias(-1, '2026-03-01'), '2026-02-28');
    assert.equal(consulta({ estado: 'En proceso', vacio: '', nulo: null }), '?estado=En+proceso');
    assert.equal(consulta({}), '');
  });
  test('iniciales del usuario', () => {
    assert.equal(f.iniciales('Fredy Alexander Vargas'), 'FA');
  });
});

describe('Menu segun el rol (RF03)', () => {
  const opciones = (rol) => menuPara({ tipo: 'empleado', rol }).flatMap((s) => s.items.map((i) => i.ruta));
  test('el administrador ve todo menos las opciones exclusivas del trabajador de campo', () => {
    const todas = MENU.flatMap((s) => s.items).filter((i) => !i.soloRol).map((i) => i.ruta);
    assert.deepEqual(opciones('Administrador').sort(), todas.sort());
    assert.ok(!opciones('Administrador').includes('/mis-labores'));
  });
  test('el trabajador de campo solo ve su trabajo', () => {
    const r = opciones('Trabajador de Campo');
    assert.ok(r.includes('/mis-labores'));
    assert.ok(!r.includes('/labores'));
    assert.ok(!r.includes('/facturas'));
    assert.ok(!r.includes('/empleados'));
  });
  test('cada rol ve los modulos que la API le autoriza', () => {
    assert.ok(opciones('Tecnico Electronico').includes('/equipos'));
    assert.ok(opciones('Jefe de Inventario').includes('/ordenes'));
    assert.ok(opciones('Responsable SST').includes('/sst/indicadores'));
    assert.ok(opciones('Gerente').includes('/reportes/rentabilidad'));
    assert.ok(!opciones('Supervisor').includes('/nomina'));
    assert.ok(!puede('Gerente', { roles: [] }), 'las opciones solo de administrador no se muestran al gerente');
  });
  test('el cliente ve el menu del portal', () => {
    const r = menuPara({ tipo: 'cliente' }).flatMap((s) => s.items.map((i) => i.ruta));
    assert.ok(r.every((x) => x.startsWith('/portal')));
  });
});

describe('Redirecciones seguras', () => {
  test('solo acepta rutas internas', () => {
    assert.equal(destinoSeguro('/labores/5'), '/labores/5');
    assert.equal(destinoSeguro('/facturas?estado=Pendiente'), '/facturas?estado=Pendiente');
    assert.equal(destinoSeguro('//sitio-malo.com'), null);
    assert.equal(destinoSeguro('https://sitio-malo.com'), null);
    assert.equal(destinoSeguro('/x"><script>'), null);
    assert.equal(destinoSeguro(undefined), null);
  });
});

describe('Servidor del frontend', () => {
  test('muestra el inicio de sesion con encabezados de seguridad', async () => {
    const r = await pedir('/');
    assert.equal(r.status, 200);
    assert.match(await r.text(), /Iniciar sesion/);
    assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
    assert.equal(r.headers.get('x-powered-by'), null);
  });

  test('las paginas internas exigen sesion y recuerdan el destino', async () => {
    const r = await pedir('/labores?estado=Programada');
    assert.equal(r.status, 302);
    assert.equal(r.headers.get('location'), `/?volver=${encodeURIComponent('/labores?estado=Programada')}`);
    const p = await pedir('/portal/facturas');
    assert.equal(p.status, 302);
    assert.equal(p.headers.get('location'), '/portal/login');
  });

  test('el puente /api rechaza peticiones sin sesion', async () => {
    const r = await pedir('/api/empleados');
    assert.equal(r.status, 401);
    assert.match((await r.json()).error, /sesion/i);
  });

  test('el puente /api no expone el inicio de sesion de la API', async () => {
    const r = await pedir('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(r.status, 404);
  });

  test('si la API no responde, el login informa el problema sin caerse', async () => {
    const r = await pedir('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'email=admin%40agroservices.com&password=x'
    });
    assert.equal(r.status, 200);
    assert.match(await r.text(), /No fue posible conectar con el servidor de la API/);
  });

  test('la consulta publica valida el codigo de seguimiento', async () => {
    const r = await pedir('/seguimiento?codigo=<script>');
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.match(html, /tiene 8 letras o numeros/);
    assert.ok(!html.includes('<script>'), 'el codigo se escapa en la pagina');
  });

  test('sirve los archivos del modo sin conexion', async () => {
    for (const ruta of ['/sw.js', '/manifest.webmanifest', '/offline', '/js/campo.js', '/js/vendor/chart.umd.min.js']) {
      assert.equal((await pedir(ruta)).status, 200, ruta);
    }
  });

  test('sin sesion, una ruta desconocida lleva al inicio de sesion', async () => {
    assert.equal((await pedir('/no-existe')).status, 302);
    assert.equal((await pedir('/portal/no-existe')).status, 302);
  });
});

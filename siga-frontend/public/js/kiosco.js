/**
 * Lector de codigos QR para el registro de asistencia (RF19).
 * Usa la camara del equipo con la libreria html5-qrcode; si no hay camara,
 * el supervisor puede escribir el codigo impreso en el carne.
 */
(function () {
  'use strict';
  var resultado = document.getElementById('resultado');
  var ultimos = document.getElementById('ultimos');
  var estado = document.getElementById('estado-camara');
  var ultimoCodigo = '';
  var ultimaVez = 0;
  var ocupado = false;

  function mostrar(clase, html) {
    resultado.className = 'tarjeta resultado-qr ' + clase;
    resultado.innerHTML = html;
  }
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  function registrar(codigo) {
    codigo = String(codigo || '').trim();
    if (!codigo || ocupado) return;
    var ahora = Date.now();
    if (codigo === ultimoCodigo && ahora - ultimaVez < 8000) return; // evita lecturas repetidas
    ultimoCodigo = codigo;
    ultimaVez = ahora;
    ocupado = true;
    window.SIGA.api('POST', '/api/asistencia/registrar', { codigo_qr: codigo }).then(function (r) {
      var hora = (r.tipo === 'Entrada' ? r.registro.hora_entrada : r.registro.hora_salida).slice(11, 16);
      mostrar(r.tipo === 'Entrada' ? 'aviso exito' : 'aviso info',
        '<span>' + r.tipo + ' registrada</span><strong>' + esc(r.empleado.nombre) + '</strong><span class="tenue">' + esc(r.empleado.rol) + ' &middot; ' + hora + '</span>');
      var li = document.createElement('li');
      li.className = 'hecho';
      li.innerHTML = '<strong>' + esc(r.empleado.nombre) + '</strong><div class="tenue pequeno">' + r.tipo + ' a las ' + hora + '</div>';
      ultimos.insertBefore(li, ultimos.firstChild);
      if (navigator.vibrate) navigator.vibrate(120);
    }).catch(function (e) {
      if (e.estado === 401) return;
      mostrar('aviso error', '<span>No registrado</span><strong>' + esc(codigo) + '</strong><span>' + esc(e.message) + '</span>');
    }).then(function () { ocupado = false; });
  }

  document.getElementById('form-codigo').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var campo = document.getElementById('codigo-manual');
    ultimoCodigo = '';
    registrar(campo.value.toUpperCase());
    campo.value = '';
  });

  if (typeof Html5Qrcode === 'undefined') { estado.textContent = 'El lector no esta disponible: escriba el codigo.'; return; }
  var lector = new Html5Qrcode('lector-video');
  lector.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, registrar, function () { /* sin codigo en el cuadro */ })
    .then(function () { estado.textContent = 'Camara activa. Acerque el codigo QR.'; })
    .catch(function () { estado.textContent = 'No fue posible usar la camara (permiso denegado o equipo sin camara). Escriba el codigo del carne.'; });
})();

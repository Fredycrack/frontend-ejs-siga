/**
 * Lector de codigos QR para el registro de asistencia (RF19).
 * Muestra la camara del equipo (getUserMedia) y analiza cada cuadro con la
 * libreria jsQR. Si no hay camara, el supervisor escribe el codigo impreso
 * en el carne.
 */
(function () {
  'use strict';
  var resultado = document.getElementById('resultado');
  var ultimos = document.getElementById('ultimos');
  var estado = document.getElementById('estado-camara');
  var zona = document.getElementById('lector-video');
  var ultimoCodigo = '';
  var ultimaVez = 0;
  var ocupado = false;

  function mostrar(clase, html) {
    resultado.className = 'tarjeta resultado-qr ' + clase;
    resultado.innerHTML = html;
  }
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  // 14:05 -> 2:05 p. m. (mismo formato del resto de la interfaz)
  function hora12(hhmm) {
    var p = hhmm.split(':');
    var h = Number(p[0]);
    return (h % 12 || 12) + ':' + p[1] + (h < 12 ? ' a. m.' : ' p. m.');
  }

  function registrar(codigo) {
    codigo = String(codigo || '').trim();
    if (!codigo || ocupado) return;
    var ahora = Date.now();
    // Mientras el mismo carne siga frente a la camara no se vuelve a registrar
    // (la API exige al menos un minuto entre la entrada y la salida)
    if (codigo === ultimoCodigo && ahora - ultimaVez < 60000) return;
    ultimoCodigo = codigo;
    ultimaVez = ahora;
    ocupado = true;
    window.SIGA.api('POST', '/api/asistencia/registrar', { codigo_qr: codigo }).then(function (r) {
      var hora = hora12((r.tipo === 'Entrada' ? r.registro.hora_entrada : r.registro.hora_salida).slice(11, 16));
      mostrar(r.tipo === 'Entrada' ? 'aviso exito' : 'aviso info',
        '<span>' + r.tipo + ' registrada</span><strong>' + esc(r.empleado.nombre) + '</strong><span class="tenue">' + esc(r.empleado.rol) + ' &middot; ' + hora + '</span>');
      var li = document.createElement('li');
      li.className = 'hecho';
      li.innerHTML = '<strong>' + esc(r.empleado.nombre) + '</strong><div class="tenue pequeno">' + r.tipo + ' a las ' + hora + '</div>';
      ultimos.insertBefore(li, ultimos.firstChild);
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

  // ---------- Camara ----------
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof jsQR === 'undefined') {
    estado.textContent = 'Este equipo no permite usar la camara: escriba el codigo del carne.';
    return;
  }
  var video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.muted = true;
  zona.appendChild(video);
  var marco = document.createElement('div');
  marco.className = 'marco-qr';
  zona.appendChild(marco);
  var lienzo = document.createElement('canvas');
  var ctx = lienzo.getContext('2d', { willReadFrequently: true });

  function analizar() {
    if (video.readyState === video.HAVE_ENOUGH_DATA && !ocupado) {
      // Se reduce el cuadro para analizarlo rapido aun en equipos sencillos
      var escala = Math.min(1, 640 / video.videoWidth);
      lienzo.width = Math.round(video.videoWidth * escala);
      lienzo.height = Math.round(video.videoHeight * escala);
      ctx.drawImage(video, 0, 0, lienzo.width, lienzo.height);
      var img = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
      var codigo = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (codigo && codigo.data) registrar(codigo.data);
    }
    setTimeout(analizar, 250);
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    .then(function (flujo) {
      video.srcObject = flujo;
      return video.play();
    })
    .then(function () {
      estado.textContent = 'Camara activa. Acerque el codigo QR del carne.';
      analizar();
    })
    .catch(function () {
      estado.textContent = 'No fue posible usar la camara (permiso denegado o equipo sin camara). Escriba el codigo del carne.';
    });

  // Al salir de la pagina se apaga la camara
  window.addEventListener('pagehide', function () {
    if (video.srcObject) video.srcObject.getTracks().forEach(function (t) { t.stop(); });
  });
})();

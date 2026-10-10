/**
 * SIGA - Registro de labores en campo (RF08, RF09, RF10 y RF12).
 * - Inicio y finalizacion con la ubicacion GPS del celular.
 * - Evidencia fotografica reducida en el navegador antes de enviarla.
 * - Sin conexion: las acciones quedan en la cola del dispositivo
 *   (cola-offline.js) y se sincronizan en orden al volver la senal.
 */
(function () {
  'use strict';
  var C = window.ColaOffline;
  var usuario = document.body.dataset.usuario;
  var lista = document.getElementById('lista-labores');
  var cola = C.crear({
    nombre: 'labores',
    endpoint: '/api/labores/sincronizar',
    campo: 'id_labor',
    ruta: function (tipo, id) { return '/api/labores/' + id + '/' + (tipo === 'evidencia' ? 'evidencias' : tipo); }
  });

  // ---------- Ubicacion y fotografia ----------
  function ubicacion(espera) {
    return new Promise(function (ok) {
      if (!navigator.geolocation) { ok({}); return; }
      navigator.geolocation.getCurrentPosition(function (p) {
        ok({ latitud: Number(p.coords.latitude.toFixed(7)), longitud: Number(p.coords.longitude.toFixed(7)) });
      }, function () { ok({}); }, { enableHighAccuracy: true, timeout: espera || 15000, maximumAge: 60000 });
    });
  }

  function comprimir(archivo) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(archivo);
      var img = new Image();
      img.onload = function () {
        var escala = Math.min(1, 1280 / Math.max(img.width, img.height));
        var lienzo = document.createElement('canvas');
        lienzo.width = Math.round(img.width * escala);
        lienzo.height = Math.round(img.height * escala);
        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
        URL.revokeObjectURL(url);
        var calidad = 0.75;
        var datos = lienzo.toDataURL('image/jpeg', calidad);
        while (datos.length > 2500000 && calidad > 0.3) { calidad -= 0.15; datos = lienzo.toDataURL('image/jpeg', calidad); }
        ok(datos);
      };
      img.onerror = function () { URL.revokeObjectURL(url); mal(new Error('No fue posible leer la imagen')); };
      img.src = url;
    });
  }

  // ---------- Lista de labores del trabajador ----------
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var COLOR = { Programada: 'ambar', 'En proceso': 'azul', Finalizada: 'verde', Cancelada: 'rojo' };
  var BORDE = { Programada: '#e09a1a', 'En proceso': 'var(--azul)', Finalizada: 'var(--verde)' };
  function hora(h) {
    if (!h) return '';
    var p = h.split(':');
    var n = Number(p[0]);
    return (n % 12 || 12) + ':' + p[1] + (n < 12 ? ' a. m.' : ' p. m.');
  }
  function fecha(f) { var p = f.split('-'); return Number(p[2]) + ' ' + MESES[Number(p[1]) - 1]; }

  function tarjeta(l) {
    var esc = C.esc;
    var botones = '';
    if (l.estado === 'Programada') botones = '<button class="btn btn-primario btn-grande" data-operar="iniciar" data-labor="' + l.id_labor + '">Iniciar labor</button>';
    if (l.estado === 'En proceso') {
      botones = '<button class="btn btn-grande" data-operar="evidencia" data-labor="' + l.id_labor + '">Tomar foto</button>' +
        '<button class="btn btn-primario btn-grande" data-operar="finalizar" data-labor="' + l.id_labor + '">Finalizar</button>';
    }
    return '<article class="tarjeta labor-campo" style="border-left-color:' + (BORDE[l.estado] || 'var(--borde)') + '">' +
      '<div class="tarjeta-cabeza"><h2>' + esc(l.tipo_labor) + '</h2><span class="etiqueta ' + (COLOR[l.estado] || 'gris') + '">' + esc(l.estado) + '</span></div>' +
      '<dl class="ficha">' +
      '<dt>Cuando</dt><dd>' + fecha(l.fecha_programada) + (l.hora_programada ? ', ' + hora(l.hora_programada) : '') + '</dd>' +
      '<dt>Donde</dt><dd>' + esc(l.ubicacion) + ' &middot; ' + esc(l.nombre_cliente) + '</dd>' +
      (l.descripcion ? '<dt>Instrucciones</dt><dd>' + esc(l.descripcion) + '</dd>' : '') +
      (l.estado !== 'Programada' ? '<dt>Evidencias</dt><dd>' + l.evidencias + ' foto(s)</dd>' : '') +
      (l.porcentaje_cumplimiento !== null && l.porcentaje_cumplimiento !== undefined ? '<dt>Cumplimiento</dt><dd>' + l.porcentaje_cumplimiento + ' %</dd>' : '') +
      '</dl>' +
      (l.pendiente ? '<div class="aviso advertencia" style="margin:.8rem 0 0">Registro guardado en el celular, pendiente de enviar.</div>' : '') +
      (botones ? '<div class="botones">' + botones + '</div>' : '') +
      (navigator.onLine ? '<div style="margin-top:.6rem"><a class="pequeno" href="/labores/' + l.id_labor + '">Ver detalle y evidencias</a></div>' : '') +
      '</article>';
  }

  function dibujar() {
    if (!lista) return Promise.resolve();
    var datos = C.datosPagina('siga-labores-' + usuario) || { labores: [], hoy: '', generado: '' };
    var labores = datos.labores.map(function (l) { return Object.assign({}, l); });
    return cola.pendientes().catch(function () { return []; }).then(function (pend) {
      // Las acciones guardadas en el celular se reflejan en la lista
      pend.forEach(function (a) {
        var l = labores.find(function (x) { return x.id_labor === a.id; });
        if (!l) return;
        l.pendiente = true;
        if (a.tipo === 'iniciar') l.estado = 'En proceso';
        if (a.tipo === 'evidencia') l.evidencias = Number(l.evidencias || 0) + 1;
        if (a.tipo === 'finalizar') { l.estado = 'Finalizada'; l.porcentaje_cumplimiento = a.datos.porcentaje_cumplimiento; }
      });
      var grupos = [
        ['En proceso', labores.filter(function (l) { return l.estado === 'En proceso'; })],
        ['Para hoy', labores.filter(function (l) { return l.estado === 'Programada' && l.fecha_programada <= datos.hoy; })],
        ['Proximas', labores.filter(function (l) { return l.estado === 'Programada' && l.fecha_programada > datos.hoy; })],
        ['Finalizadas en los ultimos 7 dias', labores.filter(function (l) { return l.estado === 'Finalizada'; }).reverse()]
      ];
      var html = grupos.filter(function (g) { return g[1].length; }).map(function (g) {
        return '<h2 style="margin:1.2rem 0 .6rem">' + g[0] + ' (' + g[1].length + ')</h2>' + g[1].map(tarjeta).join('');
      }).join('');
      lista.innerHTML = html || '<div class="tarjeta vacio">No tiene labores asignadas. Consulte con su supervisor.</div>';
      var nota = document.getElementById('nota-datos');
      if (nota && datos.generado) nota.textContent = 'Informacion actualizada el ' + datos.generado.replace('T', ' ').slice(0, 16);
    });
  }

  // Sin conexion: en la lista se redibuja; en el detalle se bloquean los botones
  function despuesSinConexion() {
    if (lista) dibujar();
    else document.querySelectorAll('[data-operar]').forEach(function (b) { b.disabled = true; });
  }

  // ---------- Botones y dialogos ----------
  var laborActual = null;
  var fotoComprimida = null;

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-operar]');
    if (!b) return;
    laborActual = b.dataset.labor;
    var tipo = b.dataset.operar;
    if (tipo === 'iniciar') {
      window.SIGA.confirmar('Se registrara la hora actual y su ubicacion GPS como inicio de la labor.', 'Iniciar labor', 'Iniciar').then(function (ok) {
        if (!ok) return;
        var texto = b.textContent;
        b.disabled = true;
        b.textContent = 'Obteniendo ubicacion...';
        ubicacion().then(function (gps) {
          return cola.ejecutar('iniciar', laborActual, { latitud: gps.latitud, longitud: gps.longitud })
            .then(function (r) { C.terminar(r, gps.latitud === undefined ? 'No se obtuvo la ubicacion GPS' : null, despuesSinConexion); });
        }).catch(function (e) { window.SIGA.notificar(e.message, 'error'); b.disabled = false; b.textContent = texto; });
      });
      return;
    }
    fotoComprimida = null;
    var d = document.getElementById(tipo === 'evidencia' ? 'dlg-evidencia' : 'dlg-finalizar');
    var form = d.querySelector('form');
    form.reset();
    form.querySelector('.aviso-formulario').classList.add('oculto');
    var vista = document.getElementById('vista-foto');
    if (vista) { vista.classList.add('oculto'); vista.removeAttribute('src'); }
    var salida = document.getElementById('valor-porcentaje');
    if (salida) salida.textContent = '100';
    d.showModal();
  });

  var campoFoto = document.getElementById('foto');
  if (campoFoto) {
    campoFoto.addEventListener('change', function () {
      fotoComprimida = null;
      var archivo = campoFoto.files[0];
      if (!archivo) return;
      comprimir(archivo).then(function (datos) {
        fotoComprimida = datos;
        var vista = document.getElementById('vista-foto');
        vista.src = datos;
        vista.classList.remove('oculto');
      }).catch(function (e) { window.SIGA.notificar(e.message, 'error'); });
    });
  }

  function enviarDialogo(form, tipo, datos) {
    var boton = form.querySelector('[type=submit]');
    var texto = boton.textContent;
    boton.disabled = true;
    boton.textContent = 'Guardando...';
    ubicacion(8000).then(function (gps) {
      datos.latitud = gps.latitud;
      datos.longitud = gps.longitud;
      return cola.ejecutar(tipo, laborActual, datos).then(function (r) { C.terminar(r, null, despuesSinConexion); });
    }).catch(function (e) { C.error(form, e.message); }).then(function () {
      boton.disabled = false;
      boton.textContent = texto;
    });
  }

  var formEvidencia = document.getElementById('form-evidencia');
  if (formEvidencia) {
    formEvidencia.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!fotoComprimida) { C.error(formEvidencia, 'Tome o seleccione una fotografia'); return; }
      enviarDialogo(formEvidencia, 'evidencia', { imagen: fotoComprimida, comentario: formEvidencia.elements.comentario.value.trim() });
    });
  }

  var formFin = document.getElementById('form-finalizar');
  if (formFin) {
    var rango = formFin.elements.porcentaje_cumplimiento;
    rango.addEventListener('input', function () { document.getElementById('valor-porcentaje').textContent = rango.value; });
    formFin.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var resultado = formFin.elements.resultado.value.trim();
      if (!resultado) { C.error(formFin, 'Describa el resultado de la labor'); return; }
      enviarDialogo(formFin, 'finalizar', { resultado: resultado, porcentaje_cumplimiento: Number(rango.value) });
    });
  }

  window.addEventListener('offline', function () { if (lista) dibujar(); });

  dibujar().then(cola.contador).then(function (pend) {
    if (pend && pend.length && navigator.onLine) cola.sincronizar();
  });
})();

/**
 * SIGA - funciones comunes de la interfaz.
 * - Formularios con data-api: se envian como JSON a la API (a traves del
 *   servidor del frontend, que agrega el token de la sesion).
 * - Botones con data-accion: ejecutan una operacion, con confirmacion opcional.
 * - Dialogos, menu lateral, notificaciones y estado de la conexion.
 */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // ---------- Notificaciones ----------
  function notificar(texto, tipo) {
    var zona = $('#notificaciones');
    if (!zona) { alert(texto); return; }
    var n = document.createElement('div');
    n.className = 'notificacion ' + (tipo || '');
    n.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    n.textContent = texto;
    zona.appendChild(n);
    setTimeout(function () { n.remove(); }, tipo === 'error' ? 7000 : 4500);
  }

  // Mensaje que se muestra despues de recargar o cambiar de pagina
  function flash(texto, tipo) {
    try { sessionStorage.setItem('siga-flash', JSON.stringify({ texto: texto, tipo: tipo || '' })); } catch (e) { /* sin almacenamiento */ }
  }
  function mostrarFlash() {
    try {
      var f = JSON.parse(sessionStorage.getItem('siga-flash') || 'null');
      sessionStorage.removeItem('siga-flash');
      if (f) notificar(f.texto, f.tipo);
    } catch (e) { /* sin almacenamiento */ }
  }

  // ---------- Llamadas a la API ----------
  function rutaLogin() {
    return (location.pathname.indexOf('/portal') === 0 ? '/portal/login' : '/') +
      '?volver=' + encodeURIComponent(location.pathname + location.search);
  }

  function api(metodo, ruta, cuerpo) {
    return fetch(ruta, {
      method: metodo,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-SIGA': '1' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (datos) {
        if (r.status === 401) {
          flash('Su sesion expiro. Inicie sesion de nuevo para continuar.', 'advertencia');
          location.href = rutaLogin();
          var e401 = new Error('Sesion expirada');
          e401.estado = 401;
          throw e401;
        }
        if (!r.ok) {
          var e = new Error(datos.error || ('Error ' + r.status));
          e.estado = r.status;
          throw e;
        }
        return datos;
      });
    });
  }

  // ---------- Confirmacion ----------
  function confirmar(texto, titulo, boton) {
    var d = $('#dialogo-confirmar');
    if (!d || !d.showModal) return Promise.resolve(window.confirm(texto));
    $('#confirmar-titulo').textContent = titulo || 'Confirmar';
    $('#confirmar-texto').textContent = texto;
    var si = $('#confirmar-si');
    si.textContent = boton || 'Confirmar';
    return new Promise(function (resolver) {
      var listo = false;
      function terminar(v) {
        if (listo) return;
        listo = true;
        si.removeEventListener('click', aceptar);
        d.removeEventListener('close', cancelar);
        if (d.open) d.close();
        resolver(v);
      }
      function aceptar() { terminar(true); }
      function cancelar() { terminar(false); }
      si.addEventListener('click', aceptar);
      d.addEventListener('close', cancelar);
      d.showModal();
    });
  }

  // ---------- Formularios ----------
  function datosFormulario(form) {
    var datos = {};
    $$('input, select, textarea', form).forEach(function (el) {
      if (!el.name || el.disabled || el.type === 'submit' || el.type === 'button' || el.type === 'file') return;
      if (el.name.slice(-2) === '[]') {
        var k = el.name.slice(0, -2);
        if (!datos[k]) datos[k] = [];
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
        if (el.multiple) {
          $$('option', el).forEach(function (o) { if (o.selected) datos[k].push(o.value); });
        } else if (el.value !== '') datos[k].push(el.value);
        return;
      }
      if (el.type === 'checkbox') { datos[el.name] = el.checked ? 1 : 0; return; }
      if (el.type === 'radio') { if (el.checked) datos[el.name] = el.value; return; }
      if (el.hasAttribute('data-omitir-vacio') && el.value === '') return;
      if (el.type === 'datetime-local' && el.value) { datos[el.name] = el.value.replace('T', ' ') + (el.value.length === 16 ? ':00' : ''); return; }
      datos[el.name] = el.value.trim ? el.value.trim() : el.value;
    });
    return datos;
  }

  function mostrarError(form, texto) {
    var aviso = $('.aviso-formulario', form);
    if (!aviso) { notificar(texto, 'error'); return; }
    aviso.textContent = texto;
    aviso.classList.remove('oculto');
    aviso.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Reemplaza {id} con la respuesta de la API y {campo} con los datos enviados
  function destino(plantilla, r, datos) {
    return plantilla.replace(/\{(\w+)\}/g, function (m, k) {
      if (r && r[k] !== undefined) return encodeURIComponent(r[k]);
      if (datos && datos[k] !== undefined) return encodeURIComponent(datos[k]);
      return '';
    });
  }

  function terminarExito(r, elemento, datos) {
    var texto = (r && r.message) || 'Operacion realizada correctamente';
    if (r && r.advertencia) texto += '. ' + r.advertencia;
    if (r && r.envio) texto += '. ' + r.envio;
    flash(texto, r && r.advertencia ? 'advertencia' : '');
    if (elemento.dataset.volver) location.href = destino(elemento.dataset.volver, r, datos);
    else location.reload();
  }

  document.addEventListener('submit', function (ev) {
    var form = ev.target.closest('form[data-api]');
    if (!form) return;
    ev.preventDefault();
    var boton = $('[type=submit]', form);
    var aviso = $('.aviso-formulario', form);
    if (aviso) aviso.classList.add('oculto');
    var distintos = $$('[data-igual-a]', form).filter(function (el) {
      return el.value !== form.elements[el.dataset.igualA].value;
    });
    if (distintos.length) { mostrarError(form, distintos[0].dataset.mensaje || 'Los valores no coinciden'); return; }
    var datos = datosFormulario(form);
    // Las paginas pueden completar o validar los datos antes del envio
    var evento = new CustomEvent('siga:antes-de-enviar', { detail: { datos: datos }, cancelable: true });
    if (!form.dispatchEvent(evento)) return;
    if (evento.detail.error) { mostrarError(form, evento.detail.error); return; }
    var pregunta = form.dataset.confirmar ? confirmar(form.dataset.confirmar, form.dataset.tituloConfirmar) : Promise.resolve(true);
    pregunta.then(function (ok) {
      if (!ok) return;
      if (boton) { boton.disabled = true; boton.dataset.texto = boton.textContent; boton.textContent = 'Guardando...'; }
      api(form.dataset.metodo || 'POST', form.dataset.api, evento.detail.datos)
        .then(function (r) { terminarExito(r, form, evento.detail.datos); })
        .catch(function (e) {
          if (e.estado === 401) return;
          mostrarError(form, e.message);
          if (boton) { boton.disabled = false; boton.textContent = boton.dataset.texto; }
        });
    });
  });

  // ---------- Botones de accion ----------
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-accion]');
    if (!b) return;
    ev.preventDefault();
    var pregunta = b.dataset.confirmar
      ? confirmar(b.dataset.confirmar, b.dataset.tituloConfirmar, b.textContent.trim())
      : Promise.resolve(true);
    pregunta.then(function (ok) {
      if (!ok) return;
      b.disabled = true;
      api(b.dataset.metodo || 'POST', b.dataset.accion, b.dataset.cuerpo ? JSON.parse(b.dataset.cuerpo) : undefined)
        .then(function (r) { terminarExito(r, b); })
        .catch(function (e) { if (e.estado !== 401) notificar(e.message, 'error'); b.disabled = false; });
    });
  });

  // ---------- Dialogos ----------
  document.addEventListener('click', function (ev) {
    var abrir = ev.target.closest('[data-abrir]');
    if (abrir) {
      var d = document.getElementById(abrir.dataset.abrir);
      if (!d) return;
      var form = $('form', d);
      if (form) {
        form.reset();
        if (abrir.dataset.api) form.dataset.api = abrir.dataset.api;
        var aviso = $('.aviso-formulario', form);
        if (aviso) aviso.classList.add('oculto');
        if (abrir.dataset.valores) {
          var valores = JSON.parse(abrir.dataset.valores);
          Object.keys(valores).forEach(function (k) {
            var el = form.elements[k];
            if (el) { if (el.type === 'checkbox') el.checked = !!valores[k]; else el.value = valores[k] === null ? '' : valores[k]; }
            var texto = $('[data-texto="' + k + '"]', d);
            if (texto) texto.textContent = valores[k];
          });
        }
      }
      d.showModal();
      var primero = $('input:not([type=hidden]), select, textarea', d);
      if (primero) primero.focus();
      return;
    }
    var cerrar = ev.target.closest('[data-cerrar]');
    if (cerrar) { var dlg = cerrar.closest('dialog'); if (dlg) dlg.close(); return; }
    if (ev.target.tagName === 'DIALOG') ev.target.close();
  });

  // Ampliar imagenes de evidencia
  document.addEventListener('click', function (ev) {
    var img = ev.target.closest('img[data-ampliar]');
    if (!img) return;
    var d = document.createElement('dialog');
    d.style.width = 'min(960px, calc(100vw - 2rem))';
    d.innerHTML = '<div class="dialogo-cabeza"><h2>Evidencia</h2><button class="cerrar" type="button" data-cerrar>&times;</button></div>';
    var grande = document.createElement('img');
    grande.src = img.src;
    grande.alt = img.alt;
    grande.style.cssText = 'width:100%;display:block';
    d.appendChild(grande);
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.showModal();
  });

  // ---------- Menu lateral, menu de usuario y navegacion ----------
  document.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-menu]')) { document.body.classList.toggle('menu-abierto'); return; }
    if (document.body.classList.contains('menu-abierto') && !ev.target.closest('.lateral')) {
      document.body.classList.remove('menu-abierto');
    }
    var desp = ev.target.closest('[data-desplegable]');
    $$('.desplegable.abierto').forEach(function (m) {
      if (!desp || m.id !== desp.dataset.desplegable) m.classList.remove('abierto');
    });
    if (desp) document.getElementById(desp.dataset.desplegable).classList.toggle('abierto');
    if (ev.target.closest('[data-atras]')) history.back();
    if (ev.target.closest('[data-imprimir]')) window.print();
  });

  // Advertir si quedan registros sin sincronizar al cerrar sesion
  document.addEventListener('click', function (ev) {
    var salir = ev.target.closest('[data-salir]');
    if (!salir) return;
    // La pagina guardada para el modo sin conexion contiene datos del usuario
    if (window.caches) caches.delete('siga-paginas');
    var n = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf('siga-pendientes-') === 0) n += Number(localStorage.getItem(k) || 0);
      }
    } catch (e) { n = 0; }
    if (n > 0) {
      ev.preventDefault();
      confirmar('Tiene ' + n + ' registro(s) sin sincronizar. Si cierra la sesion se enviaran la proxima vez que ingrese en este dispositivo. Desea salir?', 'Registros pendientes', 'Salir')
        .then(function (ok) { if (ok) location.href = salir.href; });
    }
  });

  // Copiar el texto de la opcion elegida a otro campo (si esta vacio o se copio antes)
  document.addEventListener('change', function (ev) {
    var sel = ev.target.closest('select[data-copiar-texto]');
    if (!sel || !sel.form) return;
    var destinoCampo = sel.form.elements[sel.dataset.copiarTexto];
    var opcion = sel.options[sel.selectedIndex];
    if (destinoCampo && opcion && opcion.value && (!destinoCampo.value || destinoCampo.dataset.copiado === '1')) {
      destinoCampo.value = opcion.textContent.trim();
      destinoCampo.dataset.copiado = '1';
    }
  });

  // Llenar latitud y longitud con la ubicacion del dispositivo
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-gps]');
    if (!b) return;
    ev.preventDefault();
    var campos = b.dataset.gps.split(',');
    var form = b.closest('form');
    if (!navigator.geolocation) { notificar('Este dispositivo no permite obtener la ubicacion', 'error'); return; }
    b.disabled = true;
    navigator.geolocation.getCurrentPosition(function (p) {
      form.elements[campos[0]].value = p.coords.latitude.toFixed(7);
      form.elements[campos[1]].value = p.coords.longitude.toFixed(7);
      notificar('Ubicacion obtenida (precision de ' + Math.round(p.coords.accuracy) + ' m)');
      b.disabled = false;
    }, function () {
      notificar('No fue posible obtener la ubicacion. Revise el permiso de ubicacion del navegador.', 'error');
      b.disabled = false;
    }, { enableHighAccuracy: true, timeout: 15000 });
  });

  // Los filtros con data-auto se aplican al cambiar
  document.addEventListener('change', function (ev) {
    if (ev.target.matches('[data-auto]')) ev.target.form.submit();
  });

  // ---------- Conexion ----------
  function estadoRed() { document.body.classList.toggle('sin-conexion', !navigator.onLine); }
  window.addEventListener('online', estadoRed);
  window.addEventListener('offline', estadoRed);

  function pesos(v) { return '$ ' + Math.round(Number(v) || 0).toLocaleString('es-CO'); }

  window.SIGA = { api: api, notificar: notificar, confirmar: confirmar, flash: flash, pesos: pesos, datosFormulario: datosFormulario };

  document.addEventListener('DOMContentLoaded', function () {
    estadoRed();
    mostrarFlash();
    if ('serviceWorker' in navigator && document.body.dataset.usuario) {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* sin trabajo en segundo plano */ });
    }
  });
})();

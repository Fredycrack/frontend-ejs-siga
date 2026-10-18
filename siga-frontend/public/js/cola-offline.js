/**
 * SIGA - Cola de registros sin conexion (RNF10).
 * Guarda en el dispositivo (IndexedDB) las operaciones hechas sin internet
 * y las envia en orden a la API cuando vuelve la conexion.
 * La usan "Mis labores" del trabajador de campo (RF12) y "Mi taller" del
 * tecnico electronico (RF18).
 *
 *   var cola = ColaOffline.crear({
 *     nombre: 'labores',                         // nombre de la cola
 *     endpoint: '/api/labores/sincronizar',      // ruta de sincronizacion de la API
 *     campo: 'id_labor',                         // nombre del identificador en cada accion
 *     ruta: function (tipo, id) { ... }          // ruta para ejecutar la accion en linea
 *   });
 *   cola.ejecutar('iniciar', 15, { latitud: 4.7 }).then(function (r) { r.enLinea ... });
 */
(function () {
  'use strict';
  var BD = 'siga-offline';
  var ALMACEN = 'pendientes';
  var usuario = document.body.dataset.usuario;

  function abrirBD() {
    return new Promise(function (ok, mal) {
      if (!window.indexedDB) { mal(new Error('Este navegador no permite guardar registros sin conexion')); return; }
      var r = indexedDB.open(BD, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(ALMACEN, { keyPath: 'id_local' }); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { mal(r.error); };
    });
  }

  function operacion(modo, fn) {
    return abrirBD().then(function (bd) {
      return new Promise(function (ok, mal) {
        var t = bd.transaction(ALMACEN, modo);
        var peticion = fn(t.objectStore(ALMACEN));
        t.oncomplete = function () { ok(peticion && peticion.result); bd.close(); };
        t.onerror = function () { mal(t.error); bd.close(); };
      });
    });
  }

  function crear(op) {
    var sincronizando = false;
    var claveContador = 'siga-pendientes-' + op.nombre;

    function pendientes() {
      return operacion('readonly', function (s) { return s.getAll(); }).then(function (todas) {
        return (todas || [])
          .filter(function (a) { return a.cola === op.nombre && String(a.usuario) === String(usuario); })
          .sort(function (a, b) { return a.fecha_hora < b.fecha_hora ? -1 : 1; });
      });
    }

    function guardar(accion) { return operacion('readwrite', function (s) { return s.put(accion); }); }
    function borrar(ids) { return operacion('readwrite', function (s) { ids.forEach(function (id) { s.delete(id); }); }); }

    function contador() {
      return pendientes().then(function (cola) {
        try { localStorage.setItem(claveContador, String(cola.length)); } catch (e) { /* sin almacenamiento */ }
        var caja = document.getElementById('caja-pendientes');
        if (caja) {
          caja.classList.toggle('oculto', !cola.length);
          document.getElementById('num-pendientes').textContent = cola.length;
        }
        return cola;
      }).catch(function () { return []; });
    }

    function encolar(tipo, id, datos) {
      var accion = {
        id_local: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        cola: op.nombre, usuario: usuario, tipo: tipo, id: Number(id),
        fecha_hora: new Date().toISOString(), datos: datos
      };
      return guardar(accion).then(function () { contador(); return { enLinea: false }; });
    }

    // Ejecuta en linea si hay conexion; si no, guarda la accion para despues
    function ejecutar(tipo, id, datos) {
      return pendientes().catch(function () { return []; }).then(function (cola) {
        if (!navigator.onLine) return encolar(tipo, id, datos);
        // Si ya hay registros pendientes, este va al final para respetar el orden
        if (cola.length) return encolar(tipo, id, datos).then(function (r) { sincronizar(); return r; });
        return window.SIGA.api(op.metodo ? op.metodo(tipo) : 'POST', op.ruta(tipo, id), datos)
          .then(function (r) { return { enLinea: true, respuesta: r }; })
          .catch(function (e) {
            if (e.estado) throw e;            // la API rechazo la operacion: se informa
            return encolar(tipo, id, datos);  // fallo la red: se guarda para despues
          });
      });
    }

    function estadoBoton(activo) {
      var b = document.getElementById('btn-sincronizar');
      if (b) { b.disabled = activo; b.textContent = activo ? 'Sincronizando...' : 'Sincronizar ahora'; }
    }

    // Envia los registros pendientes en lotes de hasta 5 MB
    function sincronizar(manual) {
      if (sincronizando) return Promise.resolve();
      if (!navigator.onLine) {
        if (manual) window.SIGA.notificar('Aun no hay conexion. Se sincronizara automaticamente al recuperar la senal.', 'advertencia');
        return Promise.resolve();
      }
      // Se marca antes de leer la cola: dos eventos seguidos (por ejemplo "online"
      // y el boton) no deben enviar dos veces los mismos registros
      sincronizando = true;
      return pendientes().then(function (cola) {
        if (!cola.length) {
          sincronizando = false;
          if (manual) window.SIGA.notificar('No hay registros pendientes');
          return null;
        }
        estadoBoton(true);
        var lotes = [];
        var actual = [];
        var tamano = 0;
        cola.forEach(function (a) {
          var t = JSON.stringify(a).length;
          if (actual.length && tamano + t > 5000000) { lotes.push(actual); actual = []; tamano = 0; }
          actual.push(a);
          tamano += t;
        });
        if (actual.length) lotes.push(actual);
        var enviados = 0;
        var errores = [];
        return lotes.reduce(function (p, lote) {
          return p.then(function () {
            return window.SIGA.api('POST', op.endpoint, {
              acciones: lote.map(function (a) {
                var x = { id_local: a.id_local, tipo: a.tipo, fecha_hora: a.fecha_hora, datos: a.datos };
                x[op.campo] = a.id;
                return x;
              })
            }).then(function (r) {
              r.resultados.forEach(function (x) { if (x.ok) enviados += 1; else errores.push(x.error); });
              return borrar(r.resultados.map(function (x) { return x.id_local; }));
            });
          });
        }, Promise.resolve()).then(function () {
          var texto = enviados + ' registro(s) sincronizado(s) con el servidor';
          if (errores.length) texto += '. ' + errores.length + ' no se pudieron aplicar: ' + errores.join('; ');
          window.SIGA.flash(texto, errores.length ? 'advertencia' : '');
          location.reload();
        }).catch(function (e) {
          if (e.estado !== 401) window.SIGA.notificar('No fue posible sincronizar: ' + e.message, 'error');
        }).then(function () {
          sincronizando = false;
          estadoBoton(false);
          contador();
        });
      }).catch(function (e) { sincronizando = false; window.SIGA.notificar(e.message, 'error'); });
    }

    var boton = document.getElementById('btn-sincronizar');
    if (boton) boton.addEventListener('click', function () { sincronizar(true); });
    window.addEventListener('online', function () {
      window.SIGA.notificar('Conexion recuperada. Enviando registros pendientes...');
      sincronizar();
    });

    return { ejecutar: ejecutar, sincronizar: sincronizar, pendientes: pendientes, contador: contador };
  }

  // Datos de la pagina guardados en el dispositivo para abrirla sin conexion
  function datosPagina(clave) {
    var nodo = document.getElementById('datos-pagina');
    var incrustado = nodo ? JSON.parse(nodo.textContent) : null;
    var guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(clave) || 'null'); } catch (e) { guardado = null; }
    if (incrustado && (!guardado || incrustado.generado >= guardado.generado)) {
      try { localStorage.setItem(clave, JSON.stringify(incrustado)); } catch (e) { /* almacenamiento lleno */ }
      return incrustado;
    }
    return guardado || incrustado;
  }

  // Mensaje final de una operacion en linea o guardada en el dispositivo
  function terminar(r, aviso, redibujar) {
    if (r.enLinea) {
      var texto = r.respuesta.message || 'Registro guardado';
      if (r.respuesta.advertencia) texto += '. ' + r.respuesta.advertencia;
      else if (aviso) texto += '. ' + aviso;
      window.SIGA.flash(texto, r.respuesta.advertencia || aviso ? 'advertencia' : '');
      location.reload();
      return;
    }
    window.SIGA.notificar('Sin conexion: el registro quedo guardado en este dispositivo y se enviara al recuperar la senal.', 'advertencia');
    document.querySelectorAll('dialog[open]').forEach(function (d) { d.close(); });
    if (redibujar) redibujar();
  }

  function esc(t) {
    return String(t === null || t === undefined ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function mostrarError(form, texto) {
    var aviso = form.querySelector('.aviso-formulario');
    aviso.textContent = texto;
    aviso.classList.remove('oculto');
  }

  window.ColaOffline = { crear: crear, datosPagina: datosPagina, terminar: terminar, esc: esc, error: mostrarError };
})();

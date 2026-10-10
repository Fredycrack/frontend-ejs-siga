/**
 * SIGA - Mi taller: trabajo del tecnico electronico con soporte sin conexion (RF18).
 * Diagnostico y cotizacion (RF14), aprobacion del cliente, repuestos (RF15)
 * y cambios de estado (RF16). Sin senal, las operaciones quedan en la cola del
 * dispositivo y se sincronizan en orden con POST /api/equipos/sincronizar.
 */
(function () {
  'use strict';
  var C = window.ColaOffline;
  var usuario = document.body.dataset.usuario;
  var lista = document.getElementById('lista-equipos');
  var RUTAS = { diagnostico: 'diagnostico', aprobar: 'aprobar-cotizacion', estado: 'estado', repuesto: 'repuestos' };
  var cola = C.crear({
    nombre: 'equipos',
    endpoint: '/api/equipos/sincronizar',
    campo: 'id_equipo',
    metodo: function (tipo) { return tipo === 'repuesto' ? 'POST' : 'PUT'; },
    ruta: function (tipo, id) { return '/api/equipos/' + id + '/' + RUTAS[tipo]; }
  });
  var COLOR = { Recibido: 'ambar', 'En diagnostico': 'azul', 'En proceso': 'azul', Completado: 'verde' };
  var datos = C.datosPagina('siga-taller-' + usuario) || { equipos: [], repuestos: [], generado: '' };

  function pesos(v) { return window.SIGA.pesos(v); }

  function acciones(e) {
    var b = [];
    var id = e.id_equipo;
    if (e.estado === 'Recibido' || e.estado === 'En diagnostico' || e.estado === 'En proceso') {
      b.push('<button class="btn" data-taller="diagnostico" data-equipo="' + id + '">' + (e.diagnostico ? 'Actualizar diagnostico' : 'Registrar diagnostico') + '</button>');
    }
    if (e.valor_cotizacion !== null && e.valor_cotizacion !== undefined && !e.cotizacion_aprobada) {
      b.push('<button class="btn" data-taller="aprobar" data-equipo="' + id + '">Cliente aprobo la cotizacion</button>');
    }
    if (e.estado === 'En diagnostico' || e.estado === 'En proceso') {
      b.push('<button class="btn" data-taller="repuesto" data-equipo="' + id + '">Registrar repuesto</button>');
    }
    if (e.estado === 'En diagnostico' && e.diagnostico && e.cotizacion_aprobada) b.push('<button class="btn btn-primario" data-taller="estado" data-estado="En proceso" data-equipo="' + id + '">Iniciar reparacion</button>');
    if (e.estado === 'En proceso') b.push('<button class="btn btn-primario" data-taller="estado" data-estado="Completado" data-equipo="' + id + '">Marcar como reparado</button>');
    if (e.estado === 'Completado') b.push('<button class="btn btn-primario" data-taller="estado" data-estado="Entregado" data-equipo="' + id + '">Registrar entrega</button>');
    return b.join('');
  }

  function tarjeta(e) {
    var esc = C.esc;
    return '<article class="tarjeta">' +
      '<div class="tarjeta-cabeza"><h2>' + esc(e.tipo_equipo) + ' ' + esc([e.marca, e.modelo].filter(Boolean).join(' ')) + '</h2>' +
      '<span class="etiqueta ' + (COLOR[e.estado] || 'gris') + '">' + esc(e.estado) + '</span></div>' +
      '<dl class="ficha">' +
      '<dt>Codigo</dt><dd class="mono">' + esc(e.codigo_seguimiento) + '</dd>' +
      '<dt>Cliente</dt><dd>' + esc(e.nombre_cliente) + (e.telefono_cliente ? ' &middot; ' + esc(e.telefono_cliente) : '') + '</dd>' +
      '<dt>Problema</dt><dd>' + esc(e.problema_reportado) + '</dd>' +
      (e.diagnostico ? '<dt>Diagnostico</dt><dd>' + esc(e.diagnostico) + '</dd>' : '') +
      (e.valor_cotizacion !== null && e.valor_cotizacion !== undefined ? '<dt>Cotizacion</dt><dd>' + pesos(e.valor_cotizacion) + ' &middot; ' + (e.cotizacion_aprobada ? 'aprobada' : 'por aprobar') + '</dd>' : '') +
      (e.repuestos_pendientes ? '<dt>Repuestos</dt><dd>' + e.repuestos_pendientes + ' registrado(s) sin conexion</dd>' : '') +
      '</dl>' +
      (e.pendiente ? '<div class="aviso advertencia" style="margin:.8rem 0 0">Cambios guardados en este dispositivo, pendientes de enviar.</div>' : '') +
      '<div class="pie-formulario" style="justify-content:flex-start">' + acciones(e) + '</div>' +
      (navigator.onLine ? '<a class="pequeno" href="/equipos/' + e.id_equipo + '">Ver detalle completo</a>' : '') +
      '</article>';
  }

  function dibujar() {
    var equipos = datos.equipos.map(function (e) { return Object.assign({}, e); });
    return cola.pendientes().catch(function () { return []; }).then(function (pend) {
      // Las operaciones guardadas en el dispositivo se reflejan en la lista
      pend.forEach(function (a) {
        var e = equipos.find(function (x) { return x.id_equipo === a.id; });
        if (!e) return;
        e.pendiente = true;
        if (a.tipo === 'diagnostico') {
          e.diagnostico = a.datos.diagnostico;
          e.valor_cotizacion = Number(a.datos.valor_cotizacion);
          if (e.estado === 'Recibido') e.estado = 'En diagnostico';
        }
        if (a.tipo === 'aprobar') e.cotizacion_aprobada = 1;
        if (a.tipo === 'estado') e.estado = a.datos.estado;
        if (a.tipo === 'repuesto') e.repuestos_pendientes = (e.repuestos_pendientes || 0) + 1;
      });
      var visibles = equipos.filter(function (e) { return e.estado !== 'Entregado'; });
      lista.innerHTML = visibles.length ? visibles.map(tarjeta).join('') : '<div class="tarjeta vacio">No tiene equipos pendientes.</div>';
      var nota = document.getElementById('nota-datos');
      if (nota && datos.generado) nota.textContent = 'Informacion actualizada el ' + datos.generado.replace('T', ' ').slice(0, 16);
    });
  }

  var equipoActual = null;
  var buscar = function (id) { return datos.equipos.find(function (x) { return String(x.id_equipo) === String(id); }); };

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-taller]');
    if (!b) return;
    equipoActual = b.dataset.equipo;
    var tipo = b.dataset.taller;
    var e = buscar(equipoActual);
    if (tipo === 'diagnostico') {
      var f = document.getElementById('form-diagnostico');
      f.reset();
      f.querySelector('.aviso-formulario').classList.add('oculto');
      if (e && e.diagnostico) f.elements.diagnostico.value = e.diagnostico;
      if (e && e.valor_cotizacion !== null) f.elements.valor_cotizacion.value = e.valor_cotizacion;
      document.getElementById('dlg-diagnostico').showModal();
      return;
    }
    if (tipo === 'repuesto') {
      var fr = document.getElementById('form-repuesto');
      fr.reset();
      fr.querySelector('.aviso-formulario').classList.add('oculto');
      fr.elements.id_inventario.innerHTML = '<option value="">Seleccione...</option>' + datos.repuestos.map(function (r) {
        return '<option value="' + r.id_inventario + '">' + C.esc(r.nombre_producto) + ' (disponibles: ' + Number(r.cantidad_disponible) + ')</option>';
      }).join('');
      document.getElementById('dlg-repuesto').showModal();
      return;
    }
    var pregunta = tipo === 'aprobar'
      ? 'Confirme que el cliente aprobo la cotizacion de ' + pesos(e ? e.valor_cotizacion : 0) + '.'
      : 'El equipo pasara a estado ' + b.dataset.estado + '.';
    window.SIGA.confirmar(pregunta, b.textContent.trim(), 'Confirmar').then(function (ok) {
      if (!ok) return;
      b.disabled = true;
      cola.ejecutar(tipo, equipoActual, tipo === 'estado' ? { estado: b.dataset.estado } : {})
        .then(function (r) { C.terminar(r, null, dibujar); })
        .catch(function (err) { window.SIGA.notificar(err.message, 'error'); b.disabled = false; });
    });
  });

  function enviar(form, tipo, datosForm) {
    var boton = form.querySelector('[type=submit]');
    boton.disabled = true;
    cola.ejecutar(tipo, equipoActual, datosForm)
      .then(function (r) { C.terminar(r, null, dibujar); })
      .catch(function (err) { C.error(form, err.message); })
      .then(function () { boton.disabled = false; });
  }

  document.getElementById('form-diagnostico').addEventListener('submit', function (ev) {
    ev.preventDefault();
    enviar(ev.target, 'diagnostico', { diagnostico: ev.target.elements.diagnostico.value.trim(), valor_cotizacion: Number(ev.target.elements.valor_cotizacion.value) });
  });
  document.getElementById('form-repuesto').addEventListener('submit', function (ev) {
    ev.preventDefault();
    enviar(ev.target, 'repuesto', { id_inventario: Number(ev.target.elements.id_inventario.value), cantidad: Number(ev.target.elements.cantidad.value) });
  });

  window.addEventListener('offline', dibujar);
  dibujar().then(cola.contador).then(function (pend) {
    if (pend && pend.length && navigator.onLine) cola.sincronizar();
  });
})();

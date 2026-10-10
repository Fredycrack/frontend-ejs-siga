/**
 * Formulario de factura manual: items dinamicos y calculo del IVA (RF33).
 */
(function () {
  'use strict';
  var form = document.getElementById('form-factura');
  var cuerpo = document.querySelector('#items tbody');
  var plantilla = document.getElementById('fila-item');
  var pesos = function (v) { return window.SIGA.pesos(v); };

  function recalcular() {
    var subtotal = 0;
    cuerpo.querySelectorAll('tr').forEach(function (tr) {
      var c = Number(tr.querySelector('[data-campo=cantidad]').value) || 0;
      var v = Number(tr.querySelector('[data-campo=valor_unitario]').value) || 0;
      var s = Math.round(c * v * 100) / 100;
      tr.querySelector('[data-subtotal]').textContent = pesos(s);
      subtotal += s;
    });
    var iva = Math.round(subtotal * (Number(form.elements.porcentaje_iva.value) || 0)) / 100;
    document.getElementById('t-subtotal').textContent = pesos(subtotal);
    document.getElementById('t-iva').textContent = pesos(iva);
    document.getElementById('t-total').textContent = pesos(subtotal + iva);
  }

  function agregar() {
    cuerpo.appendChild(plantilla.content.cloneNode(true));
    recalcular();
  }

  cuerpo.addEventListener('change', function (ev) {
    var sel = ev.target.closest('[data-campo=id_servicio]');
    if (sel && sel.value) {
      var op = sel.options[sel.selectedIndex];
      var tr = sel.closest('tr');
      tr.querySelector('[data-campo=descripcion]').value = op.textContent.trim() + ' (' + op.dataset.unidad.toLowerCase() + ')';
      tr.querySelector('[data-campo=valor_unitario]').value = op.dataset.tarifa;
    }
    recalcular();
  });
  cuerpo.addEventListener('input', recalcular);
  cuerpo.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-quitar]')) { ev.target.closest('tr').remove(); recalcular(); }
  });
  form.elements.porcentaje_iva.addEventListener('input', recalcular);
  document.getElementById('agregar-item').addEventListener('click', agregar);

  // Solo se muestran los contratos del cliente elegido
  form.elements.id_cliente.addEventListener('change', function () {
    var cliente = form.elements.id_cliente.value;
    Array.prototype.forEach.call(form.elements.id_contrato.options, function (o) {
      if (o.value) o.hidden = o.dataset.cliente !== cliente;
    });
    form.elements.id_contrato.value = '';
  });

  // Los items se envian como el arreglo "detalles" que espera la API
  form.addEventListener('siga:antes-de-enviar', function (ev) {
    var detalles = [];
    cuerpo.querySelectorAll('tr').forEach(function (tr) {
      var d = {};
      tr.querySelectorAll('[data-campo]').forEach(function (el) { d[el.dataset.campo] = el.value.trim(); });
      if (!d.id_servicio) delete d.id_servicio;
      detalles.push(d);
    });
    if (!detalles.length) { ev.detail.error = 'Agregue al menos un item a la factura'; return; }
    ev.detail.datos.detalles = detalles;
  });

  agregar();
})();

/**
 * Graficas del tablero gerencial (RF37) con Chart.js.
 * Los datos vienen incrustados en la pagina (script application/json).
 */
(function () {
  'use strict';
  var nodo = document.getElementById('datos-tablero');
  if (!nodo || typeof Chart === 'undefined') return;
  var datos = JSON.parse(nodo.textContent || '{}');
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var etiquetaMes = function (m) { var p = m.split('-'); return MESES[Number(p[1]) - 1] + ' ' + p[0].slice(2); };
  var verde = '#2e7d32';

  Chart.defaults.font.family = '"Segoe UI", system-ui, sans-serif';
  Chart.defaults.color = '#5d6d60';
  Chart.defaults.plugins.legend.display = false;

  var serie = (datos.series && datos.series.facturacion) || [];
  new Chart(document.getElementById('g-facturacion'), {
    type: 'bar',
    data: {
      labels: serie.map(function (s) { return etiquetaMes(s.mes); }),
      datasets: [{ data: serie.map(function (s) { return s.total; }), backgroundColor: verde, borderRadius: 4, maxBarThickness: 46 }]
    },
    options: {
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { callback: function (v) { return '$ ' + (v / 1e6).toLocaleString('es-CO') + ' M'; } } } },
      plugins: { tooltip: { callbacks: { label: function (c) { return window.SIGA.pesos(c.parsed.y); } } } }
    }
  });

  var lab = (datos.series && datos.series.labores) || [];
  new Chart(document.getElementById('g-labores'), {
    type: 'bar',
    data: {
      labels: lab.map(function (s) { return etiquetaMes(s.mes); }),
      datasets: [{ data: lab.map(function (s) { return s.finalizadas; }), backgroundColor: '#81c784', borderRadius: 4, maxBarThickness: 46 }]
    },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
  });

  var eq = datos.equipos || [];
  var colores = { Recibido: '#e09a1a', 'En diagnostico': '#64b5f6', 'En proceso': '#1565c0', Completado: '#66bb6a', Entregado: '#2e7d32' };
  new Chart(document.getElementById('g-equipos'), {
    type: 'doughnut',
    data: {
      labels: eq.map(function (e) { return e.estado; }),
      datasets: [{ data: eq.map(function (e) { return e.total; }), backgroundColor: eq.map(function (e) { return colores[e.estado] || '#90a4ae'; }) }]
    },
    options: { maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom' } } }
  });
})();

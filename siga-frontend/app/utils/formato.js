/**
 * Funciones de formato disponibles en todas las vistas EJS.
 * Las fechas llegan de la API como texto (AAAA-MM-DD o AAAA-MM-DD HH:MM:SS)
 * en hora de Colombia, por eso se formatean sin convertir zonas horarias.
 */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const pesos = (v) => (v === null || v === undefined || v === '')
  ? '—'
  : `$ ${Math.round(Number(v)).toLocaleString('es-CO')}`;

export const numero = (v, decimales = 0) => (v === null || v === undefined || v === '')
  ? '—'
  : Number(v).toLocaleString('es-CO', { maximumFractionDigits: decimales });

export const fecha = (v) => {
  if (!v) return '—';
  const [a, m, d] = String(v).slice(0, 10).split('-');
  return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`;
};

export const hora = (v) => {
  if (!v) return '—';
  const t = String(v).length > 8 ? String(v).slice(11, 16) : String(v).slice(0, 5);
  const [h, mi] = t.split(':').map(Number);
  const h12 = h % 12 || 12;
  return `${h12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`;
};

export const fechaHora = (v) => (v ? `${fecha(v)}, ${hora(v)}` : '—');

export const porcentaje = (v) => (v === null || v === undefined ? '—' : `${numero(v, 1)} %`);

// Clase de color de la etiqueta segun el estado del registro
const COLORES = {
  verde: ['Finalizada', 'Activo', 'Vigente', 'Pagada', 'Completada', 'Completado', 'Entregado', 'Aprobada', 'Recibida', 'Realizada', 'Cerrado', 'Entrada'],
  azul: ['En proceso', 'En diagnostico', 'Pagada parcialmente', 'En seguimiento', 'Salida'],
  ambar: ['Programada', 'Pendiente', 'Recibido', 'Media', 'Abierto', 'Leve'],
  rojo: ['Cancelada', 'Cancelado', 'Inactivo', 'Anulada', 'Rechazada', 'Finalizado', 'Alta', 'Grave', 'Mortal', 'Accidente', 'Vencida'],
  gris: ['Baja', 'Moderado', 'Incidente']
};
export const color = (estado) => Object.keys(COLORES).find((c) => COLORES[c].includes(estado)) || 'gris';

export const hoy = () => new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
export const sumarDias = (n, base = hoy()) => {
  const d = new Date(`${base}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const inicioMes = () => `${hoy().slice(0, 8)}01`;
export const inicioAnio = () => `${hoy().slice(0, 4)}-01-01`;

export const iniciales = (nombre = '') => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

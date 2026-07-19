export const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, hora local

export const isAtrasado = (fechaLimite, estado) => {
  if (!fechaLimite) return false;
  if (['Finalizado', 'Aprobado'].includes(estado)) return false;
  return fechaLimite < today();
};

export const diasRestantes = (fechaLimite) => {
  if (!fechaLimite) return null;
  const diff = new Date(fechaLimite) - new Date(today());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const formatFecha = (fecha) => {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${meses[parseInt(m)-1]} ${y}`;
};

export const formatFechaCorta = (fecha) => {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  return `${parseInt(d)}/${m}`;
};

export const getDiasDelMes = (year, month) => {
  const dias = [];
  const total = new Date(year, month, 0).getDate();
  for (let i = 1; i <= total; i++) {
    const mm = String(month).padStart(2, '0');
    const dd = String(i).padStart(2, '0');
    dias.push(`${year}-${mm}-${dd}`);
  }
  return dias;
};

export const getNombreDia = (fecha) => {
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  return dias[new Date(fecha + 'T12:00:00').getDay()];
};

export const getNombreMes = (month) => {
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return meses[month - 1];
};
export const formatShortDate = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

export const formatDate = (fecha) => {
  if (!fecha) return 'Sin fecha';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
};

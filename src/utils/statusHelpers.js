// Colores de departamento = colores de temple del acero: la secuencia real de
// óxido que toma el acero al calentarse (pajizo -> bronce -> violeta -> azul)
// mapeada a las etapas del pipeline, en vez de un arcoíris arbitrario de Tailwind.
// Urgencias queda en rojo alarma real (una excepción deliberada: una alerta no
// debe competir estéticamente con la paleta, debe leerse como peligro sin ambigüedad).
export const DEPT_COLORS = {
  'Arquitectura': { bg: 'bg-[#D4A017]', text: 'text-[#E8C158]', border: 'border-[#D4A017]/50', light: 'bg-[#D4A017]/10', hex: '#D4A017' },
  'Diseño':       { bg: 'bg-[#B5651D]', text: 'text-[#D68A4C]', border: 'border-[#B5651D]/50', light: 'bg-[#B5651D]/10', hex: '#B5651D' },
  'Obra':         { bg: 'bg-[#A67C3D]', text: 'text-[#C79F5C]', border: 'border-[#A67C3D]/50', light: 'bg-[#A67C3D]/10', hex: '#A67C3D' },
  'Producción':   { bg: 'bg-[#7A4B8C]', text: 'text-[#A97FBC]', border: 'border-[#7A4B8C]/50', light: 'bg-[#7A4B8C]/10', hex: '#7A4B8C' },
  'Instalación':  { bg: 'bg-[#2C6E9E]', text: 'text-[#5FA0CE]', border: 'border-[#2C6E9E]/50', light: 'bg-[#2C6E9E]/10', hex: '#2C6E9E' },
  'Urgencias':    { bg: 'bg-red-600',    text: 'text-red-300',    border: 'border-red-500',    light: 'bg-red-900/40',    hex: '#DC2626' },
};

export const STATUS_COLORS = {
  'No iniciado':       { bg: 'bg-slate-700',   text: 'text-slate-300',  dot: '#6B7280' },
  'En proceso':        { bg: 'bg-blue-700',    text: 'text-blue-200',   dot: '#2563EB' },
  'En revisión':       { bg: 'bg-cyan-700',    text: 'text-cyan-200',   dot: '#0891B2' },
  'Con observaciones': { bg: 'bg-amber-700',   text: 'text-amber-200',  dot: '#D97706' },
  'Pausado':           { bg: 'bg-slate-800',   text: 'text-steel-muted',  dot: '#4B5563' },
  'Urgente':           { bg: 'bg-red-700',     text: 'text-red-200',    dot: '#DC2626' },
  'Atrasado':          { bg: 'bg-red-900',     text: 'text-red-300',    dot: '#991B1B' },
  'Finalizado':        { bg: 'bg-green-800',   text: 'text-green-200',  dot: '#16A34A' },
  'Aprobado':          { bg: 'bg-emerald-700', text: 'text-emerald-200',dot: '#15803D' },
  // Arquitectura states
  'Esperando contrato':        { bg: 'bg-slate-700',   text: 'text-slate-300',  dot: '#6B7280' },
  'Contrato firmado':          { bg: 'bg-blue-700',    text: 'text-blue-200',   dot: '#2563EB' },
  'Aprobado para diseño':      { bg: 'bg-emerald-700', text: 'text-emerald-200',dot: '#15803D' },
  'Listo para producción':     { bg: 'bg-emerald-700', text: 'text-emerald-200',dot: '#15803D' },
  'Listo para instalación':    { bg: 'bg-emerald-700', text: 'text-emerald-200',dot: '#15803D' },
  'Aprobado para fabricación': { bg: 'bg-emerald-700', text: 'text-emerald-200',dot: '#15803D' },
  'En armado':                 { bg: 'bg-orange-700',  text: 'text-orange-200', dot: '#EA580C' },
  'En fabricación':            { bg: 'bg-orange-700',  text: 'text-orange-200', dot: '#EA580C' },
  'En instalación':            { bg: 'bg-green-700',   text: 'text-green-200',  dot: '#16A34A' },
  'Con novedad':               { bg: 'bg-red-700',     text: 'text-red-200',    dot: '#DC2626' },
  'Instalado':                 { bg: 'bg-emerald-700', text: 'text-emerald-200',dot: '#15803D' },
  'Instalación pendiente':     { bg: 'bg-slate-700',   text: 'text-slate-300',  dot: '#6B7280' },
  'Visita agendada':           { bg: 'bg-cyan-700',    text: 'text-cyan-200',   dot: '#0891B2' },
  'Medidas tomadas':           { bg: 'bg-blue-700',    text: 'text-blue-200',   dot: '#2563EB' },
  'Pendiente de diseño':       { bg: 'bg-slate-700',   text: 'text-slate-300',  dot: '#6B7280' },
  'Pendiente de arquitectura': { bg: 'bg-slate-700',   text: 'text-slate-300',  dot: '#6B7280' },
  'Modelado 3D en proceso':    { bg: 'bg-blue-700',    text: 'text-blue-200',   dot: '#2563EB' },
  'Plano de corte en proceso': { bg: 'bg-blue-700',    text: 'text-blue-200',   dot: '#2563EB' },
  'Plano técnico en proceso':  { bg: 'bg-blue-700',    text: 'text-blue-200',   dot: '#2563EB' },
  'Obra gris':                 { bg: 'bg-amber-800',   text: 'text-amber-300',  dot: '#D97706' },
  'Visita pendiente':          { bg: 'bg-slate-700',   text: 'text-slate-300',  dot: '#6B7280' },
  'Diseño conceptual en proceso': { bg: 'bg-blue-700', text: 'text-blue-200',   dot: '#2563EB' },
  'Finalizado':                { bg: 'bg-green-800',   text: 'text-green-200',  dot: '#16A34A' },
};

export const PRIORIDAD_COLORS = {
  'Baja':    'bg-slate-700 text-slate-300',
  'Normal':  'bg-blue-900 text-blue-300',
  'Alta':    'bg-orange-900 text-orange-300',
  'Urgente': 'bg-red-900 text-red-300',
};

export const getStatusColor = (estado) => {
  return STATUS_COLORS[estado] || { bg: 'bg-slate-700', text: 'text-slate-300', dot: '#6B7280' };
};

export const getDeptColor = (dept) => {
  return DEPT_COLORS[dept] || { bg: 'bg-slate-600', text: 'text-slate-300', border: 'border-slate-500', light: 'bg-slate-800', hex: '#475569' };
};

/**
 * Departamento en el que está realmente un proyecto ahora mismo, calculado a partir
 * de los campos reales que sí se actualizan (architecture/design3d/installations/production
 * y los módulos), no de "departamentoActual" (ese campo nunca existió en los datos).
 * Devuelve una de las claves de DEPT_COLORS: 'Arquitectura' | 'Diseño' | 'Obra' | 'Producción' | 'Instalación' | 'Finalizado'.
 */
export const getDeptActual = (p) => {
  if (!p) return 'Arquitectura';
  if (p.estadoGeneral === 'Finalizado') return 'Finalizado';

  const modulos = p.production?.modulos || [];
  const d3   = p.design3d || {};
  const inst = p.installations || {};

  // Producción ya terminó todo pero falta instalar — pasa a la columna de Instalación,
  // no se queda en Producción (ver [[project-foga-flow]]: Finalizado ahora requiere instalación real).
  if (p.production?.productionFinished) return 'Instalación';
  if (modulos.some(m => m.diseno3d?.liberadoProduccion) || d3.releasedToProduction) return 'Producción';
  if (p.releasedToDesign3D || modulos.some(m => m.arquitectura?.liberadoA3D)) return 'Diseño';
  if (inst.siteReady) return 'Instalación';
  if (p.releasedToInstallations || inst.firstVisitDate) return 'Obra';
  return 'Arquitectura';
};

// Style objects with hex colors (for inline styles in calendar etc.)
const DEPT_STYLE_MAP = {
  'Arquitectura': { bg: '#332905', border: '#D4A017', text: '#F0D687' },
  'Diseño':       { bg: '#2E1A08', border: '#B5651D', text: '#E3A868' },
  'Obra':         { bg: '#2A2010', border: '#A67C3D', text: '#D9BC85' },
  'Producción':   { bg: '#241A2B', border: '#7A4B8C', text: '#C9A8D6' },
  'Instalación':  { bg: '#0F2530', border: '#2C6E9E', text: '#8FC3E3' },
  'Urgencias':    { bg: '#3D0000', border: '#DC2626', text: '#FCA5A5' },
};

const STATUS_STYLE_MAP = {
  'No iniciado':       { bg: '#1F2937', text: '#9CA3AF' },
  'En proceso':        { bg: '#1E3A5F', text: '#93C5FD' },
  'En revisión':       { bg: '#164E63', text: '#67E8F9' },
  'Con observaciones': { bg: '#451A03', text: '#FCD34D' },
  'Pausado':           { bg: '#111827', text: '#6B7280' },
  'Urgente':           { bg: '#450A0A', text: '#FCA5A5' },
  'Atrasado':          { bg: '#3B0000', text: '#F87171' },
  'Finalizado':        { bg: '#052E16', text: '#86EFAC' },
  'Aprobado':          { bg: '#064E3B', text: '#6EE7B7' },
};

export const getDeptStyle = (dept) => {
  return DEPT_STYLE_MAP[dept] || { bg: '#1F2937', border: '#475569', text: '#9CA3AF' };
};

export const getStatusStyle = (estado) => {
  return STATUS_STYLE_MAP[estado] || STATUS_STYLE_MAP['No iniciado'];
};

export const getEffectiveStatus = (actividad) => {
  const today = new Date().toISOString().split('T')[0];
  if (actividad.estado !== 'Finalizado' && actividad.estado !== 'Aprobado' && actividad.fechaLimite < today) return 'Atrasado';
  return actividad.estado || 'No iniciado';
};

export const checklistProgress = (actividad) => {
  if (!actividad.checklist || actividad.checklist.length === 0) return 100;
  const total = actividad.checklist.length;
  const done = actividad.checklist.filter(c => c.done).length;
  return Math.round((done / total) * 100);
};

export const getDefaultChecklist = (departamento) => {
  const checklists = {
    'Arquitectura': [
      { id: 'c1', text: 'Contrato firmado', done: false },
      { id: 'c2', text: 'Medidas iniciales acordadas', done: false },
      { id: 'c3', text: 'Requerimientos del cliente registrados', done: false },
      { id: 'c4', text: 'Estado de obra registrado', done: false },
      { id: 'c5', text: 'Diseño conceptual realizado', done: false },
      { id: 'c6', text: 'Revisión con cliente', done: false },
      { id: 'c7', text: 'Aprobación del cliente', done: false },
    ],
    'Diseño': [
      { id: 'c1', text: 'Diseño conceptual aprobado', done: false },
      { id: 'c2', text: 'Medidas verificadas', done: false },
      { id: 'c3', text: 'Lista de equipos definida', done: false },
      { id: 'c4', text: 'Modelado 3D realizado', done: false },
      { id: 'c5', text: 'Plano técnico generado', done: false },
      { id: 'c6', text: 'Plano de corte generado', done: false },
    ],
    'Obra': [
      { id: 'c1', text: 'Estado de obra registrado', done: false },
      { id: 'c2', text: 'Visita agendada', done: false },
      { id: 'c3', text: 'Medidas finales tomadas', done: false },
      { id: 'c4', text: 'Observaciones de obra cerradas', done: false },
    ],
    'Producción': [
      { id: 'c1', text: 'Planos finales recibidos', done: false },
      { id: 'c2', text: 'Lista de materiales recibida', done: false },
      { id: 'c3', text: 'Medidas finales verificadas', done: false },
      { id: 'c4', text: 'Prioridad definida', done: false },
      { id: 'c5', text: 'Responsable asignado', done: false },
      { id: 'c6', text: 'Fecha de entrega registrada', done: false },
    ],
    'Instalación': [
      { id: 'c1', text: 'Visita agendada', done: false },
      { id: 'c2', text: 'Medidas tomadas', done: false },
      { id: 'c3', text: 'Obra lista', done: false },
      { id: 'c4', text: 'Equipos terminados', done: false },
      { id: 'c5', text: 'Transporte coordinado', done: false },
      { id: 'c6', text: 'Fecha confirmada con cliente', done: false },
    ],
  };
  return checklists[departamento] || [];
};

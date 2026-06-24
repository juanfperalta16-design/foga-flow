// =====================================================
// FOGA FLOW — Settings Storage
// Responsables y departamentos en LocalStorage
// =====================================================

const KEYS = {
  RESPONSABLES: 'foga_responsables',
  DEPARTAMENTOS_CONFIG: 'foga_departamentos_config',
};

const safe = {
  get: (key) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; } },
};

// ─── Datos iniciales ──────────────────────────────

export const RESPONSABLES_INICIALES = [
  { id: 'U001', nombre: 'Juan Peralta',       iniciales: 'JP', departamento: 'Diseño',               rol: 'Administrador', estado: 'Activo',    correo: '', telefono: '' },
  { id: 'U002', nombre: 'Santiago Vanegas',    iniciales: 'SV', departamento: 'Arquitectura',          rol: 'Arquitectura',  estado: 'Activo',    correo: '', telefono: '' },
  { id: 'U003', nombre: 'Manuel Aguirre',      iniciales: 'MA', departamento: 'Diseño',               rol: 'Diseño',        estado: 'Activo',    correo: '', telefono: '' },
  { id: 'U004', nombre: 'Joaquín Chica',       iniciales: 'JC', departamento: 'Diseño',               rol: 'Diseño',        estado: 'Activo',    correo: '', telefono: '' },
  { id: 'U005', nombre: 'Paúl Laica',          iniciales: 'PL', departamento: 'Producción',            rol: 'Producción',    estado: 'Activo',    correo: '', telefono: '' },
  { id: 'U006', nombre: 'Jose Luis Yanza',     iniciales: 'JY', departamento: 'Producción',            rol: 'Producción',    estado: 'Activo',    correo: '', telefono: '' },
  { id: 'U007', nombre: 'Diego Montero',       iniciales: 'DM', departamento: 'Instalación',           rol: 'Instalación',   estado: 'Activo',    correo: '', telefono: '' },
  { id: 'U008', nombre: 'Jose Luis Pesantez',  iniciales: 'JP', departamento: 'Instalación',           rol: 'Instalación',   estado: 'Activo',    correo: '', telefono: '' },
  { id: 'U009', nombre: 'Jaime Dominguez',     iniciales: 'JD', departamento: 'Instalación',           rol: 'Instalación',   estado: 'Activo',    correo: '', telefono: '' },
  { id: 'U010', nombre: 'Michael Aguayza',     iniciales: 'MA', departamento: 'Producción',            rol: 'Producción',    estado: 'Activo',    correo: '', telefono: '' },
  { id: 'U011', nombre: 'Bryam Casierra',      iniciales: 'BC', departamento: 'Producción',            rol: 'Producción',    estado: 'Activo',    correo: '', telefono: '' },
];

export const DEPARTAMENTOS_CONFIG_INICIALES = [
  { id: 'D001', nombre: 'Arquitectura',         color: '#7C3AED', descripcion: 'Diseño conceptual, medidas iniciales y revisión con cliente',              activo: true },
  { id: 'D002', nombre: 'Diseño',               color: '#2563EB', descripcion: 'Modelado 3D, planos técnicos y planos de corte para producción',           activo: true },
  { id: 'D003', nombre: 'Seguimiento de obra',  color: '#D97706', descripcion: 'Verificación de obra gris, visitas y toma de medidas finales',             activo: true },
  { id: 'D004', nombre: 'Producción',           color: '#EA580C', descripcion: 'Fabricación y armado de muebles en acero inoxidable',                      activo: true },
  { id: 'D005', nombre: 'Instalación',          color: '#16A34A', descripcion: 'Transporte, montaje e instalación de los equipos en el sitio del cliente', activo: true },
  { id: 'D006', nombre: 'Administración',       color: '#6B7280', descripcion: 'Gestión de contratos, facturación y coordinación general',                 activo: true },
];

// ─── Responsables ─────────────────────────────────

export const getResponsables = () => safe.get(KEYS.RESPONSABLES) || RESPONSABLES_INICIALES;

export const setResponsables = (data) => safe.set(KEYS.RESPONSABLES, data);

export const initResponsables = () => {
  if (!safe.get(KEYS.RESPONSABLES)) setResponsables(RESPONSABLES_INICIALES);
};

/** Solo responsables activos — para usarse en selects de toda la app */
export const getResponsablesActivos = () =>
  (getResponsables() || []).filter(r => r.estado === 'Activo');

/** Responsables activos de un departamento específico */
export const getResponsablesPorDept = (dept) =>
  (getResponsables() || []).filter(r => r.estado === 'Activo' && r.departamento === dept);

/** Lista de nombres para selects (compatibilidad con código existente) */
export const getNombresResponsables = () =>
  (getResponsablesActivos() || []).map(r => r.nombre);

// ─── Departamentos config ─────────────────────────

export const getDepartamentosConfig = () =>
  safe.get(KEYS.DEPARTAMENTOS_CONFIG) || DEPARTAMENTOS_CONFIG_INICIALES;

export const setDepartamentosConfig = (data) =>
  safe.set(KEYS.DEPARTAMENTOS_CONFIG, data);

export const initDepartamentosConfig = () => {
  if (!safe.get(KEYS.DEPARTAMENTOS_CONFIG)) setDepartamentosConfig(DEPARTAMENTOS_CONFIG_INICIALES);
};

// ─── Init combinado ───────────────────────────────

export const initSettingsStorage = () => {
  initResponsables();
  initDepartamentosConfig();
};

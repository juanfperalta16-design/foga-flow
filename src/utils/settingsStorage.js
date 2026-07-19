// ── Grupos definidos por FOGA ────────────────────
export const GRUPOS = {
  MAESTROS:             'Maestros',
  VENDEDORES:           'Vendedores',
  DISENADORES_PRODUCTO: 'Diseñadores Producto',
  ARQUITECTAS:          'Arquitectas',
};

export const RESPONSABLES_INICIALES = [
  // ── Maestros ──
  { id: 'U001', nombre: 'Paúl Laica',          iniciales: 'PL', grupo: 'Maestros',              departamento: 'Producción',    rol: 'Maestro',    estado: 'Activo', correo: '', telefono: '' },
  { id: 'U002', nombre: 'Jose Luis Pesantez',  iniciales: 'JP', grupo: 'Maestros',              departamento: 'Producción',    rol: 'Maestro',    estado: 'Activo', correo: '', telefono: '' },
  { id: 'U003', nombre: 'Jose Luis Yanza',     iniciales: 'JY', grupo: 'Maestros',              departamento: 'Producción',    rol: 'Maestro',    estado: 'Activo', correo: '', telefono: '' },
  { id: 'U004', nombre: 'Diego Montero',       iniciales: 'DM', grupo: 'Maestros',              departamento: 'Producción',    rol: 'Maestro',    estado: 'Activo', correo: '', telefono: '' },
  { id: 'U005', nombre: 'Jaime Dominguez',     iniciales: 'JD', grupo: 'Maestros',              departamento: 'Producción',    rol: 'Maestro',    estado: 'Activo', correo: '', telefono: '' },
  // ── Vendedores ──
  { id: 'U006', nombre: 'Fabián Peralta',      iniciales: 'FP', grupo: 'Vendedores',            departamento: 'Ventas',        rol: 'Vendedor',   estado: 'Activo', correo: '', telefono: '' },
  { id: 'U007', nombre: 'Cristian Peralta',    iniciales: 'CP', grupo: 'Vendedores',            departamento: 'Ventas',        rol: 'Vendedor',   estado: 'Activo', correo: '', telefono: '' },
  { id: 'U008', nombre: 'Fabián Andrés Peralta', iniciales: 'FA', grupo: 'Vendedores',          departamento: 'Ventas',        rol: 'Vendedor',   estado: 'Activo', correo: '', telefono: '' },
  // ── Diseñadores Producto ──
  { id: 'U009', nombre: 'Juan Peralta',        iniciales: 'JP', grupo: 'Diseñadores Producto',  departamento: 'Diseño 3D',     rol: 'Diseñador',  estado: 'Activo', correo: '', telefono: '' },
  { id: 'U010', nombre: 'Manuel Aguirre',      iniciales: 'MA', grupo: 'Diseñadores Producto',  departamento: 'Diseño 3D',     rol: 'Diseñador',  estado: 'Activo', correo: '', telefono: '' },
  { id: 'U011', nombre: 'Joaquín Chica',       iniciales: 'JC', grupo: 'Diseñadores Producto',  departamento: 'Diseño 3D',     rol: 'Diseñador',  estado: 'Activo', correo: '', telefono: '' },
  { id: 'U012', nombre: 'Santiago Vanegas',    iniciales: 'SV', grupo: 'Diseñadores Producto',  departamento: 'Diseño 3D',     rol: 'Diseñador',  estado: 'Activo', correo: '', telefono: '' },
  // ── Arquitectas ──
  { id: 'U013', nombre: 'Kelly Fierro',        iniciales: 'KF', grupo: 'Arquitectas',           departamento: 'Arquitectura',  rol: 'Arquitecta', estado: 'Activo', correo: '', telefono: '' },
  { id: 'U014', nombre: 'Carolina Yunga',      iniciales: 'CY', grupo: 'Arquitectas',           departamento: 'Arquitectura',  rol: 'Arquitecta', estado: 'Activo', correo: '', telefono: '' },
];

export const DEPARTAMENTOS_CONFIG_INICIALES = [
  { id: 'D001', nombre: 'Arquitectura', color: '#7C3AED', descripcion: 'Diseño conceptual y planos', activo: true },
  { id: 'D002', nombre: 'Diseño 3D',    color: '#2563EB', descripcion: 'Modelado SolidWorks y despiece AutoCAD', activo: true, metaMensualML: 32 },
  { id: 'D003', nombre: 'Producción',   color: '#EA580C', descripcion: 'Fabricación en acero inoxidable', activo: true },
  { id: 'D004', nombre: 'Instalaciones',color: '#16A34A', descripcion: 'Transporte e instalación en obra', activo: true },
  { id: 'D005', nombre: 'Ventas',       color: '#6B7280', descripcion: 'Gestión de prospectos y contratos', activo: true },
];

// ── Helpers de responsables ──────────────────────
// Reciben la lista de responsables como parámetro (la que viene reactiva desde
// useApp().responsables, alimentada en vivo por Firestore) en vez de leer una
// caché propia — así React vuelve a renderizar los selects apenas cambian los
// datos, sin depender de que algo más dispare un re-render por casualidad.
export const getResponsablesActivos  = (responsables) => (responsables || []).filter(r => r.estado === 'Activo');
export const getResponsablesPorDept  = (responsables, dept)  => getResponsablesActivos(responsables).filter(r => r.departamento === dept);
export const getResponsablesPorGrupo = (responsables, grupo) => getResponsablesActivos(responsables).filter(r => r.grupo === grupo);
export const getNombresResponsables  = (responsables) => getResponsablesActivos(responsables).map(r => r.nombre);

/** Responsables agrupados para usar en selects con optgroup */
export const getResponsablesAgrupados = (responsables) => {
  const activos = getResponsablesActivos(responsables);
  const grupos = {};
  activos.forEach(r => {
    const g = r.grupo || r.departamento || 'Otros';
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(r.nombre);
  });
  return grupos;
};

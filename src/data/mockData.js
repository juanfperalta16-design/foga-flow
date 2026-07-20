// =====================================================
// FOGA FLOW — Datos base (prioridades, config visual de departamentos,
// y el builder de proyecto nuevo). Los proyectos reales viven en Firestore.
// =====================================================

export const PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Urgente'];

// ─── Config visual de departamentos ──────────────

export const DEPT_CONFIG = {
  'Arquitectura':  { color: '#7C3AED', bg: '#2D1B69', text: '#C4B5FD', border: '#7C3AED', icon: '✏️' },
  'Instalaciones': { color: '#16A34A', bg: '#0F2D1A', text: '#86EFAC', border: '#16A34A', icon: '🔧' },
  'Diseño 3D':     { color: '#2563EB', bg: '#1E3A5F', text: '#93C5FD', border: '#2563EB', icon: '🖥️' },
  'Producción':    { color: '#EA580C', bg: '#3D1F00', text: '#FDBA74', border: '#EA580C', icon: '🏭' },
  // compatibilidad con vistas antiguas
  'Diseño':        { color: '#2563EB', bg: '#1E3A5F', text: '#93C5FD', border: '#2563EB', icon: '🖥️' },
  'Obra':          { color: '#D97706', bg: '#3D2B00', text: '#FCD34D', border: '#D97706', icon: '🏗️' },
  'Instalación':   { color: '#16A34A', bg: '#0F2D1A', text: '#86EFAC', border: '#16A34A', icon: '🔧' },
};

// ─── Helper: construir proyecto vacío nuevo ───────

export function buildNuevoProyecto(overrides = {}) {
  return {
    id: `P${Date.now()}`,
    nombre: '', cliente: '', numeroContrato: '',
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaIngreso: new Date().toISOString().slice(0, 10),
    fechaEntrega: '',
    prioridad: 'Normal',
    responsableGeneral: '',
    estadoGeneral: 'En propuesta',
    proximaAccion: '',
    observaciones: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // ── Contrato (link, no booleano) ──
    contratoLink:       '',
    contratoFirmado:    false,   // true cuando contratoLink tenga valor
    contratoUploadedAt: '',

    // ── Liberaciones manuales por Arquitectura ──
    releasedToInstallations:   false,
    releasedToInstallationsAt: '',
    releasedToDesign3D:        false,
    releasedToDesign3DAt:      '',

    // ── Departamentos ──
    architecture: {
      status:               'En propuesta',
      responsible:          '',
      proposalLink:         '',
      sketchupLink:         '',
      conceptualPlanLink:   '',
      installationPlanLink: '',
      observations:         '',
    },
    installations: {
      status:                    'Bloqueado',
      responsible:               '',
      firstVisitDate:            '',
      initialTechnicalReportLink:'',
      secondVisitDate:           '',
      finalVisitDate:            '',
      siteReady:                 false,
      observations:              '',
    },
    design3d: {
      status:                   'Bloqueado',
      responsible:              '',
      solidworksStarted:        false,
      solidworksFinished:       false,
      autocadBreakdownStarted:  false,
      autocadBreakdownFinished: false,
      design3DCompleted:        false,
      breakdownCompleted:       false,
      releasedToProduction:     false,
      releasedToProductionAt:   '',
      observations:             '',
    },
    production: {
      status:             'Bloqueado',
      responsible:        '',
      partialProduction:  false,
      productionFinished: false,
      observations:       '',
    },

    // ── Historial interno ──
    history: [],

    // ── Campos legacy para compatibilidad con componentes existentes ──
    arquitectura: {
      responsable: '', estadoArquitectura: 'En propuesta',
      medidasIniciales: '', requerimientosCliente: '', fechaInicio: '', fechaAprobacion: '',
      checklist: {}, observaciones: '',
    },
    diseno:    { responsable: '', estadoDiseno: 'Bloqueado', checklist: {}, observaciones: '' },
    obra:      { responsable: '', estadoObra: 'Bloqueado', obraGris: true, medidasTomadas: false, checklist: {}, observacionesObra: '' },
    produccion:{ responsable: '', estadoProduccion: 'Bloqueado', checklist: {}, observaciones: '' },
    instalacion:{ responsable: '', estadoInstalacion: 'Bloqueado', checklist: {}, observaciones: '' },
    ...overrides,
  };
}

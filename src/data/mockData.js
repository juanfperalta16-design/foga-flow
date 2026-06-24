// =====================================================
// FOGA FLOW — Mock Data v2
// Estructura corregida según flujo real de la empresa
// Arquitectura trabaja desde el inicio (sin contrato)
// Contrato confirma, pero Arquitectura libera manualmente
// =====================================================

export const DEPARTAMENTOS = ['Arquitectura', 'Instalaciones', 'Diseño 3D', 'Producción'];
export const PRIORIDADES   = ['Baja', 'Normal', 'Alta', 'Urgente'];
export const USUARIOS      = ['Juan Peralta', 'Santiago Vanegas', 'Manuel Aguirre', 'Joaquín Chica', 'Paúl Laica', 'Jose Luis Yanza', 'Diego Montero'];

// ─── Estados por departamento ─────────────────────

export const ESTADOS_ARQUITECTURA = [
  'En propuesta', 'Diseño conceptual en proceso', 'En revisión con cliente',
  'Ajustes pendientes', 'Propuesta aprobada', 'Esperando contrato',
  'Proyecto confirmado', 'En desarrollo de planos', 'Plano de instalaciones en proceso',
  'Liberado a Instalaciones', 'Información técnica recibida', 'Planos en actualización',
  'Listo para Diseño 3D', 'Finalizado',
];

export const ESTADOS_INSTALACIONES = [
  'Bloqueado', 'Pendiente liberación de Arquitectura', 'Pendiente primera visita técnica',
  'Primera visita realizada', 'Informe técnico cargado', 'Pendiente segunda visita',
  'Obra no lista', 'Obra validada', 'Finalizado',
];

export const ESTADOS_DISENO3D = [
  'Bloqueado', 'Pendiente liberación de Arquitectura', 'Pendiente de modelado',
  'En modelado SolidWorks', 'Modelado terminado', 'En despiece AutoCAD',
  'Despiece terminado', 'Liberado a Producción', 'Finalizado',
];

export const ESTADOS_PRODUCCION = [
  'Bloqueado', 'Pendiente liberación de Diseño 3D', 'Listo para producción',
  'En producción', 'Producción parcial', 'Producción terminada', 'Finalizado',
];

export const ESTADOS_GENERALES = [
  'En propuesta', 'Diseño conceptual en proceso', 'En revisión con cliente',
  'Propuesta aprobada', 'Esperando contrato', 'Proyecto confirmado',
  'En desarrollo de planos', 'Liberado a Instalaciones', 'Pendiente visita técnica',
  'Información técnica recibida', 'Planos en actualización', 'Listo para Diseño 3D',
  'En Diseño 3D', 'Listo para producción', 'En producción', 'Finalizado',
];

export const ESTADOS = ESTADOS_GENERALES; // compatibilidad

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

// ─── Mock projects ────────────────────────────────

export const mockProyectos = [
  // P001 — En propuesta (sin contrato) — solo Arquitectura activa
  {
    id: 'P001', nombre: 'Cocina Restaurante La Terraza', cliente: 'La Terraza S.A.', numeroContrato: '',
    fechaInicio: '2026-06-01', fechaEntrega: '2026-07-30', prioridad: 'Alta',
    responsableGeneral: 'Santiago Vanegas', estadoGeneral: 'Diseño conceptual en proceso',
    proximaAccion: 'Presentar propuesta conceptual al cliente', observaciones: '',
    createdAt: '2026-06-01T10:00:00', updatedAt: '2026-06-09T14:30:00',
    contratoLink: '', contratoFirmado: false, contratoUploadedAt: '',
    releasedToInstallations: false, releasedToInstallationsAt: '',
    releasedToDesign3D: false, releasedToDesign3DAt: '',
    architecture: { status: 'Diseño conceptual en proceso', responsible: 'Santiago Vanegas', proposalLink: '', sketchupLink: 'https://drive.google.com/file/sketchup-terraza', conceptualPlanLink: '', installationPlanLink: '', observations: 'Primera propuesta lista, pendiente aprobación cliente' },
    installations: { status: 'Bloqueado', responsible: '', firstVisitDate: '', initialTechnicalReportLink: '', secondVisitDate: '', finalVisitDate: '', siteReady: false, observations: '' },
    design3d: { status: 'Bloqueado', responsible: '', solidworksStarted: false, solidworksFinished: false, autocadBreakdownStarted: false, autocadBreakdownFinished: false, design3DCompleted: false, breakdownCompleted: false, releasedToProduction: false, releasedToProductionAt: '', observations: '' },
    production: { status: 'Bloqueado', responsible: '', partialProduction: false, productionFinished: false, observations: '' },
    history: [{ date: '2026-06-01', user: 'Santiago Vanegas', action: 'Proyecto creado', previousStatus: '', newStatus: 'En propuesta', comment: '' }],
    arquitectura: { responsable: 'Santiago Vanegas', estadoArquitectura: 'Diseño conceptual en proceso', checklist: {}, observaciones: '' },
    diseno: { responsable: '', estadoDiseno: 'Bloqueado', checklist: {}, observaciones: '' },
    obra: { responsable: '', estadoObra: 'Bloqueado', obraGris: true, medidasTomadas: false, checklist: {}, observacionesObra: '' },
    produccion: { responsable: '', estadoProduccion: 'Bloqueado', checklist: {}, observaciones: '' },
    instalacion: { responsable: '', estadoInstalacion: 'Bloqueado', checklist: {}, observaciones: '' },
  },

  // P002 — Proyecto confirmado (contrato cargado) — Arquitectura desarrollando planos
  {
    id: 'P002', nombre: 'Equipamiento Hotel Central', cliente: 'Hotel Central Ltda.', numeroContrato: 'CTR-002',
    fechaInicio: '2026-05-20', fechaEntrega: '2026-08-15', prioridad: 'Normal',
    responsableGeneral: 'Juan Peralta', estadoGeneral: 'En desarrollo de planos',
    proximaAccion: 'Terminar plano de instalaciones para liberar a Instalaciones', observaciones: '',
    createdAt: '2026-05-20T09:00:00', updatedAt: '2026-06-08T11:00:00',
    contratoLink: 'https://drive.google.com/file/contrato-hotel-central', contratoFirmado: true, contratoUploadedAt: '2026-05-28T10:00:00',
    releasedToInstallations: false, releasedToInstallationsAt: '',
    releasedToDesign3D: false, releasedToDesign3DAt: '',
    architecture: { status: 'En desarrollo de planos', responsible: 'Juan Peralta', proposalLink: 'https://drive.google.com/propuesta-hotel', sketchupLink: 'https://drive.google.com/sketchup-hotel', conceptualPlanLink: 'https://drive.google.com/plano-conceptual-hotel', installationPlanLink: '', observations: 'Contrato firmado. Desarrollando plano de instalaciones.' },
    installations: { status: 'Pendiente liberación de Arquitectura', responsible: '', firstVisitDate: '', initialTechnicalReportLink: '', secondVisitDate: '', finalVisitDate: '', siteReady: false, observations: '' },
    design3d: { status: 'Pendiente liberación de Arquitectura', responsible: '', solidworksStarted: false, solidworksFinished: false, autocadBreakdownStarted: false, autocadBreakdownFinished: false, design3DCompleted: false, breakdownCompleted: false, releasedToProduction: false, releasedToProductionAt: '', observations: '' },
    production: { status: 'Bloqueado', responsible: '', partialProduction: false, productionFinished: false, observations: '' },
    history: [
      { date: '2026-05-20', user: 'Juan Peralta', action: 'Proyecto creado', previousStatus: '', newStatus: 'En propuesta', comment: '' },
      { date: '2026-05-28', user: 'Juan Peralta', action: 'Contrato cargado', previousStatus: 'Esperando contrato', newStatus: 'Proyecto confirmado', comment: 'CTR-002 firmado' },
    ],
    arquitectura: { responsable: 'Juan Peralta', estadoArquitectura: 'En desarrollo de planos', checklist: {}, observaciones: '' },
    diseno: { responsable: '', estadoDiseno: 'Pendiente liberación', checklist: {}, observaciones: '' },
    obra: { responsable: '', estadoObra: 'Pendiente', obraGris: true, medidasTomadas: false, checklist: {}, observacionesObra: '' },
    produccion: { responsable: '', estadoProduccion: 'Bloqueado', checklist: {}, observaciones: '' },
    instalacion: { responsable: '', estadoInstalacion: 'Pendiente liberación', checklist: {}, observaciones: '' },
  },

  // P003 — Liberado a Instalaciones, pendiente visita
  {
    id: 'P003', nombre: 'Muebles Cafetería Norte', cliente: 'Cafetería Norte SAS', numeroContrato: 'CTR-003',
    fechaInicio: '2026-05-10', fechaEntrega: '2026-07-20', prioridad: 'Urgente',
    responsableGeneral: 'Juan Peralta', estadoGeneral: 'Pendiente visita técnica',
    proximaAccion: 'Instalaciones: realizar primera visita técnica', observaciones: '',
    createdAt: '2026-05-10T08:00:00', updatedAt: '2026-06-07T16:00:00',
    contratoLink: 'https://drive.google.com/file/contrato-cafeteria', contratoFirmado: true, contratoUploadedAt: '2026-05-18T09:00:00',
    releasedToInstallations: true, releasedToInstallationsAt: '2026-06-05T10:00:00',
    releasedToDesign3D: false, releasedToDesign3DAt: '',
    architecture: { status: 'Liberado a Instalaciones', responsible: 'Juan Peralta', proposalLink: 'https://drive.google.com/propuesta-cafe', sketchupLink: 'https://drive.google.com/sketchup-cafe', conceptualPlanLink: 'https://drive.google.com/plano-cafe', installationPlanLink: 'https://drive.google.com/instalaciones-cafe', observations: 'Planos listos. Liberado a Instalaciones el 5 jun.' },
    installations: { status: 'Pendiente primera visita técnica', responsible: 'Diego Montero', firstVisitDate: '', initialTechnicalReportLink: '', secondVisitDate: '', finalVisitDate: '', siteReady: false, observations: 'Coordinar visita con cliente' },
    design3d: { status: 'Pendiente liberación de Arquitectura', responsible: '', solidworksStarted: false, solidworksFinished: false, autocadBreakdownStarted: false, autocadBreakdownFinished: false, design3DCompleted: false, breakdownCompleted: false, releasedToProduction: false, releasedToProductionAt: '', observations: '' },
    production: { status: 'Bloqueado', responsible: '', partialProduction: false, productionFinished: false, observations: '' },
    history: [
      { date: '2026-05-10', user: 'Juan Peralta', action: 'Proyecto creado', previousStatus: '', newStatus: 'En propuesta', comment: '' },
      { date: '2026-05-18', user: 'Juan Peralta', action: 'Contrato cargado', previousStatus: 'Esperando contrato', newStatus: 'Proyecto confirmado', comment: 'CTR-003' },
      { date: '2026-06-05', user: 'Juan Peralta', action: 'Liberado a Instalaciones', previousStatus: 'En desarrollo de planos', newStatus: 'Liberado a Instalaciones', comment: 'Planos de instalación listos' },
    ],
    arquitectura: { responsable: 'Juan Peralta', estadoArquitectura: 'Liberado a Instalaciones', checklist: {}, observaciones: '' },
    diseno: { responsable: '', estadoDiseno: 'Pendiente liberación', checklist: {}, observaciones: '' },
    obra: { responsable: 'Diego Montero', estadoObra: 'Pendiente visita', obraGris: true, medidasTomadas: false, checklist: {}, observacionesObra: '' },
    produccion: { responsable: '', estadoProduccion: 'Bloqueado', checklist: {}, observaciones: '' },
    instalacion: { responsable: 'Diego Montero', estadoInstalacion: 'Pendiente primera visita técnica', checklist: {}, observaciones: '' },
  },

  // P004 — Informe técnico recibido de Instalaciones, Arquitectura actualizando planos
  {
    id: 'P004', nombre: 'Cocina Bar Mirador', cliente: 'Bar Mirador S.A.', numeroContrato: 'CTR-004',
    fechaInicio: '2026-04-15', fechaEntrega: '2026-07-10', prioridad: 'Alta',
    responsableGeneral: 'Juan Peralta', estadoGeneral: 'Información técnica recibida',
    proximaAccion: 'Arquitectura: actualizar planos con informe técnico y liberar a Diseño 3D', observaciones: '',
    createdAt: '2026-04-15T10:00:00', updatedAt: '2026-06-08T09:00:00',
    contratoLink: 'https://drive.google.com/file/contrato-mirador', contratoFirmado: true, contratoUploadedAt: '2026-04-22T08:00:00',
    releasedToInstallations: true, releasedToInstallationsAt: '2026-05-02T10:00:00',
    releasedToDesign3D: false, releasedToDesign3DAt: '',
    architecture: { status: 'Información técnica recibida', responsible: 'Juan Peralta', proposalLink: 'https://drive.google.com/propuesta-mirador', sketchupLink: 'https://drive.google.com/sketchup-mirador', conceptualPlanLink: 'https://drive.google.com/plano-mirador', installationPlanLink: 'https://drive.google.com/inst-mirador', observations: 'Informe técnico recibido. Actualizando planos con medidas reales.' },
    installations: { status: 'Informe técnico cargado', responsible: 'Diego Montero', firstVisitDate: '2026-05-15', initialTechnicalReportLink: 'https://drive.google.com/informe-tecnico-mirador', secondVisitDate: '', finalVisitDate: '', siteReady: false, observations: 'Primera visita realizada. Medidas tomadas.' },
    design3d: { status: 'Pendiente liberación de Arquitectura', responsible: 'Manuel Aguirre', solidworksStarted: false, solidworksFinished: false, autocadBreakdownStarted: false, autocadBreakdownFinished: false, design3DCompleted: false, breakdownCompleted: false, releasedToProduction: false, releasedToProductionAt: '', observations: '' },
    production: { status: 'Bloqueado', responsible: '', partialProduction: false, productionFinished: false, observations: '' },
    history: [
      { date: '2026-04-15', user: 'Juan Peralta', action: 'Proyecto creado', previousStatus: '', newStatus: 'En propuesta', comment: '' },
      { date: '2026-04-22', user: 'Juan Peralta', action: 'Contrato cargado', previousStatus: 'Esperando contrato', newStatus: 'Proyecto confirmado', comment: 'CTR-004' },
      { date: '2026-05-02', user: 'Juan Peralta', action: 'Liberado a Instalaciones', previousStatus: 'En desarrollo de planos', newStatus: 'Liberado a Instalaciones', comment: '' },
      { date: '2026-05-20', user: 'Diego Montero', action: 'Informe técnico cargado', previousStatus: 'Pendiente primera visita', newStatus: 'Información técnica recibida', comment: 'Informe primera visita' },
    ],
    arquitectura: { responsable: 'Juan Peralta', estadoArquitectura: 'Información técnica recibida', checklist: {}, observaciones: '' },
    diseno: { responsable: 'Manuel Aguirre', estadoDiseno: 'Pendiente liberación', checklist: {}, observaciones: '' },
    obra: { responsable: 'Diego Montero', estadoObra: 'Primera visita realizada', obraGris: false, medidasTomadas: true, checklist: {}, observacionesObra: '' },
    produccion: { responsable: '', estadoProduccion: 'Bloqueado', checklist: {}, observaciones: '' },
    instalacion: { responsable: 'Diego Montero', estadoInstalacion: 'Informe técnico cargado', checklist: {}, observaciones: '' },
  },

  // P005 — Liberado a Diseño 3D, en modelado
  {
    id: 'P005', nombre: 'Cocina Residencial Álvarez', cliente: 'Familia Álvarez', numeroContrato: 'CTR-005',
    fechaInicio: '2026-03-10', fechaEntrega: '2026-07-15', prioridad: 'Alta',
    responsableGeneral: 'Juan Peralta', estadoGeneral: 'En Diseño 3D',
    proximaAccion: 'Diseño 3D: terminar modelado SolidWorks', observaciones: '',
    createdAt: '2026-03-10T09:00:00', updatedAt: '2026-06-09T10:00:00',
    contratoLink: 'https://drive.google.com/file/contrato-alvarez', contratoFirmado: true, contratoUploadedAt: '2026-03-18T10:00:00',
    releasedToInstallations: true, releasedToInstallationsAt: '2026-03-25T10:00:00',
    releasedToDesign3D: true, releasedToDesign3DAt: '2026-05-10T10:00:00',
    architecture: { status: 'Listo para Diseño 3D', responsible: 'Juan Peralta', proposalLink: 'https://drive.google.com/propuesta-alvarez', sketchupLink: 'https://drive.google.com/sketchup-alvarez', conceptualPlanLink: 'https://drive.google.com/plano-alvarez', installationPlanLink: 'https://drive.google.com/inst-alvarez', observations: 'Todo listo. Planos actualizados con medidas reales.' },
    installations: { status: 'Obra validada', responsible: 'Diego Montero', firstVisitDate: '2026-04-05', initialTechnicalReportLink: 'https://drive.google.com/informe-alvarez', secondVisitDate: '2026-05-05', finalVisitDate: '', siteReady: true, observations: 'Obra lista. Segunda visita realizada.' },
    design3d: { status: 'En modelado SolidWorks', responsible: 'Manuel Aguirre', solidworksStarted: true, solidworksFinished: false, autocadBreakdownStarted: false, autocadBreakdownFinished: false, design3DCompleted: false, breakdownCompleted: false, releasedToProduction: false, releasedToProductionAt: '', observations: 'Modelado en proceso, 60% avanzado' },
    production: { status: 'Bloqueado', responsible: 'Paúl Laica', partialProduction: false, productionFinished: false, observations: '' },
    history: [
      { date: '2026-03-10', user: 'Juan Peralta', action: 'Proyecto creado', previousStatus: '', newStatus: 'En propuesta', comment: '' },
      { date: '2026-03-18', user: 'Juan Peralta', action: 'Contrato cargado', previousStatus: 'Esperando contrato', newStatus: 'Proyecto confirmado', comment: '' },
      { date: '2026-03-25', user: 'Juan Peralta', action: 'Liberado a Instalaciones', previousStatus: 'En desarrollo de planos', newStatus: 'Liberado a Instalaciones', comment: '' },
      { date: '2026-05-10', user: 'Juan Peralta', action: 'Liberado a Diseño 3D', previousStatus: 'Información técnica recibida', newStatus: 'Listo para Diseño 3D', comment: 'Planos actualizados con medidas' },
    ],
    arquitectura: { responsable: 'Juan Peralta', estadoArquitectura: 'Listo para Diseño 3D', checklist: {}, observaciones: '' },
    diseno: { responsable: 'Manuel Aguirre', estadoDiseno: 'En modelado SolidWorks', checklist: {}, observaciones: '' },
    obra: { responsable: 'Diego Montero', estadoObra: 'Obra validada', obraGris: false, medidasTomadas: true, checklist: {}, observacionesObra: '' },
    produccion: { responsable: 'Paúl Laica', estadoProduccion: 'Bloqueado', checklist: {}, observaciones: '' },
    instalacion: { responsable: 'Diego Montero', estadoInstalacion: 'Obra validada', checklist: {}, observaciones: '' },
  },

  // P006 — Listo para producción (Diseño 3D terminó)
  {
    id: 'P006', nombre: 'Cocina Clínica Norte', cliente: 'Clínica Norte S.A.', numeroContrato: 'CTR-006',
    fechaInicio: '2026-02-01', fechaEntrega: '2026-06-25', prioridad: 'Urgente',
    responsableGeneral: 'Juan Peralta', estadoGeneral: 'Listo para producción',
    proximaAccion: 'Producción: iniciar fabricación', observaciones: '',
    createdAt: '2026-02-01T09:00:00', updatedAt: '2026-06-08T16:00:00',
    contratoLink: 'https://drive.google.com/file/contrato-clinica', contratoFirmado: true, contratoUploadedAt: '2026-02-10T10:00:00',
    releasedToInstallations: true, releasedToInstallationsAt: '2026-02-20T10:00:00',
    releasedToDesign3D: true, releasedToDesign3DAt: '2026-04-01T10:00:00',
    architecture: { status: 'Finalizado', responsible: 'Juan Peralta', proposalLink: '', sketchupLink: '', conceptualPlanLink: 'https://drive.google.com/plano-clinica', installationPlanLink: 'https://drive.google.com/inst-clinica', observations: 'Entregado a Diseño 3D. Proceso completado.' },
    installations: { status: 'Obra validada', responsible: 'Jose Luis Pesantez', firstVisitDate: '2026-03-01', initialTechnicalReportLink: 'https://drive.google.com/informe-clinica', secondVisitDate: '2026-04-15', finalVisitDate: '', siteReady: true, observations: 'Obra lista para instalación.' },
    design3d: { status: 'Liberado a Producción', responsible: 'Joaquín Chica', solidworksStarted: true, solidworksFinished: true, autocadBreakdownStarted: true, autocadBreakdownFinished: true, design3DCompleted: true, breakdownCompleted: true, releasedToProduction: true, releasedToProductionAt: '2026-06-01T10:00:00', observations: 'Modelado y despiece terminados.' },
    production: { status: 'Listo para producción', responsible: 'Paúl Laica', partialProduction: false, productionFinished: false, observations: 'Esperando inicio de fabricación' },
    history: [],
    arquitectura: { responsable: 'Juan Peralta', estadoArquitectura: 'Finalizado', checklist: {}, observaciones: '' },
    diseno: { responsable: 'Joaquín Chica', estadoDiseno: 'Liberado a Producción', checklist: {}, observaciones: '' },
    obra: { responsable: 'Jose Luis Pesantez', estadoObra: 'Obra validada', obraGris: false, medidasTomadas: true, checklist: {}, observacionesObra: '' },
    produccion: { responsable: 'Paúl Laica', estadoProduccion: 'Listo para producción', checklist: {}, observaciones: '' },
    instalacion: { responsable: 'Jose Luis Pesantez', estadoInstalacion: 'Obra validada', checklist: {}, observaciones: '' },
  },

  // P007 — En producción
  {
    id: 'P007', nombre: 'Apartamento Rosales', cliente: 'Familia Rodríguez', numeroContrato: 'CTR-007',
    fechaInicio: '2026-01-15', fechaEntrega: '2026-06-15', prioridad: 'Alta',
    responsableGeneral: 'Juan Peralta', estadoGeneral: 'En producción',
    proximaAccion: 'Producción: terminar fabricación y coordinar instalación', observaciones: '',
    createdAt: '2026-01-15T09:00:00', updatedAt: '2026-06-09T12:00:00',
    contratoLink: 'https://drive.google.com/file/contrato-rosales', contratoFirmado: true, contratoUploadedAt: '2026-01-22T10:00:00',
    releasedToInstallations: true, releasedToInstallationsAt: '2026-02-01T10:00:00',
    releasedToDesign3D: true, releasedToDesign3DAt: '2026-03-15T10:00:00',
    architecture: { status: 'Finalizado', responsible: 'Juan Peralta', proposalLink: '', sketchupLink: '', conceptualPlanLink: '', installationPlanLink: 'https://drive.google.com/inst-rosales', observations: '' },
    installations: { status: 'Finalizado', responsible: 'Jaime Dominguez', firstVisitDate: '2026-02-10', initialTechnicalReportLink: 'https://drive.google.com/informe-rosales', secondVisitDate: '2026-03-10', finalVisitDate: '', siteReady: true, observations: '' },
    design3d: { status: 'Liberado a Producción', responsible: 'Manuel Aguirre', solidworksStarted: true, solidworksFinished: true, autocadBreakdownStarted: true, autocadBreakdownFinished: true, design3DCompleted: true, breakdownCompleted: true, releasedToProduction: true, releasedToProductionAt: '2026-04-20T10:00:00', observations: '' },
    production: { status: 'En producción', responsible: 'Jose Luis Yanza', partialProduction: true, productionFinished: false, observations: 'Piezas principales en proceso' },
    history: [],
    arquitectura: { responsable: 'Juan Peralta', estadoArquitectura: 'Finalizado', checklist: {}, observaciones: '' },
    diseno: { responsable: 'Manuel Aguirre', estadoDiseno: 'Liberado a Producción', checklist: {}, observaciones: '' },
    obra: { responsable: 'Jaime Dominguez', estadoObra: 'Finalizado', obraGris: false, medidasTomadas: true, checklist: {}, observacionesObra: '' },
    produccion: { responsable: 'Jose Luis Yanza', estadoProduccion: 'En producción', checklist: {}, observaciones: '' },
    instalacion: { responsable: 'Jaime Dominguez', estadoInstalacion: 'Finalizado', checklist: {}, observaciones: '' },
  },

  // P008 — Finalizado
  {
    id: 'P008', nombre: 'Cocina Hotel Bogotá', cliente: 'Hotel Capital', numeroContrato: 'CTR-008',
    fechaInicio: '2025-11-01', fechaEntrega: '2026-03-15', prioridad: 'Normal',
    responsableGeneral: 'Juan Peralta', estadoGeneral: 'Finalizado',
    proximaAccion: '', observaciones: '',
    createdAt: '2025-11-01T09:00:00', updatedAt: '2026-03-20T10:00:00',
    contratoLink: 'https://drive.google.com/file/contrato-bogota', contratoFirmado: true, contratoUploadedAt: '2025-11-10T10:00:00',
    releasedToInstallations: true, releasedToInstallationsAt: '2025-11-20T10:00:00',
    releasedToDesign3D: true, releasedToDesign3DAt: '2025-12-15T10:00:00',
    architecture: { status: 'Finalizado', responsible: 'Juan Peralta', proposalLink: '', sketchupLink: '', conceptualPlanLink: '', installationPlanLink: '', observations: '' },
    installations: { status: 'Finalizado', responsible: 'Diego Montero', firstVisitDate: '2025-11-25', initialTechnicalReportLink: '', secondVisitDate: '2025-12-10', finalVisitDate: '2026-03-10', siteReady: true, observations: '' },
    design3d: { status: 'Finalizado', responsible: 'Joaquín Chica', solidworksStarted: true, solidworksFinished: true, autocadBreakdownStarted: true, autocadBreakdownFinished: true, design3DCompleted: true, breakdownCompleted: true, releasedToProduction: true, releasedToProductionAt: '2026-01-15T10:00:00', observations: '' },
    production: { status: 'Finalizado', responsible: 'Michael Aguayza', partialProduction: true, productionFinished: true, observations: '' },
    history: [],
    arquitectura: { responsable: 'Juan Peralta', estadoArquitectura: 'Finalizado', checklist: {}, observaciones: '' },
    diseno: { responsable: 'Joaquín Chica', estadoDiseno: 'Finalizado', checklist: {}, observaciones: '' },
    obra: { responsable: 'Diego Montero', estadoObra: 'Finalizado', obraGris: false, medidasTomadas: true, checklist: {}, observacionesObra: '' },
    produccion: { responsable: 'Michael Aguayza', estadoProduccion: 'Finalizado', checklist: {}, observaciones: '' },
    instalacion: { responsable: 'Diego Montero', estadoInstalacion: 'Finalizado', checklist: {}, observaciones: '' },
  },
];

export const mockActividades  = [];
export const mockAlertas      = [];
export const mockHistorial    = [];

export const MOCK_RESPONSABLES = ['Juan Peralta', 'Santiago Vanegas', 'Manuel Aguirre', 'Joaquín Chica', 'Paúl Laica', 'Jose Luis Yanza', 'Diego Montero', 'Jose Luis Pesantez', 'Jaime Dominguez', 'Michael Aguayza', 'Bryam Casierra'];

export const DEPT_CONFIG_LEGACY = DEPT_CONFIG;

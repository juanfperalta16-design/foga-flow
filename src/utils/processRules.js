// =====================================================
// FOGA FLOW — Motor de reglas v2
// Flujo real de la empresa:
//   Arquitectura trabaja desde el inicio (propuesta)
//   Contrato confirma el proyecto pero NO libera nada
//   Arquitectura libera manualmente a Instalaciones y Diseño 3D
//   Diseño 3D libera manualmente a Producción
// =====================================================

import { today } from './dateHelpers';

// ─── Evaluación del estado general según datos ───

export const calcularEstadoGeneral = (proyecto) => {
  const p  = proyecto || {};
  const d3 = p.design3d    || {};
  const pr = p.production  || {};
  const in_ = p.installations || {};

  if (pr.productionFinished)                    return 'Finalizado';
  if (pr.status === 'En producción' || pr.partialProduction) return 'En producción';
  if (d3.releasedToProduction)                  return 'Listo para producción';
  if (p.releasedToDesign3D)                     return d3.solidworksStarted ? 'En Diseño 3D' : 'Listo para Diseño 3D';

  // Informe técnico recibido de instalaciones
  if (in_.initialTechnicalReportLink)           return 'Información técnica recibida';
  if (p.releasedToInstallations)                return 'Liberado a Instalaciones';

  if (p.contratoFirmado || p.contratoLink)      return 'Proyecto confirmado';

  // Sin contrato — según estado de Arquitectura
  const archStatus = p.architecture?.status || p.arquitectura?.estadoArquitectura || '';
  if (archStatus.includes('revisión'))          return 'En revisión con cliente';
  if (archStatus.includes('aprobada') || archStatus.includes('Aprobada')) return 'Propuesta aprobada';
  if (archStatus.includes('conceptual'))        return 'Diseño conceptual en proceso';
  return 'En propuesta';
};

// ─── Reglas de bloqueo por departamento ──────────

export const reglasDeBloqueo = (proyecto) => {
  const p   = proyecto || {};
  const d3  = p.design3d    || {};
  const in_ = p.installations || {};
  const bloqueos = [];

  const tieneContrato = !!(p.contratoLink || p.contratoFirmado);

  // Instalaciones bloqueado si no fue liberado por Arquitectura
  if (!p.releasedToInstallations) {
    bloqueos.push({
      departamento: 'Instalaciones',
      gate: 'Liberación Arquitectura → Instalaciones',
      motivo: tieneContrato
        ? 'Arquitectura no ha liberado el proyecto a Instalaciones.'
        : 'Sin contrato firmado. Arquitectura debe liberar cuando el proyecto esté confirmado.',
      accion: 'En Arquitectura → sección "Liberaciones" → clic en "Liberar a Instalaciones".',
      prioridad: tieneContrato ? 'Alta' : 'Normal',
      bloqueadoPor: 'arquitectura',
    });
  }

  // Diseño 3D bloqueado si no fue liberado por Arquitectura
  if (!p.releasedToDesign3D) {
    bloqueos.push({
      departamento: 'Diseño 3D',
      gate: 'Liberación Arquitectura → Diseño 3D',
      motivo: 'Arquitectura no ha liberado el proyecto a Diseño 3D.',
      accion: 'En Arquitectura → sección "Liberaciones" → clic en "Liberar a Diseño 3D".',
      prioridad: tieneContrato ? 'Alta' : 'Normal',
      bloqueadoPor: 'arquitectura',
    });
  }

  // Producción bloqueada si Diseño 3D no terminó
  if (!d3.design3DCompleted || !d3.breakdownCompleted) {
    bloqueos.push({
      departamento: 'Producción',
      gate: 'Liberación Diseño 3D → Producción',
      motivo: !p.releasedToDesign3D
        ? 'Producción no puede iniciar: Diseño 3D no ha sido liberado por Arquitectura.'
        : !d3.design3DCompleted
        ? 'Producción no puede iniciar: modelado SolidWorks no terminado.'
        : 'Producción no puede iniciar: despiece AutoCAD no terminado.',
      accion: 'En Diseño 3D: completar modelado y despiece, luego marcar "Listo para producción".',
      prioridad: p.releasedToDesign3D ? 'Alta' : 'Normal',
      bloqueadoPor: 'diseno3d',
    });
  }

  return bloqueos;
};

// ─── Verificar si un departamento puede actuar ───

export const puedeTrabajrar = (proyecto, departamento) => {
  const p  = proyecto || {};
  switch (departamento) {
    case 'Arquitectura':  return true; // siempre activa
    case 'Instalaciones': return !!p.releasedToInstallations;
    case 'Diseño 3D':     return !!p.releasedToDesign3D;
    case 'Producción':    return !!(p.design3d?.design3DCompleted && p.design3d?.breakdownCompleted);
    default:              return false;
  }
};

// ─── Aplicar liberación desde Arquitectura ───────

export const liberarAInstalaciones = (proyecto, usuario) => {
  if (!proyecto.contratoLink && !proyecto.contratoFirmado) {
    return { ok: false, error: 'Debes cargar el link del contrato antes de liberar a Instalaciones.' };
  }
  const now = new Date().toISOString();
  return {
    ok: true,
    cambios: {
      releasedToInstallations:   true,
      releasedToInstallationsAt: now,
      estadoGeneral: 'Liberado a Instalaciones',
      installations: {
        ...proyecto.installations,
        status: 'Pendiente primera visita técnica',
      },
      architecture: {
        ...proyecto.architecture,
        status: 'Liberado a Instalaciones',
      },
      updatedAt: now,
    },
    historial: { date: now.slice(0, 10), user: usuario, action: 'Liberado a Instalaciones', previousStatus: proyecto.estadoGeneral, newStatus: 'Liberado a Instalaciones', comment: '' },
  };
};

export const liberarADiseno3D = (proyecto, usuario) => {
  if (!proyecto.contratoLink && !proyecto.contratoFirmado) {
    return { ok: false, error: 'Debes cargar el link del contrato antes de liberar a Diseño 3D.' };
  }
  const now = new Date().toISOString();
  return {
    ok: true,
    cambios: {
      releasedToDesign3D:   true,
      releasedToDesign3DAt: now,
      estadoGeneral: 'Listo para Diseño 3D',
      design3d: {
        ...proyecto.design3d,
        status: 'Pendiente de modelado',
      },
      architecture: {
        ...proyecto.architecture,
        status: 'Listo para Diseño 3D',
      },
      updatedAt: now,
    },
    historial: { date: now.slice(0, 10), user: usuario, action: 'Liberado a Diseño 3D', previousStatus: proyecto.estadoGeneral, newStatus: 'Listo para Diseño 3D', comment: '' },
  };
};

export const liberarAProduccion = (proyecto, usuario) => {
  const d3 = proyecto.design3d || {};
  if (!d3.design3DCompleted || !d3.breakdownCompleted) {
    return { ok: false, error: 'Debes completar el modelado y despiece antes de liberar a Producción.' };
  }
  const now = new Date().toISOString();
  return {
    ok: true,
    cambios: {
      estadoGeneral: 'Listo para producción',
      design3d: { ...d3, releasedToProduction: true, releasedToProductionAt: now, status: 'Liberado a Producción' },
      production: { ...proyecto.production, status: 'Listo para producción' },
      updatedAt: now,
    },
    historial: { date: now.slice(0, 10), user: usuario, action: 'Liberado a Producción', previousStatus: proyecto.estadoGeneral, newStatus: 'Listo para producción', comment: '' },
  };
};

// ─── Registrar contrato ───────────────────────────

export const registrarContrato = (proyecto, contratoLink, usuario) => {
  if (!contratoLink?.trim()) return { ok: false, error: 'El link del contrato no puede estar vacío.' };
  const now = new Date().toISOString();
  return {
    ok: true,
    cambios: {
      contratoLink,
      contratoFirmado: true,
      contratoUploadedAt: now,
      estadoGeneral: 'Proyecto confirmado',
      architecture: { ...proyecto.architecture, status: 'Proyecto confirmado' },
      installations: { ...proyecto.installations, status: 'Pendiente liberación de Arquitectura' },
      design3d:      { ...proyecto.design3d,      status: 'Pendiente liberación de Arquitectura' },
      updatedAt: now,
    },
    historial: { date: now.slice(0, 10), user: usuario, action: 'Contrato cargado', previousStatus: proyecto.estadoGeneral, newStatus: 'Proyecto confirmado', comment: `Link: ${contratoLink}` },
  };
};

// ─── Informe técnico de Instalaciones → alerta a Arquitectura ──

export const registrarInformeTecnico = (proyecto, reportLink, usuario) => {
  const now = new Date().toISOString();
  return {
    ok: true,
    cambios: {
      estadoGeneral: 'Información técnica recibida',
      installations: { ...proyecto.installations, initialTechnicalReportLink: reportLink, status: 'Informe técnico cargado' },
      architecture:  { ...proyecto.architecture,  status: 'Información técnica recibida' },
      updatedAt: now,
    },
    historial: { date: now.slice(0, 10), user: usuario, action: 'Informe técnico cargado', previousStatus: proyecto.estadoGeneral, newStatus: 'Información técnica recibida', comment: `Link: ${reportLink}` },
  };
};

// ─── Alertas automáticas ────────────────────────

export const generarAlertasAutomaticas = (proyectos) => {
  const alertas = [];
  const hoy = today();

  (proyectos || []).forEach(p => {
    const tieneContrato = !!(p.contratoLink || p.contratoFirmado);

    // Fecha entrega vencida
    if (p.fechaEntrega && p.fechaEntrega < hoy && p.estadoGeneral !== 'Finalizado') {
      alertas.push({ id: `AUTO_${p.id}_atraso`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Sistema', tipo: 'Atrasado', motivo: `Entrega vencida el ${p.fechaEntrega}.`, accionNecesaria: 'Revisar estado y notificar cliente.', prioridad: 'Urgente', estado: 'Pendiente', fecha: hoy, auto: true });
    }

    // Sin responsable
    if (!p.responsableGeneral) {
      alertas.push({ id: `AUTO_${p.id}_resp`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Sistema', tipo: 'Sin responsable', motivo: 'Proyecto sin responsable general.', accionNecesaria: 'Asignar responsable.', prioridad: 'Alta', estado: 'Pendiente', fecha: hoy, auto: true });
    }

    // Contrato pendiente en propuesta vieja (más de 30 días sin contrato)
    if (!tieneContrato) {
      const diasSinContrato = Math.floor((new Date(hoy) - new Date(p.createdAt?.slice(0,10) || hoy)) / 86400000);
      if (diasSinContrato > 30) {
        alertas.push({ id: `AUTO_${p.id}_contrato`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Arquitectura', tipo: 'Sin contrato', motivo: `${diasSinContrato} días sin contrato. El flujo técnico está en espera.`, accionNecesaria: 'Cargar link del contrato firmado.', prioridad: 'Alta', estado: 'Pendiente', fecha: hoy, auto: true });
      }
    }

    // Proyecto confirmado pero Arquitectura no ha liberado (más de 7 días)
    if (tieneContrato && !p.releasedToInstallations && !p.releasedToDesign3D) {
      const diasConContrato = Math.floor((new Date(hoy) - new Date(p.contratoUploadedAt?.slice(0,10) || hoy)) / 86400000);
      if (diasConContrato > 7) {
        alertas.push({ id: `AUTO_${p.id}_pendlib`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Arquitectura', tipo: 'Liberación pendiente', motivo: `${diasConContrato} días con contrato sin liberar a ningún departamento.`, accionNecesaria: 'Arquitectura: liberar a Instalaciones o Diseño 3D.', prioridad: 'Normal', estado: 'Pendiente', fecha: hoy, auto: true });
      }
    }

    // Informe técnico recibido — Arquitectura debe actualizar planos
    if (p.installations?.initialTechnicalReportLink && !p.releasedToDesign3D) {
      alertas.push({ id: `AUTO_${p.id}_informe`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Instalaciones', tipo: 'Informe técnico recibido', motivo: 'Instalaciones cargó informe técnico. Arquitectura debe actualizar planos.', accionNecesaria: 'Revisar informe técnico y actualizar planos antes de liberar a Diseño 3D.', prioridad: 'Alta', estado: 'Pendiente', fecha: hoy, auto: true });
    }

    // Diseño 3D listo → debe liberarse a Producción
    const d3 = p.design3d || {};
    if (d3.design3DCompleted && d3.breakdownCompleted && !d3.releasedToProduction) {
      alertas.push({ id: `AUTO_${p.id}_d3listo`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Diseño 3D', tipo: 'Listo para producción', motivo: 'Modelado y despiece terminados. Producción puede iniciar.', accionNecesaria: 'Diseño 3D: marcar "Listo para producción".', prioridad: 'Urgente', estado: 'Pendiente', fecha: hoy, auto: true });
    }
  });

  return alertas;
};

// ─── Compatibilidad con código anterior ──────────

export const detectarBloqueos    = (proyecto) => reglasDeBloqueo(proyecto).map(b => ({ ...b, etapaBloqueada: b.departamento, accionNecesaria: b.accion, puedeAvanzar: false }));
export const estadoFlujo         = (proyecto) => ({ etapa: proyecto?.estadoGeneral || 'En propuesta', fase: proyecto?.estadoGeneral || 'En propuesta', color: '#7C3AED' });
export const evaluarGates        = detectarBloqueos;
export const puedeIniciarArquitectura  = () => ({ puedeAvanzar: true });
export const puedeIniciarDiseno        = (proyecto) => ({ puedeAvanzar: !!proyecto?.releasedToDesign3D });
export const puedeIniciarProduccion    = (proyecto) => ({ puedeAvanzar: !!(proyecto?.design3d?.design3DCompleted && proyecto?.design3d?.breakdownCompleted) });
export const puedeProgramarInstalacion = (proyecto) => ({ puedeAvanzar: !!proyecto?.releasedToInstallations });
export const registrarCambioEnHistorial = (historial, cambio) => [{ id: `H${Date.now()}`, ...cambio, fecha: today(), hora: new Date().toTimeString().slice(0, 5) }, ...(historial || [])];

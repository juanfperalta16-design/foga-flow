import { today } from './dateHelpers';

// ─── Pase de instalación (Contabilidad ↔ Instalaciones) ──────────
// Fábrica terminada: todos los módulos en fase "✓ Terminado".
// Pase abierto: fábrica terminada Y Contabilidad marcó autorizado (cobro en regla).
export const fabricaTerminada = (proyecto) => {
  const mods = proyecto?.production?.modulos || [];
  return mods.length > 0 && mods.every(m => m.produccion?.faseActual === '✓ Terminado');
};

export const paseInstalacionAbierto = (proyecto) => fabricaTerminada(proyecto) && !!proyecto?.contabilidad?.autorizado;

export const calcularEstadoGeneral = (proyecto) => {
  const p   = proyecto || {};
  const d3  = p.design3d     || {};
  const pr  = p.production   || {};
  const in_ = p.installations || {};
  const arch = p.architecture || {};
  const modulos = pr.modulos || [];

  // Finalizado: producción terminada Y la instalación ya se realizó.
  // Terminar producción por sí solo NO es "Finalizado" — todavía falta instalar.
  if (pr.productionFinished) return in_.finalVisitDate ? 'Finalizado' : 'Producción terminada — Pendiente instalación';

  // En producción — solo si realmente hay módulos en fases de producción
  const modsEnProd = modulos.filter(m => m.diseno3d?.liberadoProduccion);
  if (modsEnProd.length > 0) {
    const todosTerminados = modsEnProd.every(m => m.produccion?.faseActual === '✓ Terminado');
    if (todosTerminados && modsEnProd.length === modulos.length) {
      return in_.finalVisitDate ? 'Finalizado' : 'Producción terminada — Pendiente instalación';
    }
    return 'En producción';
  }
  if (pr.status === 'En producción' && d3.releasedToProduction) return 'En producción';

  // Listo para producción
  if (d3.releasedToProduction) return 'Listo para producción';

  // Diseño 3D
  if (p.releasedToDesign3D || modulos.some(m => m.arquitectura?.liberadoA3D)) {
    const modsD3D = modulos.filter(m => m.arquitectura?.liberadoA3D);
    if (modsD3D.some(m => m.diseno3d?.autocadBreakdownStarted)) return 'En Diseño 3D — Despiece';
    if (modsD3D.some(m => m.diseno3d?.solidworksStarted)) return 'En Diseño 3D — SolidWorks';
    if (d3.solidworksStarted) return 'En Diseño 3D';
    return 'Listo para Diseño 3D';
  }

  // Instalaciones
  if (in_.initialTechnicalReportLink) return 'Información técnica recibida';
  if (p.releasedToInstallations) return 'Liberado a Instalaciones';

  // Arquitectura
  if (p.contratoFirmado || p.contratoLink) {
    // Tiene contrato pero aún en arquitectura
    const archStatus = arch.status || '';
    if (archStatus === 'Plano conceptual listo') return 'Plano listo — Pendiente Diseño 3D';
    return 'Proyecto confirmado';
  }

  // Estado desde el estadoGeneral guardado (para proyectos desde prospecto)
  if (p.estadoGeneral === 'Plano listo — Pendiente Diseño 3D') return 'Plano listo — Pendiente Diseño 3D';

  // Sin contrato — según arquitectura
  const archStatus = arch.status || '';
  if (archStatus === 'Plano conceptual listo') return 'Plano listo — Pendiente Diseño 3D';
  if (archStatus.includes('revisión')) return 'En revisión con cliente';
  if (archStatus.includes('aprobad')) return 'Propuesta aprobada';
  if (archStatus.includes('conceptual')) return 'Diseño conceptual en proceso';

  return 'En propuesta';
};

export const reglasDeBloqueo = (proyecto) => {
  const p   = proyecto || {};
  const d3  = p.design3d    || {};
  const in_ = p.installations || {};
  const bloqueos = [];
  const tieneContrato = !!(p.contratoLink || p.contratoFirmado);

  if (!p.releasedToInstallations) {
    bloqueos.push({ departamento: 'Instalaciones', gate: 'Liberación Arquitectura → Instalaciones', motivo: tieneContrato ? 'Arquitectura no ha liberado el proyecto a Instalaciones.' : 'Sin contrato firmado.', accion: 'En Arquitectura → liberar a Instalaciones.', prioridad: tieneContrato ? 'Alta' : 'Normal', bloqueadoPor: 'arquitectura' });
  }
  if (!p.releasedToDesign3D) {
    bloqueos.push({ departamento: 'Diseño 3D', gate: 'Liberación Arquitectura → Diseño 3D', motivo: 'Arquitectura no ha liberado el proyecto a Diseño 3D.', accion: 'En Arquitectura → liberar a Diseño 3D.', prioridad: tieneContrato ? 'Alta' : 'Normal', bloqueadoPor: 'arquitectura' });
  }
  if (!d3.design3DCompleted || !d3.breakdownCompleted) {
    bloqueos.push({ departamento: 'Producción', gate: 'Liberación Diseño 3D → Producción', motivo: !p.releasedToDesign3D ? 'Diseño 3D no ha sido liberado por Arquitectura.' : !d3.design3DCompleted ? 'Modelado SolidWorks no terminado.' : 'Despiece AutoCAD no terminado.', accion: 'En Diseño 3D: completar y marcar listo.', prioridad: p.releasedToDesign3D ? 'Alta' : 'Normal', bloqueadoPor: 'diseno3d' });
  }
  return bloqueos;
};

export const puedeTrabajrar = (proyecto, departamento) => {
  const p = proyecto || {};
  switch (departamento) {
    case 'Arquitectura':  return true;
    case 'Instalaciones': return !!p.releasedToInstallations;
    case 'Diseño 3D':     return !!p.releasedToDesign3D;
    case 'Producción':    return !!(p.design3d?.design3DCompleted && p.design3d?.breakdownCompleted);
    default: return false;
  }
};

export const liberarAInstalaciones = (proyecto, usuario) => {
  if (!proyecto.contratoLink && !proyecto.contratoFirmado) return { ok: false, error: 'Debes cargar el contrato antes de liberar.' };
  const now = new Date().toISOString();
  return { ok: true, cambios: { releasedToInstallations: true, releasedToInstallationsAt: now, estadoGeneral: 'Liberado a Instalaciones', installations: { ...proyecto.installations, status: 'Pendiente primera visita técnica' }, architecture: { ...proyecto.architecture, status: 'Liberado a Instalaciones' }, updatedAt: now }, historial: { date: now.slice(0,10), user: usuario, action: 'Liberado a Instalaciones', previousStatus: proyecto.estadoGeneral, newStatus: 'Liberado a Instalaciones', comment: '' } };
};

export const liberarADiseno3D = (proyecto, usuario) => {
  if (!proyecto.contratoLink && !proyecto.contratoFirmado) return { ok: false, error: 'Debes cargar el contrato antes de liberar.' };
  const now = new Date().toISOString();
  return { ok: true, cambios: { releasedToDesign3D: true, releasedToDesign3DAt: now, estadoGeneral: 'Listo para Diseño 3D', design3d: { ...proyecto.design3d, status: 'Pendiente de modelado' }, architecture: { ...proyecto.architecture, status: 'Listo para Diseño 3D' }, updatedAt: now }, historial: { date: now.slice(0,10), user: usuario, action: 'Liberado a Diseño 3D', previousStatus: proyecto.estadoGeneral, newStatus: 'Listo para Diseño 3D', comment: '' } };
};

export const liberarAProduccion = (proyecto, usuario) => {
  const d3 = proyecto.design3d || {};
  if (!d3.design3DCompleted || !d3.breakdownCompleted) return { ok: false, error: 'Completa el modelado y despiece primero.' };
  const now = new Date().toISOString();
  return { ok: true, cambios: { estadoGeneral: 'Listo para producción', design3d: { ...d3, releasedToProduction: true, releasedToProductionAt: now, status: 'Liberado a Producción' }, production: { ...proyecto.production, status: 'Listo para producción' }, updatedAt: now }, historial: { date: now.slice(0,10), user: usuario, action: 'Liberado a Producción', previousStatus: proyecto.estadoGeneral, newStatus: 'Listo para producción', comment: '' } };
};

export const registrarContrato = (proyecto, contratoLink, usuario) => {
  if (!contratoLink?.trim()) return { ok: false, error: 'El link no puede estar vacío.' };
  const now = new Date().toISOString();
  return { ok: true, cambios: { contratoLink, contratoFirmado: true, contratoUploadedAt: now, estadoGeneral: 'Proyecto confirmado', architecture: { ...proyecto.architecture, status: 'Proyecto confirmado' }, installations: { ...proyecto.installations, status: 'Pendiente liberación de Arquitectura' }, design3d: { ...proyecto.design3d, status: 'Pendiente liberación de Arquitectura' }, updatedAt: now }, historial: { date: now.slice(0,10), user: usuario, action: 'Contrato cargado', previousStatus: proyecto.estadoGeneral, newStatus: 'Proyecto confirmado', comment: `Link: ${contratoLink}` } };
};

export const registrarInformeTecnico = (proyecto, reportLink, usuario) => {
  const now = new Date().toISOString();
  return { ok: true, cambios: { estadoGeneral: 'Información técnica recibida', installations: { ...proyecto.installations, initialTechnicalReportLink: reportLink, status: 'Informe técnico cargado' }, architecture: { ...proyecto.architecture, status: 'Información técnica recibida' }, updatedAt: now }, historial: { date: now.slice(0,10), user: usuario, action: 'Informe técnico cargado', previousStatus: proyecto.estadoGeneral, newStatus: 'Información técnica recibida', comment: `Link: ${reportLink}` } };
};

export const generarAlertasAutomaticas = (proyectos) => {
  const alertas = [];
  const hoy = today();
  (proyectos || []).forEach(p => {
    const tieneContrato = !!(p.contratoLink || p.contratoFirmado);
    if (p.fechaEntrega && p.fechaEntrega < hoy && p.estadoGeneral !== 'Finalizado') {
      alertas.push({ id: `AUTO_${p.id}_atraso`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Sistema', tipo: 'Atrasado', motivo: `Entrega vencida el ${p.fechaEntrega}.`, accionNecesaria: 'Revisar y notificar cliente.', prioridad: 'Urgente', estado: 'Pendiente', fecha: hoy, auto: true });
    }
    if (!p.responsableGeneral) {
      alertas.push({ id: `AUTO_${p.id}_resp`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Sistema', tipo: 'Sin responsable', motivo: 'Proyecto sin responsable general.', accionNecesaria: 'Asignar responsable.', prioridad: 'Alta', estado: 'Pendiente', fecha: hoy, auto: true });
    }
    // Instalaciones: ya liberado a Diseño 3D, se acerca la fecha de instalación
    // y todavía no se registra la visita técnica / verificación de medidas.
    const liberadoA3D = p.releasedToDesign3D || (p.production?.modulos || []).some(m => m.arquitectura?.liberadoA3D);
    if (liberadoA3D && p.fechaEntrega && p.estadoGeneral !== 'Finalizado' && !p.installations?.firstVisitDate) {
      const diasParaInstalar = Math.floor((new Date(p.fechaEntrega) - new Date(hoy)) / 86400000);
      if (diasParaInstalar >= 0 && diasParaInstalar <= 14) {
        alertas.push({ id: `AUTO_${p.id}_visita`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Instalaciones', tipo: 'Visita técnica pendiente', motivo: `Instalación en ${diasParaInstalar}d y todavía no se registra la visita técnica ni las medidas.`, accionNecesaria: 'Instalaciones: agendar visita y verificar medidas antes de la fecha de instalación.', prioridad: diasParaInstalar <= 7 ? 'Urgente' : 'Alta', estado: 'Pendiente', fecha: hoy, auto: true });
      }
    }
    // Por módulo, no por proyecto — antes bastaba con que UN módulo terminara diseño
    // para que la alerta dijera que "el proyecto" estaba listo, aunque el resto siguiera en proceso.
    const modsListosParaProduccion = (p.production?.modulos || []).filter(m => {
      const md3 = m.diseno3d || {};
      const disenoListo = md3.design3DCompleted || md3.solidworksFinished;
      const despieceListo = md3.breakdownCompleted || md3.autocadBreakdownFinished;
      return disenoListo && despieceListo && !md3.liberadoProduccion;
    });
    if (modsListosParaProduccion.length > 0) {
      alertas.push({ id: `AUTO_${p.id}_d3listo`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Diseño 3D', tipo: 'Listo para producción', motivo: `${modsListosParaProduccion.length} módulo${modsListosParaProduccion.length !== 1 ? 's' : ''} con modelado y despiece terminados.`, accionNecesaria: 'Diseño 3D: liberar el/los módulo(s) listos a Producción.', prioridad: 'Urgente', estado: 'Pendiente', fecha: hoy, auto: true });
    }
  });
  return alertas;
};

export const detectarBloqueos    = (proyecto) => reglasDeBloqueo(proyecto).map(b => ({ ...b, etapaBloqueada: b.departamento, accionNecesaria: b.accion, puedeAvanzar: false }));
export const estadoFlujo         = (proyecto) => ({ etapa: proyecto?.estadoGeneral || 'En propuesta', fase: proyecto?.estadoGeneral || 'En propuesta', color: '#7C3AED' });
export const evaluarGates        = detectarBloqueos;
export const puedeIniciarArquitectura  = () => ({ puedeAvanzar: true });
export const puedeIniciarDiseno        = (proyecto) => ({ puedeAvanzar: !!proyecto?.releasedToDesign3D });
export const puedeIniciarProduccion    = (proyecto) => ({ puedeAvanzar: !!(proyecto?.design3d?.design3DCompleted && proyecto?.design3d?.breakdownCompleted) });
export const puedeProgramarInstalacion = (proyecto) => ({ puedeAvanzar: !!proyecto?.releasedToInstallations });
export const registrarCambioEnHistorial = (historial, cambio) => [{ id: `H${Date.now()}`, ...cambio, fecha: today(), hora: new Date().toTimeString().slice(0,5) }, ...(historial || [])];

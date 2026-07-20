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
    // Separado en dos: uno realmente listo para liberar, y otro que le falta
    // específicamente el plano de corte (que es justo lo que bloquea el botón
    // "Liberar a Producción" en Diseño 3D) — antes ambos casos decían lo
    // mismo ("liberar a Producción") aunque el segundo en realidad no se
    // podía liberar todavía, lo cual confundía más de lo que ayudaba.
    const modulosD3D = p.production?.modulos || [];
    const disenoYDespieceListos = (m) => {
      const md3 = m.diseno3d || {};
      const disenoListo   = md3.design3DCompleted || md3.solidworksFinished;
      const despieceListo = md3.breakdownCompleted || md3.autocadBreakdownFinished;
      return disenoListo && despieceListo;
    };
    const modsListosParaProduccion = modulosD3D.filter(m => disenoYDespieceListos(m) && !!m.diseno3d?.planCorteLink && !m.diseno3d?.liberadoProduccion);
    const modsFaltaPlanoCorte      = modulosD3D.filter(m => disenoYDespieceListos(m) && !m.diseno3d?.planCorteLink && !m.diseno3d?.liberadoProduccion);
    if (modsListosParaProduccion.length > 0) {
      alertas.push({ id: `AUTO_${p.id}_d3listo`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Diseño 3D', tipo: 'Listo para producción', motivo: `${modsListosParaProduccion.length} módulo${modsListosParaProduccion.length !== 1 ? 's' : ''} con modelado, despiece y plano de corte listos.`, accionNecesaria: 'Diseño 3D: liberar el/los módulo(s) listos a Producción.', prioridad: 'Urgente', estado: 'Pendiente', fecha: hoy, auto: true });
    }
    if (modsFaltaPlanoCorte.length > 0) {
      alertas.push({ id: `AUTO_${p.id}_d3faltaplano`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Diseño 3D', tipo: 'Falta plano de corte', motivo: `${modsFaltaPlanoCorte.length} módulo${modsFaltaPlanoCorte.length !== 1 ? 's' : ''} con modelado y despiece terminados pero sin plano de corte — no se puede liberar a Producción todavía.`, accionNecesaria: 'Diseño 3D: subir el plano de corte antes de liberar.', prioridad: 'Urgente', estado: 'Pendiente', fecha: hoy, auto: true });
    }
    // Todos los planos de corte del proyecto ya están subidos, pero la
    // carpeta física (se entrega por proyecto completo, no por módulo)
    // todavía no se marcó como entregada al Jefe de Producción.
    const modulosProyecto = p.production?.modulos || [];
    const todosPlanosSubidos = modulosProyecto.length > 0 && modulosProyecto.every(m => !!m.diseno3d?.planCorteLink);
    if (todosPlanosSubidos && !p.diseno3d?.carpetaFisicaEntregada) {
      alertas.push({ id: `AUTO_${p.id}_carpeta`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Diseño 3D', tipo: 'Carpeta física pendiente', motivo: 'Todos los planos de corte están listos.', accionNecesaria: 'Diseño 3D: entregar la carpeta física completa al Jefe de Producción.', prioridad: 'Alta', estado: 'Pendiente', fecha: hoy, auto: true });
    }
    // Arquitectura generó módulos pero no pudo liberar ninguno a Diseño 3D —
    // la causa más común es que faltan medidas confirmadas del cliente/obra.
    // Antes esto solo se veía si alguien entraba manualmente al proyecto en
    // Arquitectura y hacía clic en "Enviar alerta"; ahora se avisa solo, y se
    // le pide ayuda a Instalaciones (puede agendar una visita para verificar
    // o tomar las medidas), no a Diseño 3D (que no puede hacer nada al respecto).
    const modulosArq = p.production?.modulos || [];
    if (modulosArq.length > 0 && !modulosArq.some(m => m.arquitectura?.liberadoA3D) && p.estadoGeneral !== 'Finalizado') {
      alertas.push({ id: `AUTO_${p.id}_bloqueoarq`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Arquitectura', departamentoDestino: 'Instalaciones', tipo: 'Bloqueo Diseño 3D', motivo: 'Los módulos ya fueron generados pero ninguno se pudo liberar a Diseño 3D — probablemente faltan medidas del cliente confirmadas en obra.', accionNecesaria: 'Instalaciones: agendar una visita para verificar o tomar las medidas y ayudar a Arquitectura a confirmar o corregir el plano.', prioridad: 'Alta', estado: 'Pendiente', fecha: hoy, auto: true });
    }
    // Reproceso: Producción encontró un problema de diseño en un módulo ya
    // liberado y lo marcó como reproceso — hay que avisarle a Diseño 3D (al
    // diseñador asignado, si lo hay) para que revise y suba el archivo
    // corregido. No hace falta "resolverla" a mano: en cuanto Diseño 3D marca
    // el reproceso como resuelto (produccion.reproceso vuelve a false), esta
    // alerta deja de generarse sola, igual que el resto de alertas automáticas.
    (p.production?.modulos || []).filter(m => m.produccion?.reproceso).forEach(mod => {
      const disenador = mod.diseno3d?.disenador;
      alertas.push({ id: `AUTO_${p.id}_${mod.id}_reproceso`, proyectoId: p.id, proyecto: p.nombre, cliente: p.cliente, departamentoOrigen: 'Producción', tipo: 'Reproceso de diseño', motivo: `Módulo "${mod.nombre || mod.pec}" marcado en reproceso${mod.produccion?.observaciones ? ` — ${mod.produccion.observaciones}` : ''}.`, accionNecesaria: `Diseño 3D${disenador ? ` (${disenador})` : ' (sin diseñador asignado)'}: revisar y subir el archivo corregido.`, prioridad: 'Urgente', estado: 'Pendiente', fecha: hoy, auto: true });
    });
  });
  return alertas;
};


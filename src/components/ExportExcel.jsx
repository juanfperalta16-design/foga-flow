// =====================================================
// FOGA FLOW — Botón flotante de exportación Excel
// Genera reporte con 3 hojas:
// 1. Resumen general
// 2. Por persona
// 3. Producción detallada
// =====================================================
import { useState } from 'react';
import { useApp } from '../App';
import { Download, X, FileSpreadsheet, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fabricaTerminada, paseInstalacionAbierto } from '../utils/processRules';

function semaforo(fecha) {
  if (!fecha) return 'Sin fecha';
  const d = Math.floor((new Date(fecha) - new Date()) / 86400000);
  if (d < 0)  return `ATRASADO ${Math.abs(d)}d`;
  if (d <= 5) return `URGENTE ${d}d`;
  if (d <= 15) return `PRÓXIMO ${d}d`;
  return `OK ${d}d`;
}

function estado(fecha) {
  if (!fecha) return '—';
  const d = Math.floor((new Date(fecha) - new Date()) / 86400000);
  if (d < 0)  return 'ATRASADO';
  if (d <= 5) return 'URGENTE';
  return 'EN TIEMPO';
}

// Da formato de "tabla" a una hoja: encabezado con filtros desplegables (autofiltro,
// funciona igual que una Tabla de Excel para buscar/filtrar por columna) y el título
// fusionado para que ocupe todo el ancho de datos en vez de verse angosto.
function formatoTabla(ws, { headerRowIdx, lastRowIdx, lastColIdx, tituloRows = [0] }) {
  ws['!merges'] = [
    ...(ws['!merges'] || []),
    ...tituloRows.map(r => ({ s: { r, c: 0 }, e: { r, c: lastColIdx } })),
  ];
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: headerRowIdx, c: 0 }, e: { r: lastRowIdx, c: lastColIdx } }),
  };
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function semanaDelMes(date) {
  const primerDia = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.ceil((date.getDate() + primerDia) / 7);
}

const MESES_NOMBRE = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function ExportExcel() {
  const { proyectos, prospectos, departamentosConfig } = useApp();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  function exportar() {
    setLoading(true);
    setShowMenu(false);

    try {
      const wb = XLSX.utils.book_new();
      const hoy = new Date().toLocaleDateString('es-EC');

      // ── HOJA 1: RESUMEN GENERAL ──────────────────
      const resumenData = [
        ['FOGA FLOW — REPORTE GENERAL', '', '', '', '', '', '', '', ''],
        [`Generado: ${hoy}`, '', '', '', '', '', '', '', ''],
        [''],
        ['PROYECTO', 'CLIENTE', 'PEC', 'LÍNEA', 'VENDEDOR', 'ESTADO', 'PRIORIDAD', 'FECHA ENTREGA', 'DÍAS RESTANTES', 'SEMÁFORO', 'MÓDULOS', 'RESPONSABLE ARQ.', 'DISEÑADOR D3D', 'RESP. INSTALACIONES'],
      ];

      (proyectos || []).forEach(p => {
        const d3       = p.design3d || {};
        const designers = d3.responsables || (d3.responsible ? [d3.responsible] : []);
        const modulos  = p.production?.modulos || [];
        const dias     = p.fechaEntrega ? Math.floor((new Date(p.fechaEntrega) - new Date()) / 86400000) : null;

        resumenData.push([
          p.nombre || '—',
          p.cliente || '—',
          p.numeroContrato || '—',
          p.lineaProyecto || '—',
          p.responsableGeneral || 'Sin asignar',
          p.estadoGeneral || '—',
          p.prioridad || '—',
          p.fechaEntrega || 'Sin fecha',
          dias !== null ? dias : '—',
          dias !== null ? estado(p.fechaEntrega) : '—',
          modulos.length,
          p.architecture?.responsible || 'Sin asignar',
          designers.join(', ') || 'Sin asignar',
          p.installations?.responsible || 'Sin asignar',
        ]);
      });

      const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
      ws1['!cols'] = [30,20,12,15,18,20,10,14,14,12,10,18,20,18].map(w => ({ wch: w }));
      // Estilo encabezado
      ws1['A1'] = { v: `FOGA FLOW — REPORTE GENERAL`, t: 's' };
      formatoTabla(ws1, { headerRowIdx: 3, lastRowIdx: resumenData.length - 1, lastColIdx: 13, tituloRows: [0,1] });
      XLSX.utils.book_append_sheet(wb, ws1, 'Resumen General');

      // ── HOJA 2: POR PERSONA ──────────────────────
      const personaData = [
        ['FOGA FLOW — CARGA DE TRABAJO POR PERSONA', '', '', '', '', '', '', ''],
        [`Generado: ${hoy}`, '', '', '', '', '', '', ''],
        [''],
        ['PERSONA', 'DEPARTAMENTO', 'PROYECTO', 'CLIENTE', 'PEC', 'MÓDULO / ROL', 'ESTADO', 'FECHA ENTREGA DEPT.', 'DÍAS RESTANTES', 'SEMÁFORO'],
      ];

      const personas = {};
      (proyectos || []).filter(p => p.estadoGeneral !== 'Finalizado').forEach(p => {
        const modulos   = p.production?.modulos || [];
        const d3        = p.design3d || {};
        const designers = d3.responsables || (d3.responsible ? [d3.responsible] : []);
        const fechasDepto = p.fechasDepto || {};

        // Arquitectura
        if (p.architecture?.responsible) {
          const nombre = p.architecture.responsible;
          const fecha  = fechasDepto.arquitectura || p.fechaEntrega;
          const dias   = fecha ? Math.floor((new Date(fecha) - new Date()) / 86400000) : null;
          personaData.push([nombre, 'Arquitectura', p.nombre, p.cliente, p.numeroContrato || '—', p.architecture?.status || '—', p.estadoGeneral, fecha || 'Sin fecha', dias !== null ? dias : '—', dias !== null ? estado(fecha) : '—']);
        }

        // Diseño 3D
        designers.forEach(nombre => {
          const fecha = fechasDepto.diseno3d || p.fechaEntrega;
          const dias  = fecha ? Math.floor((new Date(fecha) - new Date()) / 86400000) : null;
          personaData.push([nombre, 'Diseño 3D', p.nombre, p.cliente, p.numeroContrato || '—', d3.status || d3.estado || '—', p.estadoGeneral, fecha || 'Sin fecha', dias !== null ? dias : '—', dias !== null ? estado(fecha) : '—']);
        });

        // Instalaciones
        if (p.installations?.responsible) {
          const nombre = p.installations.responsible;
          const fecha  = fechasDepto.instalaciones || p.fechaEntrega;
          const dias   = fecha ? Math.floor((new Date(fecha) - new Date()) / 86400000) : null;
          personaData.push([nombre, 'Instalaciones', p.nombre, p.cliente, p.numeroContrato || '—', p.installations?.status || '—', p.estadoGeneral, fecha || 'Sin fecha', dias !== null ? dias : '—', dias !== null ? estado(fecha) : '—']);
        }

        // Producción por módulo
        modulos.forEach(mod => {
          if (mod.maestro) {
            const fecha = mod.fechaEntrega || fechasDepto.produccion || p.fechaEntrega;
            const dias  = fecha ? Math.floor((new Date(fecha) - new Date()) / 86400000) : null;
            personaData.push([mod.maestro, 'Producción', p.nombre, p.cliente, mod.pec || '—', mod.nombre || '—', mod.produccion?.faseActual || '—', fecha || 'Sin fecha', dias !== null ? dias : '—', dias !== null ? estado(fecha) : '—']);
          }
        });
      });

      const ws2 = XLSX.utils.aoa_to_sheet(personaData);
      ws2['!cols'] = [20,14,28,20,12,20,18,16,14,12].map(w => ({ wch: w }));
      formatoTabla(ws2, { headerRowIdx: 3, lastRowIdx: personaData.length - 1, lastColIdx: 9, tituloRows: [0,1] });
      XLSX.utils.book_append_sheet(wb, ws2, 'Por Persona');

      // ── HOJA 3: PRODUCCIÓN DETALLADA ─────────────
      const prodData = [
        ['FOGA FLOW — PRODUCCIÓN DETALLADA', '', '', '', '', '', '', '', ''],
        [`Generado: ${hoy}`, '', '', '', '', '', '', '', ''],
        [''],
        ['PROYECTO', 'CLIENTE', 'PEC MÓDULO', 'MÓDULO', 'LÍNEA', 'MAESTRO', 'FASE ACTUAL', 'REPROCESO', 'FECHA ENTREGA', 'DÍAS REST.', 'SEMÁFORO', 'MATERIAL FALTANTE'],
      ];

      (proyectos || []).forEach(p => {
        const modulos = p.production?.modulos || [];
        modulos.forEach(mod => {
          const matFaltante = (mod.materialFaltante || []).filter(m => m.estadoCompra !== '✓ Recibido');
          const fecha = mod.fechaEntrega || p.fechaEntrega;
          const dias  = fecha ? Math.floor((new Date(fecha) - new Date()) / 86400000) : null;
          prodData.push([
            p.nombre || '—',
            p.cliente || '—',
            mod.pec || '—',
            mod.nombre || '—',
            mod.linea || '—',
            mod.maestro || 'Sin asignar',
            mod.produccion?.faseActual || '—',
            mod.produccion?.reproceso ? 'Sí' : 'No',
            fecha || 'Sin fecha',
            dias !== null ? dias : '—',
            dias !== null ? estado(fecha) : '—',
            matFaltante.length > 0 ? matFaltante.map(m => `${m.material} (${m.prioridad})`).join(' | ') : '—',
          ]);
        });
      });

      const ws3 = XLSX.utils.aoa_to_sheet(prodData);
      ws3['!cols'] = [28,20,14,20,14,18,22,12,14,10,12,30].map(w => ({ wch: w }));
      formatoTabla(ws3, { headerRowIdx: 3, lastRowIdx: prodData.length - 1, lastColIdx: 11, tituloRows: [0,1] });
      XLSX.utils.book_append_sheet(wb, ws3, 'Producción Detallada');

      // ── HOJA 4: PROSPECTOS DE DISEÑO ─────────────
      const prosRaw = prospectos || [];
      const prosData = [
        ['FOGA FLOW — PROSPECTOS DE DISEÑO', '', '', '', '', '', '', '', ''],
        [`Generado: ${hoy}`, '', '', '', '', '', '', '', ''],
        [''],
        ['#', 'CLIENTE', 'VENDEDOR', 'DISEÑADORA', 'LÍNEA', 'ESTADO', 'N° CAMBIOS', 'FECHA INGRESO', 'OBSERVACIÓN'],
      ];
      prosRaw.forEach((p, i) => {
        prosData.push([
          i + 1,
          p.cliente || '—',
          p.vendedor || '—',
          p.disenadora || '—',
          p.linea || '—',
          p.convertido ? 'Convertido a proyecto' : (p.estado || '—'),
          p.nCambios || 0,
          p.fechaIngreso || '—',
          p.observacion || '—',
        ]);
      });
      const ws4 = XLSX.utils.aoa_to_sheet(prosData);
      ws4['!cols'] = [5,25,18,18,16,20,12,14,30].map(w => ({ wch: w }));
      formatoTabla(ws4, { headerRowIdx: 3, lastRowIdx: prosData.length - 1, lastColIdx: 8, tituloRows: [0,1] });
      XLSX.utils.book_append_sheet(wb, ws4, 'Prospectos Diseño');

      // ── HOJA 5: ARQUITECTURA DETALLADA ───────────
      const arqData = [
        ['FOGA FLOW — ARQUITECTURA DETALLADA', '', '', '', '', '', '', ''],
        [`Generado: ${hoy}`, '', '', '', '', '', '', ''],
        [''],
        ['PROYECTO', 'CLIENTE', 'PEC', 'RESPONSABLE', 'ESTADO', 'CHECKLIST', 'MÓDULOS LIBERADOS A D3D', 'OBSERVACIONES'],
      ];
      (proyectos || []).filter(p => p.estadoGeneral !== 'Finalizado').forEach(p => {
        const arch = p.architecture || {};
        const checklist = arch.checklist || {};
        const pasos = ['propuestaInicial','borradorConceptual','enviadoAVentas','ajustesRealizados','planosAprobados'];
        const pasosOk = pasos.filter(k => checklist[k]).length;
        const modulos = p.production?.modulos || [];
        const liberados = modulos.filter(m => m.arquitectura?.liberadoA3D).length;
        arqData.push([
          p.nombre || '—', p.cliente || '—', p.numeroContrato || '—',
          arch.responsible || 'Sin asignar', arch.status || '—',
          `${pasosOk}/${pasos.length}`,
          modulos.length > 0 ? `${liberados}/${modulos.length}` : '—',
          arch.observations || '—',
        ]);
      });
      const ws5 = XLSX.utils.aoa_to_sheet(arqData);
      ws5['!cols'] = [28,20,12,18,26,12,20,30].map(w => ({ wch: w }));
      formatoTabla(ws5, { headerRowIdx: 3, lastRowIdx: arqData.length - 1, lastColIdx: 7, tituloRows: [0,1] });
      XLSX.utils.book_append_sheet(wb, ws5, 'Arquitectura Detallada');

      // ── HOJA 6: DISEÑO 3D DETALLADA ──────────────
      const d3Data = [
        ['FOGA FLOW — DISEÑO 3D DETALLADA', '', '', '', '', '', '', '', ''],
        [`Generado: ${hoy}`, '', '', '', '', '', '', '', ''],
        [''],
        ['PROYECTO', 'CLIENTE', 'PEC MÓDULO', 'MÓDULO', 'DISEÑADOR(ES)', 'SOLIDWORKS', 'DESPIECE', 'PLAN DE CORTE', 'LIBERADO A PRODUCCIÓN'],
      ];
      (proyectos || []).forEach(p => {
        const d3 = p.design3d || {};
        const designers = (d3.responsables || (d3.responsible ? [d3.responsible] : [])).join(', ') || 'Sin asignar';
        (p.production?.modulos || []).filter(m => m.arquitectura?.liberadoA3D).forEach(mod => {
          const md3 = mod.diseno3d || {};
          d3Data.push([
            p.nombre || '—', p.cliente || '—', mod.pec || '—', mod.nombre || '—', designers,
            md3.solidworksFinished ? 'Terminado' : md3.solidworksStarted ? 'En proceso' : 'Pendiente',
            md3.autocadBreakdownFinished ? 'Terminado' : md3.autocadBreakdownStarted ? 'En proceso' : 'Pendiente',
            md3.planCorteLink ? 'Cargado' : 'Pendiente',
            md3.liberadoProduccion ? 'Sí' : 'No',
          ]);
        });
      });
      const ws6 = XLSX.utils.aoa_to_sheet(d3Data);
      ws6['!cols'] = [28,20,14,20,20,14,14,14,20].map(w => ({ wch: w }));
      formatoTabla(ws6, { headerRowIdx: 3, lastRowIdx: d3Data.length - 1, lastColIdx: 8, tituloRows: [0,1] });
      XLSX.utils.book_append_sheet(wb, ws6, 'Diseño 3D Detallada');

      // ── HOJA 7: INSTALACIONES DETALLADA ──────────
      const instData = [
        ['FOGA FLOW — INSTALACIONES DETALLADA', '', '', '', '', '', '', '', ''],
        [`Generado: ${hoy}`, '', '', '', '', '', '', '', ''],
        [''],
        ['PROYECTO', 'CLIENTE', 'RESPONSABLE', '1ª VISITA', 'INFORME TÉCNICO / MEDIDAS', '2ª VISITA', 'OBRA LISTA', 'INSTALACIÓN REALIZADA', 'FECHA INSTALACIÓN'],
      ];
      (proyectos || []).filter(p => p.releasedToInstallations || p.releasedToDesign3D || (p.production?.modulos||[]).some(m => m.arquitectura?.liberadoA3D)).forEach(p => {
        const inst = p.installations || {};
        instData.push([
          p.nombre || '—', p.cliente || '—', inst.responsible || 'Sin asignar',
          inst.firstVisitDate || '—',
          inst.initialTechnicalReportLink ? 'Cargado' : 'Pendiente',
          inst.secondVisitDate || '—',
          inst.siteReady ? 'Sí' : 'No',
          inst.finalVisitDate || 'Pendiente',
          p.fechaEntrega || 'Sin fecha',
        ]);
      });
      const ws7 = XLSX.utils.aoa_to_sheet(instData);
      ws7['!cols'] = [28,20,20,14,22,14,12,20,16].map(w => ({ wch: w }));
      formatoTabla(ws7, { headerRowIdx: 3, lastRowIdx: instData.length - 1, lastColIdx: 8, tituloRows: [0,1] });
      XLSX.utils.book_append_sheet(wb, ws7, 'Instalaciones Detallada');

      // ── HOJA 7B: CONTABILIDAD — PASE DE INSTALACIÓN ──
      const contData = [
        ['FOGA FLOW — CONTABILIDAD · PASE DE INSTALACIÓN', '', '', '', '', '', ''],
        [`Generado: ${hoy}`, '', '', '', '', '', ''],
        [''],
        ['PROYECTO', 'CLIENTE', 'PEC', 'FECHA INSTALACIÓN', 'FÁBRICA TERMINADA', 'AUTORIZADO CONTABILIDAD', 'PASE'],
      ];
      (proyectos || []).filter(p => p.estadoGeneral !== 'Finalizado').forEach(p => {
        const aut = !!p.contabilidad?.autorizado;
        contData.push([
          p.nombre || '—', p.cliente || '—', p.numeroContrato || '—',
          p.fechaEntrega || 'Sin fecha',
          fabricaTerminada(p) ? 'Sí' : 'No',
          aut ? `Sí (${p.contabilidad?.autorizadoPor || '—'})` : 'No',
          paseInstalacionAbierto(p) ? 'ABIERTO' : 'SIN PASE',
        ]);
      });
      const wsC = XLSX.utils.aoa_to_sheet(contData);
      wsC['!cols'] = [28,20,12,16,16,26,12].map(w => ({ wch: w }));
      formatoTabla(wsC, { headerRowIdx: 3, lastRowIdx: contData.length - 1, lastColIdx: 6, tituloRows: [0,1] });
      XLSX.utils.book_append_sheet(wb, wsC, 'Contabilidad');

      // ── HOJA 8: REGISTRO DE DISEÑO DE OBJETO ─────
      // Un renglón por módulo con fecha de diseño registrada (ML = largo en metros)
      const registro = [];
      (proyectos || []).forEach(p => {
        (p.production?.modulos || []).forEach(mod => {
          const d3 = mod.diseno3d || {};
          const prod = mod.produccion || {};
          if (!d3.fechaDiseno) return;
          const f = new Date(d3.fechaDiseno);
          registro.push({
            fechaDiseno: d3.fechaDiseno,
            // La validación y el reproceso los marca Producción, cuando la pieza ya está en planta —
            // Diseño 3D solo registra que diseñó el módulo.
            fechaValidacionJP: prod.fechaValidacionJP || '',
            semanaIso: isoWeek(f),
            anio: f.getFullYear(),
            mes: f.getMonth() + 1,
            semanaMes: semanaDelMes(f),
            disenador: d3.disenador || 'Sin asignar',
            linea: mod.linea || '—',
            pec: mod.pec || '—',
            clienteModulo: `${mod.nombre || 'Módulo'} - ${p.cliente || p.nombre || '—'}`,
            ml: mod.largo ? Number(mod.largo) / 100 : 0,
            estado: prod.reproceso ? 'Reproceso' : (prod.fechaValidacionJP ? 'Validado' : ''),
            observaciones: d3.observaciones || '',
          });
        });
      });
      registro.sort((a,b) => a.fechaDiseno.localeCompare(b.fechaDiseno));

      const regData = [
        ['FOGA · REGISTRO DE DISEÑO DE OBJETO · el metro cuenta como BUENO solo cuando JP valida el equipo YA EN PRODUCCION', '', '', '', '', '', '', '', '', '', '', ''],
        [''],
        ['FECHA DISEÑO', 'FECHA VALIDACIÓN JP', 'SEMANA ISO', 'AÑO', 'MES', 'SEMANA DEL MES', 'DISEÑADOR', 'LINEA', 'CODIGO / PEC', 'CLIENTE / MODULO', 'ML', 'ESTADO', 'OBSERVACIONES'],
      ];
      registro.forEach(r => regData.push([
        r.fechaDiseno, r.fechaValidacionJP, r.semanaIso, r.anio, r.mes, r.semanaMes,
        r.disenador, r.linea, r.pec, r.clienteModulo, Number(r.ml.toFixed(2)), r.estado, r.observaciones,
      ]));
      const ws8 = XLSX.utils.aoa_to_sheet(regData);
      ws8['!cols'] = [12,14,10,8,8,12,14,10,14,40,8,12,30].map(w => ({ wch: w }));
      formatoTabla(ws8, { headerRowIdx: 2, lastRowIdx: regData.length - 1, lastColIdx: 12 });
      XLSX.utils.book_append_sheet(wb, ws8, 'Registro Diseño Objeto');

      // ── HOJA 9 y 10: RESUMEN DEL MES (semana / diseñador) ──
      // Se calcula sobre el mes actual, igual que el reporte físico del jefe.
      const ahora = new Date();
      const delMesActual = registro.filter(r => {
        const f = new Date(r.fechaDiseno);
        return f.getFullYear() === ahora.getFullYear() && f.getMonth() === ahora.getMonth();
      });

      function resumenDe(lista) {
        const generados  = lista.reduce((s,r) => s + r.ml, 0);
        const validados  = lista.filter(r => r.fechaValidacionJP).reduce((s,r) => s + r.ml, 0);
        const reproceso  = lista.filter(r => r.estado === 'Reproceso').reduce((s,r) => s + r.ml, 0);
        const pendiente  = Math.max(0, generados - validados - reproceso);
        const pctValidado = generados > 0 ? (validados / generados) * 100 : 0;
        return { generados, validados, reproceso, pendiente, pctValidado };
      }

      // Por semana del mes
      const semData = [
        [`FOGA FLOW — RESUMEN DEL MES POR SEMANA (${MESES_NOMBRE[ahora.getMonth()]} ${ahora.getFullYear()})`, '', '', '', ''],
        [''],
        ['SEMANA DEL MES', 'GENERADOS (ML)', 'VALIDADOS (ML)', 'REPROCESO (ML)', 'PENDIENTE (ML)', '% VALIDADO'],
      ];
      for (let s = 1; s <= 5; s++) {
        const r = resumenDe(delMesActual.filter(x => x.semanaMes === s));
        if (r.generados === 0 && s > 4) continue;
        semData.push([`Semana ${s}`, r.generados.toFixed(2), r.validados.toFixed(2) || '-', r.reproceso.toFixed(2) || '-', r.pendiente.toFixed(2), `${r.pctValidado.toFixed(1)}%`]);
      }
      const totalMes = resumenDe(delMesActual);
      semData.push(['TOTAL MES', totalMes.generados.toFixed(2), totalMes.validados.toFixed(2), totalMes.reproceso.toFixed(2), totalMes.pendiente.toFixed(2), `${totalMes.pctValidado.toFixed(1)}%`]);
      const ws9 = XLSX.utils.aoa_to_sheet(semData);
      ws9['!cols'] = [16,16,16,16,16,12].map(w => ({ wch: w }));
      formatoTabla(ws9, { headerRowIdx: 2, lastRowIdx: semData.length - 1, lastColIdx: 5 });
      XLSX.utils.book_append_sheet(wb, ws9, 'Resumen Mes-Semana');

      // Por diseñador, con meta y semáforo
      const deptD3D = (departamentosConfig || []).find(d => d.nombre === 'Diseño 3D');
      const metaMes = Number(deptD3D?.metaMensualML) || 0;
      const disenadores = [...new Set(delMesActual.map(r => r.disenador))].sort();
      const disData = [
        [`FOGA FLOW — RESUMEN DEL MES POR DISEÑADOR (${MESES_NOMBRE[ahora.getMonth()]} ${ahora.getFullYear()})`, '', '', '', '', '', ''],
        [''],
        ['DISEÑADOR', 'GENERADOS (ML)', 'VALIDADOS (ML)', 'REPROCESO (ML)', 'PENDIENTE (ML)', 'META MES (ML)', '% vs META', 'SEMAFORO'],
      ];
      disenadores.forEach(nombre => {
        const r = resumenDe(delMesActual.filter(x => x.disenador === nombre));
        const pctMeta = metaMes > 0 ? (r.generados / metaMes) * 100 : 0;
        const sem = pctMeta >= 100 ? 'VERDE' : pctMeta >= 70 ? 'AMARILLO' : 'ROJO';
        disData.push([nombre, r.generados.toFixed(2), r.validados.toFixed(2) || '-', r.reproceso.toFixed(2) || '-', r.pendiente.toFixed(2), metaMes.toFixed(2), `${pctMeta.toFixed(1)}%`, sem]);
      });
      const totalDis = resumenDe(delMesActual);
      const metaTotal = metaMes * disenadores.length;
      const pctMetaTotal = metaTotal > 0 ? (totalDis.generados / metaTotal) * 100 : 0;
      disData.push(['TOTAL', totalDis.generados.toFixed(2), totalDis.validados.toFixed(2), totalDis.reproceso.toFixed(2), totalDis.pendiente.toFixed(2), metaTotal.toFixed(2), `${pctMetaTotal.toFixed(1)}%`, '']);
      const ws10 = XLSX.utils.aoa_to_sheet(disData);
      ws10['!cols'] = [16,16,16,16,16,14,12,12].map(w => ({ wch: w }));
      formatoTabla(ws10, { headerRowIdx: 2, lastRowIdx: disData.length - 1, lastColIdx: 7 });
      XLSX.utils.book_append_sheet(wb, ws10, 'Resumen Mes-Diseñador');

      // ── DESCARGAR ─────────────────────────────────
      const fecha = new Date().toISOString().slice(0,10);
      XLSX.writeFile(wb, `FOGA_Flow_Reporte_${fecha}.xlsx`);

    } catch(err) {
      console.error('Error exportando:', err);
      alert('Error al generar el Excel. Verifica que xlsx esté instalado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setShowMenu(v => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #16A34A, #15803D)',
          border: '2px solid #16A34A60',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px #16A34A40',
          transition: 'all .2s',
        }}
        title="Exportar Excel"
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {loading ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <FileSpreadsheet size={20} />}
      </button>

      {/* Menú */}
      {showMenu && (
        <div style={{
          position: 'fixed', bottom: 86, right: 24, zIndex: 1000,
          background: '#161820', border: '1px solid #1E2433',
          borderRadius: 14, padding: '16px 18px', minWidth: 260,
          boxShadow: '0 8px 40px #00000060',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>Exportar reporte</div>
            <button onClick={() => setShowMenu(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 14 }}>
            Genera un Excel con control total de la empresa, en 11 hojas:
          </div>
          {[
            { icon: '📊', label: 'Resumen general',    desc: 'Todos los proyectos con estado y fechas' },
            { icon: '👤', label: 'Por persona',         desc: 'Carga de trabajo por responsable' },
            { icon: '🏭', label: 'Producción',          desc: 'Módulos, fases y material faltante' },
            { icon: '✏️', label: 'Prospectos',           desc: 'Prospectos de diseño en proceso' },
            { icon: '📐', label: 'Arquitectura',         desc: 'Checklist, contrato y liberación a D3D' },
            { icon: '🖥️', label: 'Diseño 3D',            desc: 'SolidWorks, despiece y plan de corte' },
            { icon: '🔧', label: 'Instalaciones',        desc: 'Visitas, medidas y obra lista' },
            { icon: '💲', label: 'Contabilidad',          desc: 'Fábrica terminada, autorización y pase' },
            { icon: '📋', label: 'Registro Diseño Objeto', desc: 'Por módulo: fecha, validación JP, ML' },
            { icon: '📅', label: 'Resumen Mes-Semana',   desc: 'ML generados/validados por semana' },
            { icon: '🎯', label: 'Resumen Mes-Diseñador', desc: 'ML por diseñador vs. meta, con semáforo' },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #1E2433' }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#E2E8F0' }}>{label}</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>{desc}</div>
              </div>
            </div>
          ))}
          <button onClick={exportar} disabled={loading}
            style={{ marginTop: 14, width: '100%', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Download size={14} />
            {loading ? 'Generando...' : 'Descargar Excel'}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// =====================================================
// FOGA FLOW — Botón flotante de exportación Excel
// Genera reporte con 12 hojas, con encabezados y semáforos
// (rojo/amarillo/verde) coloreados igual que la planilla de referencia.
// =====================================================
import { useState } from 'react';
import { useApp } from '../App';
import { Download, X, FileSpreadsheet, Loader } from 'lucide-react';
import ExcelJS from 'exceljs';
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

// ── Estilo de hojas ──────────────────────────────────
const COLORES = {
  rojo:     { bg: 'FFFCA5A5', font: 'FF7F1D1D' },
  amarillo: { bg: 'FFFDE68A', font: 'FF78350F' },
  verde:    { bg: 'FF86EFAC', font: 'FF14532D' },
  gris:     { bg: 'FFE2E8F0', font: 'FF475569' },
};

function estiloTitulo(cell) {
  cell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1117' } };
  cell.alignment = { vertical: 'middle' };
}

function estiloSubtitulo(cell) {
  cell.font = { italic: true, size: 9, color: { argb: 'FF94A3B8' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1117' } };
}

function estiloEncabezados(row, numCols) {
  for (let i = 1; i <= numCols; i++) {
    const cell = row.getCell(i);
    cell.font = { bold: true, color: { argb: 'FFF1F5F9' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E2433' } };
    cell.alignment = { vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF334155' } } };
  }
}

function aplicarColorClase(cell, clase) {
  const c = COLORES[clase];
  if (!c) return;
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.bg } };
  cell.font = { bold: true, color: { argb: c.font } };
}

// Busca una columna por el texto de su encabezado y colorea cada celda
// de datos debajo de ella según lo que devuelva `classifier(valor)`.
function pintarColumna(sheet, headerRow, headerLabel, classifier) {
  let colIdx = null;
  headerRow.eachCell((cell, idx) => { if (cell.value === headerLabel) colIdx = idx; });
  if (!colIdx) return;
  for (let r = headerRow.number + 1; r <= sheet.rowCount; r++) {
    const cell = sheet.getRow(r).getCell(colIdx);
    const clase = classifier(cell.value);
    if (clase) aplicarColorClase(cell, clase);
  }
}

function negritaFila(sheet, rowNumber, numCols) {
  const row = sheet.getRow(rowNumber);
  for (let i = 1; i <= numCols; i++) row.getCell(i).font = { bold: true };
}

// ── Clasificadores de semáforo por columna ───────────
const claseSemaforoTexto = (v) => {
  const t = String(v || '').toUpperCase();
  if (t.startsWith('ATRASADO') || t.startsWith('URGENTE')) return 'rojo';
  if (t.startsWith('PRÓXIMO') || t.startsWith('PROXIMO')) return 'amarillo';
  if (t.startsWith('OK')) return 'verde';
  return null;
};
const claseEstadoTexto = (v) => {
  const t = String(v || '').toUpperCase();
  if (t === 'ATRASADO' || t === 'URGENTE') return 'rojo';
  if (t === 'EN TIEMPO') return 'verde';
  return null;
};
const clasePase = (v) => {
  const t = String(v || '').toUpperCase();
  if (t === 'ABIERTO') return 'verde';
  if (t === 'SIN PASE') return 'rojo';
  return null;
};
const claseSiNo = (v) => {
  const t = String(v || '').toUpperCase();
  if (t.startsWith('SÍ') || t.startsWith('SI')) return 'verde';
  if (t === 'NO') return 'gris';
  return null;
};
const claseReproceso = (v) => {
  const t = String(v || '').toUpperCase();
  if (t === 'SÍ' || t === 'SI') return 'rojo';
  if (t === 'NO') return 'verde';
  return null;
};
const claseProgreso = (v) => {
  const t = String(v || '').toUpperCase();
  if (t === 'TERMINADO' || t === 'CARGADO') return 'verde';
  if (t === 'EN PROCESO') return 'amarillo';
  if (t === 'PENDIENTE') return 'rojo';
  return null;
};
const claseRegistroEstado = (v) => {
  const t = String(v || '').toUpperCase();
  if (t === 'REPROCESO') return 'rojo';
  if (t === 'VALIDADO') return 'verde';
  return null;
};
const claseSemaforoLiteral = (v) => {
  const t = String(v || '').toUpperCase();
  if (t === 'ROJO') return 'rojo';
  if (t === 'AMARILLO') return 'amarillo';
  if (t === 'VERDE') return 'verde';
  return null;
};
const claseProspectoEstado = (v) => (v === 'Convertido a proyecto' ? 'verde' : null);
const claseEtapaGeneral = (v) => {
  const t = String(v || '').toUpperCase();
  if (t.includes('BLOQUEADO')) return 'gris';
  if (t.includes('TERMINADO') || t.includes('LIBERADO') || t.includes('REALIZADA') || t === 'FINALIZADO') return 'verde';
  if (t.includes('EN ') || t.includes('PENDIENTE')) return 'amarillo';
  return null;
};
const claseDiasSinAvanzar = (v) => {
  const n = Number(v);
  if (v === '—' || isNaN(n)) return null;
  if (n >= 15) return 'rojo';
  if (n >= 7) return 'amarillo';
  return 'verde';
};

// Crea una hoja con título (fusionado), fecha de generación opcional,
// fila en blanco y encabezados con autofiltro — devuelve la hoja y la
// fila de encabezados (para poder pintar columnas después).
function nuevaHoja(wb, nombre, titulo, headers, anchos, { conGenerado = true } = {}) {
  const sheet = wb.addWorksheet(nombre);
  sheet.columns = anchos.map(w => ({ width: w }));
  const numCols = headers.length;

  const rowTitulo = sheet.addRow([titulo]);
  sheet.mergeCells(rowTitulo.number, 1, rowTitulo.number, numCols);
  estiloTitulo(rowTitulo.getCell(1));

  if (conGenerado) {
    const rowGen = sheet.addRow([`Generado: ${new Date().toLocaleDateString('es-EC')}`]);
    sheet.mergeCells(rowGen.number, 1, rowGen.number, numCols);
    estiloSubtitulo(rowGen.getCell(1));
  }

  sheet.addRow([]);

  const rowHeader = sheet.addRow(headers);
  estiloEncabezados(rowHeader, numCols);
  sheet.autoFilter = { from: { row: rowHeader.number, column: 1 }, to: { row: rowHeader.number, column: numCols } };

  return { sheet, rowHeader };
}

export default function ExportExcel() {
  const { proyectos, prospectos, departamentosConfig } = useApp();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  async function exportar() {
    setLoading(true);
    setShowMenu(false);

    try {
      const wb = new ExcelJS.Workbook();

      // ── HOJA 1: RESUMEN GENERAL ──────────────────
      const headers1 = ['PROYECTO', 'CLIENTE', 'PEC', 'LÍNEA', 'VENDEDOR', 'ESTADO', 'PRIORIDAD', 'FECHA ENTREGA', 'DÍAS RESTANTES', 'SEMÁFORO', 'MÓDULOS', 'RESPONSABLE ARQ.', 'DISEÑADOR D3D', 'RESP. INSTALACIONES'];
      const { sheet: ws1, rowHeader: hdr1 } = nuevaHoja(wb, 'Resumen General', 'FOGA FLOW — REPORTE GENERAL', headers1, [30,20,12,15,18,20,10,14,14,12,10,18,20,18]);

      (proyectos || []).forEach(p => {
        const d3       = p.design3d || {};
        const designers = d3.responsables || (d3.responsible ? [d3.responsible] : []);
        const modulos  = p.production?.modulos || [];
        const dias     = p.fechaEntrega ? Math.floor((new Date(p.fechaEntrega) - new Date()) / 86400000) : null;

        ws1.addRow([
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
      pintarColumna(ws1, hdr1, 'SEMÁFORO', claseSemaforoTexto);

      // ── HOJA 1B: FLUJO GENERAL ───────────────────
      // Un renglón por módulo con las 4 etapas (Arquitectura → Diseño 3D →
      // Producción → Instalaciones) y en qué estado está cada una, más una
      // columna "ETAPA ACTUAL" con el resumen de dónde está parado hoy
      // (ej. "Producción — 3. Plegado") — para ver todo el panorama sin
      // tener que cruzar las 4 hojas detalladas por departamento.
      const headers1B = ['PROYECTO', 'CLIENTE', 'PEC MÓDULO', 'MÓDULO', 'LÍNEA', 'ARQUITECTURA', 'DISEÑO 3D', 'PRODUCCIÓN', 'INSTALACIONES', 'ETAPA ACTUAL'];
      const { sheet: ws1B, rowHeader: hdr1B } = nuevaHoja(wb, 'Flujo General', 'FOGA FLOW — FLUJO GENERAL POR MÓDULO', headers1B, [28,20,14,20,12,20,20,20,20,26]);

      (proyectos || []).filter(p => p.estadoGeneral !== 'Finalizado').forEach(p => {
        const inst = p.installations || {};
        const instEstado = inst.finalVisitDate ? 'Instalación realizada'
          : inst.secondVisitDate ? '2ª visita hecha'
          : inst.firstVisitDate  ? '1ª visita hecha'
          : (p.releasedToInstallations || p.releasedToDesign3D) ? 'Pendiente visita'
          : 'Bloqueado';

        (p.production?.modulos || []).forEach(mod => {
          const arch = mod.arquitectura || {};
          const md3  = mod.diseno3d || {};
          const liberadoA3D = !!arch.liberadoA3D;

          const arqEstado = liberadoA3D ? 'Liberado a D3D' : (arch.estado || 'En proceso');

          const d3Estado = !liberadoA3D ? 'Bloqueado'
            : md3.liberadoProduccion       ? 'Liberado a Producción'
            : md3.autocadBreakdownFinished ? 'Despiece terminado'
            : md3.autocadBreakdownStarted  ? 'En despiece'
            : md3.solidworksFinished       ? 'SolidWorks terminado'
            : md3.solidworksStarted        ? 'En SolidWorks'
            : 'Pendiente';

          const prodEstado = !md3.liberadoProduccion ? 'Bloqueado' : (mod.produccion?.faseActual || '1. Despacho Materia Prima');

          const etapaActual =
            (prodEstado === '✓ Terminado' && instEstado === 'Instalación realizada') ? 'Finalizado'
            : md3.liberadoProduccion ? `Producción — ${prodEstado}`
            : liberadoA3D            ? `Diseño 3D — ${d3Estado}`
            : `Arquitectura — ${arqEstado}`;

          ws1B.addRow([
            p.nombre || '—', p.cliente || '—', mod.pec || '—', mod.nombre || '—', mod.linea || p.lineaProyecto || '—',
            arqEstado, d3Estado, prodEstado, instEstado, etapaActual,
          ]);
        });
      });
      pintarColumna(ws1B, hdr1B, 'ARQUITECTURA', claseEtapaGeneral);
      pintarColumna(ws1B, hdr1B, 'DISEÑO 3D', claseEtapaGeneral);
      pintarColumna(ws1B, hdr1B, 'PRODUCCIÓN', claseEtapaGeneral);
      pintarColumna(ws1B, hdr1B, 'INSTALACIONES', claseEtapaGeneral);
      pintarColumna(ws1B, hdr1B, 'ETAPA ACTUAL', claseEtapaGeneral);

      // ── HOJA 2: POR PERSONA ──────────────────────
      const headers2 = ['PERSONA', 'DEPARTAMENTO', 'PROYECTO', 'CLIENTE', 'PEC', 'MÓDULO / ROL', 'ESTADO', 'FECHA ENTREGA DEPT.', 'DÍAS RESTANTES', 'SEMÁFORO'];
      const { sheet: ws2, rowHeader: hdr2 } = nuevaHoja(wb, 'Por Persona', 'FOGA FLOW — CARGA DE TRABAJO POR PERSONA', headers2, [20,14,28,20,12,20,18,16,14,12]);

      (proyectos || []).filter(p => p.estadoGeneral !== 'Finalizado').forEach(p => {
        const modulos   = p.production?.modulos || [];
        const d3        = p.design3d || {};
        const designers = d3.responsables || (d3.responsible ? [d3.responsible] : []);
        const fechasDepto = p.fechasDepto || {};

        if (p.architecture?.responsible) {
          const nombre = p.architecture.responsible;
          const fecha  = fechasDepto.arquitectura || p.fechaEntrega;
          const dias   = fecha ? Math.floor((new Date(fecha) - new Date()) / 86400000) : null;
          ws2.addRow([nombre, 'Arquitectura', p.nombre, p.cliente, p.numeroContrato || '—', p.architecture?.status || '—', p.estadoGeneral, fecha || 'Sin fecha', dias !== null ? dias : '—', dias !== null ? estado(fecha) : '—']);
        }

        designers.forEach(nombre => {
          const fecha = fechasDepto.diseno3d || p.fechaEntrega;
          const dias  = fecha ? Math.floor((new Date(fecha) - new Date()) / 86400000) : null;
          ws2.addRow([nombre, 'Diseño 3D', p.nombre, p.cliente, p.numeroContrato || '—', d3.status || d3.estado || '—', p.estadoGeneral, fecha || 'Sin fecha', dias !== null ? dias : '—', dias !== null ? estado(fecha) : '—']);
        });

        if (p.installations?.responsible) {
          const nombre = p.installations.responsible;
          const fecha  = fechasDepto.instalaciones || p.fechaEntrega;
          const dias   = fecha ? Math.floor((new Date(fecha) - new Date()) / 86400000) : null;
          ws2.addRow([nombre, 'Instalaciones', p.nombre, p.cliente, p.numeroContrato || '—', p.installations?.status || '—', p.estadoGeneral, fecha || 'Sin fecha', dias !== null ? dias : '—', dias !== null ? estado(fecha) : '—']);
        }

        modulos.forEach(mod => {
          if (mod.maestro) {
            const fecha = mod.fechaEntrega || fechasDepto.produccion || p.fechaEntrega;
            const dias  = fecha ? Math.floor((new Date(fecha) - new Date()) / 86400000) : null;
            ws2.addRow([mod.maestro, 'Producción', p.nombre, p.cliente, mod.pec || '—', mod.nombre || '—', mod.produccion?.faseActual || '—', fecha || 'Sin fecha', dias !== null ? dias : '—', dias !== null ? estado(fecha) : '—']);
          }
        });
      });
      pintarColumna(ws2, hdr2, 'SEMÁFORO', claseSemaforoTexto);

      // ── HOJA 3: PRODUCCIÓN DETALLADA ─────────────
      const headers3 = ['PROYECTO', 'CLIENTE', 'PEC MÓDULO', 'MÓDULO', 'LÍNEA', 'MAESTRO', 'FASE ACTUAL', 'REPROCESO', 'FECHA ENTREGA', 'DÍAS REST.', 'SEMÁFORO', 'MATERIAL FALTANTE'];
      const { sheet: ws3, rowHeader: hdr3 } = nuevaHoja(wb, 'Producción Detallada', 'FOGA FLOW — PRODUCCIÓN DETALLADA', headers3, [28,20,14,20,14,18,22,12,14,10,12,30]);

      (proyectos || []).forEach(p => {
        const modulos = p.production?.modulos || [];
        const fechaDeptoProd = p.fechasDepto?.produccion;
        modulos.forEach(mod => {
          const matFaltante = (mod.materialFaltante || []).filter(m => m.estadoCompra !== '✓ Recibido');
          // Prioridad: fecha propia del módulo > fecha que Producción planificó
          // en su calendario de departamento > fecha de instalación general.
          const fecha = mod.fechaEntrega || fechaDeptoProd || p.fechaEntrega;
          const dias  = fecha ? Math.floor((new Date(fecha) - new Date()) / 86400000) : null;
          ws3.addRow([
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
      pintarColumna(ws3, hdr3, 'SEMÁFORO', claseSemaforoTexto);
      pintarColumna(ws3, hdr3, 'REPROCESO', claseReproceso);

      // ── HOJA 4: PROSPECTOS DE DISEÑO (Y CONTROL DE BORRADORES) ──
      // Antes eran dos hojas separadas ("Prospectos Diseño" y "Control
      // Borradores Arq.") que repetían cliente/diseñadora/vendedor/línea/
      // estado/fecha ingreso/observación casi idénticos — se fusionan en
      // una sola con todo junto: datos del prospecto + fecha de cada paso
      // del checklist + días sin avanzar.
      const headers4 = ['#', 'CLIENTE', 'VENDEDOR', 'DISEÑADORA', 'LÍNEA', 'ESTADO', 'N° CAMBIOS', 'FECHA INGRESO', '1. PROPUESTA INICIAL', '2. BORRADOR CONCEPTUAL', '3. ENVIADO A VENTAS', '4. AJUSTES REALIZADOS', '5. PLANOS APROBADOS', 'DÍAS SIN AVANZAR', 'OBSERVACIÓN'];
      const { sheet: ws4, rowHeader: hdr4 } = nuevaHoja(wb, 'Prospectos Diseño', 'FOGA FLOW — PROSPECTOS DE DISEÑO', headers4, [5,25,18,18,16,20,12,14,16,18,16,16,16,14,30]);

      const hoyStr = new Date().toISOString().slice(0,10);
      (prospectos || []).forEach((p, i) => {
        const ch = p.checklist || {};
        const pasos = ['propuestaInicial','borradorConceptual','enviadoAVentas','ajustesRealizados','planosAprobados'];
        const fechas = pasos.map(id => ch[`${id}Fecha`]).filter(Boolean);
        const ultimoAvance = fechas.length ? fechas.sort().at(-1) : p.fechaIngreso;
        const diasSinAvanzar = (p.convertido || ch.planosAprobados || !ultimoAvance) ? '—'
          : Math.floor((new Date(hoyStr) - new Date(ultimoAvance)) / 86400000);
        ws4.addRow([
          i + 1,
          p.cliente || '—',
          p.vendedor || '—',
          p.disenadora || '—',
          p.linea || '—',
          p.convertido ? 'Convertido a proyecto' : (p.estado || '—'),
          p.nCambios || 0,
          p.fechaIngreso || '—',
          ch.propuestaInicialFecha   || (ch.propuestaInicial   ? '✓' : '—'),
          ch.borradorConceptualFecha || (ch.borradorConceptual ? '✓' : '—'),
          ch.enviadoAVentasFecha     || (ch.enviadoAVentas     ? '✓' : '—'),
          ch.ajustesRealizadosFecha  || (ch.ajustesRealizados  ? '✓' : '—'),
          ch.planosAprobadosFecha    || (ch.planosAprobados    ? '✓' : '—'),
          diasSinAvanzar,
          p.observacion || '—',
        ]);
      });
      pintarColumna(ws4, hdr4, 'ESTADO', claseProspectoEstado);
      pintarColumna(ws4, hdr4, 'DÍAS SIN AVANZAR', claseDiasSinAvanzar);

      // ── HOJA 5: ARQUITECTURA DETALLADA ───────────
      // FECHA OBJETIVO = la que el Jefe de Producción planificó para
      // Arquitectura en el calendario de ese departamento (Equipo →
      // fechasDepto.arquitectura), o la de instalación si no hay una propia.
      const headers5 = ['PROYECTO', 'CLIENTE', 'PEC', 'RESPONSABLE', 'ESTADO', 'CHECKLIST', 'MÓDULOS LIBERADOS A D3D', 'FECHA OBJETIVO', 'SEMÁFORO', 'OBSERVACIONES'];
      const { sheet: ws5, rowHeader: hdr5 } = nuevaHoja(wb, 'Arquitectura Detallada', 'FOGA FLOW — ARQUITECTURA DETALLADA', headers5, [28,20,12,18,26,12,20,14,12,30]);

      (proyectos || []).filter(p => p.estadoGeneral !== 'Finalizado').forEach(p => {
        const arch = p.architecture || {};
        const checklist = arch.checklist || {};
        const pasos = ['propuestaInicial','borradorConceptual','enviadoAVentas','ajustesRealizados','planosAprobados'];
        const pasosOk = pasos.filter(k => checklist[k]).length;
        const modulos = p.production?.modulos || [];
        const liberados = modulos.filter(m => m.arquitectura?.liberadoA3D).length;
        const fechaObjetivo = p.fechasDepto?.arquitectura || p.fechaEntrega;
        ws5.addRow([
          p.nombre || '—', p.cliente || '—', p.numeroContrato || '—',
          arch.responsible || 'Sin asignar', arch.status || '—',
          `${pasosOk}/${pasos.length}`,
          modulos.length > 0 ? `${liberados}/${modulos.length}` : '—',
          fechaObjetivo || 'Sin fecha',
          fechaObjetivo ? estado(fechaObjetivo) : '—',
          arch.observations || '—',
        ]);
      });
      pintarColumna(ws5, hdr5, 'SEMÁFORO', claseSemaforoTexto);

      // ── HOJA 6: DISEÑO 3D DETALLADA ──────────────
      const headers6 = ['PROYECTO', 'CLIENTE', 'PEC MÓDULO', 'MÓDULO', 'DISEÑADOR(ES)', 'SOLIDWORKS', 'DESPIECE', 'PLAN DE CORTE', 'LIBERADO A PRODUCCIÓN', 'FECHA OBJETIVO', 'SEMÁFORO'];
      const { sheet: ws6, rowHeader: hdr6 } = nuevaHoja(wb, 'Diseño 3D Detallada', 'FOGA FLOW — DISEÑO 3D DETALLADA', headers6, [28,20,14,20,20,14,14,14,20,14,12]);

      (proyectos || []).forEach(p => {
        const d3 = p.design3d || {};
        const designers = (d3.responsables || (d3.responsible ? [d3.responsible] : [])).join(', ') || 'Sin asignar';
        const fechaObjetivo = p.fechasDepto?.diseno3d || p.fechaEntrega;
        (p.production?.modulos || []).filter(m => m.arquitectura?.liberadoA3D).forEach(mod => {
          const md3 = mod.diseno3d || {};
          ws6.addRow([
            p.nombre || '—', p.cliente || '—', mod.pec || '—', mod.nombre || '—', designers,
            md3.solidworksFinished ? 'Terminado' : md3.solidworksStarted ? 'En proceso' : 'Pendiente',
            md3.autocadBreakdownFinished ? 'Terminado' : md3.autocadBreakdownStarted ? 'En proceso' : 'Pendiente',
            md3.planCorteLink ? 'Cargado' : 'Pendiente',
            md3.liberadoProduccion ? 'Sí' : 'No',
            fechaObjetivo || 'Sin fecha',
            fechaObjetivo ? estado(fechaObjetivo) : '—',
          ]);
        });
      });
      pintarColumna(ws6, hdr6, 'SOLIDWORKS', claseProgreso);
      pintarColumna(ws6, hdr6, 'DESPIECE', claseProgreso);
      pintarColumna(ws6, hdr6, 'PLAN DE CORTE', claseProgreso);
      pintarColumna(ws6, hdr6, 'LIBERADO A PRODUCCIÓN', claseSiNo);
      pintarColumna(ws6, hdr6, 'SEMÁFORO', claseSemaforoTexto);

      // ── HOJA 7: INSTALACIONES DETALLADA ──────────
      const headers7 = ['PROYECTO', 'CLIENTE', 'RESPONSABLE', '1ª VISITA', 'INFORME TÉCNICO / MEDIDAS', '2ª VISITA', 'OBRA LISTA', 'INSTALACIÓN REALIZADA', 'FECHA INSTALACIÓN'];
      const { sheet: ws7, rowHeader: hdr7 } = nuevaHoja(wb, 'Instalaciones Detallada', 'FOGA FLOW — INSTALACIONES DETALLADA', headers7, [28,20,20,14,22,14,12,20,16]);

      (proyectos || []).filter(p => p.releasedToInstallations || p.releasedToDesign3D || (p.production?.modulos||[]).some(m => m.arquitectura?.liberadoA3D)).forEach(p => {
        const inst = p.installations || {};
        ws7.addRow([
          p.nombre || '—', p.cliente || '—', inst.responsible || 'Sin asignar',
          inst.firstVisitDate || '—',
          inst.initialTechnicalReportLink ? 'Cargado' : 'Pendiente',
          inst.secondVisitDate || '—',
          inst.siteReady ? 'Sí' : 'No',
          inst.finalVisitDate || 'Pendiente',
          p.fechaEntrega || 'Sin fecha',
        ]);
      });
      pintarColumna(ws7, hdr7, 'INFORME TÉCNICO / MEDIDAS', claseProgreso);
      pintarColumna(ws7, hdr7, 'OBRA LISTA', claseSiNo);

      // ── HOJA 7B: CONTABILIDAD — PASE DE INSTALACIÓN ──
      const headersC = ['PROYECTO', 'CLIENTE', 'PEC', 'FECHA INSTALACIÓN', 'FÁBRICA TERMINADA', 'AUTORIZADO CONTABILIDAD', 'PASE'];
      const { sheet: wsC, rowHeader: hdrC } = nuevaHoja(wb, 'Contabilidad', 'FOGA FLOW — CONTABILIDAD · PASE DE INSTALACIÓN', headersC, [28,20,12,16,16,26,12]);

      (proyectos || []).filter(p => p.estadoGeneral !== 'Finalizado').forEach(p => {
        const aut = !!p.contabilidad?.autorizado;
        wsC.addRow([
          p.nombre || '—', p.cliente || '—', p.numeroContrato || '—',
          p.fechaEntrega || 'Sin fecha',
          fabricaTerminada(p) ? 'Sí' : 'No',
          aut ? `Sí (${p.contabilidad?.autorizadoPor || '—'})` : 'No',
          paseInstalacionAbierto(p) ? 'ABIERTO' : 'SIN PASE',
        ]);
      });
      pintarColumna(wsC, hdrC, 'FÁBRICA TERMINADA', claseSiNo);
      pintarColumna(wsC, hdrC, 'AUTORIZADO CONTABILIDAD', claseSiNo);
      pintarColumna(wsC, hdrC, 'PASE', clasePase);

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

      const headers8 = ['FECHA DISEÑO', 'FECHA VALIDACIÓN JP', 'SEMANA ISO', 'AÑO', 'MES', 'SEMANA DEL MES', 'DISEÑADOR', 'LINEA', 'CODIGO / PEC', 'CLIENTE / MODULO', 'ML', 'ESTADO', 'OBSERVACIONES'];
      const { sheet: ws8, rowHeader: hdr8 } = nuevaHoja(wb, 'Registro Diseño Objeto', 'FOGA · REGISTRO DE DISEÑO DE OBJETO · el metro cuenta como BUENO solo cuando JP valida el equipo YA EN PRODUCCION', headers8, [12,14,10,8,8,12,14,10,14,40,8,12,30], { conGenerado: false });

      registro.forEach(r => ws8.addRow([
        r.fechaDiseno, r.fechaValidacionJP, r.semanaIso, r.anio, r.mes, r.semanaMes,
        r.disenador, r.linea, r.pec, r.clienteModulo, Number(r.ml.toFixed(2)), r.estado, r.observaciones,
      ]));
      pintarColumna(ws8, hdr8, 'ESTADO', claseRegistroEstado);

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
      const headers9 = ['SEMANA DEL MES', 'GENERADOS (ML)', 'VALIDADOS (ML)', 'REPROCESO (ML)', 'PENDIENTE (ML)', '% VALIDADO'];
      const { sheet: ws9 } = nuevaHoja(wb, 'Resumen Mes-Semana', `FOGA FLOW — RESUMEN DEL MES POR SEMANA (${MESES_NOMBRE[ahora.getMonth()]} ${ahora.getFullYear()})`, headers9, [16,16,16,16,16,12], { conGenerado: false });

      for (let s = 1; s <= 5; s++) {
        const r = resumenDe(delMesActual.filter(x => x.semanaMes === s));
        if (r.generados === 0 && s > 4) continue;
        ws9.addRow([`Semana ${s}`, r.generados.toFixed(2), r.validados.toFixed(2) || '-', r.reproceso.toFixed(2) || '-', r.pendiente.toFixed(2), `${r.pctValidado.toFixed(1)}%`]);
      }
      const totalMes = resumenDe(delMesActual);
      ws9.addRow(['TOTAL MES', totalMes.generados.toFixed(2), totalMes.validados.toFixed(2), totalMes.reproceso.toFixed(2), totalMes.pendiente.toFixed(2), `${totalMes.pctValidado.toFixed(1)}%`]);
      negritaFila(ws9, ws9.rowCount, headers9.length);

      // Por diseñador, con meta y semáforo
      const deptD3D = (departamentosConfig || []).find(d => d.nombre === 'Diseño 3D');
      const metaMes = Number(deptD3D?.metaMensualML) || 0;
      const disenadores = [...new Set(delMesActual.map(r => r.disenador))].sort();
      const headers10 = ['DISEÑADOR', 'GENERADOS (ML)', 'VALIDADOS (ML)', 'REPROCESO (ML)', 'PENDIENTE (ML)', 'META MES (ML)', '% vs META', 'SEMAFORO'];
      const { sheet: ws10, rowHeader: hdr10 } = nuevaHoja(wb, 'Resumen Mes-Diseñador', `FOGA FLOW — RESUMEN DEL MES POR DISEÑADOR (${MESES_NOMBRE[ahora.getMonth()]} ${ahora.getFullYear()})`, headers10, [16,16,16,16,16,14,12,12], { conGenerado: false });

      disenadores.forEach(nombre => {
        const r = resumenDe(delMesActual.filter(x => x.disenador === nombre));
        const pctMeta = metaMes > 0 ? (r.generados / metaMes) * 100 : 0;
        const sem = pctMeta >= 100 ? 'VERDE' : pctMeta >= 70 ? 'AMARILLO' : 'ROJO';
        ws10.addRow([nombre, r.generados.toFixed(2), r.validados.toFixed(2) || '-', r.reproceso.toFixed(2) || '-', r.pendiente.toFixed(2), metaMes.toFixed(2), `${pctMeta.toFixed(1)}%`, sem]);
      });
      const totalDis = resumenDe(delMesActual);
      const metaTotal = metaMes * disenadores.length;
      const pctMetaTotal = metaTotal > 0 ? (totalDis.generados / metaTotal) * 100 : 0;
      ws10.addRow(['TOTAL', totalDis.generados.toFixed(2), totalDis.validados.toFixed(2), totalDis.reproceso.toFixed(2), totalDis.pendiente.toFixed(2), metaTotal.toFixed(2), `${pctMetaTotal.toFixed(1)}%`, '']);
      negritaFila(ws10, ws10.rowCount, headers10.length);
      pintarColumna(ws10, hdr10, 'SEMAFORO', claseSemaforoLiteral);

      // ── DESCARGAR ─────────────────────────────────
      const fecha = new Date().toISOString().slice(0,10);
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FOGA_Flow_Reporte_${fecha}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

    } catch(err) {
      console.error('Error exportando:', err);
      alert('Error al generar el Excel.');
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
            Genera un Excel con control total de la empresa, en 12 hojas:
          </div>
          {[
            { icon: '📊', label: 'Resumen general',    desc: 'Todos los proyectos con estado y fechas' },
            { icon: '🧭', label: 'Flujo General',       desc: 'Cada módulo, sus 4 etapas y en cuál está hoy' },
            { icon: '👤', label: 'Por persona',         desc: 'Carga de trabajo por responsable' },
            { icon: '🏭', label: 'Producción',          desc: 'Módulos, fases y material faltante' },
            { icon: '✏️', label: 'Prospectos',           desc: 'Prospectos + checklist de diseño con fechas por paso' },
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

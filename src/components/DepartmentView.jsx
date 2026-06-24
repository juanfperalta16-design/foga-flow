import { useState } from 'react';
import { useApp } from '../App';
import { Lock, ExternalLink, ChevronDown, ChevronUp, AlertCircle, Clock, CheckCircle2, Circle } from 'lucide-react';
import { DEPT_CONFIG } from '../data/mockData';
import { getResponsablesPorDept, getNombresResponsables } from '../utils/settingsStorage';

// ── Qué campo del proyecto usa cada departamento ──
const DEPT_KEY = {
  'Arquitectura':  'architecture',
  'Instalaciones': 'installations',
  'Diseño 3D':     'design3d',
  'Producción':    'production',
};

// ── ¿Debe aparecer este proyecto en este departamento? ──
function proyectoEnDept(p, dept) {
  switch (dept) {
    case 'Arquitectura':
      return p.estadoGeneral !== 'Finalizado';
    case 'Instalaciones':
      return !!(p.releasedToInstallations || ['En producción','Finalizado'].includes(p.estadoGeneral));
    case 'Diseño 3D':
      return !!(p.releasedToDesign3D || ['Listo para producción','En producción','Finalizado'].includes(p.estadoGeneral));
    case 'Producción':
      return !!(p.design3d?.releasedToProduction || ['En producción','Finalizado'].includes(p.estadoGeneral));
    default:
      return false;
  }
}

// ── ¿Puede trabajar activamente este departamento? ──
function puedeTrabajar(p, dept) {
  switch (dept) {
    case 'Arquitectura':  return true;
    case 'Instalaciones': return !!p.releasedToInstallations;
    case 'Diseño 3D':     return !!p.releasedToDesign3D;
    case 'Producción':    return !!(p.design3d?.design3DCompleted && p.design3d?.breakdownCompleted);
    default:              return false;
  }
}

// ── Colores de estado ──
function statusColor(estado = '') {
  const e = estado.toLowerCase();
  if (e.includes('finaliz') || e.includes('terminado') || e.includes('validada') || e.includes('listo'))
    return { bg: '#052E16', text: '#86EFAC' };
  if (e.includes('proceso') || e.includes('modelado') || e.includes('fabricac') || e.includes('desarrollo'))
    return { bg: '#1E3A5F', text: '#93C5FD' };
  if (e.includes('pendiente') || e.includes('espera') || e.includes('liberaci') || e.includes('confirmado'))
    return { bg: '#451A03', text: '#FCD34D' };
  if (e.includes('bloqueado'))
    return { bg: '#1F2937', text: '#4B5563' };
  if (e.includes('urgente') || e.includes('atrasado'))
    return { bg: '#450A0A', text: '#FCA5A5' };
  return { bg: '#1E2433', text: '#CBD5E1' };
}

function prioridadDot(p) {
  if (p === 'Urgente') return '#EF4444';
  if (p === 'Alta')    return '#D97706';
  if (p === 'Normal')  return '#3B82F6';
  return '#6B7280';
}

// ── Detalles expandibles de Arquitectura ──
function ArchDetails({ proyecto, onUpdate }) {
  const arch = proyecto.architecture || {};
  const [showContratoForm, setShowContratoForm] = useState(false);
  const [contratoInput, setContratoInput]       = useState('');

  function cargarContrato() {
    if (!contratoInput.trim()) return;
    const now = new Date().toISOString();
    onUpdate({
      ...proyecto,
      contratoLink: contratoInput,
      contratoFirmado: true,
      contratoUploadedAt: now,
      estadoGeneral: 'Proyecto confirmado',
      architecture: { ...arch, status: 'Proyecto confirmado' },
      installations: { ...proyecto.installations, status: 'Pendiente liberación de Arquitectura' },
      design3d: { ...proyecto.design3d, status: 'Pendiente liberación de Arquitectura' },
    });
    setContratoInput('');
    setShowContratoForm(false);
  }

  function liberar(dest) {
    const now = new Date().toISOString();
    if (dest === 'instalaciones') {
      onUpdate({
        ...proyecto,
        releasedToInstallations: true,
        releasedToInstallationsAt: now,
        estadoGeneral: 'Liberado a Instalaciones',
        architecture: { ...arch, status: 'Liberado a Instalaciones' },
        installations: { ...proyecto.installations, status: 'Pendiente primera visita técnica' },
        history: [{ date: now.slice(0,10), user: 'Usuario', action: 'Liberado a Instalaciones', previousStatus: proyecto.estadoGeneral, newStatus: 'Liberado a Instalaciones', comment: '' }, ...(proyecto.history || [])],
      });
    } else {
      onUpdate({
        ...proyecto,
        releasedToDesign3D: true,
        releasedToDesign3DAt: now,
        estadoGeneral: 'Listo para Diseño 3D',
        architecture: { ...arch, status: 'Listo para Diseño 3D' },
        design3d: { ...proyecto.design3d, status: 'Pendiente de modelado' },
        history: [{ date: now.slice(0,10), user: 'Usuario', action: 'Liberado a Diseño 3D', previousStatus: proyecto.estadoGeneral, newStatus: 'Listo para Diseño 3D', comment: '' }, ...(proyecto.history || [])],
      });
    }
  }

  const tieneContrato = !!(proyecto.contratoLink || proyecto.contratoFirmado);

  return (
    <div style={{ marginTop: 10, fontSize: 12 }}>
      {/* Links */}
      {arch.sketchupLink       && <LinkFila label="SketchUp"          href={arch.sketchupLink} />}
      {arch.conceptualPlanLink && <LinkFila label="Plano conceptual"  href={arch.conceptualPlanLink} />}
      {arch.installationPlanLink && <LinkFila label="Plano instalaciones" href={arch.installationPlanLink} />}
      {arch.observations && <div style={{ color: '#93C5FD', background: '#1E3A5F30', padding: '4px 8px', borderRadius: 6, marginTop: 6 }}>{arch.observations}</div>}

      {/* Contrato */}
      <div style={{ marginTop: 10, padding: '8px', background: '#0A0D14', borderRadius: 8, border: '1px solid #1E2433' }}>
        <div style={{ fontWeight: 700, color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Liberaciones</div>

        <Fila label="Contrato">
          {tieneContrato
            ? <span style={{ color: '#86EFAC', display: 'flex', alignItems: 'center', gap: 4 }}>
                ✓ Cargado
                <a href={proyecto.contratoLink} target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA' }}><ExternalLink size={10} /></a>
              </span>
            : <button onClick={() => setShowContratoForm(f => !f)}
                style={{ background: '#D97706', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, padding: '2px 8px', cursor: 'pointer' }}>
                Cargar link
              </button>
          }
        </Fila>

        {showContratoForm && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            <input value={contratoInput} onChange={e => setContratoInput(e.target.value)}
              placeholder="https://drive.google.com/..."
              style={{ flex: 1, background: '#0F1117', border: '1px solid #374151', borderRadius: 6, color: '#E2E8F0', fontSize: 11, padding: '4px 8px' }} />
            <button onClick={cargarContrato} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}>✓</button>
            <button onClick={() => setShowContratoForm(false)} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <Fila label="→ Instalaciones">
          {proyecto.releasedToInstallations
            ? <span style={{ color: '#86EFAC' }}>✓ {proyecto.releasedToInstallationsAt?.slice(0,10)}</span>
            : <button onClick={() => tieneContrato && liberar('instalaciones')}
                disabled={!tieneContrato}
                style={{ background: tieneContrato ? '#16A34A' : '#1F2937', color: tieneContrato ? '#fff' : '#4B5563', border: 'none', borderRadius: 5, fontSize: 10, padding: '2px 8px', cursor: tieneContrato ? 'pointer' : 'not-allowed' }}>
                Liberar
              </button>
          }
        </Fila>

        <Fila label="→ Diseño 3D">
          {proyecto.releasedToDesign3D
            ? <span style={{ color: '#93C5FD' }}>✓ {proyecto.releasedToDesign3DAt?.slice(0,10)}</span>
            : <button onClick={() => tieneContrato && liberar('diseno3d')}
                disabled={!tieneContrato}
                style={{ background: tieneContrato ? '#2563EB' : '#1F2937', color: tieneContrato ? '#fff' : '#4B5563', border: 'none', borderRadius: 5, fontSize: 10, padding: '2px 8px', cursor: tieneContrato ? 'pointer' : 'not-allowed' }}>
                Liberar
              </button>
          }
        </Fila>

        <Fila label="Producción">
          <span style={{ color: proyecto.design3d?.releasedToProduction ? '#FDBA74' : '#4B5563', fontSize: 10 }}>
            {proyecto.design3d?.releasedToProduction ? '✓ Liberado por D3D' : 'Espera Diseño 3D'}
          </span>
        </Fila>
      </div>
    </div>
  );
}

// ── Detalles de Instalaciones ──
function InstDetails({ proyecto, onUpdate }) {
  const inst = proyecto.installations || {};
  const [reportInput, setReportInput] = useState('');
  const [showReport, setShowReport]   = useState(false);

  function cargarInforme() {
    if (!reportInput.trim()) return;
    const now = new Date().toISOString();
    onUpdate({
      ...proyecto,
      estadoGeneral: 'Información técnica recibida',
      installations: { ...inst, initialTechnicalReportLink: reportInput, status: 'Informe técnico cargado', firstVisitDate: inst.firstVisitDate || now.slice(0,10) },
      architecture: { ...proyecto.architecture, status: 'Información técnica recibida' },
      history: [{ date: now.slice(0,10), user: 'Usuario', action: 'Informe técnico cargado', previousStatus: proyecto.estadoGeneral, newStatus: 'Información técnica recibida', comment: '' }, ...(proyecto.history || [])],
    });
    setReportInput('');
    setShowReport(false);
  }

  return (
    <div style={{ marginTop: 10, fontSize: 12 }}>
      <Fila label="Responsable"><span style={{ color: inst.responsible ? '#E2E8F0' : '#4B5563' }}>{inst.responsible || 'Sin asignar'}</span></Fila>
      <Fila label="1ª Visita"><span style={{ color: inst.firstVisitDate ? '#86EFAC' : '#4B5563' }}>{inst.firstVisitDate || 'Pendiente'}</span></Fila>
      <Fila label="2ª Visita"><span style={{ color: inst.secondVisitDate ? '#86EFAC' : '#4B5563' }}>{inst.secondVisitDate || 'Pendiente'}</span></Fila>
      <Fila label="Obra lista"><span style={{ color: inst.siteReady ? '#86EFAC' : '#4B5563' }}>{inst.siteReady ? '✓ Sí' : 'No aún'}</span></Fila>
      {inst.initialTechnicalReportLink
        ? <LinkFila label="Informe técnico" href={inst.initialTechnicalReportLink} />
        : (
          <div style={{ marginTop: 6 }}>
            {!showReport
              ? <button onClick={() => setShowReport(true)} style={{ width: '100%', background: '#16A34A20', color: '#86EFAC', border: '1px solid #16A34A40', borderRadius: 6, fontSize: 11, padding: '5px', cursor: 'pointer' }}>+ Cargar informe técnico</button>
              : <div style={{ display: 'flex', gap: 4 }}>
                  <input value={reportInput} onChange={e => setReportInput(e.target.value)} placeholder="Link del informe..."
                    style={{ flex: 1, background: '#0F1117', border: '1px solid #374151', borderRadius: 6, color: '#E2E8F0', fontSize: 11, padding: '4px 8px' }} />
                  <button onClick={cargarInforme} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}>✓</button>
                  <button onClick={() => setShowReport(false)} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}>✕</button>
                </div>
            }
          </div>
        )
      }
      {inst.observations && <div style={{ color: '#86EFAC', background: '#0F2D1A30', padding: '4px 8px', borderRadius: 6, marginTop: 6 }}>{inst.observations}</div>}
    </div>
  );
}

// ── Detalles de Diseño 3D ──
function D3DDetails({ proyecto, onUpdate }) {
  const d3 = proyecto.design3d || {};

  function toggle(field) {
    const updated = { ...d3, [field]: !d3[field] };
    if (field === 'solidworksFinished' && !d3.solidworksFinished)        updated.design3DCompleted = true;
    if (field === 'autocadBreakdownFinished' && !d3.autocadBreakdownFinished) updated.breakdownCompleted = true;

    let status = 'Pendiente de modelado';
    if (updated.breakdownCompleted && updated.design3DCompleted) status = 'Despiece terminado';
    else if (updated.autocadBreakdownStarted) status = 'En despiece AutoCAD';
    else if (updated.solidworksFinished)      status = 'Modelado terminado';
    else if (updated.solidworksStarted)       status = 'En modelado SolidWorks';

    onUpdate({ ...proyecto, design3d: { ...updated, status } });
  }

  function liberarProduccion() {
    const now = new Date().toISOString();
    onUpdate({
      ...proyecto,
      estadoGeneral: 'Listo para producción',
      design3d: { ...d3, releasedToProduction: true, releasedToProductionAt: now, status: 'Liberado a Producción' },
      production: { ...proyecto.production, status: 'Listo para producción' },
      history: [{ date: now.slice(0,10), user: 'Usuario', action: 'Liberado a Producción', previousStatus: proyecto.estadoGeneral, newStatus: 'Listo para producción', comment: '' }, ...(proyecto.history || [])],
    });
  }

  const items = [
    { key: 'solidworksStarted',        label: 'SolidWorks iniciado' },
    { key: 'solidworksFinished',       label: 'SolidWorks terminado' },
    { key: 'autocadBreakdownStarted',  label: 'Despiece AutoCAD iniciado' },
    { key: 'autocadBreakdownFinished', label: 'Despiece AutoCAD terminado' },
  ];

  return (
    <div style={{ marginTop: 10, fontSize: 12 }}>
      <Fila label="Responsable"><span style={{ color: d3.responsible ? '#E2E8F0' : '#4B5563' }}>{d3.responsible || 'Sin asignar'}</span></Fila>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(item => (
          <div key={item.key} onClick={() => toggle(item.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '2px 0' }}>
            {d3[item.key] ? <CheckCircle2 size={13} color="#2563EB" /> : <Circle size={13} color="#374151" />}
            <span style={{ color: d3[item.key] ? '#93C5FD' : '#6B7280' }}>{item.label}</span>
          </div>
        ))}
      </div>
      {d3.design3DCompleted && d3.breakdownCompleted && !d3.releasedToProduction && (
        <button onClick={liberarProduccion}
          style={{ marginTop: 10, width: '100%', background: '#EA580C', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, padding: '6px', cursor: 'pointer' }}>
          🏭 Liberar a Producción
        </button>
      )}
      {d3.releasedToProduction && <div style={{ marginTop: 8, color: '#FDBA74', fontWeight: 600 }}>✓ Producción liberada el {d3.releasedToProductionAt?.slice(0,10)}</div>}
      {d3.observations && <div style={{ color: '#93C5FD', background: '#1E3A5F30', padding: '4px 8px', borderRadius: 6, marginTop: 6 }}>{d3.observations}</div>}
    </div>
  );
}

// ── Detalles de Producción ──
function ProdDetails({ proyecto, onUpdate }) {
  const prod = proyecto.production || {};

  function toggle(field) {
    const updated = { ...prod, [field]: !prod[field] };
    let status = 'Listo para producción';
    if (updated.productionFinished) status = 'Producción terminada';
    else if (updated.partialProduction) status = 'En producción';
    onUpdate({ ...proyecto, production: { ...updated, status }, estadoGeneral: updated.productionFinished ? 'Finalizado' : updated.partialProduction ? 'En producción' : 'Listo para producción' });
  }

  return (
    <div style={{ marginTop: 10, fontSize: 12 }}>
      <Fila label="Responsable"><span style={{ color: prod.responsible ? '#E2E8F0' : '#4B5563' }}>{prod.responsible || 'Sin asignar'}</span></Fila>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div onClick={() => toggle('partialProduction')} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '2px 0' }}>
          {prod.partialProduction ? <CheckCircle2 size={13} color="#EA580C" /> : <Circle size={13} color="#374151" />}
          <span style={{ color: prod.partialProduction ? '#FDBA74' : '#6B7280' }}>Producción parcial iniciada</span>
        </div>
        <div onClick={() => toggle('productionFinished')} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '2px 0' }}>
          {prod.productionFinished ? <CheckCircle2 size={13} color="#16A34A" /> : <Circle size={13} color="#374151" />}
          <span style={{ color: prod.productionFinished ? '#86EFAC' : '#6B7280' }}>Producción terminada</span>
        </div>
      </div>
      {prod.observations && <div style={{ color: '#FDBA74', background: '#3D1F0030', padding: '4px 8px', borderRadius: 6, marginTop: 6 }}>{prod.observations}</div>}
    </div>
  );
}

// ── Helpers de layout ──
function Fila({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1A2035' }}>
      <span style={{ color: '#6B7280', fontSize: 11 }}>{label}</span>
      <span style={{ fontSize: 11 }}>{children}</span>
    </div>
  );
}
function LinkFila({ label, href }) {
  return (
    <Fila label={label}>
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none', fontSize: 11 }}>
        Ver <ExternalLink size={10} />
      </a>
    </Fila>
  );
}

// ── Tarjeta de proyecto ──
function ProyectoCard({ proyecto, departamento }) {
  const { updateProyecto, goToProject } = useApp();
  const [expanded, setExpanded] = useState(false);

  const cfg    = DEPT_CONFIG[departamento] || { color: '#7C3AED', bg: '#1F2937', text: '#C4B5FD', border: '#7C3AED' };
  const deptKey = DEPT_KEY[departamento];
  const estado  = proyecto[deptKey]?.status || 'Sin estado';
  const locked  = !puedeTrabajar(proyecto, departamento);
  const sc      = statusColor(estado);
  const hoy     = new Date().toISOString().slice(0,10);
  const atrasado = proyecto.fechaEntrega && proyecto.fechaEntrega < hoy;

  const Details = {
    'Arquitectura':  ArchDetails,
    'Instalaciones': InstDetails,
    'Diseño 3D':     D3DDetails,
    'Producción':    ProdDetails,
  }[departamento];

  return (
    <div style={{
      background: '#141824',
      border: `1.5px solid ${locked ? '#1E2433' : cfg.color + '50'}`,
      borderRadius: 12,
      overflow: 'hidden',
      opacity: locked ? 0.65 : 1,
    }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: prioridadDot(proyecto.prioridad), flexShrink: 0, marginTop: 5 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span onClick={() => goToProject(proyecto.id)}
              style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', cursor: 'pointer' }}>
              {proyecto.nombre}
            </span>
            {atrasado && <span style={{ fontSize: 9, fontWeight: 700, background: '#450A0A', color: '#FCA5A5', padding: '1px 5px', borderRadius: 4 }}>ATRASADO</span>}
            {locked    && <Lock size={11} color="#EF4444" />}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{proyecto.cliente}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: sc.bg, color: sc.text }}>{estado}</span>
            {proyecto.fechaEntrega && (
              <span style={{ fontSize: 10, color: atrasado ? '#F87171' : '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={9} /> {proyecto.fechaEntrega}
              </span>
            )}
          </div>
          {locked && (
            <div style={{ marginTop: 5, fontSize: 10, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={10} />
              {departamento === 'Instalaciones' ? 'Pendiente de liberación por Arquitectura' :
               departamento === 'Diseño 3D'     ? 'Pendiente de liberación por Arquitectura' :
                                                  'Esperando que Diseño 3D complete el despiece'}
            </div>
          )}
        </div>
        <button onClick={() => setExpanded(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${cfg.color}20` }}>
          {Details && <Details proyecto={proyecto} onUpdate={updateProyecto} />}
          <button onClick={() => goToProject(proyecto.id)}
            style={{ marginTop: 12, width: '100%', background: cfg.color + '15', border: `1px solid ${cfg.color}40`, color: cfg.text, borderRadius: 7, fontSize: 11, fontWeight: 600, padding: '6px', cursor: 'pointer' }}>
            Abrir proyecto completo →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──
export default function DepartmentView({ departamento, proyectos = [] }) {
  const cfg = DEPT_CONFIG[departamento] || { color: '#7C3AED', bg: '#1F2937', text: '#C4B5FD', icon: '📋' };
  const safeProys = Array.isArray(proyectos) ? proyectos : [];

  const deptProys   = safeProys.filter(p => proyectoEnDept(p, departamento));
  const activos     = deptProys.filter(p =>  puedeTrabajar(p, departamento));
  const bloqueados  = deptProys.filter(p => !puedeTrabajar(p, departamento));

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          {cfg.icon || '📋'}
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9' }}>{departamento}</h1>
          <p style={{ fontSize: 12, color: cfg.text, marginTop: 2 }}>
            {activos.length} activo{activos.length !== 1 ? 's' : ''} · {bloqueados.length} pendiente{bloqueados.length !== 1 ? 's' : ''} de liberación
          </p>
        </div>
      </div>

      {/* Sin proyectos */}
      {deptProys.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#4B5563' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{cfg.icon}</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>
            {departamento === 'Arquitectura'
              ? 'No hay proyectos. Crea uno desde "Proyectos".'
              : `No hay proyectos liberados a ${departamento} todavía.`}
          </p>
          {departamento !== 'Arquitectura' && (
            <p style={{ fontSize: 12, color: '#4B5563', marginTop: 6 }}>
              Ve a Arquitectura → abre un proyecto → sección Liberaciones → clic en "Liberar".
            </p>
          )}
        </div>
      )}

      {/* Activos */}
      {activos.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.6px' }}>
              Activos — {activos.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {activos.map(p => <ProyectoCard key={p.id} proyecto={p} departamento={departamento} />)}
          </div>
        </div>
      )}

      {/* Bloqueados / pendientes */}
      {bloqueados.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Lock size={11} color="#EF4444" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.6px' }}>
              Pendientes de liberación — {bloqueados.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {bloqueados.map(p => <ProyectoCard key={p.id} proyecto={p} departamento={departamento} />)}
          </div>
        </div>
      )}
    </div>
  );
}

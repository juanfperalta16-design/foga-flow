import { useState } from 'react';
import { useApp } from '../App';
import { ArrowLeft, Edit, Clock, Lock, ExternalLink, CheckCircle2, Circle, Link } from 'lucide-react';
import { StatusChip, PrioridadChip } from './StatusChip';
import { formatFecha, isAtrasado } from '../utils/dateHelpers';
import ProjectFlow from './ProjectFlow';
import ProjectForm from './ProjectForm';
import { getNombresResponsables, getResponsablesPorDept } from '../utils/settingsStorage';
import { crearEntradaHistorial } from '../utils/historyHelpers';
import { calcularEstadoGeneral } from '../utils/processRules';

// ── Sección de Arquitectura ──────────────────────
function SeccionArquitectura({ proyecto, onUpdate }) {
  const arch = proyecto.architecture || {};
  const [contratoInput, setContratoInput] = useState('');
  const [showContrato, setShowContrato]   = useState(false);
  const [confirmLib, setConfirmLib]       = useState('');
  const tieneContrato = !!(proyecto.contratoLink || proyecto.contratoFirmado);
  const respOpts = getResponsablesPorDept('Arquitectura').map(r => r.nombre);
  const allResp  = getNombresResponsables();

  function cargarContrato() {
    if (!contratoInput.trim()) return;
    const now = new Date().toISOString();
    onUpdate({
      ...proyecto,
      contratoLink: contratoInput, contratoFirmado: true, contratoUploadedAt: now,
      architecture: { ...arch, status: 'Proyecto confirmado' },
      installations: { ...proyecto.installations, status: 'Pendiente liberación de Arquitectura' },
      design3d: { ...proyecto.design3d, status: 'Pendiente liberación de Arquitectura' },
    });
    setContratoInput(''); setShowContrato(false);
  }

  function liberar(dest) {
    if (confirmLib !== dest) { setConfirmLib(dest); return; }
    const now = new Date().toISOString();
    if (dest === 'diseno3d') {
      onUpdate({
        ...proyecto,
        releasedToDesign3D: true, releasedToDesign3DAt: now,
        architecture: { ...arch, status: 'Listo para Diseño 3D' },
        design3d: { ...proyecto.design3d, status: 'Pendiente de modelado' },
        history: [{ date: now.slice(0,10), user: 'Usuario', action: 'Liberado a Diseño 3D', previousStatus: proyecto.estadoGeneral, newStatus: 'Listo para Diseño 3D', comment: '' }, ...(proyecto.history||[])],
      });
    }
    setConfirmLib('');
  }

  function updateField(field, val) {
    onUpdate({ ...proyecto, architecture: { ...arch, [field]: val } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Responsable */}
      <div>
        <label style={labelStyle}>Responsable de Arquitectura</label>
        <select value={arch.responsible || ''} onChange={e => updateField('responsible', e.target.value)} style={selectStyle}>
          <option value="">Seleccionar...</option>
          {(respOpts.length > 0 ? respOpts : allResp).map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Links de trabajo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { field: 'proposalLink',        label: 'Link propuesta' },
          { field: 'sketchupLink',        label: 'Link SketchUp' },
          { field: 'conceptualPlanLink',  label: 'Link plano conceptual' },
          { field: 'installationPlanLink',label: 'Link plano instalaciones' },
        ].map(({ field, label }) => (
          <div key={field}>
            <label style={labelStyle}>{label}</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={arch[field] || ''} onChange={e => updateField(field, e.target.value)}
                placeholder="https://drive.google.com/..."
                style={{ ...inputStyle, flex: 1 }} />
              {arch[field] && (
                <a href={arch[field]} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '6px 8px', background: '#1E3A5F', border: '1px solid #2563EB40', borderRadius: 7, color: '#93C5FD', display: 'flex', alignItems: 'center' }}>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Observaciones */}
      <div>
        <label style={labelStyle}>Observaciones de Arquitectura</label>
        <textarea value={arch.observations || ''} onChange={e => updateField('observations', e.target.value)}
          rows={2} style={{ ...inputStyle, resize: 'none', width: '100%' }} />
      </div>

      {/* Panel de liberaciones */}
      <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 14 }}>
          🔓 Liberaciones del proyecto
        </div>

        {/* Contrato */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E2433' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tieneContrato ? '#16A34A' : '#D97706' }} />
            <div>
              <div style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 600 }}>1. Contrato firmado</div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>Requerido para liberar a Diseño 3D</div>
            </div>
          </div>
          {tieneContrato
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={pillStyle('#052E16', '#86EFAC')}>✓ Cargado</span>
                {proyecto.contratoLink && <a href={proyecto.contratoLink} target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA' }}><ExternalLink size={12} /></a>}
              </div>
            : <button onClick={() => setShowContrato(f => !f)} style={btnStyle('#D97706')}>Cargar contrato</button>
          }
        </div>

        {showContrato && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 0', borderBottom: '1px solid #1E2433' }}>
            <input value={contratoInput} onChange={e => setContratoInput(e.target.value)}
              placeholder="https://drive.google.com/... (link del contrato firmado)"
              style={{ ...inputStyle, flex: 1 }} />
            <button onClick={cargarContrato} style={btnStyle('#16A34A')}>✓ Confirmar</button>
            <button onClick={() => setShowContrato(false)} style={btnStyle('#374151')}>✕</button>
          </div>
        )}

        {/* Liberar a Diseño 3D */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E2433' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: proyecto.releasedToDesign3D ? '#2563EB' : '#374151' }} />
            <div>
              <div style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 600 }}>2. Liberar a Diseño 3D</div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>
                {proyecto.releasedToDesign3D
                  ? `Liberado el ${proyecto.releasedToDesign3DAt?.slice(0,10)}`
                  : 'Cuando contrato y planos estén listos'}
              </div>
            </div>
          </div>
          {proyecto.releasedToDesign3D
            ? <span style={pillStyle('#1E3A5F', '#93C5FD')}>✓ Liberado</span>
            : <button onClick={() => liberar('diseno3d')} disabled={!tieneContrato}
                style={btnStyle(confirmLib === 'diseno3d' ? '#DC2626' : tieneContrato ? '#2563EB' : '#1F2937', !tieneContrato)}>
                {confirmLib === 'diseno3d' ? '¿Confirmar?' : 'Liberar a Diseño 3D'}
              </button>
          }
        </div>

        {/* Producción — automático */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: proyecto.design3d?.releasedToProduction ? '#EA580C' : '#374151' }} />
            <div>
              <div style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 600 }}>3. Producción</div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>Se libera automáticamente cuando Diseño 3D termina</div>
            </div>
          </div>
          <span style={pillStyle(proyecto.design3d?.releasedToProduction ? '#3D1F00' : '#1F2937', proyecto.design3d?.releasedToProduction ? '#FDBA74' : '#4B5563')}>
            {proyecto.design3d?.releasedToProduction ? '✓ Liberado' : 'Automático'}
          </span>
        </div>

        {confirmLib && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#FCD34D', background: '#451A03', padding: '6px 10px', borderRadius: 6 }}>
            Haz clic de nuevo en el botón para confirmar.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sección de Instalaciones ─────────────────────
function SeccionInstalaciones({ proyecto, onUpdate }) {
  const inst = proyecto.installations || {};
  const [reportInput, setReportInput] = useState('');
  const [showReport, setShowReport]   = useState(false);
  const respOpts = getResponsablesPorDept('Instalaciones').map(r => r.nombre);
  const allResp  = getNombresResponsables();

  function updateField(field, val) {
    onUpdate({ ...proyecto, installations: { ...inst, [field]: val } });
  }

  function cargarInforme() {
    if (!reportInput.trim()) return;
    const now = new Date().toISOString();
    onUpdate({
      ...proyecto,
      estadoGeneral: 'Información técnica recibida',
      installations: { ...inst, initialTechnicalReportLink: reportInput, status: 'Informe técnico cargado', firstVisitDate: inst.firstVisitDate || now.slice(0,10) },
      architecture: { ...proyecto.architecture, status: 'Información técnica recibida' },
      history: [{ date: now.slice(0,10), user: 'Usuario', action: 'Informe técnico cargado', previousStatus: proyecto.estadoGeneral, newStatus: 'Información técnica recibida', comment: '' }, ...(proyecto.history||[])],
    });
    setReportInput(''); setShowReport(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#0F2D1A30', border: '1px solid #16A34A30', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#86EFAC' }}>
        🔧 Instalaciones monitorea la obra durante todo el proyecto e instala cuando Producción termina.
      </div>

      {/* Responsable */}
      <div>
        <label style={labelStyle}>Responsable de Instalaciones</label>
        <select value={inst.responsible || ''} onChange={e => updateField('responsible', e.target.value)} style={selectStyle}>
          <option value="">Seleccionar...</option>
          {(respOpts.length > 0 ? respOpts : allResp).map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Visitas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Fecha 1ª visita técnica</label>
          <input type="date" value={inst.firstVisitDate || ''} onChange={e => updateField('firstVisitDate', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Fecha 2ª visita técnica</label>
          <input type="date" value={inst.secondVisitDate || ''} onChange={e => updateField('secondVisitDate', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Fecha visita final</label>
          <input type="date" value={inst.finalVisitDate || ''} onChange={e => updateField('finalVisitDate', e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!inst.siteReady} onChange={e => updateField('siteReady', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#16A34A' }} />
            <span style={{ fontSize: 12, color: inst.siteReady ? '#86EFAC' : '#9CA3AF', fontWeight: 600 }}>
              ✓ Obra lista para instalar
            </span>
          </label>
        </div>
      </div>

      {/* Informe técnico */}
      <div>
        <label style={labelStyle}>Informe técnico de visita</label>
        {inst.initialTechnicalReportLink
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#86EFAC' }}>✓ Cargado</span>
              <a href={inst.initialTechnicalReportLink} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                Ver informe <ExternalLink size={10} />
              </a>
              <button onClick={() => updateField('initialTechnicalReportLink', '')}
                style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar</button>
            </div>
          : showReport
            ? <div style={{ display: 'flex', gap: 6 }}>
                <input value={reportInput} onChange={e => setReportInput(e.target.value)}
                  placeholder="https://drive.google.com/..." style={{ ...inputStyle, flex: 1 }} />
                <button onClick={cargarInforme} style={btnStyle('#16A34A')}>✓</button>
                <button onClick={() => setShowReport(false)} style={btnStyle('#374151')}>✕</button>
              </div>
            : <button onClick={() => setShowReport(true)} style={{ ...btnStyle('#16A34A20'), color: '#86EFAC', border: '1px solid #16A34A40', width: '100%' }}>
                + Cargar informe técnico
              </button>
        }
      </div>

      {/* Observaciones de obra */}
      <div>
        <label style={labelStyle}>Novedades y observaciones de la obra</label>
        <textarea value={inst.observations || ''} onChange={e => updateField('observations', e.target.value)}
          rows={3} placeholder="Anotar el estado de la obra, novedades, pendientes..."
          style={{ ...inputStyle, resize: 'none', width: '100%' }} />
      </div>
    </div>
  );
}

// ── Sección de Diseño 3D ─────────────────────────
function SeccionDiseno3D({ proyecto, onUpdate }) {
  const d3 = proyecto.design3d || {};
  const locked = !proyecto.releasedToDesign3D;
  const [confirmProd, setConfirmProd] = useState(false);
  const respOpts = getResponsablesPorDept('Diseño 3D').map(r => r.nombre);
  const allResp  = getNombresResponsables();

  function toggle(field) {
    const updated = { ...d3, [field]: !d3[field] };
    if (field === 'solidworksFinished' && !d3.solidworksFinished)        updated.design3DCompleted = true;
    if (field === 'autocadBreakdownFinished' && !d3.autocadBreakdownFinished) updated.breakdownCompleted = true;
    let status = 'Pendiente de modelado';
    if (updated.breakdownCompleted)      status = 'Despiece terminado';
    else if (updated.autocadBreakdownStarted) status = 'En despiece AutoCAD';
    else if (updated.solidworksFinished) status = 'Modelado terminado';
    else if (updated.solidworksStarted)  status = 'En modelado SolidWorks';
    onUpdate({ ...proyecto, design3d: { ...updated, status } });
  }

  function liberarProduccion() {
    if (!confirmProd) { setConfirmProd(true); return; }
    const now = new Date().toISOString();
    onUpdate({
      ...proyecto,
      estadoGeneral: 'Listo para producción',
      design3d: { ...d3, releasedToProduction: true, releasedToProductionAt: now, status: 'Liberado a Producción' },
      production: { ...proyecto.production, status: 'Listo para producción' },
      history: [{ date: now.slice(0,10), user: 'Usuario', action: 'Liberado a Producción', previousStatus: proyecto.estadoGeneral, newStatus: 'Listo para producción', comment: '' }, ...(proyecto.history||[])],
    });
    setConfirmProd(false);
  }

  if (locked) return (
    <div style={{ textAlign: 'center', padding: '30px 20px', color: '#4B5563' }}>
      <Lock size={32} color="#374151" style={{ margin: '0 auto 12px' }} />
      <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Diseño 3D está bloqueado</p>
      <p style={{ fontSize: 11, marginTop: 6 }}>Arquitectura debe cargar el contrato y los planos, y luego liberar a Diseño 3D.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Responsable de Diseño 3D</label>
        <select value={d3.responsible || ''} onChange={e => onUpdate({ ...proyecto, design3d: { ...d3, responsible: e.target.value } })} style={selectStyle}>
          <option value="">Seleccionar...</option>
          {(respOpts.length > 0 ? respOpts : allResp).map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>Avance del trabajo</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { key: 'solidworksStarted',        label: 'SolidWorks iniciado' },
            { key: 'solidworksFinished',       label: 'SolidWorks terminado ✓' },
            { key: 'autocadBreakdownStarted',  label: 'Despiece AutoCAD iniciado' },
            { key: 'autocadBreakdownFinished', label: 'Despiece AutoCAD terminado ✓' },
          ].map(item => (
            <div key={item.key} onClick={() => toggle(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: d3[item.key] ? '#1E3A5F40' : '#141824', border: `1px solid ${d3[item.key] ? '#2563EB40' : '#1E2433'}`, borderRadius: 8, cursor: 'pointer', transition: 'all .15s' }}>
              {d3[item.key] ? <CheckCircle2 size={14} color="#2563EB" /> : <Circle size={14} color="#374151" />}
              <span style={{ fontSize: 11, color: d3[item.key] ? '#93C5FD' : '#6B7280', fontWeight: d3[item.key] ? 600 : 400 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Observaciones</label>
        <textarea value={d3.observations || ''} onChange={e => onUpdate({ ...proyecto, design3d: { ...d3, observations: e.target.value } })}
          rows={2} style={{ ...inputStyle, resize: 'none', width: '100%' }} />
      </div>

      {/* Liberar a Producción */}
      {!d3.releasedToProduction
        ? <button onClick={liberarProduccion}
            disabled={!d3.design3DCompleted || !d3.breakdownCompleted}
            style={btnStyle(
              confirmProd ? '#DC2626' : (d3.design3DCompleted && d3.breakdownCompleted) ? '#EA580C' : '#1F2937',
              !d3.design3DCompleted || !d3.breakdownCompleted
            )}>
            {confirmProd ? '¿Confirmar liberación a Producción?' : '🏭 Liberar a Producción'}
          </button>
        : <div style={{ padding: '10px 14px', background: '#3D1F0040', border: '1px solid #EA580C40', borderRadius: 8, fontSize: 12, color: '#FDBA74', fontWeight: 600 }}>
            ✓ Producción liberada el {d3.releasedToProductionAt?.slice(0,10)}
          </div>
      }
      {(!d3.design3DCompleted || !d3.breakdownCompleted) && !d3.releasedToProduction && (
        <div style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
          Marca SolidWorks terminado y Despiece terminado para habilitar la liberación.
        </div>
      )}
    </div>
  );
}

// ── Sección de Producción ────────────────────────
function SeccionProduccion({ proyecto, onUpdate }) {
  const prod   = proyecto.production || {};
  const locked = !proyecto.design3d?.releasedToProduction;
  const respOpts = getResponsablesPorDept('Producción').map(r => r.nombre);
  const allResp  = getNombresResponsables();

  function toggle(field) {
    const updated = { ...prod, [field]: !prod[field] };
    let status = 'Listo para producción';
    if (updated.productionFinished) status = 'Producción terminada';
    else if (updated.partialProduction) status = 'En producción';
    onUpdate({
      ...proyecto,
      production: { ...updated, status },
      estadoGeneral: updated.productionFinished ? 'En producción' : updated.partialProduction ? 'En producción' : 'Listo para producción',
    });
  }

  if (locked) return (
    <div style={{ textAlign: 'center', padding: '30px 20px', color: '#4B5563' }}>
      <Lock size={32} color="#374151" style={{ margin: '0 auto 12px' }} />
      <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Producción está bloqueada</p>
      <p style={{ fontSize: 11, marginTop: 6 }}>Se habilitará cuando Diseño 3D termine el modelado y despiece, y libere a Producción.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Responsable de Producción</label>
        <select value={prod.responsible || ''} onChange={e => onUpdate({ ...proyecto, production: { ...prod, responsible: e.target.value } })} style={selectStyle}>
          <option value="">Seleccionar...</option>
          {(respOpts.length > 0 ? respOpts : allResp).map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { key: 'partialProduction',  label: 'Producción parcial iniciada',  color: '#EA580C' },
          { key: 'productionFinished', label: 'Producción terminada ✓',       color: '#16A34A' },
        ].map(item => (
          <div key={item.key} onClick={() => toggle(item.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: prod[item.key] ? item.color + '15' : '#141824', border: `1px solid ${prod[item.key] ? item.color + '40' : '#1E2433'}`, borderRadius: 10, cursor: 'pointer', transition: 'all .15s' }}>
            {prod[item.key] ? <CheckCircle2 size={18} color={item.color} /> : <Circle size={18} color="#374151" />}
            <span style={{ fontSize: 13, color: prod[item.key] ? '#E2E8F0' : '#6B7280', fontWeight: prod[item.key] ? 600 : 400 }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div>
        <label style={labelStyle}>Observaciones de producción</label>
        <textarea value={prod.observations || ''} onChange={e => onUpdate({ ...proyecto, production: { ...prod, observations: e.target.value } })}
          rows={2} style={{ ...inputStyle, resize: 'none', width: '100%' }} />
      </div>

      {prod.productionFinished && (
        <div style={{ padding: '10px 14px', background: '#052E1640', border: '1px solid #16A34A40', borderRadius: 8, fontSize: 12, color: '#86EFAC', fontWeight: 600 }}>
          ✓ Producción terminada — Instalación puede proceder
        </div>
      )}
    </div>
  );
}

// ── Estilos reutilizables ────────────────────────
const inputStyle  = { background: '#0F1117', border: '1px solid #374151', borderRadius: 8, color: '#E2E8F0', fontSize: 12, padding: '7px 10px', outline: 'none', width: '100%' };
const selectStyle = { ...inputStyle };
const labelStyle  = { fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 5 };
const pillStyle   = (bg, color) => ({ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: bg, color, display: 'inline-block' });
const btnStyle    = (bg, disabled = false) => ({ background: bg, color: disabled ? '#4B5563' : '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, padding: '6px 14px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, transition: 'all .15s' });

// ── Componente principal ─────────────────────────
export default function ProjectDetail({ proyectoId }) {
  const { proyectos, historial, actividades, updateProyecto, addHistorial, currentUser, setPage } = useApp();
  const [activeTab, setActiveTab] = useState('flujo');
  const [showEditForm, setShowEditForm] = useState(false);

  const proyecto = proyectos.find(p => p.id === proyectoId);
  if (!proyecto) return <div style={{ padding: 24, color: '#6B7280' }}>Proyecto no encontrado</div>;

  const pHistorial   = historial.filter(h => h.proyectoId === proyectoId);
  const pActividades = actividades.filter(a => a.proyectoId === proyectoId);
  const atrasado     = isAtrasado(proyecto.fechaEntrega, proyecto.estadoGeneral);

  function handleUpdate(updated) {
    const conEstado = { ...updated, estadoGeneral: calcularEstadoGeneral(updated), updatedAt: new Date().toISOString() };
    updateProyecto(conEstado);
  }

  const TABS = [
    { id: 'flujo',         label: 'Flujo' },
    { id: 'arquitectura',  label: '✏️ Arquitectura' },
    { id: 'instalaciones', label: '🔧 Instalaciones / Obra' },
    { id: 'diseno3d',      label: '🖥️ Diseño 3D' },
    { id: 'produccion',    label: '🏭 Producción' },
    { id: 'historial',     label: `Historial (${pHistorial.length})` },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* Volver */}
      <button onClick={() => setPage('proyectos')} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft size={15} /> Proyectos
      </button>

      {/* Header del proyecto */}
      <div className={`bg-[#161820] border rounded-xl p-4 ${atrasado ? 'border-red-800/70' : 'border-white/5'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-white">{proyecto.nombre}</h1>
              {atrasado && <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-bold">ATRASADO</span>}
            </div>
            <div className="text-slate-400 text-sm">{proyecto.cliente} · {proyecto.numeroContrato || 'Sin número de contrato'}</div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusChip estado={proyecto.estadoGeneral} />
              <PrioridadChip prioridad={proyecto.prioridad} />
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${(proyecto.contratoLink || proyecto.contratoFirmado) ? 'bg-green-900 text-green-300' : 'bg-amber-900/60 text-amber-300'}`}>
                {(proyecto.contratoLink || proyecto.contratoFirmado) ? '✓ Contrato cargado' : '⚠ Sin contrato'}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-500">Entrega estimada</div>
            <div className={`text-sm font-bold ${atrasado ? 'text-red-400' : 'text-white'}`}>{formatFecha(proyecto.fechaEntrega) || '—'}</div>
            <div className="text-xs text-slate-500 mt-1">Resp: {proyecto.responsableGeneral || '—'}</div>
            <button onClick={() => setShowEditForm(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 ml-auto">
              <Edit size={11} /> Editar
            </button>
          </div>
        </div>
        {proyecto.proximaAccion && (
          <div className="mt-3 bg-blue-900/20 border border-blue-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <Clock size={12} className="text-blue-400 shrink-0" />
            <span className="text-xs text-blue-300 font-medium">{proyecto.proximaAccion}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`text-xs px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === t.id ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido de tabs */}
      <div className="bg-[#161820] border border-white/5 rounded-xl p-5">
        {activeTab === 'flujo' && (
          <ProjectFlow proyecto={proyecto} onUpdateProyecto={handleUpdate} />
        )}
        {activeTab === 'arquitectura' && (
          <SeccionArquitectura proyecto={proyecto} onUpdate={handleUpdate} />
        )}
        {activeTab === 'instalaciones' && (
          <SeccionInstalaciones proyecto={proyecto} onUpdate={handleUpdate} />
        )}
        {activeTab === 'diseno3d' && (
          <SeccionDiseno3D proyecto={proyecto} onUpdate={handleUpdate} />
        )}
        {activeTab === 'produccion' && (
          <SeccionProduccion proyecto={proyecto} onUpdate={handleUpdate} />
        )}
        {activeTab === 'historial' && (
          <div className="divide-y divide-white/5">
            {pHistorial.length === 0 && <div className="py-8 text-center text-slate-500 text-sm">Sin historial registrado</div>}
            {pHistorial.map((h, i) => (
              <div key={h.id || i} className="py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-slate-500">{h.fecha} {h.hora}</span>
                  <span className="text-[10px] text-white font-medium">{h.usuario || h.user}</span>
                  <span className="text-[10px] text-slate-500">·</span>
                  <span className="text-[10px] text-slate-400">{h.departamento}</span>
                </div>
                <div className="text-xs text-white">{h.accion || h.action}</div>
                {(h.valorAnterior || h.previousStatus) && (
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {h.valorAnterior || h.previousStatus} → <span className="text-green-400">{h.valorNuevo || h.newStatus}</span>
                  </div>
                )}
                {(h.observacion || h.comment) && <div className="text-[10px] text-slate-400 italic mt-0.5">{h.observacion || h.comment}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditForm && <ProjectForm proyecto={proyecto} onClose={() => setShowEditForm(false)} />}
    </div>
  );
}

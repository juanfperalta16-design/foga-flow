import { useState } from 'react';
import { useApp } from '../App';
import { ArrowLeft, Lock, Unlock, ExternalLink, CheckCircle2, Circle, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react';
import { DEPT_CONFIG } from '../data/mockData';
import SeccionArquitectura from './SeccionArquitectura';
import SeccionInstalaciones from './SeccionInstalaciones';
import CalendarioDepto from './CalendarioDepto';
import Prospectos from './Prospectos';
import { paseInstalacionAbierto } from '../utils/processRules';
import { getResponsablesAgrupados } from '../utils/settingsStorage';
import { LineaBadge } from './Badge';

// Sin "Instalando" — esa fase no le corresponde a Producción, es de Instalaciones.
const FASES_PRODUCCION = [
  '1. Despacho Materia Prima','2. Corte Láser','3. Plegado',
  '4. Mesa de Trabajo (Maestros)','5. Pintura','6. Abrillantado',
  '7. Terminados','8. Control de Calidad','9. Empaquetado',
  '10. Bodega','⏸ Pendiente','✓ Terminado',
];

function diasRestantes(fecha) {
  if (!fecha) return null;
  return Math.floor((new Date(fecha) - new Date()) / 86400000);
}

function semaforo(fecha) {
  const d = diasRestantes(fecha);
  if (d === null) return { color: '#6B7280', bg: '#1F2937', label: 'Sin fecha' };
  if (d < 0)   return { color: '#EF4444', bg: '#450A0A', label: `${Math.abs(d)}d atrasado` };
  if (d <= 5)  return { color: '#F97316', bg: '#431407', label: `${d}d` };
  if (d <= 15) return { color: '#D97706', bg: '#451A03', label: `${d}d` };
  return { color: '#16A34A', bg: '#052E16', label: `${d}d` };
}

function formatDimensiones(mod) {
  if (!mod.largo && !mod.profundidad && !mod.alto) return null;
  const m = (v) => v ? (Number(v) / 100).toFixed(2) : '—';
  return `${m(mod.largo)} × ${m(mod.profundidad)} × ${m(mod.alto)} m`;
}


function prioridadOrden(p) {
  return { 'Urgente': 0, 'Alta': 1, 'Normal': 2, 'Baja': 3 }[p?.prioridad] ?? 2;
}

function clasificarProyecto(p, departamento) {
  const d = diasRestantes(p.fechaEntrega);
  const mods = p.production?.modulos || [];
  if (d !== null && d < 0) return 'atrasado';
  if (d !== null && d <= 5) return 'urgente';
  switch (departamento) {
    case 'Arquitectura':
      if (mods.length > 0 && mods.every(m => m.arquitectura?.liberadoA3D)) return 'completado';
      if (mods.some(m => m.arquitectura?.liberadoA3D)) return 'en_proceso';
      return 'pendiente';
    case 'Diseño 3D':
      if (mods.length > 0 && mods.filter(m => m.arquitectura?.liberadoA3D).every(m => m.diseno3d?.liberadoProduccion)) return 'completado';
      if (mods.some(m => m.arquitectura?.liberadoA3D)) return 'en_proceso';
      return 'pendiente';
    case 'Producción':
      if (mods.length > 0 && mods.filter(m => m.diseno3d?.liberadoProduccion).every(m => m.produccion?.faseActual === '✓ Terminado')) return 'completado';
      if (mods.some(m => m.diseno3d?.liberadoProduccion)) return 'en_proceso';
      return 'pendiente';
    case 'Instalaciones':
      if (p.installations?.siteReady) return 'completado';
      if (p.installations?.firstVisitDate) return 'en_proceso';
      return 'pendiente';
    default: return 'pendiente';
  }
}

function proyectoEnDept(p, dept) {
  switch (dept) {
    case 'Arquitectura':  return p.estadoGeneral !== 'Finalizado';
    case 'Diseño 3D':     return !!(p.releasedToDesign3D || (p.production?.modulos||[]).some(m => m.arquitectura?.liberadoA3D));
    // Instalaciones empieza a darle seguimiento al proyecto en cuanto Arquitectura
    // libera módulos a Diseño 3D — desde ahí deben estar pendientes de agendar visita
    // y verificar medidas antes de la fecha de instalación.
    case 'Instalaciones': return !!(p.releasedToInstallations || p.releasedToDesign3D || (p.production?.modulos||[]).some(m => m.arquitectura?.liberadoA3D));
    case 'Producción':    return !!(p.design3d?.releasedToProduction || (p.production?.modulos||[]).some(m => m.diseno3d?.liberadoProduccion));
    default: return false;
  }
}

function getResponsable(p, departamento) {
  const d3 = p.design3d || {};
  const designers = d3.responsables || (d3.responsible ? [d3.responsible] : []);
  switch (departamento) {
    case 'Arquitectura':  return [p.architecture?.responsible || null];
    case 'Diseño 3D':     return designers.length > 0 ? designers : [null];
    case 'Producción':    { const ms = [...new Set((p.production?.modulos||[]).map(m=>m.maestro).filter(Boolean))]; return ms.length > 0 ? ms : [null]; }
    case 'Instalaciones': return [p.installations?.responsible || null];
    default: return [null];
  }
}

// ── Tarjeta de proyecto ──────────────────────────
function ProyectoCard({ proyecto, departamento, clasificacion, onClick }) {
  const cfg  = DEPT_CONFIG[departamento] || { color: '#D4A017', bg: '#1F2937', text: '#F0D687' };
  const mods = proyecto.production?.modulos || [];
  const sem  = semaforo(proyecto.fechaEntrega);
  const liberadosArq = mods.filter(m => m.arquitectura?.liberadoA3D).length;
  const liberadosD3D = mods.filter(m => m.diseno3d?.liberadoProduccion).length;
  const terminados   = mods.filter(m => m.produccion?.faseActual === '✓ Terminado').length;
  const enReproceso  = mods.filter(m => m.produccion?.reproceso).length;
  const borderColor  = enReproceso > 0 && departamento === 'Diseño 3D' ? '#EF4444' : clasificacion === 'atrasado' || clasificacion === 'urgente' ? '#EF4444' : clasificacion === 'completado' ? '#16A34A' : cfg.color;

  const progreso = mods.length === 0 ? 0 : (() => {
    switch (departamento) {
      case 'Arquitectura': return Math.round((liberadosArq / mods.length) * 100);
      case 'Diseño 3D':    return liberadosArq > 0 ? Math.round((liberadosD3D / liberadosArq) * 100) : 0;
      case 'Producción':   return liberadosD3D > 0 ? Math.round((terminados / liberadosD3D) * 100) : 0;
      default: return 0;
    }
  })();

  return (
    <div onClick={onClick} style={{
      background: '#141824', border: `1.5px solid ${borderColor}25`,
      borderLeft: `4px solid ${borderColor}`, borderRadius: 10,
      padding: '14px 16px', cursor: 'pointer', transition: 'all .15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#1a1f2e'}
    onMouseLeave={e => e.currentTarget.style.background = '#141824'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{proyecto.nombre}</span>
            {(clasificacion === 'atrasado' || clasificacion === 'urgente') && (
              <span style={{ fontSize: 9, fontWeight: 700, background: '#450A0A', color: '#FCA5A5', padding: '1px 6px', borderRadius: 4 }}>
                {clasificacion === 'atrasado' ? 'ATRASADO' : 'URGENTE'}
              </span>
            )}
            {clasificacion === 'completado' && <span style={{ fontSize: 9, fontWeight: 700, background: '#052E16', color: '#86EFAC', padding: '1px 6px', borderRadius: 4 }}>✓ LISTO</span>}
            {departamento === 'Diseño 3D' && enReproceso > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, background: '#450A0A', color: '#FCA5A5', padding: '1px 6px', borderRadius: 4 }}>⚠ REPROCESO ({enReproceso})</span>
            )}
            {departamento === 'Instalaciones' && proyecto.fechaEntrega && (() => {
              return paseInstalacionAbierto(proyecto)
                ? <span style={{ fontSize: 9, fontWeight: 700, background: '#052E16', color: '#86EFAC', padding: '1px 6px', borderRadius: 4 }}>✓ PASE ABIERTO</span>
                : <span style={{ fontSize: 9, fontWeight: 700, background: '#450A0A', color: '#FCA5A5', padding: '1px 6px', borderRadius: 4 }}>⚠ SIN PASE (Contabilidad)</span>;
            })()}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>
            {proyecto.cliente} · <span style={{ fontFamily: 'var(--font-mono)' }}>{proyecto.numeroContrato || '—'}</span>
          </div>
          {mods.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>📦 {mods.length} módulos</span>
              {departamento === 'Arquitectura' && <span style={{ fontSize: 10, background: liberadosArq === mods.length ? '#052E16' : '#2E1A08', color: liberadosArq === mods.length ? '#86EFAC' : '#E3A868', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>{liberadosArq}/{mods.length} en D3D</span>}
              {departamento === 'Diseño 3D' && <span style={{ fontSize: 10, background: '#2E1A08', color: '#E3A868', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>{liberadosD3D}/{liberadosArq} a Prod.</span>}
              {departamento === 'Producción' && <span style={{ fontSize: 10, background: '#241A2B', color: '#C9A8D6', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>{terminados}/{liberadosD3D} terminados</span>}
            </div>
          ) : <span style={{ fontSize: 10, color: '#4B5563' }}>Sin módulos</span>}
          {mods.length > 0 && (
            <div style={{ height: 3, background: '#1E2433', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ height: '100%', width: `${progreso}%`, background: progreso === 100 ? '#16A34A' : cfg.color, borderRadius: 2 }} />
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {proyecto.fechaEntrega && <>
            <div style={{ fontSize: 10, color: '#6B7280' }}>Entrega</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: sem.color }}>{proyecto.fechaEntrega}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: sem.color, background: sem.bg, padding: '1px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2 }}>{sem.label}</span>
          </>}
          {proyecto.prioridad && (
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: proyecto.prioridad === 'Urgente' ? '#450A0A' : proyecto.prioridad === 'Alta' ? '#451A03' : '#1F2937', color: proyecto.prioridad === 'Urgente' ? '#FCA5A5' : proyecto.prioridad === 'Alta' ? '#FCD34D' : '#9CA3AF' }}>
                {proyecto.prioridad}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GrupoProyectos({ titulo, proyectos, departamento, dotColor, onSelect }) {
  if (proyectos.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.6px' }}>{titulo}</span>
        <span style={{ fontSize: 10, color: '#4B5563', background: '#1F2937', padding: '1px 6px', borderRadius: 99 }}>{proyectos.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
        {proyectos.map(p => (
          <ProyectoCard key={p.id} proyecto={p} departamento={departamento} clasificacion={clasificarProyecto(p, departamento)} onClick={() => onSelect(p)} />
        ))}
      </div>
    </div>
  );
}

// ── Módulos por departamento ─────────────────────
function ModuloArq({ mod, planLink, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const arch = mod.arquitectura || {};
  const liberado = !!arch.liberadoA3D;
  const ESTADOS = ['En proceso','En Diseño','En Revisión Cliente','Cambios Solicitados','Aprobado Cliente','Listo','Liberado a Diseño 3D'];
  function toggle() {
    const now = new Date().toISOString();
    onUpdate({ ...mod, arquitectura: { ...arch, liberadoA3D: !liberado, liberadoAt: !liberado ? now : '', estado: !liberado ? 'Liberado a Diseño 3D' : 'En proceso' }, diseno3d: { ...mod.diseno3d, estado: !liberado ? 'Pendiente de modelado' : 'Bloqueado' } });
  }
  return (
    <div style={{ background: '#141824', border: `1.5px solid ${liberado ? '#D4A01740' : '#1E2433'}`, borderRadius: 10, marginBottom: 8 }}>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div onClick={toggle} style={{ cursor: 'pointer', flexShrink: 0 }}>{liberado ? <Unlock size={15} color="#D4A017" /> : <Lock size={15} color="#374151" />}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>{mod.nombre || 'Sin nombre'}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7280' }}>{mod.pec}</span>
            <span style={{ fontSize: 9, background: liberado ? '#332905' : '#1F2937', color: liberado ? '#F0D687' : '#6B7280', padding: '1px 6px', borderRadius: 4 }}>{arch.estado || 'En proceso'}</span>
            {mod.maestro && <span style={{ fontSize: 10, color: '#6B7280' }}>👤 {mod.maestro}</span>}
          </div>
          {mod.codigo && <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#4B5563', marginTop: 2 }}>{mod.codigo}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {liberado ? <span style={{ fontSize: 10, color: '#F0D687', fontWeight: 600 }}>✓ En D3D</span> : <button onClick={toggle} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: '#D4A017', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>Liberar a D3D</button>}
          <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
        </div>
      </div>
      {expanded && (
        <div className="anim-fade-in" style={{ padding: '0 14px 12px', borderTop: '1px solid #1E2433' }}>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={lbl}>Estado</label>
              <select value={arch.estado || 'En proceso'} onChange={e => onUpdate({ ...mod, arquitectura: { ...arch, estado: e.target.value } })} style={inp}>
                {ESTADOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Plano conceptual</label>
              {planLink ? <a href={planLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '6px 0' }}>Ver plano <ExternalLink size={10} /></a> : <span style={{ fontSize: 11, color: '#4B5563', padding: '6px 0', display: 'block' }}>Sin plano</span>}
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Observaciones</label>
              <textarea value={arch.observaciones || ''} onChange={e => onUpdate({ ...mod, arquitectura: { ...arch, observaciones: e.target.value } })} rows={2} style={{ ...inp, resize: 'none', width: '100%' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuloD3D({ mod, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [planInput, setPlanInput] = useState('');
  const [showArchivoReproceso, setShowArchivoReproceso] = useState(false);
  const [archivoReprocesoInput, setArchivoReprocesoInput] = useState('');
  const d3 = mod.diseno3d || {};
  const prod = mod.produccion || {};
  const liberadoArq = !!mod.arquitectura?.liberadoA3D;
  const liberadoProd = !!d3.liberadoProduccion;
  const dims = formatDimensiones(mod);
  const ITEMS = [
    { key: 'solidworksStarted', label: 'SolidWorks iniciado' },
    { key: 'solidworksFinished', label: 'SolidWorks terminado' },
    { key: 'autocadBreakdownStarted', label: 'Despiece iniciado' },
    { key: 'autocadBreakdownFinished', label: 'Despiece terminado' },
  ];
  function toggleItem(key) {
    const updated = { ...d3, [key]: !d3[key] };
    if (key === 'solidworksFinished' && !d3.solidworksFinished) updated.design3DCompleted = true;
    if (key === 'autocadBreakdownFinished' && !d3.autocadBreakdownFinished) updated.breakdownCompleted = true;
    let estado = 'Pendiente de modelado';
    if (updated.breakdownCompleted) estado = 'Despiece terminado';
    else if (updated.autocadBreakdownStarted) estado = 'En despiece AutoCAD';
    else if (updated.solidworksFinished) estado = 'Modelado terminado';
    else if (updated.solidworksStarted) estado = 'En modelado SolidWorks';
    onUpdate({ ...mod, diseno3d: { ...updated, estado } });
  }
  function liberar() {
    const now = new Date().toISOString();
    onUpdate({ ...mod, diseno3d: { ...d3, liberadoProduccion: true, liberadoAt: now, estado: 'Liberado a Producción' }, produccion: { ...mod.produccion, estado: 'Listo para producción' } });
  }
  function subirPlan() {
    if (!planInput.trim()) return;
    // La fecha de diseño (para el registro de ML) queda fija al mismo
    // momento en que se sube el plano de corte — no se escribe a mano.
    // La fecha "objetivo" la sigue asignando el Jefe de Producción desde
    // la pestaña Equipo (fechasDepto.diseno3d), esto es la fecha real.
    const hoy = new Date().toISOString().slice(0,10);
    onUpdate({ ...mod, diseno3d: { ...d3, planCorteLink: planInput, fechaDespachoPlano: hoy, fechaDiseno: d3.fechaDiseno || hoy } });
    setPlanInput(''); setShowPlan(false);
  }
  function subirArchivoReproceso() {
    if (!archivoReprocesoInput.trim()) return;
    onUpdate({ ...mod, diseno3d: { ...d3, archivoReproceso: archivoReprocesoInput } });
    setArchivoReprocesoInput(''); setShowArchivoReproceso(false);
  }
  function resolverReproceso() {
    const hoy = new Date().toISOString().slice(0,10);
    onUpdate({ ...mod, diseno3d: { ...d3, fechaReprocesoResuelto: hoy }, produccion: { ...prod, reproceso: false } });
  }
  if (!liberadoArq) return (
    <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '10px 14px', marginBottom: 8, opacity: 0.45 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lock size={13} color="#374151" />
        <span style={{ fontSize: 12, color: '#4B5563' }}>{mod.pec} — {mod.nombre || 'Sin nombre'}</span>
        <span style={{ fontSize: 10, color: '#374151', marginLeft: 'auto' }}>Esperando Arquitectura</span>
      </div>
    </div>
  );
  const puedeLiberar = d3.design3DCompleted && d3.breakdownCompleted && !!d3.planCorteLink;
  return (
    <div style={{ background: '#141824', border: `1.5px solid ${prod.reproceso ? '#EF444470' : liberadoProd ? '#16A34A40' : '#B5651D40'}`, borderRadius: 10, marginBottom: 8 }}>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Unlock size={14} color="#B5651D" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>{mod.nombre || 'Sin nombre'}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7280' }}>{mod.pec}</span>
            <LineaBadge linea={mod.linea} />
            <span style={{ fontSize: 9, background: '#2E1A08', color: '#E3A868', padding: '1px 6px', borderRadius: 4 }}>{d3.estado || 'Pendiente'}</span>
            {prod.reproceso && <span style={{ fontSize: 9, fontWeight: 700, background: '#450A0A', color: '#FCA5A5', padding: '1px 6px', borderRadius: 4 }}>⚠ REPROCESO</span>}
            {mod.maestro && <span style={{ fontSize: 10, color: '#6B7280' }}>👤 {mod.maestro}</span>}
            {dims && <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>📐 {dims}</span>}
          </div>
          {mod.codigo && <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#4B5563', marginTop: 2 }}>{mod.codigo}</div>}
        </div>
        <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
      </div>
      {expanded && (
        <div className="anim-fade-in" style={{ padding: '0 14px 14px', borderTop: '1px solid #1E2433' }}>
          {prod.reproceso && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: '#2E0B0B30', border: '1px solid #7A4B8C50', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FCA5A5', marginBottom: 4 }}>⚠ Reproceso solicitado por Producción</div>
              {prod.fechaReproceso && <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>Marcado el {prod.fechaReproceso}</div>}
              {prod.observaciones && <div style={{ fontSize: 11, color: '#E2E8F0', marginBottom: 8 }}>{prod.observaciones}</div>}
              <label style={lbl}>Archivo corregido</label>
              {d3.archivoReproceso ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <a href={d3.archivoReproceso} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>Ver archivo <ExternalLink size={10} /></a>
                  <button onClick={() => setShowArchivoReproceso(true)} style={{ fontSize: 10, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar</button>
                </div>
              ) : !showArchivoReproceso ? (
                <button onClick={() => setShowArchivoReproceso(true)} style={{ fontSize: 11, color: '#C9A8D6', background: '#241A2B', border: '1px solid #7A4B8C50', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', width: '100%', marginBottom: 8 }}>+ Subir archivo corregido</button>
              ) : null}
              {showArchivoReproceso && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input value={archivoReprocesoInput} onChange={e => setArchivoReprocesoInput(e.target.value)} placeholder="https://drive.google.com/..." style={{ ...inp, flex: 1 }} />
                  <button onClick={subirArchivoReproceso} style={{ background: '#7A4B8C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '5px 10px', cursor: 'pointer' }}>✓</button>
                  <button onClick={() => setShowArchivoReproceso(false)} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '5px 10px', cursor: 'pointer' }}>✕</button>
                </div>
              )}
              <button onClick={resolverReproceso} disabled={!d3.archivoReproceso}
                style={{ width: '100%', background: d3.archivoReproceso ? '#7A4B8C' : '#1F2937', color: d3.archivoReproceso ? '#fff' : '#4B5563', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '7px', cursor: d3.archivoReproceso ? 'pointer' : 'not-allowed' }}>
                ✓ Marcar reproceso resuelto
              </button>
              {!d3.archivoReproceso && <div style={{ fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>Sube el archivo corregido para poder resolverlo</div>}
            </div>
          )}
          {!prod.reproceso && d3.fechaReprocesoResuelto && (
            <div style={{ marginTop: 10, fontSize: 10, color: '#6B7280' }}>✓ Último reproceso resuelto el {d3.fechaReprocesoResuelto}</div>
          )}
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {ITEMS.map(item => (
              <div key={item.key} onClick={() => toggleItem(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: d3[item.key] ? '#2E1A0840' : '#0A0D14', border: `1px solid ${d3[item.key] ? '#B5651D40' : '#1E2433'}`, borderRadius: 8, cursor: 'pointer' }}>
                {d3[item.key] ? <CheckCircle2 size={14} color="#B5651D" /> : <Circle size={14} color="#374151" />}
                <span style={{ fontSize: 11, color: d3[item.key] ? '#E3A868' : '#6B7280' }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={lbl}>Plano de corte</label>
            {d3.planCorteLink ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a href={d3.planCorteLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>Ver plano <ExternalLink size={10} /></a>
                {d3.fechaDespachoPlano && <span style={{ fontSize: 10, color: '#6B7280' }}>Despachado: {d3.fechaDespachoPlano}</span>}
                <button onClick={() => setShowPlan(true)} style={{ fontSize: 10, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar</button>
              </div>
            ) : !showPlan ? (
              <button onClick={() => setShowPlan(true)} style={{ fontSize: 11, color: '#E3A868', background: '#2E1A0820', border: '1px solid #B5651D40', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', width: '100%' }}>+ Subir plano de corte</button>
            ) : null}
            {showPlan && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <input value={planInput} onChange={e => setPlanInput(e.target.value)} placeholder="https://drive.google.com/..." style={{ ...inp, flex: 1 }} />
                <button onClick={subirPlan} style={{ background: '#B5651D', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '5px 10px', cursor: 'pointer' }}>✓</button>
                <button onClick={() => setShowPlan(false)} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '5px 10px', cursor: 'pointer' }}>✕</button>
              </div>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={lbl}>Dimensiones (cm)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input type="number" min={0} value={mod.largo || ''} onChange={e => onUpdate({ ...mod, largo: e.target.value })} placeholder="Largo" style={inp} />
              <input type="number" min={0} value={mod.profundidad || ''} onChange={e => onUpdate({ ...mod, profundidad: e.target.value })} placeholder="Profundidad" style={inp} />
              <input type="number" min={0} value={mod.alto || ''} onChange={e => onUpdate({ ...mod, alto: e.target.value })} placeholder="Alto" style={inp} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={lbl}>Registro de diseño</label>
            <div style={{ marginBottom: 8 }}>
              <label style={{ ...lbl, fontSize: 10 }}>Diseñador</label>
              <div style={{ ...inp, display: 'flex', alignItems: 'center', color: d3.disenador ? '#E2E8F0' : '#4B5563' }}>
                {d3.disenador || 'Sin asignar — se asigna desde la pestaña Equipo del proyecto'}
              </div>
            </div>
            <div>
              <label style={{ ...lbl, fontSize: 10 }}>Fecha en que se subió el plano de corte</label>
              <div style={{ ...inp, display: 'flex', alignItems: 'center', color: d3.fechaDiseno ? '#E2E8F0' : '#4B5563' }}>
                {d3.fechaDiseno || 'Todavía no se sube el plano de corte de este módulo'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={lbl}>Observaciones</label>
            <textarea value={d3.observaciones || ''} onChange={e => onUpdate({ ...mod, diseno3d: { ...d3, observaciones: e.target.value } })} rows={2} style={{ ...inp, resize: 'none', width: '100%' }} />
          </div>
          {!liberadoProd ? (
            <div style={{ marginTop: 10 }}>
              <button onClick={liberar} disabled={!puedeLiberar} style={{ width: '100%', background: puedeLiberar ? '#7A4B8C' : '#1F2937', color: puedeLiberar ? '#fff' : '#4B5563', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '7px', cursor: puedeLiberar ? 'pointer' : 'not-allowed' }}>
                🏭 Liberar a Producción
              </button>
              {!puedeLiberar && <div style={{ fontSize: 10, color: !d3.planCorteLink && d3.design3DCompleted && d3.breakdownCompleted ? '#FCD34D' : '#4B5563', textAlign: 'center', marginTop: 4 }}>{!d3.planCorteLink && d3.design3DCompleted && d3.breakdownCompleted ? '⚠ Sube el plano de corte para liberar' : 'Completa SolidWorks y Despiece primero'}</div>}
            </div>
          ) : <div style={{ marginTop: 10, fontSize: 11, color: '#C9A8D6', fontWeight: 600, textAlign: 'center' }}>✓ Liberado a Producción el {d3.liberadoAt?.slice(0,10)}</div>}
        </div>
      )}
    </div>
  );
}

function ModuloProd({ mod, onUpdate }) {
  const { responsables } = useApp();
  const maestrosOpts = getResponsablesAgrupados(responsables)['Maestros'] || [];
  const [expanded, setExpanded] = useState(false);
  const prod = mod.produccion || {};
  const liberado = !!mod.diseno3d?.liberadoProduccion;
  const sem = semaforo(mod.fechaEntrega);
  const dims = formatDimensiones(mod);
  const idxActual = FASES_PRODUCCION.indexOf(prod.faseActual || FASES_PRODUCCION[0]);
  function toggleReproceso() {
    if (!prod.reproceso) {
      // Nuevo reproceso: se guarda la fecha y se limpia cualquier archivo/fecha
      // de resolución de un reproceso anterior en este mismo módulo, para que
      // Diseño 3D no vea como "ya resuelto" algo que en realidad es un caso nuevo.
      const hoy = new Date().toISOString().slice(0,10);
      onUpdate({ ...mod, produccion: { ...prod, reproceso: true, fechaReproceso: hoy }, diseno3d: { ...mod.diseno3d, archivoReproceso: '', fechaReprocesoResuelto: '' } });
    } else {
      onUpdate({ ...mod, produccion: { ...prod, reproceso: false } });
    }
  }
  if (!liberado) return (
    <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '10px 14px', marginBottom: 8, opacity: 0.45 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lock size={13} color="#374151" />
        <span style={{ fontSize: 12, color: '#4B5563' }}>{mod.pec} — {mod.nombre || 'Sin nombre'}</span>
        <span style={{ fontSize: 10, color: '#374151', marginLeft: 'auto' }}>Esperando Diseño 3D</span>
      </div>
    </div>
  );
  return (
    <div style={{ background: '#141824', border: `1.5px solid ${prod.faseActual === '✓ Terminado' ? '#16A34A40' : '#7A4B8C40'}`, borderRadius: 10, marginBottom: 8 }}>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: sem.color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>{mod.nombre || 'Sin nombre'}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7280' }}>{mod.pec}</span>
            <LineaBadge linea={mod.linea} />
            <span style={{ fontSize: 9, background: '#241A2B', color: '#C9A8D6', padding: '1px 6px', borderRadius: 4 }}>{prod.faseActual || 'Pendiente'}</span>
            {prod.reproceso && <span style={{ fontSize: 9, fontWeight: 700, background: '#450A0A', color: '#FCA5A5', padding: '1px 6px', borderRadius: 4 }}>⚠ REPROCESO</span>}
            {mod.maestro && <span style={{ fontSize: 10, color: '#6B7280' }}>👤 {mod.maestro}</span>}
            <span style={{ fontSize: 10, color: sem.color }}>{sem.label}</span>
            {dims && <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>📐 {dims}</span>}
          </div>
          {mod.codigo && <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#4B5563', marginTop: 2 }}>{mod.codigo}</div>}
          <div style={{ display: 'flex', gap: 2, marginTop: 5 }}>
            {FASES_PRODUCCION.slice(0,10).map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < idxActual ? '#7A4B8C' : i === idxActual ? '#C9A8D6' : '#1E2433' }} />)}
          </div>
        </div>
        <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
      </div>
      {expanded && (
        <div className="anim-fade-in" style={{ padding: '0 14px 14px', borderTop: '1px solid #1E2433' }}>
          <div style={{ marginTop: 10 }}>
            <label style={lbl}>Maestro asignado</label>
            <select value={mod.maestro || ''} onChange={e => onUpdate({ ...mod, maestro: e.target.value })} style={inp}>
              <option value="">Sin asignar</option>
              {maestrosOpts.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={lbl}>Fase actual</label>
            <select value={prod.faseActual || FASES_PRODUCCION[0]} onChange={e => onUpdate({ ...mod, produccion: { ...prod, faseActual: e.target.value, fechaIngresoFase: new Date().toISOString().slice(0,10) } })} style={inp}>
              {FASES_PRODUCCION.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 8 }}>
            {FASES_PRODUCCION.slice(0,10).map((fase, i) => (
              <div key={fase} onClick={() => onUpdate({ ...mod, produccion: { ...prod, faseActual: fase, fechaIngresoFase: new Date().toISOString().slice(0,10) } })} title={fase} style={{ width: 24, height: 24, borderRadius: 5, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < idxActual ? '#052E16' : i === idxActual ? '#7A4B8C' : '#1E2433', color: i < idxActual ? '#86EFAC' : i === idxActual ? '#fff' : '#374151', cursor: 'pointer' }}>{i+1}</div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={lbl}>Dimensiones (cm)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input type="number" min={0} value={mod.largo || ''} onChange={e => onUpdate({ ...mod, largo: e.target.value })} placeholder="Largo" style={inp} />
              <input type="number" min={0} value={mod.profundidad || ''} onChange={e => onUpdate({ ...mod, profundidad: e.target.value })} placeholder="Profundidad" style={inp} />
              <input type="number" min={0} value={mod.alto || ''} onChange={e => onUpdate({ ...mod, alto: e.target.value })} placeholder="Alto" style={inp} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={lbl}>Fecha validación (Jefe de Producción)</label>
            <input type="date" value={prod.fechaValidacionJP || ''} onChange={e => onUpdate({ ...mod, produccion: { ...prod, fechaValidacionJP: e.target.value } })} style={inp} />
          </div>
          <div onClick={toggleReproceso}
            style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: prod.reproceso ? '#45140320' : '#0A0D14', border: `1px solid ${prod.reproceso ? '#7A4B8C50' : '#1E2433'}`, borderRadius: 7, cursor: 'pointer' }}>
            {prod.reproceso ? <CheckCircle2 size={13} color="#7A4B8C" /> : <Circle size={13} color="#374151" />}
            <span style={{ fontSize: 11, color: prod.reproceso ? '#C9A8D6' : '#6B7280' }}>Marcar como Reproceso</span>
          </div>
          {prod.reproceso && prod.fechaReproceso && (
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>Marcado el {prod.fechaReproceso} — Diseño 3D ya recibió la alerta</div>
          )}
          {!prod.reproceso && mod.diseno3d?.fechaReprocesoResuelto && (
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>✓ Último reproceso resuelto el {mod.diseno3d.fechaReprocesoResuelto}</div>
          )}
          <div style={{ marginTop: 8 }}>
            <label style={lbl}>Observaciones</label>
            <textarea value={prod.observaciones || ''} onChange={e => onUpdate({ ...mod, produccion: { ...prod, observaciones: e.target.value } })} rows={2} style={{ ...inp, resize: 'none', width: '100%' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vista detalle proyecto ───────────────────────
function ProyectoDetalleDept({ proyecto, departamento, onUpdate, onBack }) {
  const { saveAlertas } = useApp();
  const cfg = DEPT_CONFIG[departamento] || { color: '#D4A017', bg: '#1F2937', text: '#F0D687', icon: '📋' };
  const modulos = proyecto.production?.modulos || [];
  const proyectoActualRef = proyecto;

  function updateModulo(modActualizado) {
    const nuevos = modulos.map(m => m.id === modActualizado.id ? modActualizado : m);

    // Sincronizar estado del proyecto con lo que pasa en los módulos
    const algunoLiberadoD3D  = nuevos.some(m => m.arquitectura?.liberadoA3D);
    const algunoD3DActivo    = nuevos.some(m => m.diseno3d?.solidworksStarted);
    const algunoD3DTerminado = nuevos.some(m => m.diseno3d?.solidworksFinished);
    const algunoLibProd      = nuevos.some(m => m.diseno3d?.liberadoProduccion);
    const todosTerminados    = nuevos.length > 0 && nuevos.every(m => m.produccion?.faseActual === '✓ Terminado');

    // Actualizar design3d del proyecto con el estado más avanzado
    const d3Actualizado = {
      ...proyecto.design3d,
      solidworksStarted:        algunoD3DActivo,
      solidworksFinished:       algunoD3DTerminado,
      autocadBreakdownStarted:  nuevos.some(m => m.diseno3d?.autocadBreakdownStarted),
      autocadBreakdownFinished: nuevos.some(m => m.diseno3d?.autocadBreakdownFinished),
      design3DCompleted:        nuevos.some(m => m.diseno3d?.design3DCompleted || m.diseno3d?.solidworksFinished),
      breakdownCompleted:       nuevos.some(m => m.diseno3d?.breakdownCompleted || m.diseno3d?.autocadBreakdownFinished),
      planCorteLink:            nuevos.find(m => m.diseno3d?.planCorteLink)?.diseno3d?.planCorteLink || proyecto.design3d?.planCorteLink || '',
      releasedToProduction:     algunoLibProd,
      status: algunoLibProd ? 'Liberado a Producción' :
              nuevos.some(m => m.diseno3d?.autocadBreakdownStarted) ? 'En despiece AutoCAD' :
              algunoD3DTerminado ? 'SolidWorks terminado' :
              algunoD3DActivo ? 'En modelado SolidWorks' :
              algunoLiberadoD3D ? 'Pendiente de modelado' : 'Bloqueado',
    };

    // Actualizar producción
    const prodActualizada = {
      ...proyecto.production,
      modulos: nuevos,
      partialProduction: nuevos.some(m => m.produccion?.faseActual && m.produccion.faseActual !== '1. Despacho Materia Prima' && m.produccion.faseActual !== '✓ Terminado'),
      productionFinished: todosTerminados,
      status: todosTerminados ? 'Producción terminada' :
              nuevos.some(m => m.diseno3d?.liberadoProduccion) ? 'En producción' : 'Bloqueado',
    };

    onUpdate({
      ...proyecto,
      releasedToDesign3D: algunoLiberadoD3D,
      design3d:   d3Actualizado,
      production: prodActualizada,
    });

    // Si Producción recién termina y Contabilidad ya había autorizado antes, el pase
    // queda abierto justo ahora — avisar a Instalaciones sin esperar a que alguien vuelva a tocar Contabilidad.
    const yaEstabaTerminado = !!proyecto.production?.productionFinished;
    if (todosTerminados && !yaEstabaTerminado && !!proyecto.contabilidad?.autorizado) {
      saveAlertas([{
        id: `ALERTA_${proyecto.id}_pase_${Date.now()}`,
        proyectoId: proyecto.id,
        proyecto: proyecto.nombre,
        cliente: proyecto.cliente,
        departamentoOrigen: 'Contabilidad',
        departamentoDestino: 'Instalaciones',
        tipo: 'Pase abierto — listo para instalar',
        motivo: 'Producción terminó recién y el pago ya estaba autorizado por Contabilidad. Ya se puede proceder a instalar.',
        accionNecesaria: 'Instalaciones: coordinar y proceder con la instalación.',
        prioridad: 'Alta',
        estado: 'Pendiente',
        fecha: new Date().toISOString().slice(0,10),
        auto: false,
      }]);
    }
  }

  const resp = getResponsable(proyecto, departamento)[0];
  const liberados = modulos.filter(m => m.arquitectura?.liberadoA3D).length;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
        <ArrowLeft size={15} /> Volver a {departamento}
      </button>
      <div style={{ background: '#141824', border: '1px solid #1E2433', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>{proyecto.nombre}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{proyecto.cliente} · {proyecto.numeroContrato || '—'}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.text }}>{departamento}</span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#1F2937', color: '#9CA3AF' }}>📦 {modulos.length} módulos</span>
              {departamento === 'Arquitectura' && modulos.length > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#2E1A08', color: '#E3A868' }}>{liberados}/{modulos.length} en D3D</span>}
              {resp && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: cfg.bg, color: cfg.text }}>👤 {resp}</span>}
            </div>
          </div>
          {proyecto.fechaEntrega && (() => { const s = semaforo(proyecto.fechaEntrega); return (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#6B7280' }}>Entrega</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{proyecto.fechaEntrega}</div>
              <div style={{ fontSize: 10, color: s.color }}>{s.label}</div>
            </div>
          );})()}
        </div>
      </div>
      {departamento !== 'Instalaciones' && (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
          Módulos — {modulos.length} registrados
        </div>
      )}
      {departamento !== 'Instalaciones' && modulos.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#4B5563', fontSize: 12 }}>Sin módulos. Edita el proyecto desde "Proyectos".</div>}
      {departamento === 'Diseño 3D' && modulos.length > 0 && modulos.every(m => !!m.diseno3d?.planCorteLink) && (() => {
        const entregada = !!proyecto.diseno3d?.carpetaFisicaEntregada;
        // Fecha en que quedó listo el último módulo del proyecto — distinta
        // de cuándo se marca la carpeta como entregada (eso es un paso
        // físico aparte, que puede pasar días después). Se calcula sola a
        // partir de la fecha que cada módulo ya guarda al subir su plano.
        const fechaProyectoCompleto = modulos.map(m => m.diseno3d?.fechaDespachoPlano).filter(Boolean).sort().at(-1);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: entregada ? '#052E1660' : '#451A0360', border: `1px solid ${entregada ? '#16653480' : '#B4530980'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: entregada ? '#86EFAC' : '#FCD34D', fontWeight: 600 }}>
              {entregada
                ? `✓ Carpeta física entregada al Jefe de Producción${proyecto.diseno3d?.carpetaFisicaEntregadaAt ? ` — ${proyecto.diseno3d.carpetaFisicaEntregadaAt}` : ''}`
                : '⚠ Todos los planos de corte están listos — no olvides entregar la carpeta física completa al Jefe de Producción.'}
              {fechaProyectoCompleto && <span style={{ display: 'block', fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginTop: 2 }}>Proyecto completo (todos los planos subidos) desde el {fechaProyectoCompleto}</span>}
            </span>
            {!entregada && (
              <button
                onClick={() => onUpdate({ ...proyecto, diseno3d: { ...proyecto.diseno3d, carpetaFisicaEntregada: true, carpetaFisicaEntregadaAt: new Date().toISOString().slice(0,10) } })}
                style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', background: '#B45309', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                ✓ Marcar carpeta entregada
              </button>
            )}
          </div>
        );
      })()}
      {departamento === 'Arquitectura'  && <SeccionArquitectura proyecto={proyectoActualRef} onUpdate={onUpdate} />}
      {departamento === 'Diseño 3D'     && modulos.map(m => <ModuloD3D  key={m.id} mod={m} onUpdate={updateModulo} />)}
      {departamento === 'Producción'    && modulos.map(m => <ModuloProd key={m.id} mod={m} onUpdate={updateModulo} />)}
      {departamento === 'Instalaciones' && <SeccionInstalaciones proyecto={proyectoActualRef} onUpdate={onUpdate} />}
    </div>
  );
}

// ── Componente principal ─────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function labelMes(ym) {
  const [y, m] = ym.split('-');
  return `${MESES[parseInt(m,10)-1]} ${y}`;
}

export default function DepartmentView({ departamento, proyectos = [] }) {
  const { updateProyecto } = useApp();
  const [seleccionado, setSeleccionado] = useState(null);
  const [vista, setVista] = useState('proyectos');
  const [filtroPersona, setFiltroPersona] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const cfg = DEPT_CONFIG[departamento] || { color: '#D4A017', bg: '#1F2937', text: '#F0D687', icon: '📋' };

  const safeProys = Array.isArray(proyectos) ? proyectos : [];
  const deptProys = safeProys.filter(p => proyectoEnDept(p, departamento));

  const personasDisponibles = [...new Set(deptProys.flatMap(p => getResponsable(p, departamento)).filter(Boolean))].sort();
  const mesesDisponibles    = [...new Set(deptProys.map(p => p.fechaEntrega ? p.fechaEntrega.slice(0,7) : null).filter(Boolean))].sort();

  const deptProysFiltrados = deptProys.filter(p => {
    const matchPersona = !filtroPersona || getResponsable(p, departamento).includes(filtroPersona);
    const matchMes     = !filtroMes || p.fechaEntrega?.slice(0,7) === filtroMes;
    return matchPersona && matchMes;
  });

  function handleUpdate(updated) {
    updateProyecto(updated);
    setSeleccionado(updated);
  }

  if (seleccionado) {
    const actual = safeProys.find(p => p.id === seleccionado.id) || seleccionado;
    return <ProyectoDetalleDept proyecto={actual} departamento={departamento} onUpdate={handleUpdate} onBack={() => setSeleccionado(null)} />;
  }

  const sinResp = deptProysFiltrados.filter(p => getResponsable(p, departamento)[0] === null);
  const grupos  = {};
  deptProysFiltrados.filter(p => getResponsable(p, departamento)[0] !== null).forEach(p => {
    getResponsable(p, departamento).forEach(nombre => {
      if (!grupos[nombre]) grupos[nombre] = [];
      if (!grupos[nombre].find(x => x.id === p.id)) grupos[nombre].push(p);
    });
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{cfg.icon || '📋'}</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: 0, fontFamily: 'var(--font-display)' }}>{departamento}</h1>
            <p style={{ fontSize: 12, color: cfg.text, margin: '3px 0 0' }}>
              {(filtroPersona || filtroMes) && vista === 'proyectos'
                ? `${deptProysFiltrados.length} de ${deptProys.length} proyecto${deptProys.length !== 1 ? 's' : ''} · Clic para ver módulos`
                : `${deptProys.length} proyecto${deptProys.length !== 1 ? 's' : ''} · Clic para ver módulos`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', background: '#0A0D14', border: `1.5px solid ${cfg.color}30`, borderRadius: 10, overflow: 'hidden' }}>
          {[['proyectos','📋 Proyectos'],['calendario','📅 Calendario'],...(departamento === 'Arquitectura' ? [['prospectos','✏️ Prospectos']] : [])].map(([v, label]) => (
            <button key={v} onClick={() => setVista(v)} style={{ fontSize: 14, fontWeight: 700, padding: '11px 22px', background: vista === v ? cfg.color : 'transparent', color: vista === v ? '#fff' : '#9CA3AF', border: 'none', cursor: 'pointer', transition: 'all .15s' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Filtros: persona y mes */}
      {vista === 'proyectos' && (personasDisponibles.length > 0 || mesesDisponibles.length > 0) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          {personasDisponibles.length > 0 && (
            <select value={filtroPersona} onChange={e => setFiltroPersona(e.target.value)}
              style={{ fontSize: 12, fontWeight: 600, padding: '8px 14px', background: filtroPersona ? cfg.color : '#0A0D14', color: filtroPersona ? '#fff' : '#9CA3AF', border: `1.5px solid ${cfg.color}40`, borderRadius: 9, cursor: 'pointer' }}>
              <option value="">👤 Todas las personas</option>
              {personasDisponibles.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          {mesesDisponibles.length > 0 && (
            <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
              style={{ fontSize: 12, fontWeight: 600, padding: '8px 14px', background: filtroMes ? cfg.color : '#0A0D14', color: filtroMes ? '#fff' : '#9CA3AF', border: `1.5px solid ${cfg.color}40`, borderRadius: 9, cursor: 'pointer' }}>
              <option value="">📅 Todos los meses</option>
              {mesesDisponibles.map(m => <option key={m} value={m}>{labelMes(m)}</option>)}
            </select>
          )}
          {(filtroPersona || filtroMes) && (
            <button onClick={() => { setFiltroPersona(''); setFiltroMes(''); }}
              style={{ fontSize: 12, fontWeight: 600, padding: '8px 14px', background: 'none', color: '#6B7280', border: '1.5px solid #374151', borderRadius: 9, cursor: 'pointer' }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Calendario */}
      {vista === 'calendario' && (
        <div style={{ height: 560, background: '#141824', border: `1px solid ${cfg.color}20`, borderRadius: 12, overflow: 'hidden' }}>
          <CalendarioDepto proyectos={deptProys} departamento={departamento} cfg={cfg} onGoProject={id => { const p = safeProys.find(x => x.id === id); if (p) setSeleccionado(p); }} />
        </div>
      )}

      {/* Prospectos — solo Arquitectura */}
      {vista === 'prospectos' && departamento === 'Arquitectura' && (
        <Prospectos onProyectoGenerado={proyecto => { setVista('proyectos'); setSeleccionado(proyecto); }} />
      )}

      {/* Lista proyectos */}
      {vista === 'proyectos' && (
        <>
          {/* Alerta sin responsable */}
          {sinResp.length > 0 && (
            <div style={{ background: '#450A0A', border: '1px solid #EF444440', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FCA5A5' }}>{sinResp.length} proyecto{sinResp.length !== 1 ? 's' : ''} sin responsable</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Ve a cada proyecto → pestaña Equipo para asignar responsable</div>
              </div>
            </div>
          )}
          {sinResp.length > 0 && <GrupoProyectos titulo="Sin responsable" proyectos={sinResp} departamento={departamento} dotColor="#EF4444" onSelect={setSeleccionado} />}

          {deptProys.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#4B5563' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{cfg.icon}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>
                {departamento === 'Arquitectura' ? 'No hay proyectos activos.' : `No hay proyectos en ${departamento} todavía.`}
              </p>
            </div>
          )}

          {/* Agrupado por responsable */}
          {Object.entries(grupos).sort(([a],[b]) => a.localeCompare(b)).map(([nombre, proysPersona]) => {
            const cls = proysPersona.map(p => ({ p, cls: clasificarProyecto(p, departamento) }));
            const urgentesP    = cls.filter(x => x.cls === 'atrasado' || x.cls === 'urgente').sort((a,b) => prioridadOrden(a.p)-prioridadOrden(b.p)).map(x => x.p);
            const enProcesoP   = cls.filter(x => x.cls === 'en_proceso').sort((a,b) => prioridadOrden(a.p)-prioridadOrden(b.p)).map(x => x.p);
            const pendientesP  = cls.filter(x => x.cls === 'pendiente').sort((a,b) => prioridadOrden(a.p)-prioridadOrden(b.p)).map(x => x.p);
            const completadosP = cls.filter(x => x.cls === 'completado').map(x => x.p);
            const tieneUrgente = urgentesP.length > 0;
            return (
              <div key={nombre} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', background: '#0A0D14', border: `1px solid ${tieneUrgente ? '#EF444430' : cfg.color + '20'}`, borderRadius: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {nombre.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{nombre}</div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>
                      {proysPersona.length} proyecto{proysPersona.length !== 1 ? 's' : ''}
                      {tieneUrgente && <span style={{ color: '#EF4444', marginLeft: 8 }}>· {urgentesP.length} urgente{urgentesP.length !== 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                </div>
                <GrupoProyectos titulo="Urgentes y atrasados" proyectos={urgentesP}    departamento={departamento} dotColor="#EF4444" onSelect={setSeleccionado} />
                <GrupoProyectos titulo="En proceso"            proyectos={enProcesoP}   departamento={departamento} dotColor="#B5651D" onSelect={setSeleccionado} />
                <GrupoProyectos titulo="Pendientes"            proyectos={pendientesP}  departamento={departamento} dotColor="#6B7280" onSelect={setSeleccionado} />
                <GrupoProyectos titulo="Completados"           proyectos={completadosP} departamento={departamento} dotColor="#16A34A" onSelect={setSeleccionado} />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

const lbl = { fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 };
const inp = { background: '#101215', border: '1px solid #374151', borderRadius: 7, color: '#E2E8F0', fontSize: 12, padding: '6px 10px', outline: 'none', width: '100%' };

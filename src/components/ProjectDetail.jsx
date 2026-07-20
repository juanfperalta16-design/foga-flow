import { useState } from 'react';
import { useApp } from '../App';
import { ArrowLeft, Edit, Clock, Lock, ExternalLink, CheckCircle2, Circle, Link, Users, Download } from 'lucide-react';
import { StatusChip, PrioridadChip } from './StatusChip';
import { formatFecha, isAtrasado } from '../utils/dateHelpers';
import ProjectFlow from './ProjectFlow';
import ProjectForm from './ProjectForm';
import { getNombresResponsables, getResponsablesAgrupados } from '../utils/settingsStorage';
import { crearEntradaHistorial } from '../utils/historyHelpers';
import { calcularEstadoGeneral } from '../utils/processRules';

// ── Select de responsable limpio ──────────────────
function ResponsableSelect({ label, value, onChange, color = '#D4A017', bg = '#332905', textColor = '#F0D687', grupos, responsables }) {
  const agrupados = getResponsablesAgrupados(responsables);
  const filtrados = grupos
    ? Object.fromEntries(Object.entries(agrupados).filter(([g]) => grupos.includes(g)))
    : agrupados;
  return (
    <div style={{ background: bg + '30', border: `1.5px solid ${color}40`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
        👤 {label}
      </div>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: '#101215', border: `1px solid ${color}40`, borderRadius: 8, color: value ? '#F1F5F9' : '#6B7280', fontSize: 13, fontWeight: value ? 600 : 400, padding: '8px 12px', outline: 'none' }}>
        <option value="">Sin asignar...</option>
        {Object.entries(filtrados).map(([grupo, nombres]) => (
          <optgroup key={grupo} label={`── ${grupo} ──`}>
            {nombres.map(n => <option key={n} value={n}>{n}</option>)}
          </optgroup>
        ))}
      </select>
      {value && (
        <div style={{ marginTop: 6, fontSize: 11, color: textColor, display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
          {value} asignado
        </div>
      )}
    </div>
  );
}

// ── Multi-select para Diseño 3D ───────────────────
function MultiResponsableSelect({ label, values = [], onChange, color = '#B5651D', bg = '#2E1A08', textColor = '#E3A868', grupos, responsables, itemLabel = 'diseñador' }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState('');
  const agrupados = getResponsablesAgrupados(responsables);
  const filtrados = grupos
    ? Object.fromEntries(Object.entries(agrupados).filter(([g]) => grupos.includes(g)))
    : agrupados;

  function agregar() {
    if (!selected || values.includes(selected)) return;
    onChange([...values, selected]);
    setSelected('');
    setShowAdd(false);
  }

  function quitar(nombre) {
    onChange(values.filter(v => v !== nombre));
  }

  return (
    <div style={{ background: bg + '20', border: `1.5px solid ${color}40`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
        👥 {label}
      </div>
      {values.length === 0 && !showAdd && (
        <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 6 }}>Sin {itemLabel}s asignados</div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: values.length > 0 ? 8 : 0 }}>
        {values.map(v => (
          <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, background: bg + '60', border: `1px solid ${color}40`, borderRadius: 99, padding: '3px 10px 3px 8px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 11, color: textColor, fontWeight: 600 }}>{v}</span>
            <button onClick={() => quitar(v)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0, marginLeft: 2 }}>✕</button>
          </div>
        ))}
      </div>
      {showAdd
        ? <div style={{ display: 'flex', gap: 6 }}>
            <select value={selected} onChange={e => setSelected(e.target.value)}
              style={{ flex: 1, background: '#101215', border: `1px solid ${color}40`, borderRadius: 7, color: '#E2E8F0', fontSize: 12, padding: '6px 10px', outline: 'none' }}>
              <option value="">Seleccionar...</option>
              {Object.entries(filtrados).map(([grupo, nombres]) => (
                <optgroup key={grupo} label={`── ${grupo} ──`}>
                  {nombres.filter(n => !values.includes(n)).map(n => <option key={n} value={n}>{n}</option>)}
                </optgroup>
              ))}
            </select>
            <button onClick={agregar} style={{ background: color, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>✓</button>
            <button onClick={() => setShowAdd(false)} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
          </div>
        : <button onClick={() => setShowAdd(true)}
            style={{ fontSize: 11, color, background: bg + '30', border: `1px dashed ${color}50`, borderRadius: 7, padding: '5px 12px', cursor: 'pointer', width: '100%', marginTop: values.length > 0 ? 4 : 0 }}>
            + Agregar {itemLabel}
          </button>
      }
    </div>
  );
}

// ── Pestaña Equipo ────────────────────────────────
function PestanaEquipo({ proyecto, onUpdate, responsables }) {
  const arch      = proyecto.architecture  || {};
  const inst      = proyecto.installations || {};
  const d3        = proyecto.design3d      || {};
  const modulos   = proyecto.production?.modulos || [];

  function setResp(dept, field, val) {
    onUpdate({ ...proyecto, [dept]: { ...(proyecto[dept] || {}), [field]: val } });
  }

  // El diseñador se asigna UNA vez aquí, en Equipo (no por módulo — ver
  // ModuloD3D en DepartmentView, que ahora solo lo muestra de solo lectura).
  // Cambiar el diseñador principal lo aplica de una vez a todos los módulos
  // ya liberados a Diseño 3D, igual que la Línea del proyecto en Arquitectura.
  function setD3Designers(vals) {
    const cambios = { ...proyecto, design3d: { ...d3, responsables: vals, responsible: vals[0] || '' } };
    if (vals.length > 0) {
      const principal = vals[0];
      cambios.production = {
        ...proyecto.production,
        modulos: modulos.map(m => m.arquitectura?.liberadoA3D ? { ...m, diseno3d: { ...m.diseno3d, disenador: principal } } : m),
      };
    }
    onUpdate(cambios);
  }

  function setMaestros(vals) {
    const previos = proyecto.production?.maestrosAsignados || [];
    const cambios = { ...proyecto, production: { ...proyecto.production, maestrosAsignados: vals } };
    // Si se agregó un maestro nuevo, aplicarlo a los módulos que todavía no tengan maestro —
    // si no, quedaba guardado aquí pero Producción seguía mostrando "sin maestro".
    if (vals.length > previos.length) {
      const nuevo = vals[vals.length - 1];
      cambios.production.modulos = modulos.map(m => m.maestro ? m : { ...m, maestro: nuevo });
    }
    onUpdate(cambios);
  }

  const d3Designers = d3.responsables || (d3.responsible ? [d3.responsible] : []);
  const maestrosProd = [...new Set(modulos.map(m => m.maestro).filter(Boolean))];
  const maestrosAsignados = proyecto.production?.maestrosAsignados || maestrosProd;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 12, color: '#6B7280', background: '#141824', border: '1px solid #1E2433', borderRadius: 8, padding: '8px 12px' }}>
        El jefe asigna aquí el responsable de cada departamento. Cada persona ve sus proyectos en su área correspondiente.
      </div>

      {/* Vendedor */}
      <div style={{ background: '#1F293730', border: '1.5px solid #37415140', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
          💼 Vendedor
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{proyecto.responsableGeneral || 'Sin asignar'}</div>
        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Se asigna al crear el proyecto</div>
      </div>

      {/* Fechas de entrega por departamento */}
      <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
          📅 Fechas de entrega por departamento
        </div>
        <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 10 }}>
          Estas fechas aparecen en el calendario de cada departamento y son independientes de la fecha general del proyecto.
        </div>
        {[
          { key: 'diseno3d',      label: 'Diseño 3D',     color: '#B5651D', bg: '#2E1A08' },
          { key: 'produccion',    label: 'Producción',    color: '#7A4B8C', bg: '#241A2B' },
        ].map(({ key, label, color, bg }) => {
          const fechasDepto = proyecto.fechasDepto || {};
          const val  = fechasDepto[key] || '';
          const dnum = val ? Math.floor((new Date(val) - new Date()) / 86400000) : null;
          const semaforoColor = dnum === null ? '#6B7280' : dnum < 0 ? '#EF4444' : dnum <= 5 ? '#F97316' : '#16A34A';
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #1E2433' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#CBD5E1', width: 110, flexShrink: 0, fontWeight: 500 }}>{label}</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="date" value={val}
                  onChange={e => {
                    const nueva = e.target.value;
                    // Validar año razonable
                    if (nueva && new Date(nueva).getFullYear() > 2100) return;
                    onUpdate({ ...proyecto, fechasDepto: { ...fechasDepto, [key]: nueva } });
                  }}
                  style={{ background: '#101215', border: `1.5px solid ${val ? color + '60' : '#374151'}`, borderRadius: 8, color: '#E2E8F0', fontSize: 12, padding: '6px 10px', outline: 'none', flex: 1 }} />
                {val && (
                  <button
                    onClick={() => onUpdate({ ...proyecto, fechasDepto: { ...fechasDepto, [key]: '' } })}
                    title="Limpiar fecha"
                    style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#9CA3AF', fontSize: 11, padding: '5px 8px', cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>
                    ✕
                  </button>
                )}
              </div>
              {dnum !== null && (
                <span style={{ fontSize: 10, fontWeight: 700, color: semaforoColor, background: semaforoColor + '20', border: `1px solid ${semaforoColor}40`, padding: '3px 10px', borderRadius: 99, flexShrink: 0, minWidth: 90, textAlign: 'center' }}>
                  {dnum < 0 ? `⚠ ${Math.abs(dnum)}d atrasado` : `✓ ${dnum}d restantes`}
                </span>
              )}
            </div>
          );
        })}
        {/* Instalaciones — no se escribe a mano, es la fecha que ya puso el cliente */}
        {(() => {
          const val = proyecto.fechaEntrega || '';
          const dnum = val ? Math.floor((new Date(val) - new Date()) / 86400000) : null;
          const semaforoColor = dnum === null ? '#6B7280' : dnum < 0 ? '#EF4444' : dnum <= 5 ? '#F97316' : '#16A34A';
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2C6E9E', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#CBD5E1', width: 110, flexShrink: 0, fontWeight: 500 }}>Instalaciones</span>
              <div style={{ flex: 1, fontSize: 12, color: val ? '#E2E8F0' : '#4B5563' }}>
                {val || 'Sin fecha del cliente'} <span style={{ color: '#6B7280', fontSize: 10 }}>(fecha de instalación del proyecto)</span>
              </div>
              {dnum !== null && (
                <span style={{ fontSize: 10, fontWeight: 700, color: semaforoColor, background: semaforoColor + '20', border: `1px solid ${semaforoColor}40`, padding: '3px 10px', borderRadius: 99, flexShrink: 0, minWidth: 90, textAlign: 'center' }}>
                  {dnum < 0 ? `⚠ ${Math.abs(dnum)}d atrasado` : `✓ ${dnum}d restantes`}
                </span>
              )}
            </div>
          );
        })()}
      </div>

      {/* Arquitectura */}
      <ResponsableSelect
        label="Arquitectura"
        value={arch.responsible}
        onChange={val => setResp('architecture', 'responsible', val)}
        color="#D4A017" bg="#332905" textColor="#F0D687"
        grupos={['Arquitectas']}
        responsables={responsables}
      />

      {/* Diseño 3D — múltiple */}
      <MultiResponsableSelect
        label="Diseño 3D"
        values={d3Designers}
        onChange={setD3Designers}
        color="#B5651D" bg="#2E1A08" textColor="#E3A868"
        grupos={['Diseñadores Producto']}
        responsables={responsables}
      />

      {/* Diseño 3D — detalle por módulo (diseñador, fechas, reproceso) */}
      {modulos.length > 0 && (
        <div style={{ background: '#2E1A0820', border: '1.5px solid #B5651D40', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#B5651D', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
            🖥️ Diseño 3D — Registro por módulo
          </div>
          {modulos.filter(m => m.arquitectura?.liberadoA3D).length === 0
            ? <div style={{ fontSize: 12, color: '#4B5563' }}>Ningún módulo liberado a Diseño 3D todavía</div>
            : modulos.filter(m => m.arquitectura?.liberadoA3D).map(mod => {
                const d3 = mod.diseno3d || {};
                return (
                  <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid #1E2433', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{mod.nombre || mod.pec}</span>
                      <span style={{ fontSize: 10, color: '#6B7280', marginLeft: 6 }}>{d3.disenador || 'Sin diseñador asignado'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {d3.fechaDiseno && <span style={{ fontSize: 10, color: '#E3A868' }}>Diseño: {d3.fechaDiseno}</span>}
                      {mod.produccion?.fechaValidacionJP && <span style={{ fontSize: 10, color: '#86EFAC' }}>Validado: {mod.produccion.fechaValidacionJP}</span>}
                      {mod.produccion?.reproceso && <span style={{ fontSize: 9, fontWeight: 700, background: '#450A0A', color: '#FCA5A5', padding: '1px 6px', borderRadius: 4 }}>⚠ Reproceso</span>}
                    </div>
                  </div>
                );
              })
          }
          <div style={{ fontSize: 10, color: '#6B7280', marginTop: 6 }}>Se registra desde la pestaña Diseño 3D / Producción, por módulo.</div>
        </div>
      )}

      {/* Instalaciones */}
      <ResponsableSelect
        label="Instalaciones / Obra"
        value={inst.responsible}
        onChange={val => setResp('installations', 'responsible', val)}
        color="#2C6E9E" bg="#0F2530" textColor="#8FC3E3"
        grupos={['Maestros']}
        responsables={responsables}
      />

      {/* Producción — Maestros */}
      <MultiResponsableSelect
        label="Producción — Maestros"
        values={maestrosAsignados}
        onChange={setMaestros}
        color="#7A4B8C" bg="#241A2B" textColor="#C9A8D6"
        grupos={['Maestros']}
        responsables={responsables}
        itemLabel="maestro"
      />

      {/* Producción — detalle real por módulo (lo que cada módulo tiene asignado) */}
      <div style={{ background: '#241A2B20', border: '1.5px solid #7A4B8C40', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7A4B8C', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
          🏭 Asignación real por módulo
        </div>
        {maestrosProd.length === 0
          ? <div style={{ fontSize: 12, color: '#4B5563' }}>Ningún módulo tiene maestro asignado todavía</div>
          : maestrosProd.map(m => {
              const n = modulos.filter(mod => mod.maestro === m).length;
              return (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7A4B8C' }} />
                  <span style={{ fontSize: 12, color: '#C9A8D6', fontWeight: 600 }}>{m}</span>
                  <span style={{ fontSize: 10, color: '#6B7280' }}>
                    — trabajando en este proyecto ({n} módulo{n !== 1 ? 's' : ''} en Producción)
                  </span>
                </div>
              );
            })
        }
        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 6 }}>Se asignan desde la pestaña Producción por módulo</div>
      </div>

      {/* Resumen visual */}
      <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
          Resumen del equipo
        </div>
        {[
          { label: 'Vendedor',       value: proyecto.responsableGeneral, color: '#9CA3AF' },
          { label: 'Arquitectura',   value: arch.responsible,            color: '#F0D687' },
          { label: 'Diseño 3D',      value: d3Designers.join(', ') || null, color: '#E3A868' },
          { label: 'Instalaciones',  value: inst.responsible,            color: '#8FC3E3' },
          { label: 'Producción',     value: maestrosProd.join(', ') || null, color: '#C9A8D6' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E2433' }}>
            <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: value ? color : '#374151' }}>{value || 'Sin asignar'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────
export default function ProjectDetail({ proyectoId }) {
  const { proyectos, historial, actividades, updateProyecto, addHistorial, currentUser, setPage, responsables } = useApp();
  const [activeTab, setActiveTab]   = useState('flujo');
  const [showEditForm, setShowEditForm] = useState(false);

  const proyecto = proyectos.find(p => p.id === proyectoId);
  if (!proyecto) return <div style={{ padding: 24, color: '#6B7280' }}>Proyecto no encontrado</div>;

  const pHistorial  = historial.filter(h => h.proyectoId === proyectoId);
  const atrasado    = isAtrasado(proyecto.fechaEntrega, proyecto.estadoGeneral);
  const diasRestantes = proyecto.fechaEntrega
    ? Math.floor((new Date(proyecto.fechaEntrega) - new Date()) / 86400000)
    : null;

  const arch    = proyecto.architecture  || {};
  const d3      = proyecto.design3d      || {};
  const inst    = proyecto.installations || {};
  const modulos = proyecto.production?.modulos || [];
  const d3Designers = d3.responsables || (d3.responsible ? [d3.responsible] : []);

  function handleUpdate(updated) {
    const conEstado = { ...updated, estadoGeneral: calcularEstadoGeneral(updated), updatedAt: new Date().toISOString() };
    updateProyecto(conEstado);
  }

  const TABS = [
    { id: 'flujo',    label: 'Flujo' },
    { id: 'equipo',   label: '👥 Equipo' },
    { id: 'historial',label: `Historial (${pHistorial.length})` },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* Volver */}
      <button onClick={() => setPage('proyectos')} className="text-steel-muted hover:text-white flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft size={15} /> Proyectos
      </button>

      {/* Header */}
      <div className={`bg-[#1B1E23] border rounded-xl p-4 ${atrasado ? 'border-red-800/70' : 'border-steel-line'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-display font-bold text-white">{proyecto.nombre}</h1>
              {atrasado && <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-bold">ATRASADO</span>}
            </div>
            <div className="text-steel-muted text-sm">{proyecto.cliente} · {proyecto.numeroContrato || 'Sin PEC'}</div>

            {/* Chips de estado */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusChip estado={proyecto.estadoGeneral} />
              <PrioridadChip prioridad={proyecto.prioridad} />
              {proyecto.lineaProyecto && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${proyecto.lineaProyecto === 'Element' ? 'bg-purple-900/60 text-purple-300' : proyecto.lineaProyecto === 'Equifrigo' ? 'bg-yellow-900/60 text-yellow-300' : 'bg-blue-900/60 text-blue-300'}`}>
                  {proyecto.lineaProyecto === 'Element' ? '⬡ Element' : proyecto.lineaProyecto === 'Equifrigo' ? '◆ Equifrigo' : '◈ Santa Ana'}
                </span>
              )}
            </div>

            {/* Equipo rápido */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {proyecto.responsableGeneral && (
                <span className="text-[10px] text-steel-muted">💼 <strong className="text-slate-300">{proyecto.responsableGeneral}</strong></span>
              )}
              {arch.responsible && (
                <span className="text-[10px] text-steel-muted">✏️ <strong className="text-[#F0D687]">{arch.responsible}</strong></span>
              )}
              {d3Designers.length > 0 && (
                <span className="text-[10px] text-steel-muted">🖥️ <strong className="text-[#E3A868]">{d3Designers.join(', ')}</strong></span>
              )}
              {inst.responsible && (
                <span className="text-[10px] text-steel-muted">🔧 <strong className="text-[#8FC3E3]">{inst.responsible}</strong></span>
              )}
            </div>
          </div>

          {/* Fecha y días */}
          <div className="text-right shrink-0">
            <div className="text-xs text-steel-faint">Entrega estimada</div>
            <div className={`text-sm font-bold ${atrasado ? 'text-red-400' : 'text-white'}`}>
              {formatFecha(proyecto.fechaEntrega) || '—'}
            </div>
            {diasRestantes !== null && (
              <div className="font-stamp" style={{
                marginTop: 4,
                fontSize: 11, fontWeight: 700,
                color: diasRestantes < 0 ? '#EF4444' : diasRestantes <= 7 ? '#F97316' : '#86EFAC',
                background: diasRestantes < 0 ? '#450A0A' : diasRestantes <= 7 ? '#431407' : '#052E16',
                padding: '2px 8px', borderRadius: 6, display: 'inline-block',
              }}>
                {diasRestantes < 0 ? `Vencido hace ${Math.abs(diasRestantes)}d` : `${diasRestantes}d restantes`}
              </div>
            )}
            <button onClick={() => setShowEditForm(true)} className="mt-2 text-xs text-flame hover:brightness-110 flex items-center gap-1 ml-auto">
              <Edit size={11} /> Editar
            </button>
          </div>
        </div>

        {/* Módulos resumen */}
        {modulos.length > 0 && (() => {
          const element    = modulos.filter(m => m.linea === 'Element').length;
          const fogaFull   = modulos.filter(m => m.linea === 'Santa Ana').length;
          const equifrigo  = modulos.filter(m => m.linea === 'Equifrigo').length;
          const sinMaestro = modulos.filter(m => !m.maestro).length;
          const atrasadosMods = modulos.filter(m => m.fechaEntrega && new Date(m.fechaEntrega) < new Date()).length;
          return (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-orange-900/20 border border-orange-800/40 rounded-lg px-3 py-1.5">
                <span className="text-orange-400 text-xs">📦</span>
                <span className="text-orange-300 text-xs font-bold">{modulos.length} módulo{modulos.length !== 1 ? 's' : ''}</span>
                {element  > 0 && <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded font-medium">Element: {element}</span>}
                {fogaFull > 0 && <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded font-medium">Santa Ana: {fogaFull}</span>}
                {equifrigo > 0 && <span className="text-[10px] bg-yellow-900/60 text-yellow-300 px-1.5 py-0.5 rounded font-medium">Equifrigo: {equifrigo}</span>}
                {sinMaestro > 0 && <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded font-medium">⚠ {sinMaestro} sin maestro</span>}
                {atrasadosMods > 0 && <span className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-medium">🔴 {atrasadosMods} atrasado{atrasadosMods !== 1 ? 's' : ''}</span>}
              </div>
            </div>
          );
        })()}

        {proyecto.proximaAccion && (
          <div className="mt-3 bg-flame/10 border border-flame/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <Clock size={12} className="text-flame shrink-0" />
            <span className="text-xs text-flame font-medium">{proyecto.proximaAccion}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-steel-line overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`text-xs px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === t.id ? 'bg-white/10 text-white font-medium' : 'text-steel-muted hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="bg-[#1B1E23] border border-steel-line rounded-xl p-5">
        {activeTab === 'flujo'    && <ProjectFlow proyecto={proyecto} onUpdateProyecto={handleUpdate} />}
        {activeTab === 'equipo'   && <PestanaEquipo proyecto={proyecto} onUpdate={handleUpdate} responsables={responsables} />}
        {activeTab === 'historial' && (
          <div className="divide-y divide-steel-line">
            {pHistorial.length === 0 && <div className="py-8 text-center text-steel-faint text-sm">Sin historial registrado</div>}
            {pHistorial.map((h, i) => (
              <div key={h.id || i} className="py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-steel-faint">{h.fecha} {h.hora}</span>
                  <span className="text-[10px] text-white font-medium">{h.usuario || h.user}</span>
                  <span className="text-[10px] text-steel-faint">·</span>
                  <span className="text-[10px] text-steel-muted">{h.departamento}</span>
                </div>
                <div className="text-xs text-white">{h.accion || h.action}</div>
                {(h.valorAnterior || h.previousStatus) && (
                  <div className="text-[10px] text-steel-faint mt-0.5">
                    {h.valorAnterior || h.previousStatus} → <span className="text-green-400">{h.valorNuevo || h.newStatus}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditForm && <ProjectForm proyecto={proyecto} onClose={() => setShowEditForm(false)} />}
    </div>
  );
}

// ── Fallbacks para pestañas que usan componentes externos ──
function FallbackInstalaciones({ proyecto, onUpdate }) {
  const inst = proyecto.installations || {};
  const [reportInput, setReportInput] = useState('');
  const [showReport, setShowReport]   = useState(false);
  const respOpts = getNombresResponsables() || [];

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
    });
    setReportInput(''); setShowReport(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#0F2D1A30', border: '1px solid #16A34A30', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#86EFAC' }}>
        🔧 Instalaciones monitorea la obra durante todo el proyecto e instala cuando Producción termina.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>Fecha 1ª visita técnica</label>
          <input type="date" value={inst.firstVisitDate || ''} onChange={e => updateField('firstVisitDate', e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl}>Fecha 2ª visita técnica</label>
          <input type="date" value={inst.secondVisitDate || ''} onChange={e => updateField('secondVisitDate', e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl}>Fecha visita final</label>
          <input type="date" value={inst.finalVisitDate || ''} onChange={e => updateField('finalVisitDate', e.target.value)} style={inp} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!inst.siteReady} onChange={e => updateField('siteReady', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#16A34A' }} />
            <span style={{ fontSize: 12, color: inst.siteReady ? '#86EFAC' : '#9CA3AF', fontWeight: 600 }}>✓ Obra lista para instalar</span>
          </label>
        </div>
      </div>
      <div>
        <label style={lbl}>Informe técnico de visita</label>
        {inst.initialTechnicalReportLink
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#86EFAC' }}>✓ Cargado</span>
              <a href={inst.initialTechnicalReportLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                Ver informe <ExternalLink size={10} />
              </a>
              <button onClick={() => updateField('initialTechnicalReportLink', '')} style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar</button>
            </div>
          : showReport
            ? <div style={{ display: 'flex', gap: 6 }}>
                <input value={reportInput} onChange={e => setReportInput(e.target.value)} placeholder="https://drive.google.com/..." style={{ ...inp, flex: 1 }} />
                <button onClick={cargarInforme} style={btnSm('#16A34A')}>✓</button>
                <button onClick={() => setShowReport(false)} style={btnSm('#374151')}>✕</button>
              </div>
            : <button onClick={() => setShowReport(true)} style={{ ...btnSm('#16A34A20'), color: '#86EFAC', border: '1px solid #16A34A40', width: '100%' }}>+ Cargar informe técnico</button>
        }
      </div>
      <div>
        <label style={lbl}>Novedades y observaciones de la obra</label>
        <textarea value={inst.observations || ''} onChange={e => updateField('observations', e.target.value)}
          rows={3} placeholder="Anotar el estado de la obra, novedades, pendientes..."
          style={{ ...inp, resize: 'none', width: '100%' }} />
      </div>
    </div>
  );
}

function FallbackDiseno3D({ proyecto, onUpdate }) {
  const d3 = proyecto.design3d || {};
  const [showPlan, setShowPlan] = useState(false);
  const [planInput, setPlanInput] = useState('');

  const ITEMS = [
    { key: 'solidworksStarted',        label: 'SolidWorks iniciado' },
    { key: 'solidworksFinished',       label: 'SolidWorks terminado' },
    { key: 'autocadBreakdownStarted',  label: 'Despiece AutoCAD iniciado' },
    { key: 'autocadBreakdownFinished', label: 'Despiece AutoCAD terminado' },
  ];

  function toggle(key) {
    const updated = { ...d3, [key]: !d3[key] };
    if (key === 'solidworksFinished' && !d3.solidworksFinished) updated.design3DCompleted = true;
    if (key === 'autocadBreakdownFinished' && !d3.autocadBreakdownFinished) updated.breakdownCompleted = true;
    let estado = 'Pendiente de modelado';
    if (updated.breakdownCompleted) estado = 'Despiece terminado';
    else if (updated.autocadBreakdownStarted) estado = 'En despiece AutoCAD';
    else if (updated.solidworksFinished) estado = 'Modelado terminado';
    else if (updated.solidworksStarted) estado = 'En modelado SolidWorks';
    onUpdate({ ...proyecto, design3d: { ...updated, estado, status: estado } });
  }

  function subirPlan() {
    if (!planInput.trim()) return;
    onUpdate({ ...proyecto, design3d: { ...d3, planCorteLink: planInput } });
    setPlanInput(''); setShowPlan(false);
  }

  function liberar() {
    const now = new Date().toISOString();
    onUpdate({
      ...proyecto,
      estadoGeneral: 'Listo para producción',
      design3d: { ...d3, releasedToProduction: true, releasedToProductionAt: now, status: 'Liberado a Producción' },
      production: { ...proyecto.production, status: 'Listo para producción' },
    });
  }

  const puedeLiberar = d3.design3DCompleted && d3.breakdownCompleted && !!d3.planCorteLink;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {ITEMS.map(item => (
          <div key={item.key} onClick={() => toggle(item.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: d3[item.key] ? '#1E3A5F40' : '#0A0D14', border: `1px solid ${d3[item.key] ? '#2563EB40' : '#1E2433'}`, borderRadius: 10, cursor: 'pointer' }}>
            {d3[item.key] ? <CheckCircle2 size={16} color="#2563EB" /> : <Circle size={16} color="#374151" />}
            <span style={{ fontSize: 12, color: d3[item.key] ? '#93C5FD' : '#6B7280', fontWeight: d3[item.key] ? 600 : 400 }}>{item.label}</span>
          </div>
        ))}
      </div>
      <div>
        <label style={lbl}>Plano de corte</label>
        {d3.planCorteLink
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a href={d3.planCorteLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>Ver plano <ExternalLink size={10} /></a>
              <button onClick={() => setShowPlan(true)} style={{ fontSize: 10, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar</button>
            </div>
          : !showPlan && <button onClick={() => setShowPlan(true)} style={{ fontSize: 11, color: '#93C5FD', background: '#1E3A5F20', border: '1px solid #2563EB40', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', width: '100%' }}>+ Subir plano de corte</button>
        }
        {showPlan && (
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input value={planInput} onChange={e => setPlanInput(e.target.value)} placeholder="https://drive.google.com/..." style={{ ...inp, flex: 1 }} />
            <button onClick={subirPlan} style={btnSm('#2563EB')}>✓</button>
            <button onClick={() => setShowPlan(false)} style={btnSm('#374151')}>✕</button>
          </div>
        )}
      </div>
      <div>
        <label style={lbl}>Observaciones</label>
        <textarea value={d3.observations || d3.observaciones || ''} onChange={e => onUpdate({ ...proyecto, design3d: { ...d3, observations: e.target.value, observaciones: e.target.value } })}
          rows={2} style={{ ...inp, resize: 'none', width: '100%' }} />
      </div>
      {!d3.releasedToProduction && (
        <div>
          <button onClick={liberar} disabled={!puedeLiberar}
            style={{ width: '100%', background: puedeLiberar ? '#EA580C' : '#1F2937', color: puedeLiberar ? '#fff' : '#4B5563', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px', cursor: puedeLiberar ? 'pointer' : 'not-allowed' }}>
            🏭 Liberar a Producción
          </button>
          {!puedeLiberar && (
            <div style={{ fontSize: 10, color: !d3.planCorteLink && d3.design3DCompleted && d3.breakdownCompleted ? '#FCD34D' : '#4B5563', textAlign: 'center', marginTop: 4 }}>
              {!d3.planCorteLink && d3.design3DCompleted && d3.breakdownCompleted ? '⚠ Sube el plano de corte para liberar' : 'Completa SolidWorks y Despiece primero'}
            </div>
          )}
        </div>
      )}
      {d3.releasedToProduction && (
        <div style={{ padding: '10px', background: '#3D1F0040', border: '1px solid #EA580C40', borderRadius: 8, fontSize: 12, color: '#FDBA74', fontWeight: 600, textAlign: 'center' }}>
          ✓ Producción liberada el {d3.releasedToProductionAt?.slice(0,10)}
        </div>
      )}
    </div>
  );
}

const lbl    = { fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 };
const inp    = { background: '#101215', border: '1px solid #374151', borderRadius: 7, color: '#E2E8F0', fontSize: 12, padding: '6px 10px', outline: 'none', width: '100%' };
const btnSm  = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '5px 10px', cursor: 'pointer' });

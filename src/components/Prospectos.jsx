import { useState } from 'react';
import { useApp } from '../App';
import { Plus, X, ChevronDown, ChevronUp, ArrowRight, Trash2, Edit2, CheckCircle2, Circle, Send, ExternalLink } from 'lucide-react';
import { getResponsablesAgrupados } from '../utils/settingsStorage';
import ProjectForm from './ProjectForm';

const ESTADOS = ['En propuesta','Propuesta inicial lista','Borrador conceptual listo','Presentado al cliente','Con cambios','Aprobado','No ganado'];
const LINEAS  = ['Element','Santa Ana','Equifrigo'];

const LINEA_COLORS = {
  'Element':   { color: '#C4B5FD', bg: '#2D1B69' },
  'Santa Ana': { color: '#93C5FD', bg: '#1E3A5F' },
  'Equifrigo': { color: '#FCD34D', bg: '#452B03' },
};

const EST_COLORS = {
  'En propuesta':              { color: '#9CA3AF', bg: '#1F2937' },
  'Propuesta inicial lista':   { color: '#93C5FD', bg: '#1E3A5F' },
  'Borrador conceptual listo': { color: '#93C5FD', bg: '#1E3A5F' },
  'Presentado al cliente':     { color: '#FCD34D', bg: '#451A03' },
  'Con cambios':               { color: '#F97316', bg: '#431407' },
  'Aprobado':                  { color: '#86EFAC', bg: '#052E16' },
  'No ganado':                 { color: '#EF4444', bg: '#450A0A' },
};

const CHECKLIST = [
  { id: 'propuestaInicial',   label: 'Propuesta de diseño inicial',      desc: 'Primera propuesta presentada' },
  { id: 'borradorConceptual', label: 'Borrador del plano conceptual',    desc: 'Borrador listo para revisión' },
  { id: 'enviadoAVentas',     label: 'Enviado a Ventas para aprobación', desc: 'Email enviado al vendedor', esEmail: true },
  { id: 'ajustesRealizados',  label: 'Ajustes realizados',               desc: 'Cambios del cliente aplicados', opcional: true },
  { id: 'planosAprobados',    label: 'Planos aprobados por cliente',      desc: 'Cliente confirmó aprobación final', esFinal: true },
];

function estadoDesdeChecklist(checklist) {
  if (checklist.planosAprobados)     return 'Aprobado';
  if (checklist.ajustesRealizados)   return 'Con cambios';
  if (checklist.enviadoAVentas)      return 'Presentado al cliente';
  if (checklist.borradorConceptual)  return 'Borrador conceptual listo';
  if (checklist.propuestaInicial)    return 'Propuesta inicial lista';
  return 'En propuesta';
}

function buildProspecto() {
  return {
    id: `PROS-${Date.now()}`,
    cliente: '', vendedor: '', vendedorEmail: '', disenadora: '', linea: 'Element',
    estado: 'En propuesta', nCambios: 0,
    fechaIngreso: new Date().toISOString().slice(0,10),
    observacion: '',
    checklist: {},
    sketchupLink: '', planConceptualLink: '', planInstalacionesLink: '',
    convertido: false, proyectoId: null,
  };
}

// ── Formulario nuevo/editar ──
function ProspectoForm({ prospecto, onSave, onClose }) {
  const { responsables: responsablesCtx } = useApp();
  const esNuevo = !prospecto.cliente;
  const [form, setForm] = useState({ ...prospecto });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function setVendedor(nombre) {
    const resp = (responsablesCtx || []).find(r => r.nombre === nombre);
    setForm(f => ({ ...f, vendedor: nombre, vendedorEmail: (!f.vendedorEmail && resp?.correo) ? resp.correo : f.vendedorEmail }));
  }

  return (
    <div style={{ background: '#0A0D14', border: '1.5px solid #7C3AED40', borderRadius: 12, padding: 18, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#C4B5FD', marginBottom: 14 }}>
        {prospecto.cliente ? `Editar — ${prospecto.cliente}` : 'Nuevo prospecto'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Cliente *</label>
          <input value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Nombre del cliente" style={inp} />
        </div>
        <div>
          <label style={lbl}>Vendedor</label>
          <select value={form.vendedor} onChange={e => setVendedor(e.target.value)} style={inp}>
            <option value="">Seleccionar...</option>
            {Object.entries(getResponsablesAgrupados(responsablesCtx)).filter(([g]) => g === 'Vendedores').map(([grupo, nombres]) => (
              <optgroup key={grupo} label="── Vendedores ──">
                {nombres.map(n => <option key={n} value={n}>{n}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Email del vendedor</label>
          <input type="email" value={form.vendedorEmail || ''} onChange={e => set('vendedorEmail', e.target.value)} placeholder="vendedor@foga.com" style={inp} />
        </div>
        <div>
          <label style={lbl}>Diseñadora</label>
          <select value={form.disenadora} onChange={e => set('disenadora', e.target.value)} style={inp}>
            <option value="">Seleccionar...</option>
            {Object.entries(getResponsablesAgrupados(responsablesCtx)).filter(([g]) => g === 'Arquitectas').map(([grupo, nombres]) => (
              <optgroup key={grupo} label="── Arquitectas ──">
                {nombres.map(n => <option key={n} value={n}>{n}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Línea</label>
          <select value={form.linea} onChange={e => set('linea', e.target.value)} style={inp}>
            {LINEAS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Estado</label>
          {esNuevo ? (
            <div style={{ ...inp, display: 'flex', alignItems: 'center', color: '#9CA3AF', cursor: 'not-allowed' }}>En propuesta</div>
          ) : (
            <select value={form.estado} onChange={e => set('estado', e.target.value)} style={inp}>
              {ESTADOS.map(s => <option key={s}>{s}</option>)}
            </select>
          )}
        </div>
        <div>
          <label style={lbl}>Fecha de ingreso</label>
          <input type="date" value={form.fechaIngreso} onChange={e => set('fechaIngreso', e.target.value)} style={inp} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Observaciones</label>
          <textarea value={form.observacion} onChange={e => set('observacion', e.target.value)} rows={2} style={{ ...inp, resize: 'none', width: '100%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={btn('#374151')}>Cancelar</button>
        <button onClick={() => { if (!form.cliente.trim()) return alert('El cliente es requerido'); onSave(form); onClose(); }} style={btn('#7C3AED')}>Guardar</button>
      </div>
    </div>
  );
}

// ── Tarjeta expandida de prospecto con checklist ──
function ProspectoCard({ prospecto, onUpdate, onEdit, onDelete, onGenerarProyecto }) {
  const [expanded, setExpanded] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(null);
  const [planInput, setPlanInput] = useState('');

  const est  = EST_COLORS[prospecto.estado] || { color: '#9CA3AF', bg: '#1F2937' };
  const diasEnProceso = prospecto.fechaIngreso ? Math.floor((new Date() - new Date(prospecto.fechaIngreso)) / 86400000) : null;
  const checklist = prospecto.checklist || {};
  const pasosOk   = CHECKLIST.filter(p => !p.opcional && checklist[p.id]).length;
  const pasosTot  = CHECKLIST.filter(p => !p.opcional).length;
  const pct       = Math.round((pasosOk / pasosTot) * 100);
  const checklistCompleto = !!checklist.planosAprobados && !!checklist.propuestaInicial && !!checklist.borradorConceptual && !!checklist.enviadoAVentas;
  const esAprobado = prospecto.estado === 'Aprobado' || checklistCompleto;

  function toggleCheck(id) {
    const checked = !checklist[id];
    const nuevoChecklist = { ...checklist, [id]: checked, [`${id}Fecha`]: checked ? new Date().toISOString().slice(0,10) : '' };
    onUpdate({ ...prospecto, checklist: nuevoChecklist, estado: estadoDesdeChecklist(nuevoChecklist) });
  }

  function abrirOutlook() {
    const email  = prospecto.vendedorEmail || '';
    const asunto = `Aprobación diseño conceptual — ${prospecto.cliente}`;
    const cuerpo = `Hola ${prospecto.vendedor || 'equipo de Ventas'},\n\nEl borrador del plano conceptual para el cliente "${prospecto.cliente}" está listo para revisión.\n\nPor favor confirma si procede o si necesitas ajustes.\n\nSaludos,\nEquipo de Arquitectura FOGA`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, '_blank');
    if (!checklist.enviadoAVentas) {
      const nuevoChecklist = { ...checklist, enviadoAVentas: true, enviadoAVentasFecha: new Date().toISOString().slice(0,10) };
      onUpdate({ ...prospecto, checklist: nuevoChecklist, estado: estadoDesdeChecklist(nuevoChecklist) });
    }
  }

  function subirLink(campo) {
    if (!planInput.trim()) return;
    onUpdate({ ...prospecto, [campo]: planInput });
    setPlanInput(''); setShowPlanForm(null);
  }

  return (
    <div style={{ background: '#141824', border: `1.5px solid ${esAprobado ? '#16A34A40' : prospecto.estado === 'No ganado' ? '#1F2937' : '#7C3AED20'}`, borderLeft: `4px solid ${est.color}`, borderRadius: 10, marginBottom: 8, opacity: prospecto.estado === 'No ganado' ? 0.6 : 1 }}>

      {/* Header */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{prospecto.cliente}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: est.bg, color: est.color }}>{prospecto.estado}</span>
            {checklistCompleto && !prospecto.convertido && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#052E16', color: '#86EFAC' }}>✓ Listo para proyecto</span>
            )}
            {prospecto.linea && (() => { const lc = LINEA_COLORS[prospecto.linea] || LINEA_COLORS['Santa Ana']; return (
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: lc.bg, color: lc.color, fontWeight: 600 }}>{prospecto.linea}</span>
            ); })()}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {prospecto.vendedor    && <span style={{ fontSize: 10, color: '#6B7280' }}>💼 {prospecto.vendedor}</span>}
            {prospecto.disenadora  && <span style={{ fontSize: 10, color: '#C4B5FD' }}>✏️ {prospecto.disenadora}</span>}
            {prospecto.nCambios > 0 && <span style={{ fontSize: 10, color: '#F97316' }}>🔄 {prospecto.nCambios} cambio{prospecto.nCambios !== 1 ? 's' : ''}</span>}
            {diasEnProceso !== null && !prospecto.convertido && <span style={{ fontSize: 10, color: diasEnProceso > 15 ? '#F97316' : '#6B7280' }}>📅 {diasEnProceso}d en propuesta</span>}
            {/* Mini barra progreso checklist */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 50, height: 3, background: '#1E2433', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#16A34A' : '#7C3AED', borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 9, color: '#6B7280' }}>{pct}%</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {esAprobado && !prospecto.convertido && (
            <button onClick={() => onGenerarProyecto(prospecto)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <ArrowRight size={12} /> Generar proyecto
            </button>
          )}
          {prospecto.convertido && <span style={{ fontSize: 10, color: '#86EFAC', fontWeight: 600 }}>✓ Proyecto creado</span>}
          <button onClick={() => onEdit(prospecto)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><Edit2 size={13} /></button>
          <button onClick={() => onDelete(prospecto.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><Trash2 size={12} /></button>
          <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #1E2433' }}>

          {/* ── CHECKLIST ── */}
          <div style={{ marginTop: 14, background: '#0A0D14', border: '1px solid #2D1B6940', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#C4B5FD' }}>Proceso de diseño conceptual</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? '#86EFAC' : '#C4B5FD' }}>{pasosOk}/{pasosTot} pasos</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {CHECKLIST.map((paso, i) => {
                const checked   = !!checklist[paso.id];
                const anterior  = i === 0 || !!checklist[CHECKLIST[i-1].id];
                const bloqueado = !anterior && !checked;
                return (
                  <div key={paso.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: checked ? '#2D1B6920' : '#141824', border: `1px solid ${checked ? '#7C3AED50' : '#1E2433'}`, borderRadius: 8, opacity: bloqueado ? 0.45 : 1 }}>
                    <div onClick={() => !bloqueado && !paso.esEmail && toggleCheck(paso.id)} style={{ width: 20, height: 20, borderRadius: paso.esFinal ? 5 : '50%', border: `2px solid ${checked ? '#7C3AED' : '#374151'}`, background: checked ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: paso.esEmail || bloqueado ? 'default' : 'pointer', flexShrink: 0 }}>
                      {checked && <CheckCircle2 size={13} color="#fff" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: checked ? '#C4B5FD' : bloqueado ? '#4B5563' : '#E2E8F0' }}>
                        {i+1}. {paso.label}
                        {paso.opcional && <span style={{ fontSize: 9, color: '#6B7280', marginLeft: 6 }}>(opcional)</span>}
                        {checked && checklist[`${paso.id}Fecha`] && <span style={{ fontSize: 9, color: '#7C3AED', marginLeft: 6, fontWeight: 400 }}>· {checklist[`${paso.id}Fecha`]}</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{paso.desc}</div>
                    </div>
                    {paso.esEmail && (
                      <button onClick={abrirOutlook} disabled={!checklist.borradorConceptual}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: checked ? '#052E16' : checklist.borradorConceptual ? '#0369A1' : '#1F2937', color: checked ? '#86EFAC' : checklist.borradorConceptual ? '#fff' : '#4B5563', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, padding: '5px 12px', cursor: checklist.borradorConceptual ? 'pointer' : 'not-allowed' }}>
                        {checked ? <><CheckCircle2 size={11} /> Enviado</> : <><Send size={11} /> Enviar a Ventas</>}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {!prospecto.vendedorEmail && (
              <div style={{ marginTop: 8, fontSize: 10, color: '#FCD34D', background: '#451A03', border: '1px solid #D97706', borderRadius: 6, padding: '4px 10px' }}>
                ⚠ Sin email del vendedor. Edita el prospecto para agregarlo.
              </div>
            )}
          </div>

          {/* ── LINKS DE PLANOS ── */}
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { campo: 'sketchupLink',         label: 'Link SketchUp' },
              { campo: 'planConceptualLink',   label: 'Link plano conceptual' },
              { campo: 'planInstalacionesLink',label: 'Link plano instalaciones' },
            ].map(({ campo, label }) => (
              <div key={campo}>
                <label style={lbl}>{label}</label>
                {prospecto[campo]
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <a href={prospecto[campo]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>Ver <ExternalLink size={10} /></a>
                      <button onClick={() => { setPlanInput(prospecto[campo]); setShowPlanForm(campo); }} style={{ fontSize: 10, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar</button>
                    </div>
                  : showPlanForm === campo
                    ? <div style={{ display: 'flex', gap: 4 }}>
                        <input value={planInput} onChange={e => setPlanInput(e.target.value)} placeholder="https://..." style={{ ...inp, flex: 1, fontSize: 10 }} />
                        <button onClick={() => subirLink(campo)} style={btn('#2563EB')}>✓</button>
                        <button onClick={() => setShowPlanForm(null)} style={btn('#374151')}>✕</button>
                      </div>
                    : <button onClick={() => { setPlanInput(''); setShowPlanForm(campo); }} style={{ fontSize: 10, color: '#7C3AED', background: '#2D1B6920', border: '1px dashed #7C3AED40', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', width: '100%' }}>+ Agregar link</button>
                }
              </div>
            ))}
          </div>

          {/* ── CAMBIOS Y OBSERVACIONES ── */}
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '180px 1fr', gap: 10, alignItems: 'start' }}>
            <div>
              <label style={lbl}>N° de cambios</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => onUpdate({ ...prospecto, nCambios: Math.max(0, (prospecto.nCambios || 0) - 1) })}
                  style={{ width: 30, height: 30, borderRadius: 7, background: '#1F2937', border: '1px solid #374151', color: '#E2E8F0', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 700, color: prospecto.nCambios > 0 ? '#F97316' : '#6B7280' }}>
                  {prospecto.nCambios || 0}
                </div>
                <button onClick={() => onUpdate({ ...prospecto, nCambios: (prospecto.nCambios || 0) + 1 })}
                  style={{ width: 30, height: 30, borderRadius: 7, background: '#1F2937', border: '1px solid #374151', color: '#E2E8F0', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
              </div>
              {prospecto.nCambios > 0 && (
                <div style={{ fontSize: 10, color: '#F97316', textAlign: 'center', marginTop: 4 }}>
                  {prospecto.nCambios} cambio{prospecto.nCambios !== 1 ? 's' : ''} solicitado{prospecto.nCambios !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <div>
              <label style={lbl}>Observaciones</label>
              <textarea value={prospecto.observacion || ''} onChange={e => onUpdate({ ...prospecto, observacion: e.target.value })}
                rows={2} placeholder="Notas sobre el cliente, preferencias, estado..." style={{ ...inp, resize: 'none', width: '100%' }} />
            </div>
          </div>

          {/* Eliminar prospecto */}
          {!prospecto.convertido && (
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => onDelete(prospecto.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #EF444430', color: '#EF4444', borderRadius: 7, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>
                <Trash2 size={12} /> Eliminar prospecto
              </button>
            </div>
          )}

          {/* Botón generar proyecto si aprobado */}
          {esAprobado && !prospecto.convertido && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#052E1640', border: '1px dashed #16A34A60', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#86EFAC', marginBottom: 8 }}>✓ Planos aprobados — listo para convertir en proyecto oficial</div>
              <button onClick={() => onGenerarProyecto(prospecto)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 20px', cursor: 'pointer' }}>
                <ArrowRight size={14} /> Generar proyecto con PEC y módulos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──
export default function Prospectos({ onProyectoGenerado }) {
  const { prospectos, updateProspecto, deleteProspecto } = useApp();
  const [showForm, setShowForm]          = useState(false);
  const [editando, setEditando]          = useState(null);
  const [confirmDel, setConfirmDel]      = useState(null);
  const [proyectoAGenerar, setProyectoAGenerar] = useState(null);

  function guardar(pros) {
    updateProspecto(pros);
  }

  function actualizar(pros) { guardar(pros); }

  async function eliminar(id) {
    await deleteProspecto(id);
    setConfirmDel(null);
  }

  function prepararProyecto(prospecto) {
    // Pre-llenar el formulario con datos del prospecto
    setProyectoAGenerar({
      id:               `PROY-${Date.now()}`,
      nombre:           prospecto.cliente,
      cliente:          prospecto.cliente,
      numeroContrato:   '',
      lineaProyecto:    prospecto.linea,
      responsableGeneral: prospecto.vendedor,
      vendedorEmail:    prospecto.vendedorEmail || '',
      prioridad:        'Normal',
      fechaIngreso:     new Date().toISOString().slice(0,10),
      fechaEntrega:     '',
      estadoGeneral:    'En propuesta',
      contratoLink:     '',
      contratoFirmado:  false,
      releasedToDesign3D: false,
      planConceptualLink: prospecto.planConceptualLink || '',
      architecture: {
        responsible:        prospecto.disenadora || '',
        status:             'Proyecto confirmado',
        checklist:          prospecto.checklist || {},
        conceptualPlanLink: prospecto.planConceptualLink || '',
        sketchupLink:       prospecto.sketchupLink || '',
        installationPlanLink: prospecto.planInstalacionesLink || '',
        observations:       prospecto.observacion || '',
      },
      design3d:      { status: 'Bloqueado', responsible: '' },
      installations: { status: 'Bloqueado', responsible: '' },
      production:    { status: 'Bloqueado', modulos: [] },
      fechasDepto:   {},
      history: [{
        date: new Date().toISOString().slice(0,10),
        user: prospecto.disenadora || 'Arquitectura',
        action: `Proyecto generado desde prospecto — ${prospecto.cliente}`,
        previousStatus: 'Prospecto',
        newStatus: 'En propuesta',
        comment: `Diseñadora: ${prospecto.disenadora}`,
      }],
      _prospectoId: prospecto.id,
    });
  }

  function onProyectoCreado(proyecto) {
    if (proyecto._prospectoId) {
      const actualizado = prospectos.find(p => p.id === proyecto._prospectoId);
      if (actualizado) guardar({ ...actualizado, convertido: true, proyectoId: proyecto.id });
    }
    setProyectoAGenerar(null);
    if (onProyectoGenerado) onProyectoGenerado(proyecto);
  }

  // Estadísticas
  const stats = {
    total:       prospectos.length,
    activos:     prospectos.filter(p => !['No ganado','Aprobado'].includes(p.estado) && !p.convertido).length,
    aprobados:   prospectos.filter(p => p.estado === 'Aprobado' && !p.convertido).length,
    convertidos: prospectos.filter(p => p.convertido).length,
  };

  function subgruposDe(lista) {
    return [
      { key: 'listos',  label: 'Listos para generar proyecto', color: '#16A34A', items: lista.filter(p => p.estado === 'Aprobado' && !p.convertido) },
      { key: 'activos', label: 'En proceso',                   color: '#7C3AED', items: lista.filter(p => !['No ganado','Aprobado'].includes(p.estado) && !p.convertido) },
      { key: 'conv',    label: 'Convertidos a proyecto',       color: '#2563EB', items: lista.filter(p => p.convertido) },
      { key: 'ng',      label: 'No ganados',                   color: '#6B7280', items: lista.filter(p => p.estado === 'No ganado' && !p.convertido) },
    ].filter(g => g.items.length > 0);
  }

  const nombresArquitectas = [...new Set(prospectos.map(p => p.disenadora || 'Sin asignar'))]
    .sort((a,b) => a === 'Sin asignar' ? 1 : b === 'Sin asignar' ? -1 : a.localeCompare(b));

  const gruposPorArquitecta = nombresArquitectas.map(nombre => {
    const propios = prospectos.filter(p => (p.disenadora || 'Sin asignar') === nombre);
    return { nombre, total: propios.length, subgrupos: subgruposDe(propios) };
  }).filter(g => g.total > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[
          { label: 'Total',        value: stats.total,       color: '#E2E8F0' },
          { label: 'En proceso',   value: stats.activos,     color: '#C4B5FD' },
          { label: 'Para crear',   value: stats.aprobados,   color: '#86EFAC' },
          { label: 'Convertidos',  value: stats.convertidos, color: '#93C5FD' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Botón nuevo */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => { setEditando(buildProspecto()); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, padding: '8px 18px', cursor: 'pointer' }}>
          <Plus size={14} /> Nuevo prospecto
        </button>
      </div>

      {/* Formulario nuevo/editar */}
      {showForm && editando && (
        <ProspectoForm prospecto={editando} onSave={guardar} onClose={() => { setShowForm(false); setEditando(null); }} />
      )}

      {/* Vacío */}
      {prospectos.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#4B5563' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Sin prospectos todavía</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Agrega el primer prospecto con el botón de arriba</div>
        </div>
      )}

      {/* Grupos por arquitecta */}
      {gruposPorArquitecta.map(({ nombre, total, subgrupos }) => (
        <div key={nombre} style={{ background: '#141824', border: '1px solid #1E2433', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #7C3AED80)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {nombre === 'Sin asignar' ? '—' : nombre.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{nombre}</div>
              <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{total} prospecto{total !== 1 ? 's' : ''}</div>
            </div>
          </div>
          {subgrupos.map(grupo => (
            <div key={grupo.key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: grupo.color }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px' }}>{grupo.label}</span>
                <span style={{ fontSize: 10, background: '#1F2937', color: '#6B7280', padding: '1px 7px', borderRadius: 99 }}>{grupo.items.length}</span>
              </div>
              {grupo.items.map(p => (
                <ProspectoCard key={p.id} prospecto={p}
                  onUpdate={actualizar}
                  onEdit={pros => { setEditando(pros); setShowForm(true); }}
                  onDelete={id => setConfirmDel(id)}
                  onGenerarProyecto={prepararProyecto}
                />
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* Confirm delete */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000A0', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#161820', border: '1px solid #1E2433', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>¿Eliminar prospecto?</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Esta acción no se puede deshacer.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex: 1, ...btn('#1F2937') }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDel)} style={{ flex: 1, ...btn('#DC2626') }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ProjectForm pre-llenado */}
      {proyectoAGenerar && (
        <ProjectForm
          proyecto={proyectoAGenerar}
          onClose={() => setProyectoAGenerar(null)}
          onCreated={onProyectoCreado}
        />
      )}
    </div>
  );
}

const lbl = { fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 };
const inp = { background: '#0F1117', border: '1px solid #374151', borderRadius: 7, color: '#E2E8F0', fontSize: 12, padding: '7px 10px', outline: 'none', width: '100%' };
const btn = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, padding: '6px 14px', cursor: 'pointer' });

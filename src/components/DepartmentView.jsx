import { useState } from 'react';
import { Plus, X, Filter } from 'lucide-react';
import { ESTADOS, PRIORIDADES, DEPT_CONFIG } from '../data/mockData';
import { getDeptStyle, getEffectiveStatus, getStatusStyle, checklistProgress, getDefaultChecklist } from '../utils/statusHelpers';
import { formatDate, formatShortDate } from '../utils/dateHelpers';
import { getNombresResponsables, getResponsablesPorDept } from '../utils/settingsStorage';
import ActivityCard from './ActivityCard';

function NewActivityForm({ departamento, proyectos = [], onSave, onClose }) {
  // Para el select de responsable: primero los del dept, si no hay, todos los activos
  const respDept  = getResponsablesPorDept(departamento).map(r => r.nombre);
  const respTodos = getNombresResponsables();
  const respOpts  = respDept.length > 0 ? respDept : respTodos;

  const [form, setForm] = useState({
    departamento,
    actividad: '',
    descripcion: '',
    proyectoId: proyectos[0]?.id || '',
    proyecto:   proyectos[0]?.nombre || '',
    cliente:    proyectos[0]?.cliente || '',
    responsable: respOpts[0] || '',
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaLimite: '',
    estado: 'No iniciado',
    prioridad: 'Normal',
    observaciones: '',
    dependencias: [],
  });

  function handleProyecto(pid) {
    const p = (proyectos || []).find(p => p.id === pid);
    setForm(f => ({ ...f, proyectoId: pid, proyecto: p?.nombre || '', cliente: p?.cliente || '' }));
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box animate-fadein p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Nueva actividad — {departamento}</h2>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label-field">Actividad</label>
            <input className="input-field" value={form.actividad} onChange={e => setForm(f => ({ ...f, actividad: e.target.value }))} placeholder="¿Qué se va a hacer?" />
          </div>
          <div className="col-span-2">
            <label className="label-field">Proyecto</label>
            <select className="input-field" value={form.proyectoId} onChange={e => handleProyecto(e.target.value)}>
              {(proyectos || []).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Responsable</label>
            <select className="input-field" value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}>
              <option value="">Seleccionar...</option>
              {respOpts.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Prioridad</label>
            <select className="input-field" value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))}>
              {(PRIORIDADES || []).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Fecha inicio</label>
            <input type="date" className="input-field" value={form.fechaInicio} onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))} />
          </div>
          <div>
            <label className="label-field">Fecha límite</label>
            <input type="date" className="input-field" value={form.fechaLimite} onChange={e => setForm(f => ({ ...f, fechaLimite: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label-field">Descripción</label>
            <textarea className="input-field" rows={2} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label-field">Estado inicial</label>
            <select className="input-field" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
              {(ESTADOS || []).map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => {
            if (!form.actividad) return alert('Ingresa el nombre de la actividad');
            if (!form.fechaLimite) return alert('Ingresa la fecha límite');
            onSave && onSave({ ...form, checklist: getDefaultChecklist(departamento) });
            onClose();
          }} className="btn-primary">Crear actividad</button>
        </div>
      </div>
    </div>
  );
}

export default function DepartmentView({
  departamento,
  actividades = [],
  proyectos = [],
  alerts = [],
  history = [],
  onViewActivity,
  onCreateActividad,
}) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResp,   setFilterResp]   = useState('all');
  const [filterProy,   setFilterProy]   = useState('all');

  const cfg = DEPT_CONFIG[departamento] || { bg: '#1F2937', border: '#475569', text: '#9CA3AF', icon: '📋' };
  const safeActs  = Array.isArray(actividades) ? actividades : [];
  const safeProys = Array.isArray(proyectos)   ? proyectos   : [];

  const deptActs      = safeActs.filter(a => a.departamento === departamento);
  const responsables  = [...new Set(deptActs.map(a => a.responsable).filter(Boolean))];
  const proyectosDept = [...new Set(deptActs.map(a => a.proyecto).filter(Boolean))];

  const filtered = deptActs.filter(a => {
    if (filterStatus !== 'all' && getEffectiveStatus(a) !== filterStatus) return false;
    if (filterResp   !== 'all' && a.responsable !== filterResp)           return false;
    if (filterProy   !== 'all' && a.proyecto    !== filterProy)           return false;
    return true;
  });

  const urgentes    = filtered.filter(a => ['Urgente','Atrasado'].includes(getEffectiveStatus(a)));
  const activas     = filtered.filter(a => getEffectiveStatus(a) === 'En proceso');
  const pendientes  = filtered.filter(a => getEffectiveStatus(a) === 'No iniciado');
  const resto       = filtered.filter(a => !['Urgente','Atrasado','En proceso','No iniciado','Finalizado','Aprobado'].includes(getEffectiveStatus(a)));
  const finalizadas = filtered.filter(a => ['Finalizado','Aprobado'].includes(getEffectiveStatus(a)));

  const Section = ({ title, acts, dot }) => acts.length === 0 ? null : (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ background: dot }} />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
        <span className="bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded-full font-bold">{acts.length}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {acts.map(a => <ActivityCard key={a.id} actividad={a} onClick={onViewActivity} />)}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: cfg.bg }}>
            {cfg.icon || '📋'}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{departamento}</h1>
            <p className="text-sm mt-0.5" style={{ color: cfg.text }}>{deptActs.length} actividades registradas</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ background: cfg.border }}>
          <Plus size={16} />Nueva actividad
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap bg-white rounded-xl border border-slate-100 p-3">
        <Filter size={13} className="text-slate-400" />
        <select className="input-field text-xs py-1 w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Todos los estados</option>
          {(ESTADOS || []).map(e => <option key={e}>{e}</option>)}
        </select>
        <select className="input-field text-xs py-1 w-auto" value={filterResp} onChange={e => setFilterResp(e.target.value)}>
          <option value="all">Todos los responsables</option>
          {responsables.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="input-field text-xs py-1 w-auto" value={filterProy} onChange={e => setFilterProy(e.target.value)}>
          <option value="all">Todos los proyectos</option>
          {proyectosDept.map(p => <option key={p}>{p}</option>)}
        </select>
        {(filterStatus !== 'all' || filterResp !== 'all' || filterProy !== 'all') && (
          <button onClick={() => { setFilterStatus('all'); setFilterResp('all'); setFilterProy('all'); }}
            className="text-xs text-slate-400 hover:text-slate-600">Limpiar</button>
        )}
        <span className="ml-auto text-xs text-slate-400">{filtered.length} de {deptActs.length}</span>
      </div>

      {/* Sections */}
      <Section title="Urgente / Atrasado"         acts={urgentes}    dot="#ef4444" />
      <Section title="En proceso"                  acts={activas}     dot="#3b82f6" />
      <Section title="En revisión / Observaciones" acts={resto}       dot="#eab308" />
      <Section title="Pendientes"                  acts={pendientes}  dot="#94a3b8" />
      <Section title="Finalizadas"                 acts={finalizadas} dot="#22c55e" />

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">{cfg.icon || '📋'}</div>
          <p className="font-medium">Sin actividades para los filtros seleccionados</p>
        </div>
      )}

      {showForm && (
        <NewActivityForm
          departamento={departamento}
          proyectos={safeProys}
          onSave={onCreateActividad}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

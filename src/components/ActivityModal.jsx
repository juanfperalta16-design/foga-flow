import { useState } from 'react';
import { useApp } from '../App';
import { X, Save } from 'lucide-react';
import { StatusChip, DeptChip } from './StatusChip';
import { formatFecha } from '../utils/dateHelpers';
import { PRIORIDADES } from '../data/mockData';
import { getNombresResponsables } from '../utils/settingsStorage';
import { crearEntradaHistorial } from '../utils/historyHelpers';

const ESTADOS_ACT = ['No iniciado','En proceso','En revisión','Con observaciones','Pausado','Urgente','Atrasado','Finalizado','Aprobado'];

export default function ActivityModal({ actividad, onClose }) {
  const { updateActividad, addHistorial, currentUser } = useApp();
  const [form, setForm]     = useState({ ...actividad });
  const [editing, setEditing] = useState(false);

  const responsablesOpts = getNombresResponsables() || [];
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = () => {
    const entry = crearEntradaHistorial({
      proyectoId: form.proyectoId, usuario: currentUser, departamento: form.departamento,
      accion: 'Edición actividad', campoModificado: 'Actividad',
      valorAnterior: actividad.estado, valorNuevo: form.estado, observacion: form.observaciones,
    });
    updateActividad(form);
    addHistorial(entry);
    setEditing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1B1E23] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-steel-line">
          <div className="flex items-center gap-2 flex-wrap">
            <DeptChip dept={form.departamento} />
            <StatusChip estado={form.estado} />
          </div>
          <button onClick={onClose} className="text-steel-muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <div className="text-lg font-bold text-white">{form.actividad}</div>
            <div className="text-sm text-steel-muted">{form.proyecto} · {form.cliente}</div>
          </div>

          {!editing ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Responsable', form.responsable || '—'],
                  ['Prioridad',   form.prioridad],
                  ['Fecha inicio', formatFecha(form.fechaInicio)],
                  ['Fecha límite', formatFecha(form.fechaLimite)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white/5 rounded-lg p-3">
                    <div className="text-[10px] text-steel-faint mb-1">{k}</div>
                    <div className="text-white text-xs font-medium">{v}</div>
                  </div>
                ))}
              </div>
              {form.descripcion && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] text-steel-faint mb-1">Descripción</div>
                  <div className="text-xs text-slate-300">{form.descripcion}</div>
                </div>
              )}
              {form.observaciones && (
                <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3">
                  <div className="text-[10px] text-amber-400 mb-1">Observaciones</div>
                  <div className="text-xs text-amber-200">{form.observaciones}</div>
                </div>
              )}
              {form.checklist?.length > 0 && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] text-steel-faint mb-2">Checklist</div>
                  {form.checklist.map((item, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-center gap-2 py-0.5">
                      <span className="text-steel-faint">·</span>{item}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setEditing(true)} className="w-full bg-blue-600/20 border border-blue-500/50 text-blue-300 text-sm py-2 rounded-lg hover:bg-blue-600/30 transition-colors">
                Editar actividad
              </button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-steel-muted mb-1 block">Estado</label>
                  <select value={form.estado} onChange={e => set('estado', e.target.value)} className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500">
                    {ESTADOS_ACT.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-steel-muted mb-1 block">Responsable</label>
                  <select value={form.responsable || ''} onChange={e => set('responsable', e.target.value)} className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500">
                    <option value="">Seleccionar...</option>
                    {responsablesOpts.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-steel-muted mb-1 block">Fecha inicio</label>
                    <input type="date" value={form.fechaInicio} onChange={e => set('fechaInicio', e.target.value)} className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-steel-muted mb-1 block">Fecha límite</label>
                    <input type="date" value={form.fechaLimite} onChange={e => set('fechaLimite', e.target.value)} className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-steel-muted mb-1 block">Prioridad</label>
                  <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)} className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500">
                    {(PRIORIDADES || []).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-steel-muted mb-1 block">Observaciones</label>
                  <textarea value={form.observaciones || ''} onChange={e => set('observaciones', e.target.value)} rows={2} className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 text-steel-muted hover:text-white text-sm py-2 rounded-lg hover:bg-white/5 transition-colors">Cancelar</button>
                <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Save size={13} />Guardar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

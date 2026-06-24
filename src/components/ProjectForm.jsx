import { useState } from 'react';
import { useApp } from '../App';
import { X } from 'lucide-react';
import { PRIORIDADES } from '../data/mockData';
import { getNombresResponsables } from '../utils/settingsStorage';
import { crearEntradaHistorial } from '../utils/historyHelpers';
import { buildNuevoProyecto } from '../data/mockData';

export default function ProjectForm({ onClose, proyecto: existing }) {
  const { updateProyecto, addHistorial, currentUser } = useApp();
  const isEdit = !!existing;
  const responsablesOpts = getNombresResponsables() || [];

  const [form, setForm] = useState(() => {
    if (existing) return { ...existing };
    return buildNuevoProyecto();
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = () => {
    if (!form.nombre?.trim() || !form.cliente?.trim()) return alert('Nombre y cliente son requeridos');
    const updated = { ...form, updatedAt: new Date().toISOString() };
    // Nuevo proyecto: asegurar estado inicial correcto
    if (!isEdit) {
      updated.estadoGeneral = 'En propuesta';
      updated.architecture  = { ...updated.architecture, status: 'En propuesta', responsible: updated.responsableGeneral };
    }
    updateProyecto(updated);
    if (isEdit) {
      addHistorial(crearEntradaHistorial({ proyectoId: form.id, usuario: currentUser, departamento: 'Proyectos', accion: 'Edición', campoModificado: 'Proyecto', valorAnterior: existing.nombre, valorNuevo: form.nombre, observacion: '' }));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161820] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold">{isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
            {!isEdit && <p className="text-slate-500 text-xs mt-0.5">El proyecto iniciará como propuesta en Arquitectura</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {[
            { label: 'Nombre del proyecto *', field: 'nombre',         type: 'text', placeholder: 'Ej: Cocina Restaurante La Terraza' },
            { label: 'Cliente *',             field: 'cliente',        type: 'text', placeholder: 'Ej: La Terraza S.A.' },
            { label: 'Número de contrato',    field: 'numeroContrato', type: 'text', placeholder: 'CTR-XXX (opcional al crear)' },
            { label: 'Fecha de entrega estimada', field: 'fechaEntrega', type: 'date' },
            { label: 'Próxima acción',        field: 'proximaAccion',  type: 'text', placeholder: 'Ej: Presentar propuesta conceptual' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="text-xs text-slate-400 mb-1 block">{label}</label>
              <input type={type} value={form[field] || ''} onChange={e => set(field, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Responsable general</label>
              <select value={form.responsableGeneral || ''} onChange={e => set('responsableGeneral', e.target.value)}
                className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Seleccionar...</option>
                {responsablesOpts.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Prioridad</label>
              <select value={form.prioridad || 'Normal'} onChange={e => set('prioridad', e.target.value)}
                className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500">
                {(PRIORIDADES || []).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Observaciones</label>
            <textarea value={form.observaciones || ''} onChange={e => set('observaciones', e.target.value)} rows={2}
              className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          {/* Nota informativa */}
          {!isEdit && (
            <div className="bg-purple-900/20 border border-purple-800/40 rounded-lg px-3 py-2">
              <p className="text-xs text-purple-300">
                <strong>Flujo de trabajo:</strong> El proyecto iniciará en Arquitectura como propuesta. Podrás cargar el link del contrato y liberar a los demás departamentos desde la pestaña "Flujo" del proyecto.
              </p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-2">
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium">
            {isEdit ? 'Guardar cambios' : 'Crear proyecto en propuesta'}
          </button>
        </div>
      </div>
    </div>
  );
}

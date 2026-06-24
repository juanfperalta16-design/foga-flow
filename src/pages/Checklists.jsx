// ─── Checklists ──────────────────────────────────────

import React, { useState } from "react";
import { Plus, CheckSquare, Square, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { create, update, remove, COLLECTIONS } from "../firebase/firestoreService";
import { formatDate } from "../utils/dateUtils";
import { DeptBadge } from "../components/Badge";

export default function Checklists() {
  const { activities, projects, responsables, currentUser, logHistory } = useApp();
  const [selectedActId, setSelectedActId] = useState("");
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedAct = activities.find(a => a.id === selectedActId);
  const checklist = selectedAct?.checklist || [];

  const toggleItem = async (idx) => {
    if (!selectedAct) return;
    const updated = checklist.map((item, i) =>
      i === idx ? { ...item, completado: !item.completado, fechaCompletado: !item.completado ? new Date().toISOString() : null } : item
    );
    await update(COLLECTIONS.ACTIVITIES, selectedActId, { checklist: updated });
  };

  const addItem = async () => {
    if (!newItem.trim() || !selectedAct) return;
    setSaving(true);
    const updated = [...checklist, {
      texto: newItem.trim(),
      completado: false,
      responsable: "",
      creadoPor: currentUser.nombre,
      fechaCreacion: new Date().toISOString(),
      fechaCompletado: null,
    }];
    await update(COLLECTIONS.ACTIVITIES, selectedActId, { checklist: updated });
    await logHistory("editar", "activities", selectedActId, "checklist", `+${newItem.trim()}`);
    setNewItem("");
    setSaving(false);
  };

  const deleteItem = async (idx) => {
    const updated = checklist.filter((_, i) => i !== idx);
    await update(COLLECTIONS.ACTIVITIES, selectedActId, { checklist: updated });
  };

  const completedCount = checklist.filter(i => i.completado).length;
  const pct = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Checklists</h1>
        <p className="text-slate-500 text-sm mt-1">Seguimiento de tareas por actividad</p>
      </div>

      {/* Selector de actividad */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccionar actividad</label>
        <select
          value={selectedActId}
          onChange={e => setSelectedActId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white"
        >
          <option value="">Selecciona una actividad...</option>
          {activities.map(a => (
            <option key={a.id} value={a.id}>
              {a.titulo} — {a.proyecto || "Sin proyecto"} ({a.departamento})
            </option>
          ))}
        </select>
      </div>

      {/* Checklist */}
      {selectedAct && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header actividad */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-800">{selectedAct.titulo}</h2>
                {selectedAct.proyecto && <p className="text-sm text-slate-500">{selectedAct.proyecto}</p>}
              </div>
              <DeptBadge dept={selectedAct.departamento} small />
            </div>
            {checklist.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 font-medium">{completedCount}/{checklist.length} completados</span>
                  <span className="text-xs font-bold text-slate-600">{pct}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="divide-y divide-slate-50">
            {checklist.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-sm">Sin ítems. Agrega el primero.</div>
            )}
            {checklist.map((item, idx) => (
              <div key={idx} className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors ${item.completado ? "opacity-60" : ""}`}>
                <button onClick={() => toggleItem(idx)} className="shrink-0">
                  {item.completado
                    ? <CheckSquare size={18} className="text-green-500" />
                    : <Square size={18} className="text-slate-300 hover:text-slate-500" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.completado ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {item.texto}
                  </p>
                  {item.completado && item.fechaCompletado && (
                    <p className="text-xs text-slate-400">Completado: {formatDate(item.fechaCompletado)}</p>
                  )}
                </div>
                <button onClick={() => deleteItem(idx)} className="p-1 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Agregar ítem */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
            <div className="flex gap-2">
              <input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
                placeholder="Agregar ítem al checklist..."
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={addItem}
                disabled={saving || !newItem.trim()}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <Plus size={14} /> Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

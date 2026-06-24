// ─── Historial ───────────────────────────────────────

import React, { useState } from "react";
import { Clock, User, Edit2, Plus, Trash2, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/dateUtils";

const ACTION_ICONS = {
  crear: { icon: Plus, color: "text-green-600 bg-green-50" },
  editar: { icon: Edit2, color: "text-blue-600 bg-blue-50" },
  eliminar: { icon: Trash2, color: "text-red-600 bg-red-50" },
  "cambiar estado": { icon: RefreshCw, color: "text-purple-600 bg-purple-50" },
};

const COL_LABELS = {
  projects: "Proyectos",
  activities: "Actividades",
  responsables: "Responsables",
  departments: "Departamentos",
  estados: "Estados",
  prioridades: "Prioridades",
};

export default function Historial() {
  const { history } = useApp();
  const [filterUser, setFilterUser] = useState("");
  const [filterCol, setFilterCol] = useState("");

  const users = [...new Set(history.map(h => h.usuario).filter(Boolean))];
  const cols = [...new Set(history.map(h => h.coleccion).filter(Boolean))];

  const filtered = history.filter(h =>
    (!filterUser || h.usuario === filterUser) &&
    (!filterCol || h.coleccion === filterCol)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Historial de cambios</h1>
        <p className="text-slate-500 text-sm">{history.length} registros</p>
      </div>

      <div className="flex gap-3">
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="">Todos los usuarios</option>
          {users.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={filterCol} onChange={e => setFilterCol(e.target.value)} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="">Todas las colecciones</option>
          {cols.map(c => <option key={c} value={c}>{COL_LABELS[c] || c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Clock size={28} className="mx-auto mb-2 opacity-40" />
            <p>Sin historial registrado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((h, i) => {
              const { icon: Icon, color } = ACTION_ICONS[h.accion] || ACTION_ICONS.editar;
              return (
                <div key={h.id || i} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{h.usuario || "Sistema"}</span>
                      <span className="text-sm text-slate-500 capitalize">{h.accion}</span>
                      {h.valorNuevo && <span className="text-sm font-medium text-slate-700">"{String(h.valorNuevo).slice(0, 40)}"</span>}
                    </div>
                    {h.valorAnterior && h.valorNuevo && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="text-red-400 line-through">{String(h.valorAnterior).slice(0, 30)}</span>
                        {" → "}
                        <span className="text-green-600">{String(h.valorNuevo).slice(0, 30)}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">{COL_LABELS[h.coleccion] || h.coleccion}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{formatDateTime(h.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

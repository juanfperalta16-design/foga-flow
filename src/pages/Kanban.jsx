// ─── Kanban ──────────────────────────────────────────

import React from "react";
import { useApp } from "../context/AppContext";
import { DeptBadge, StatusBadge, PriorityBadge } from "../components/Badge";
import { formatDate } from "../utils/dateUtils";
import { AlertTriangle } from "lucide-react";

const COLUMNS = [
  { id: "nuevo", label: "Nuevo proyecto", estados: ["No iniciado"] },
  { id: "diseno", label: "En diseño", departamento: "Diseño" },
  { id: "arquitectura", label: "En arquitectura", departamento: "Arquitectura" },
  { id: "produccion", label: "En producción", departamento: "Producción" },
  { id: "instalacion", label: "En instalación", departamento: "Instalación" },
  { id: "obs", label: "Con observaciones", estados: ["Con observaciones"] },
  { id: "finalizado", label: "Finalizado", estados: ["Finalizado", "Aprobado"] },
];

const COL_COLORS = {
  nuevo: "bg-slate-100 border-slate-200",
  diseno: "bg-blue-50 border-blue-100",
  arquitectura: "bg-purple-50 border-purple-100",
  produccion: "bg-orange-50 border-orange-100",
  instalacion: "bg-green-50 border-green-100",
  obs: "bg-yellow-50 border-yellow-100",
  finalizado: "bg-gray-50 border-gray-200",
};

const COL_HEADER = {
  nuevo: "bg-slate-200 text-slate-700",
  diseno: "bg-blue-500 text-white",
  arquitectura: "bg-purple-500 text-white",
  produccion: "bg-orange-500 text-white",
  instalacion: "bg-green-500 text-white",
  obs: "bg-yellow-400 text-yellow-900",
  finalizado: "bg-gray-400 text-white",
};

export default function KanbanBoard() {
  const { activities } = useApp();

  const getColumnActivities = (col) => {
    return activities.filter(a => {
      if (col.departamento) return a.departamento === col.departamento && a.estado !== "Finalizado" && a.estado !== "Aprobado";
      if (col.estados) return col.estados.includes(a.estado);
      return false;
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Kanban</h1>
        <p className="text-slate-500 text-sm">Vista visual del flujo de trabajo</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
        {COLUMNS.map(col => {
          const items = getColumnActivities(col);
          return (
            <div key={col.id} className={`flex-none w-64 rounded-2xl border ${COL_COLORS[col.id]} flex flex-col overflow-hidden`}>
              {/* Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${COL_HEADER[col.id]} rounded-t-2xl`}>
                <span className="text-sm font-bold">{col.label}</span>
                <span className="text-xs font-bold bg-black/10 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {items.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Sin actividades</p>
                )}
                {items.map(a => (
                  <KanbanCard key={a.id} activity={a} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({ activity: a }) {
  const isUrgent = a.estado === "Urgente" || a.estado === "Atrasado";
  return (
    <div className={`bg-white rounded-xl p-3 shadow-sm border text-xs space-y-1.5 hover:shadow-md transition-shadow cursor-default
      ${isUrgent ? "border-red-200" : "border-slate-100"}`}>
      {isUrgent && (
        <div className="flex items-center gap-1 text-red-500">
          <AlertTriangle size={11} />
          <span className="font-bold uppercase text-[10px]">{a.estado}</span>
        </div>
      )}
      <p className="font-semibold text-slate-800 leading-tight">{a.titulo}</p>
      {a.proyecto && <p className="text-slate-500 truncate">{a.proyecto}</p>}
      <div className="flex flex-wrap gap-1">
        <DeptBadge dept={a.departamento} small />
      </div>
      {a.responsable && (
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0">
            {a.responsable[0]}
          </div>
          <span className="text-slate-500 truncate">{a.responsable}</span>
        </div>
      )}
      {a.fechaLimite && (
        <p className={`${isUrgent ? "text-red-500" : "text-slate-400"}`}>
          📅 {formatDate(a.fechaLimite)}
        </p>
      )}
    </div>
  );
}

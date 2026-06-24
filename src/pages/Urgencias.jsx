// ─── Urgencias y Atrasos ─────────────────────────────

import React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";
import { DeptBadge, StatusBadge, PriorityBadge } from "../components/Badge";
import { formatDate } from "../utils/dateUtils";

export default function Urgencias() {
  const { activities } = useApp();
  const urgentes = activities.filter(a => a.estado === "Urgente");
  const atrasados = activities.filter(a => a.estado === "Atrasado");
  const conObs = activities.filter(a => a.estado === "Con observaciones");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Urgencias y Atrasos</h1>
        <p className="text-slate-500 text-sm">{urgentes.length + atrasados.length} actividades requieren atención</p>
      </div>

      <ActivitySection title="Actividades urgentes" icon={AlertTriangle} iconColor="text-red-500" activities={urgentes} emptyMsg="No hay urgentes" bg="bg-red-50" border="border-red-100" />
      <ActivitySection title="Actividades atrasadas" icon={Clock} iconColor="text-red-800" activities={atrasados} emptyMsg="No hay atrasados" bg="bg-red-100/50" border="border-red-200" />
      <ActivitySection title="Con observaciones" icon={AlertTriangle} iconColor="text-yellow-500" activities={conObs} emptyMsg="Sin observaciones pendientes" bg="bg-yellow-50" border="border-yellow-100" />
    </div>
  );
}

function ActivitySection({ title, icon: Icon, iconColor, activities, emptyMsg, bg, border }) {
  return (
    <div className={`${bg} border ${border} rounded-2xl p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className={iconColor} />
        <h2 className="font-bold text-slate-800">{title}</h2>
        {activities.length > 0 && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bg === "bg-red-50" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{activities.length}</span>
        )}
      </div>
      {activities.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyMsg} ✓</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activities.map(a => (
            <div key={a.id} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-slate-800 text-sm">{a.titulo}</p>
                <StatusBadge status={a.estado} small />
              </div>
              <p className="text-xs text-slate-500 mb-2">{a.proyecto || "Sin proyecto"} · {a.responsable || "Sin asignar"}</p>
              <div className="flex flex-wrap gap-1.5">
                <DeptBadge dept={a.departamento} small />
                <PriorityBadge priority={a.prioridad} small />
              </div>
              {a.fechaLimite && (
                <p className="text-xs text-red-500 mt-2 font-medium">Límite: {formatDate(a.fechaLimite)}</p>
              )}
              {a.observaciones && (
                <p className="text-xs text-slate-500 mt-1 italic">{a.observaciones}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

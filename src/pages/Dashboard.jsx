// ─── Dashboard ───────────────────────────────────────

import React from "react";
import { AlertTriangle, Clock, CheckCircle, FolderOpen, Users, Zap } from "lucide-react";
import { useApp } from "../context/AppContext";
import { DeptBadge, StatusBadge, PriorityBadge } from "../components/Badge";
import { formatDate } from "../utils/dateUtils";
import { getDeptColor } from "../utils/colorUtils";

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color === "text-red-600" ? "bg-red-50" : color === "text-blue-600" ? "bg-blue-50" : color === "text-green-600" ? "bg-green-50" : "bg-orange-50"}`}>
          <Icon size={22} className={color} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { projects, activities, departments } = useApp();

  const urgentes = activities.filter(a => a.estado === "Urgente");
  const atrasados = activities.filter(a => a.estado === "Atrasado");
  const finalizados = activities.filter(a => a.estado === "Finalizado" || a.estado === "Aprobado");
  const conObs = activities.filter(a => a.estado === "Con observaciones");
  const activos = projects.filter(p => p.estado !== "Finalizado" && p.estado !== "Aprobado");

  // Carga por departamento
  const deptLoad = departments.reduce((acc, d) => {
    acc[d.nombre] = activities.filter(a => a.departamento === d.nombre && a.estado !== "Finalizado").length;
    return acc;
  }, {});

  // Responsables con más actividades
  const respLoad = {};
  activities.filter(a => a.estado !== "Finalizado").forEach(a => {
    if (a.responsable) respLoad[a.responsable] = (respLoad[a.responsable] || 0) + 1;
  });
  const topResps = Object.entries(respLoad).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen general del trabajo en curso</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen} label="Proyectos activos" value={activos.length} color="text-blue-600" />
        <StatCard icon={Zap} label="Urgentes" value={urgentes.length} color="text-red-600" />
        <StatCard icon={Clock} label="Atrasados" value={atrasados.length} color="text-orange-600" />
        <StatCard icon={CheckCircle} label="Finalizados" value={finalizados.length} color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carga por departamento */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-800 mb-4">Carga por departamento</h2>
          <div className="space-y-3">
            {departments.filter(d => d.nombre !== "Finalizado").map(d => {
              const count = deptLoad[d.nombre] || 0;
              const max = Math.max(...Object.values(deptLoad), 1);
              const pct = Math.round((count / max) * 100);
              const c = getDeptColor(d.nombre);
              return (
                <div key={d.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{d.nombre}</span>
                    <span className="text-sm font-bold text-slate-600">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${c.bg} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top responsables */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-800 mb-4">Carga por responsable</h2>
          <div className="space-y-2">
            {topResps.length === 0 && <p className="text-slate-400 text-sm">Sin actividades asignadas</p>}
            {topResps.map(([nombre, count]) => (
              <div key={nombre} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    {nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{nombre}</span>
                </div>
                <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgentes y atrasados */}
      {(urgentes.length > 0 || atrasados.length > 0) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="text-base font-bold text-slate-800">Atención requerida</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...urgentes, ...atrasados].slice(0, 6).map(a => (
              <div key={a.id} className={`p-3 rounded-xl border ${a.estado === "Atrasado" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{a.titulo}</p>
                    <p className="text-slate-500 text-xs truncate">{a.proyecto} · {a.responsable || "Sin asignar"}</p>
                  </div>
                  <StatusBadge status={a.estado} small />
                </div>
                <div className="mt-1.5 flex gap-2">
                  <DeptBadge dept={a.departamento} small />
                  <span className="text-xs text-slate-400">Límite: {formatDate(a.fechaLimite)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actividades con observaciones */}
      {conObs.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-yellow-100">
          <h2 className="text-base font-bold text-slate-800 mb-3">Con observaciones</h2>
          <div className="space-y-2">
            {conObs.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{a.titulo}</p>
                  <p className="text-xs text-slate-400">{a.proyecto} · {a.departamento}</p>
                </div>
                <DeptBadge dept={a.departamento} small />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

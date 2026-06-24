// ─── Calendario General ───────────────────────────────
// Vista mensual visual por departamentos — centro de FOGA Flow

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, X, Calendar } from "lucide-react";
import { useApp } from "../context/AppContext";
import { MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth, formatDate, isOverdue } from "../utils/dateUtils";
import { getDeptColor, getStatusColor } from "../utils/colorUtils";
import Modal from "../components/Modal";
import { StatusBadge, DeptBadge, PriorityBadge } from "../components/Badge";
import { update, COLLECTIONS } from "../firebase/firestoreService";

const DEPT_ORDER = ["Diseño", "Arquitectura", "Producción", "Instalación", "Toma de medidas"];

export default function CalendarioGeneral() {
  const { activities, departments, responsables, projects, estados, prioridades, logHistory, currentUser } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState("dept"); // "month" | "dept"
  const [filters, setFilters] = useState({ dept: "", resp: "", estado: "", prioridad: "" });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Actividades filtradas del mes
  const monthActivities = useMemo(() => {
    return activities.filter(a => {
      if (!a.fechaInicio && !a.fechaLimite) return false;
      const start = new Date(a.fechaInicio || a.fechaLimite);
      const end = new Date(a.fechaLimite || a.fechaInicio);
      const mStart = new Date(year, month, 1);
      const mEnd = new Date(year, month + 1, 0);
      const inMonth = start <= mEnd && end >= mStart;
      const matchDept = !filters.dept || a.departamento === filters.dept;
      const matchResp = !filters.resp || a.responsable === filters.resp;
      const matchEstado = !filters.estado || a.estado === filters.estado;
      const matchPrio = !filters.prioridad || a.prioridad === filters.prioridad;
      return inMonth && matchDept && matchResp && matchEstado && matchPrio;
    });
  }, [activities, year, month, filters]);

  const openActivity = (a) => { setSelectedActivity(a); setEditForm({ ...a }); setEditing(false); };

  const handleSaveEdit = async () => {
    await update(COLLECTIONS.ACTIVITIES, selectedActivity.id, editForm);
    await logHistory("editar", "activities", selectedActivity.id, selectedActivity.estado, editForm.estado);
    setSelectedActivity({ ...selectedActivity, ...editForm });
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calendario General</h1>
          <p className="text-slate-500 text-sm">{monthActivities.length} actividades en {MONTH_NAMES[month]} {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("month")} className={`px-3 py-2 text-sm rounded-xl font-medium transition-colors ${view === "month" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            Vista mensual
          </button>
          <button onClick={() => setView("dept")} className={`px-3 py-2 text-sm rounded-xl font-medium transition-colors ${view === "dept" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            Por departamento
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
        <select value={filters.dept} onChange={e => setFilters(f => ({ ...f, dept: e.target.value }))} className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none">
          <option value="">Todos los departamentos</option>
          {departments.map(d => <option key={d.id} value={d.nombre}>{d.nombre}</option>)}
        </select>
        <select value={filters.resp} onChange={e => setFilters(f => ({ ...f, resp: e.target.value }))} className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none">
          <option value="">Todos los responsables</option>
          {responsables.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
        </select>
        <select value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))} className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none">
          <option value="">Todos los estados</option>
          {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
        </select>
        <select value={filters.prioridad} onChange={e => setFilters(f => ({ ...f, prioridad: e.target.value }))} className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none">
          <option value="">Todas las prioridades</option>
          {prioridades.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
        </select>
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({ dept: "", resp: "", estado: "", prioridad: "" })} className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors">
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* Navegación del mes */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 shadow-sm border border-slate-100">
        <button onClick={prevMonth} className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{MONTH_NAMES[month]}</h2>
          <p className="text-slate-400 text-sm font-medium">{year}</p>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Vista mensual tradicional */}
      {view === "month" && (
        <MonthView year={year} month={month} activities={monthActivities} onClickActivity={openActivity} />
      )}

      {/* Vista por departamentos */}
      {view === "dept" && (
        <DeptView year={year} month={month} activities={monthActivities} departments={departments} onClickActivity={openActivity} />
      )}

      {/* Modal detalle de actividad */}
      {selectedActivity && (
        <Modal isOpen={!!selectedActivity} onClose={() => setSelectedActivity(null)} title="Detalle de actividad" size="md">
          {!editing ? (
            <ActivityDetail
              activity={selectedActivity}
              onEdit={() => setEditing(true)}
            />
          ) : (
            <div className="space-y-4">
              <ActivityEditForm form={editForm} setForm={setEditForm} responsables={responsables} estados={estados} prioridades={prioridades} />
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600">Cancelar</button>
                <button onClick={handleSaveEdit} className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white font-medium">Guardar</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── Vista Mensual ────────────────────────────────────
function MonthView({ year, month, activities, onClickActivity }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const getActivitiesForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return activities.filter(a => {
      const start = a.fechaInicio || a.fechaLimite;
      const end = a.fechaLimite || a.fechaInicio;
      return start && end && start <= dateStr && dateStr <= end;
    });
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Días de semana */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      {/* Celdas */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="min-h-28 bg-slate-50/30 border-r border-b border-slate-100" />;
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const dayActivities = getActivitiesForDay(day);
          return (
            <div key={day} className={`min-h-28 p-1.5 border-r border-b border-slate-100 ${isToday ? "bg-blue-50/50" : "hover:bg-slate-50/50"} transition-colors`}>
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1 ${isToday ? "bg-blue-600 text-white" : "text-slate-600"}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayActivities.slice(0, 3).map(a => (
                  <ActivityChip key={a.id} activity={a} onClick={() => onClickActivity(a)} />
                ))}
                {dayActivities.length > 3 && (
                  <div className="text-xs text-slate-400 pl-1">+{dayActivities.length - 3} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vista por Departamentos ───────────────────────────
function DeptView({ year, month, activities, departments, onClickActivity }) {
  const daysInMonth = getDaysInMonth(year, month);
  const today = new Date();
  const activeDepts = DEPT_ORDER.filter(d => departments.find(dep => dep.nombre === d));

  const getActivitiesForDayDept = (day, dept) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return activities.filter(a => {
      if (a.departamento !== dept) return false;
      const start = a.fechaInicio || a.fechaLimite;
      const end = a.fechaLimite || a.fechaInicio;
      return start && end && start <= dateStr && dateStr <= end;
    });
  };

  // Solo mostrar días con actividades para no sobrecargar
  const daysWithActivities = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d =>
    activeDepts.some(dept => getActivitiesForDayDept(d, dept).length > 0)
  );

  if (daysWithActivities.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-400 font-medium">No hay actividades este mes</p>
        <p className="text-slate-300 text-sm mt-1">Crea actividades con fechas en {MONTH_NAMES[month]} {year}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider w-28 sticky left-0">
                Día
              </th>
              {activeDepts.map(dept => {
                const c = getDeptColor(dept);
                return (
                  <th key={dept} className="px-3 py-3 bg-slate-50 text-xs font-bold uppercase tracking-wider text-center">
                    <span className={`px-3 py-1.5 rounded-full ${c.light} ${c.text}`}>{dept}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {daysWithActivities.map(day => {
              const date = new Date(year, month, day);
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const weekDay = DAY_NAMES[date.getDay()];
              return (
                <tr key={day} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${isToday ? "bg-blue-50/30" : ""}`}>
                  <td className={`px-4 py-3 sticky left-0 ${isToday ? "bg-blue-50/80" : "bg-white"} z-10`}>
                    <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold mb-0.5 ${isToday ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                      {day}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{weekDay}</p>
                  </td>
                  {activeDepts.map(dept => {
                    const deptActivities = getActivitiesForDayDept(day, dept);
                    const c = getDeptColor(dept);
                    return (
                      <td key={dept} className="px-2 py-2 align-top">
                        <div className="space-y-1.5">
                          {deptActivities.map(a => (
                            <DeptActivityCard key={a.id} activity={a} color={c} onClick={() => onClickActivity(a)} />
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Componentes de actividad ─────────────────────────
function ActivityChip({ activity, onClick }) {
  const c = getDeptColor(activity.departamento);
  const isUrgent = activity.estado === "Urgente" || activity.estado === "Atrasado";
  return (
    <button onClick={onClick} title={activity.titulo} className={`w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate transition-opacity hover:opacity-80 ${c.bg} text-white ${isUrgent ? "ring-1 ring-red-500" : ""}`}>
      {isUrgent && "⚠ "}{activity.titulo}
    </button>
  );
}

function DeptActivityCard({ activity, color, onClick }) {
  const isUrgent = activity.estado === "Urgente" || activity.estado === "Atrasado";
  const isOverdueAct = activity.estado === "Atrasado";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2 rounded-xl text-xs transition-all hover:shadow-md border
        ${isOverdueAct ? "bg-red-50 border-red-200 hover:bg-red-100" : `${color.light} ${color.border} hover:bg-opacity-80`}`}
    >
      {isUrgent && (
        <div className="flex items-center gap-1 mb-1">
          <AlertTriangle size={10} className="text-red-500 shrink-0" />
          <span className="text-red-600 font-bold uppercase text-[10px]">{activity.estado}</span>
        </div>
      )}
      <p className={`font-semibold leading-tight mb-1 ${isOverdueAct ? "text-red-800" : color.text}`}>{activity.titulo}</p>
      {activity.proyecto && <p className="text-slate-500 truncate mb-0.5">{activity.proyecto}</p>}
      {activity.responsable && (
        <p className="text-slate-400 flex items-center gap-1 truncate">
          <span className="w-3 h-3 rounded-full bg-slate-300 inline-flex items-center justify-center text-[8px] font-bold text-slate-600 shrink-0">
            {activity.responsable[0]}
          </span>
          {activity.responsable}
        </p>
      )}
      {activity.fechaLimite && (
        <p className={`mt-1 flex items-center gap-1 ${isOverdueAct ? "text-red-600" : "text-slate-400"}`}>
          <Clock size={9} />
          {formatDate(activity.fechaLimite)}
        </p>
      )}
    </button>
  );
}

function ActivityDetail({ activity, onEdit }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <DeptBadge dept={activity.departamento} />
        <StatusBadge status={activity.estado} />
        <PriorityBadge priority={activity.prioridad} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {activity.proyecto && <Detail label="Proyecto" value={activity.proyecto} />}
        {activity.cliente && <Detail label="Cliente" value={activity.cliente} />}
        {activity.responsable && <Detail label="Responsable" value={activity.responsable} />}
        {activity.fechaInicio && <Detail label="Inicio" value={formatDate(activity.fechaInicio)} />}
        {activity.fechaLimite && <Detail label="Fecha límite" value={formatDate(activity.fechaLimite)} />}
      </div>
      {activity.descripcion && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Descripción</p>
          <p className="text-sm text-slate-700">{activity.descripcion}</p>
        </div>
      )}
      {activity.observaciones && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
          <p className="text-xs font-semibold text-yellow-700 mb-1">Observaciones</p>
          <p className="text-sm text-yellow-800">{activity.observaciones}</p>
        </div>
      )}
      <div className="pt-2 border-t border-slate-100">
        <button onClick={onEdit} className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-colors">
          Editar actividad
        </button>
      </div>
    </div>
  );
}

function ActivityEditForm({ form, setForm, responsables, estados, prioridades }) {
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Estado</label>
        <select value={form.estado || ""} onChange={e => f("estado", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
          {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Prioridad</label>
        <select value={form.prioridad || ""} onChange={e => f("prioridad", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
          {prioridades.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Responsable</label>
        <select value={form.responsable || ""} onChange={e => f("responsable", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
          <option value="">Sin asignar</option>
          {responsables.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha límite</label>
        <input type="date" value={form.fechaLimite || ""} onChange={e => f("fechaLimite", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
        <textarea value={form.observaciones || ""} onChange={e => f("observaciones", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none" />
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
      <p className="text-slate-800 font-medium">{value}</p>
    </div>
  );
}

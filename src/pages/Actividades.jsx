// ─── Actividades ─────────────────────────────────────

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useApp } from "../context/AppContext";
import { create, update, remove, COLLECTIONS } from "../firebase/firestoreService";
import Modal from "../components/Modal";
import { DeptBadge, StatusBadge, PriorityBadge } from "../components/Badge";
import { formatDate } from "../utils/dateUtils";

const EMPTY = {
  proyectoId: "", proyecto: "", cliente: "", departamento: "Diseño",
  responsable: "", titulo: "", descripcion: "", fechaInicio: "", fechaLimite: "",
  estado: "No iniciado", prioridad: "Normal", observaciones: ""
};

export default function Actividades() {
  const { activities, projects, responsables, departments, estados, prioridades, logHistory, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const filtered = activities.filter(a => {
    const q = search.toLowerCase();
    return (!q || a.titulo?.toLowerCase().includes(q) || a.proyecto?.toLowerCase().includes(q) || a.responsable?.toLowerCase().includes(q))
      && (!filterDept || a.departamento === filterDept)
      && (!filterEstado || a.estado === filterEstado);
  });

  const openNew = () => { setForm(EMPTY); setModal("new"); };
  const openEdit = (a) => { setForm({ ...a }); setSelected(a); setModal("edit"); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleProjectChange = (proyectoId) => {
    const p = projects.find(p => p.id === proyectoId);
    setForm(prev => ({ ...prev, proyectoId, proyecto: p?.nombre || "", cliente: p?.cliente || "" }));
  };

  const handleSave = async () => {
    if (!form.titulo || !form.departamento) return alert("Completa los campos obligatorios.");
    setSaving(true);
    try {
      if (modal === "new") {
        await create(COLLECTIONS.ACTIVITIES, { ...form, creadoPor: currentUser.nombre });
        await logHistory("crear", "activities", "nuevo", null, form.titulo);
      } else {
        await update(COLLECTIONS.ACTIVITIES, selected.id, form);
        await logHistory("editar", "activities", selected.id, selected.estado, form.estado);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a) => {
    if (!confirm(`¿Eliminar actividad "${a.titulo}"?`)) return;
    await remove(COLLECTIONS.ACTIVITIES, a.id);
    await logHistory("eliminar", "activities", a.id, a.titulo, null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Actividades</h1>
          <p className="text-slate-500 text-sm">{activities.length} actividades en total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
          <Plus size={16} /> Nueva actividad
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar actividad, proyecto, responsable..." className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="">Todos los deptos</option>
          {departments.map(d => <option key={d.id} value={d.nombre}>{d.nombre}</option>)}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="">Todos los estados</option>
          {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Actividad</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Proyecto</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Departamento</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Responsable</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Prioridad</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha límite</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400">No hay actividades.</td></tr>
            )}
            {filtered.map(a => (
              <tr key={a.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${a.estado === "Atrasado" ? "bg-red-50/30" : ""}`}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{a.titulo}</p>
                  {a.descripcion && <p className="text-xs text-slate-400 truncate max-w-xs">{a.descripcion}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{a.proyecto || "—"}</td>
                <td className="px-4 py-3"><DeptBadge dept={a.departamento} small /></td>
                <td className="px-4 py-3 text-slate-600">{a.responsable || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={a.estado} small /></td>
                <td className="px-4 py-3"><PriorityBadge priority={a.prioridad} small /></td>
                <td className="px-4 py-3 text-slate-500">{formatDate(a.fechaLimite)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(a)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={modal === "new" || modal === "edit"} onClose={closeModal} title={modal === "new" ? "Nueva actividad" : "Editar actividad"} size="lg">
        <ActivityForm
          form={form} setForm={setForm}
          projects={projects} responsables={responsables}
          departments={departments} estados={estados} prioridades={prioridades}
          onProjectChange={handleProjectChange}
        />
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={closeModal} className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60">
            {saving ? "Guardando..." : modal === "new" ? "Crear actividad" : "Guardar cambios"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ActivityForm({ form, setForm, projects, responsables, departments, estados, prioridades, onProjectChange }) {
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Proyecto relacionado</label>
        <select value={form.proyectoId || ""} onChange={e => onProjectChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
          <option value="">Sin proyecto</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.nombre} — {p.cliente}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Título de actividad *</label>
        <input value={form.titulo || ""} onChange={e => f("titulo", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" placeholder="Ej: Desarrollo de planos" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Departamento *</label>
        <select value={form.departamento || ""} onChange={e => f("departamento", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
          {departments.map(d => <option key={d.id} value={d.nombre}>{d.nombre}</option>)}
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
        <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de inicio</label>
        <input type="date" value={form.fechaInicio || ""} onChange={e => f("fechaInicio", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha límite</label>
        <input type="date" value={form.fechaLimite || ""} onChange={e => f("fechaLimite", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none" />
      </div>
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
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
        <textarea value={form.descripcion || ""} onChange={e => f("descripcion", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none" placeholder="Descripción de la actividad..." />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
        <textarea value={form.observaciones || ""} onChange={e => f("observaciones", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none resize-none" placeholder="Observaciones o notas importantes..." />
      </div>
    </div>
  );
}

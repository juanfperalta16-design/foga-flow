// ─── Proyectos ───────────────────────────────────────

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Eye, Search, Filter } from "lucide-react";
import { useApp } from "../context/AppContext";
import { create, update, remove, COLLECTIONS } from "../firebase/firestoreService";
import Modal from "../components/Modal";
import { DeptBadge, StatusBadge, PriorityBadge } from "../components/Badge";
import { formatDate } from "../utils/dateUtils";

const EMPTY = {
  cliente: "", nombre: "", numeroOrden: "", fechaInicio: "", fechaEntrega: "",
  departamentoActual: "Diseño", responsablePrincipal: "", estado: "No iniciado",
  prioridad: "Normal", observaciones: ""
};

export default function Proyectos() {
  const { projects, responsables, departments, estados, prioridades, logHistory, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [modal, setModal] = useState(null); // null | "new" | "edit" | "view"
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.nombre?.toLowerCase().includes(q) || p.cliente?.toLowerCase().includes(q) || p.numeroOrden?.toLowerCase().includes(q);
    const matchDept = !filterDept || p.departamentoActual === filterDept;
    const matchEstado = !filterEstado || p.estado === filterEstado;
    return matchSearch && matchDept && matchEstado;
  });

  const openNew = () => { setForm(EMPTY); setModal("new"); };
  const openEdit = (p) => { setForm({ ...p }); setSelected(p); setModal("edit"); };
  const openView = (p) => { setSelected(p); setModal("view"); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, creadoPor: currentUser.nombre };
      if (modal === "new") {
        await create(COLLECTIONS.PROJECTS, data);
        await logHistory("crear", "projects", "nuevo", null, data.nombre);
      } else {
        await update(COLLECTIONS.PROJECTS, selected.id, form);
        await logHistory("editar", "projects", selected.id, selected.nombre, form.nombre);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`¿Eliminar proyecto "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    await remove(COLLECTIONS.PROJECTS, p.id);
    await logHistory("eliminar", "projects", p.id, p.nombre, null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proyectos</h1>
          <p className="text-slate-500 text-sm">{projects.length} proyectos en total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
          <Plus size={16} /> Nuevo proyecto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyecto, cliente..." className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="">Todos los departamentos</option>
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
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Proyecto</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Departamento</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Prioridad</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Entrega</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">No hay proyectos{search ? " que coincidan" : ". Crea el primero."}</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{p.nombre}</p>
                  {p.numeroOrden && <p className="text-xs text-slate-400">Orden #{p.numeroOrden}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.cliente}</td>
                <td className="px-4 py-3"><DeptBadge dept={p.departamentoActual} small /></td>
                <td className="px-4 py-3"><StatusBadge status={p.estado} small /></td>
                <td className="px-4 py-3"><PriorityBadge priority={p.prioridad} small /></td>
                <td className="px-4 py-3 text-slate-500">{formatDate(p.fechaEntrega)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openView(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={15} /></button>
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(p)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo/editar */}
      <Modal isOpen={modal === "new" || modal === "edit"} onClose={closeModal} title={modal === "new" ? "Nuevo proyecto" : "Editar proyecto"} size="lg">
        <ProjectForm form={form} setForm={setForm} responsables={responsables} departments={departments} estados={estados} prioridades={prioridades} />
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={closeModal} className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60">
            {saving ? "Guardando..." : modal === "new" ? "Crear proyecto" : "Guardar cambios"}
          </button>
        </div>
      </Modal>

      {/* Modal ver */}
      <Modal isOpen={modal === "view"} onClose={closeModal} title="Detalle del proyecto" size="md">
        {selected && <ProjectDetail project={selected} />}
      </Modal>
    </div>
  );
}

function ProjectForm({ form, setForm, responsables, departments, estados, prioridades }) {
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label>Nombre del proyecto *</Label>
        <Input value={form.nombre} onChange={v => f("nombre", v)} placeholder="Ej: Cocina Restaurante XYZ" />
      </div>
      <div>
        <Label>Cliente *</Label>
        <Input value={form.cliente} onChange={v => f("cliente", v)} placeholder="Nombre del cliente" />
      </div>
      <div>
        <Label>Número de orden</Label>
        <Input value={form.numeroOrden} onChange={v => f("numeroOrden", v)} placeholder="OC-2025-001" />
      </div>
      <div>
        <Label>Fecha de inicio</Label>
        <Input type="date" value={form.fechaInicio} onChange={v => f("fechaInicio", v)} />
      </div>
      <div>
        <Label>Fecha de entrega</Label>
        <Input type="date" value={form.fechaEntrega} onChange={v => f("fechaEntrega", v)} />
      </div>
      <div>
        <Label>Departamento actual</Label>
        <Select value={form.departamentoActual} onChange={v => f("departamentoActual", v)} options={departments.map(d => d.nombre)} />
      </div>
      <div>
        <Label>Responsable principal</Label>
        <Select value={form.responsablePrincipal} onChange={v => f("responsablePrincipal", v)} options={responsables.map(r => r.nombre)} placeholder="Seleccionar..." />
      </div>
      <div>
        <Label>Estado</Label>
        <Select value={form.estado} onChange={v => f("estado", v)} options={estados.map(e => e.nombre)} />
      </div>
      <div>
        <Label>Prioridad</Label>
        <Select value={form.prioridad} onChange={v => f("prioridad", v)} options={prioridades.map(p => p.nombre)} />
      </div>
      <div className="md:col-span-2">
        <Label>Observaciones generales</Label>
        <textarea value={form.observaciones} onChange={e => f("observaciones", e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" placeholder="Notas generales del proyecto..." />
      </div>
    </div>
  );
}

function ProjectDetail({ project }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Detail label="Cliente" value={project.cliente} />
        <Detail label="Orden #" value={project.numeroOrden || "—"} />
        <Detail label="Estado" value={<StatusBadge status={project.estado} small />} />
        <Detail label="Prioridad" value={<PriorityBadge priority={project.prioridad} small />} />
        <Detail label="Departamento" value={<DeptBadge dept={project.departamentoActual} small />} />
        <Detail label="Responsable" value={project.responsablePrincipal || "—"} />
        <Detail label="Inicio" value={formatDate(project.fechaInicio)} />
        <Detail label="Entrega" value={formatDate(project.fechaEntrega)} />
      </div>
      {project.observaciones && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
          <p className="text-xs font-semibold text-yellow-700 mb-1">Observaciones</p>
          <p className="text-sm text-yellow-800">{project.observaciones}</p>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
      <div className="text-slate-800">{value}</div>
    </div>
  );
}

function Label({ children }) {
  return <label className="block text-xs font-semibold text-slate-600 mb-1">{children}</label>;
}
function Input({ value, onChange, type = "text", placeholder }) {
  return <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />;
}
function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value || ""} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

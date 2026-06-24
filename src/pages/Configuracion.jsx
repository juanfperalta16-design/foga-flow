// ─── Configuración ───────────────────────────────────
// Todo editable desde la interfaz, sin tocar el código

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, Users, Building2, Tag, Layers, AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { create, update, remove } from "../firebase/firestoreService";

export default function Configuracion() {
  const { responsables, departments, estados, prioridades, etapas } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Administra los datos maestros del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CRUDCard
          title="Responsables"
          icon={Users}
          data={responsables}
          collection="responsables"
          fields={[
            { key: "nombre", label: "Nombre", required: true },
            { key: "departamento", label: "Departamento" },
          ]}
          displayKey="nombre"
          subKey="departamento"
        />
        <CRUDCard
          title="Departamentos"
          icon={Building2}
          data={departments}
          collection="departments"
          fields={[
            { key: "nombre", label: "Nombre", required: true },
            { key: "color", label: "Color (hex)", type: "color" },
            { key: "orden", label: "Orden", type: "number" },
          ]}
          displayKey="nombre"
        />
        <CRUDCard
          title="Estados"
          icon={Tag}
          data={estados}
          collection="estados"
          fields={[
            { key: "nombre", label: "Nombre", required: true },
            { key: "color", label: "Color (hex)", type: "color" },
            { key: "orden", label: "Orden", type: "number" },
          ]}
          displayKey="nombre"
        />
        <CRUDCard
          title="Prioridades"
          icon={AlertCircle}
          data={prioridades}
          collection="prioridades"
          fields={[
            { key: "nombre", label: "Nombre", required: true },
            { key: "color", label: "Color (hex)", type: "color" },
            { key: "orden", label: "Orden", type: "number" },
          ]}
          displayKey="nombre"
        />
        <CRUDCard
          title="Etapas del flujo"
          icon={Layers}
          data={etapas}
          collection="etapas"
          fields={[
            { key: "nombre", label: "Nombre de la etapa", required: true },
            { key: "orden", label: "Orden", type: "number" },
          ]}
          displayKey="nombre"
          subKey="orden"
          subPrefix="Etapa "
        />
      </div>
    </div>
  );
}

// ─── CRUD Card genérica ────────────────────────────────
function CRUDCard({ title, icon: Icon, data, collection, fields, displayKey, subKey, subPrefix = "" }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const emptyForm = fields.reduce((acc, f) => ({ ...acc, [f.key]: f.type === "number" ? "" : "" }), {});

  const startAdd = () => { setForm(emptyForm); setAdding(true); setEditingId(null); };
  const startEdit = (item) => { setForm({ ...item }); setEditingId(item.id); setAdding(false); };
  const cancel = () => { setAdding(false); setEditingId(null); };

  const handleSave = async () => {
    const required = fields.find(f => f.required && !form[f.key]);
    if (required) return alert(`El campo "${required.label}" es obligatorio.`);
    setSaving(true);
    try {
      const cleanForm = { ...form };
      if (cleanForm.orden) cleanForm.orden = parseInt(cleanForm.orden);
      if (adding) {
        await create(collection, cleanForm);
      } else {
        await update(collection, editingId, cleanForm);
      }
      cancel();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item[displayKey]}"?`)) return;
    await remove(collection, item.id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <Icon size={16} className="text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
            <p className="text-slate-400 text-xs">{data.length} registros</p>
          </div>
        </div>
        <button
          onClick={startAdd}
          className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={13} /> Agregar
        </button>
      </div>

      {/* Formulario agregar/editar */}
      {(adding || editingId) && (
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {fields.map(field => (
              <div key={field.key} className={fields.length === 1 ? "col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{field.label}</label>
                {field.type === "color" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form[field.key] || "#3B82F6"}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className="w-10 h-8 rounded cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={form[field.key] || ""}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                      placeholder="#3B82F6"
                    />
                  </div>
                ) : (
                  <input
                    type={field.type || "text"}
                    value={form[field.key] || ""}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder={field.label}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60 transition-colors">
              <Check size={12} /> {saving ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={cancel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors">
              <X size={12} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
        {data.length === 0 && (
          <div className="py-6 text-center text-slate-400 text-sm">No hay registros. Agrega el primero.</div>
        )}
        {data.map(item => (
          <div key={item.id} className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors ${editingId === item.id ? "bg-blue-50/50" : ""}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {item.color && (
                <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-200" style={{ backgroundColor: item.color }} />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item[displayKey]}</p>
                {subKey && item[subKey] && (
                  <p className="text-xs text-slate-400">{subPrefix}{item[subKey]}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => startEdit(item)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Edit2 size={13} />
              </button>
              <button onClick={() => handleDelete(item)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

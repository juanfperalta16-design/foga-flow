import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Mismos nombres que src/utils/settingsStorage.js (DEPARTAMENTOS_CONFIG_INICIALES /
// RESPONSABLES_INICIALES) — antes este dropdown ofrecía nombres distintos
// ("Diseño", "Instalación") a los que realmente usan los datos ("Diseño 3D",
// "Instalaciones"), así que al editar a alguien con el departamento real, el
// selector no tenía ninguna opción que calzara con su valor guardado.
const DEPARTAMENTOS_OPTS = [
  'Arquitectura', 'Diseño 3D', 'Producción', 'Instalaciones', 'Ventas', 'Administración',
];
const ROLES_OPTS = [
  'Administrador', 'Arquitectura', 'Diseño', 'Producción', 'Instalación', 'Consulta',
];
const DEPT_AVATAR_BG = {
  'Arquitectura': '#D4A017', 'Diseño 3D': '#B5651D', 'Producción': '#7A4B8C',
  'Instalaciones': '#2C6E9E', 'Ventas': '#A67C3D', 'Administración': '#6B7280',
};

const EMPTY = {
  nombre: '', iniciales: '', departamento: 'Diseño',
  rol: 'Consulta', estado: 'Activo', correo: '', telefono: '',
};

function autoIniciales(nombre) {
  return (nombre || '').trim().split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
}

export default function ResponsibleForm({ responsable, onSave, onClose }) {
  const editando = !!responsable;
  const [form, setForm] = useState(editando ? { ...responsable } : { ...EMPTY });
  const [error, setError] = useState('');

  // auto-iniciales al escribir nombre (solo en modo crear)
  useEffect(() => {
    if (!editando) {
      setForm(f => ({ ...f, iniciales: autoIniciales(f.nombre) }));
    }
  }, [form.nombre, editando]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  function handleSubmit() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!form.iniciales.trim()) { setError('Las iniciales son obligatorias.'); return; }
    setError('');
    onSave(form);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 anim-backdrop-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1B1E23] border border-white/10 rounded-2xl w-full max-w-[480px] anim-panel-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-steel-line">
          <h2 className="font-display text-white font-bold text-lg">
            {editando ? 'Editar responsable' : 'Nueva persona'}
          </h2>
          <button onClick={onClose} className="text-steel-muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="px-6 py-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-3 mb-5 px-3.5 py-3 bg-[#101215] border border-white/5 rounded-xl">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px] text-white shrink-0"
              style={{ background: DEPT_AVATAR_BG[form.departamento] || '#6B7280' }}>
              {form.iniciales || '?'}
            </div>
            <div>
              <div className="font-semibold text-sm text-white">{form.nombre || 'Nombre completo'}</div>
              <div className="text-xs text-steel-muted">{form.departamento} · {form.rol}</div>
            </div>
          </div>

          {/* Campos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-steel-muted mb-1 block">Nombre completo *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Juan Peralta"
                className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-flame placeholder:text-steel-faint" />
            </div>
            <div>
              <label className="text-xs text-steel-muted mb-1 block">Iniciales *</label>
              <input value={form.iniciales} onChange={e => set('iniciales', e.target.value.toUpperCase().slice(0, 3))} placeholder="JP"
                className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-flame placeholder:text-steel-faint" />
            </div>
            <div>
              <label className="text-xs text-steel-muted mb-1 block">Estado</label>
              <Select value={form.estado} onChange={v => set('estado', v)} opts={['Activo', 'Inactivo']} />
            </div>
            <div>
              <label className="text-xs text-steel-muted mb-1 block">Departamento</label>
              <Select value={form.departamento} onChange={v => set('departamento', v)} opts={DEPARTAMENTOS_OPTS} />
            </div>
            <div>
              <label className="text-xs text-steel-muted mb-1 block">Rol</label>
              <Select value={form.rol} onChange={v => set('rol', v)} opts={ROLES_OPTS} />
            </div>
            <div>
              <label className="text-xs text-steel-muted mb-1 block">Correo (opcional)</label>
              <input value={form.correo} onChange={e => set('correo', e.target.value)} placeholder="correo@foga.com"
                className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-flame placeholder:text-steel-faint" />
            </div>
            <div>
              <label className="text-xs text-steel-muted mb-1 block">Teléfono (opcional)</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+57 300 000 0000"
                className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-flame placeholder:text-steel-faint" />
            </div>
          </div>

          {error && <p className="text-xs text-red-400 mt-2.5">{error}</p>}
        </div>

        {/* Botones */}
        <div className="px-6 py-4 border-t border-steel-line flex justify-end gap-2">
          <button onClick={onClose} className="text-steel-muted hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-press text-sm px-5 py-2 rounded-lg bg-flame hover:bg-flame-dim text-white font-medium transition-colors">
            {editando ? 'Guardar cambios' : 'Crear persona'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Select({ value, onChange, opts }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-flame">
      {(opts || []).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

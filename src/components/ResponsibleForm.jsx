import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DEPARTAMENTOS_OPTS = [
  'Arquitectura', 'Diseño', 'Seguimiento de obra', 'Producción', 'Instalación', 'Administración',
];
const ROLES_OPTS = [
  'Administrador', 'Arquitectura', 'Diseño', 'Producción', 'Instalación', 'Consulta',
];

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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: '#0F172A' }}>
            {editando ? 'Editar responsable' : 'Nueva persona'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            <X size={18} />
          </button>
        </div>

        {/* Avatar preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 14px', background: '#F8FAFC', borderRadius: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#D4A017', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#fff', flexShrink: 0 }}>
            {form.iniciales || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{form.nombre || 'Nombre completo'}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{form.departamento} · {form.rol}</div>
          </div>
        </div>

        {/* Campos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Label>Nombre completo *</Label>
            <Input value={form.nombre} onChange={v => set('nombre', v)} placeholder="Ej: Juan Peralta" />
          </div>
          <div>
            <Label>Iniciales *</Label>
            <Input value={form.iniciales} onChange={v => set('iniciales', v.toUpperCase().slice(0, 3))} placeholder="JP" />
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={form.estado} onChange={v => set('estado', v)} opts={['Activo', 'Inactivo']} />
          </div>
          <div>
            <Label>Departamento</Label>
            <Select value={form.departamento} onChange={v => set('departamento', v)} opts={DEPARTAMENTOS_OPTS} />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={form.rol} onChange={v => set('rol', v)} opts={ROLES_OPTS} />
          </div>
          <div>
            <Label>Correo (opcional)</Label>
            <Input value={form.correo} onChange={v => set('correo', v)} placeholder="correo@foga.com" />
          </div>
          <div>
            <Label>Teléfono (opcional)</Label>
            <Input value={form.telefono} onChange={v => set('telefono', v)} placeholder="+57 300 000 0000" />
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 10 }}>{error}</p>}

        {/* Botones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#D4A017', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            {editando ? 'Guardar cambios' : 'Crear persona'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.4px' }}>{children}</label>;
}
function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
    />
  );
}
function Select({ value, onChange, opts }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, color: '#0F172A', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
      {(opts || []).map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

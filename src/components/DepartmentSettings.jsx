import { useState } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

const COLOR_OPTS = [
  { label: 'Morado',    hex: '#D4A017' },
  { label: 'Azul',      hex: '#B5651D' },
  { label: 'Ámbar',     hex: '#D97706' },
  { label: 'Naranja',   hex: '#7A4B8C' },
  { label: 'Verde',     hex: '#16A34A' },
  { label: 'Gris',      hex: '#6B7280' },
  { label: 'Rojo',      hex: '#DC2626' },
  { label: 'Celeste',   hex: '#0891B2' },
];

export default function DepartmentSettings({ departamentos = [], responsables = [], onUpdateDept }) {
  const [expandido, setExpandido] = useState(null);
  const [editDesc, setEditDesc] = useState({});
  const [editColor, setEditColor] = useState({});
  const [editMeta, setEditMeta] = useState({});

  function toggleExpand(id) {
    setExpandido(prev => prev === id ? null : id);
  }

  function handleSave(dept) {
    const desc  = editDesc[dept.id]  !== undefined ? editDesc[dept.id]  : dept.descripcion;
    const color = editColor[dept.id] !== undefined ? editColor[dept.id] : dept.color;
    const meta  = editMeta[dept.id]  !== undefined ? editMeta[dept.id]  : dept.metaMensualML;
    onUpdateDept({ ...dept, descripcion: desc, color, metaMensualML: meta });
    setEditDesc(p => { const n = {...p}; delete n[dept.id]; return n; });
    setEditColor(p => { const n = {...p}; delete n[dept.id]; return n; });
    setEditMeta(p => { const n = {...p}; delete n[dept.id]; return n; });
  }

  function miembros(deptNombre) {
    return (responsables || []).filter(r => r.departamento === deptNombre);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(departamentos || []).map(dept => {
        const open   = expandido === dept.id;
        const color  = editColor[dept.id] !== undefined ? editColor[dept.id] : dept.color;
        const desc   = editDesc[dept.id]  !== undefined ? editDesc[dept.id]  : dept.descripcion;
        const equipo = miembros(dept.nombre);
        const meta   = editMeta[dept.id] !== undefined ? editMeta[dept.id] : (dept.metaMensualML ?? '');
        const dirty  = editDesc[dept.id] !== undefined || editColor[dept.id] !== undefined || editMeta[dept.id] !== undefined;

        return (
          <div key={dept.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
            {/* Header fila */}
            <div
              onClick={() => toggleExpand(dept.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A', flex: 1 }}>{dept.nombre}</span>
              <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={12} /> {equipo.length} personas
              </span>
              {open ? <ChevronUp size={15} color="#94A3B8" /> : <ChevronDown size={15} color="#94A3B8" />}
            </div>

            {/* Contenido expandido */}
            {open && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F8FAFC' }}>
                {/* Color */}
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Color del departamento</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {COLOR_OPTS.map(c => (
                      <button
                        key={c.hex}
                        onClick={() => setEditColor(p => ({ ...p, [dept.id]: c.hex }))}
                        title={c.label}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c.hex, border: color === c.hex ? '3px solid #0F172A' : '2px solid transparent',
                          cursor: 'pointer', transition: 'border .15s',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Descripción */}
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Descripción</label>
                  <textarea
                    value={desc}
                    onChange={e => setEditDesc(p => ({ ...p, [dept.id]: e.target.value }))}
                    rows={2}
                    style={{ width: '100%', marginTop: 5, padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, resize: 'none', boxSizing: 'border-box', color: '#0F172A', outline: 'none' }}
                  />
                </div>

                {/* Meta mensual — solo Diseño 3D */}
                {dept.nombre === 'Diseño 3D' && (
                  <div style={{ marginTop: 14 }}>
                    <label style={labelStyle}>Meta mensual por diseñador (ML)</label>
                    <input type="number" min={0} step="0.01" value={meta}
                      onChange={e => setEditMeta(p => ({ ...p, [dept.id]: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                      placeholder="Ej: 32"
                      style={{ width: 140, marginTop: 5, padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, boxSizing: 'border-box', color: '#0F172A', outline: 'none' }} />
                    <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Se usa en el resumen mensual del registro de diseño (mismo valor para todos los diseñadores).</p>
                  </div>
                )}

                {/* Equipo */}
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Personas del departamento</label>
                  {equipo.length === 0
                    ? <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 5 }}>Ninguna persona asignada aún.</p>
                    : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 7 }}>
                        {equipo.map(r => (
                          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '4px 10px 4px 6px' }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                              {r.iniciales}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>{r.nombre}</span>
                            {r.estado === 'Inactivo' && (
                              <span style={{ fontSize: 9, background: '#FEF2F2', color: '#DC2626', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>Inactivo</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>

                {/* Guardar */}
                {dirty && (
                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleSave(dept)}
                      className="btn-press"
                      style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Guardar cambios
                    </button>
                    <button
                      onClick={() => { setEditDesc(p => { const n={...p}; delete n[dept.id]; return n; }); setEditColor(p => { const n={...p}; delete n[dept.id]; return n; }); }}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, color: '#64748B', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px' };

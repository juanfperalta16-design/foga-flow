import { useState } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

// Paleta de temple del acero + acento llama, igual que el resto del sistema.
const COLOR_OPTS = [
  { label: 'Pajizo',   hex: '#D4A017' },
  { label: 'Bronce',   hex: '#B5651D' },
  { label: 'Latón',    hex: '#A67C3D' },
  { label: 'Violeta',  hex: '#7A4B8C' },
  { label: 'Azul',     hex: '#2C6E9E' },
  { label: 'Gris',     hex: '#6B7280' },
  { label: 'Llama',    hex: '#FF5A1F' },
  { label: 'Celeste',  hex: '#0891B2' },
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
    <div className="flex flex-col gap-2.5">
      {(departamentos || []).map(dept => {
        const open   = expandido === dept.id;
        const color  = editColor[dept.id] !== undefined ? editColor[dept.id] : dept.color;
        const desc   = editDesc[dept.id]  !== undefined ? editDesc[dept.id]  : dept.descripcion;
        const equipo = miembros(dept.nombre);
        const meta   = editMeta[dept.id] !== undefined ? editMeta[dept.id] : (dept.metaMensualML ?? '');
        const dirty  = editDesc[dept.id] !== undefined || editColor[dept.id] !== undefined || editMeta[dept.id] !== undefined;

        return (
          <div key={dept.id} className="bg-[#1B1E23] border border-steel-line rounded-xl overflow-hidden">
            {/* Header fila */}
            <div
              onClick={() => toggleExpand(dept.id)}
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="font-semibold text-sm text-white flex-1">{dept.nombre}</span>
              <span className="text-[11px] text-steel-muted flex items-center gap-1">
                <Users size={12} /> {equipo.length} persona{equipo.length !== 1 ? 's' : ''}
              </span>
              {open ? <ChevronUp size={15} className="text-steel-muted" /> : <ChevronDown size={15} className="text-steel-muted" />}
            </div>

            {/* Contenido expandido */}
            {open && (
              <div className="px-4 pb-4 pt-3.5 border-t border-steel-line">
                {/* Color */}
                <div>
                  <label className="text-[11px] font-semibold text-steel-faint uppercase tracking-wide">Color del departamento</label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {COLOR_OPTS.map(c => (
                      <button
                        key={c.hex}
                        onClick={() => setEditColor(p => ({ ...p, [dept.id]: c.hex }))}
                        title={c.label}
                        className="w-7 h-7 rounded-full transition-shadow"
                        style={{
                          background: c.hex,
                          boxShadow: color === c.hex ? `0 0 0 2px #1B1E23, 0 0 0 4px ${c.hex}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Descripción */}
                <div className="mt-3.5">
                  <label className="text-[11px] font-semibold text-steel-faint uppercase tracking-wide">Descripción</label>
                  <textarea
                    value={desc}
                    onChange={e => setEditDesc(p => ({ ...p, [dept.id]: e.target.value }))}
                    rows={2}
                    className="w-full mt-1.5 bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 resize-none focus:outline-none focus:border-flame"
                  />
                </div>

                {/* Meta mensual — solo Diseño 3D */}
                {dept.nombre === 'Diseño 3D' && (
                  <div className="mt-3.5">
                    <label className="text-[11px] font-semibold text-steel-faint uppercase tracking-wide">Meta mensual por diseñador (ML)</label>
                    <input type="number" min={0} step="0.01" value={meta}
                      onChange={e => setEditMeta(p => ({ ...p, [dept.id]: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                      placeholder="Ej: 32"
                      className="w-[140px] mt-1.5 bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-flame" />
                    <p className="text-[11px] text-steel-faint mt-1">Se usa en el resumen mensual del registro de diseño (mismo valor para todos los diseñadores).</p>
                  </div>
                )}

                {/* Equipo */}
                <div className="mt-3.5">
                  <label className="text-[11px] font-semibold text-steel-faint uppercase tracking-wide">Personas del departamento</label>
                  {equipo.length === 0
                    ? <p className="text-[12px] text-steel-faint mt-1.5">Ninguna persona asignada aún.</p>
                    : (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {equipo.map(r => (
                          <div key={r.id} className="flex items-center gap-1.5 bg-[#101215] border border-white/10 rounded-full py-1 pl-1.5 pr-2.5">
                            <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: color }}>
                              {r.iniciales}
                            </div>
                            <span className="text-xs font-medium text-slate-200">{r.nombre}</span>
                            {r.estado === 'Inactivo' && (
                              <span className="text-[9px] bg-red-500/15 text-red-400 rounded px-1.5 py-0.5 font-semibold">Inactivo</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>

                {/* Guardar */}
                {dirty && (
                  <div className="mt-3.5 flex gap-2">
                    <button
                      onClick={() => handleSave(dept)}
                      className="btn-press px-4 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors"
                      style={{ background: color }}>
                      Guardar cambios
                    </button>
                    <button
                      onClick={() => { setEditDesc(p => { const n={...p}; delete n[dept.id]; return n; }); setEditColor(p => { const n={...p}; delete n[dept.id]; return n; }); }}
                      className="px-3.5 py-1.5 rounded-lg border border-steel-line text-xs text-steel-muted hover:text-white transition-colors">
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

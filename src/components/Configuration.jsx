import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Power, Users, Building2, Info } from 'lucide-react';
import { useApp } from '../App';
import { listenToCollection, setWithId, remove, COLLECTIONS } from '../firebase/firestoreService';
import ResponsibleForm from './ResponsibleForm';
import DepartmentSettings from './DepartmentSettings';

// Mismos colores de temple usados en el resto del sistema (ver statusHelpers.js),
// con los mismos nombres de departamento que src/utils/settingsStorage.js.
const DEPT_COLORS = {
  'Arquitectura':   { bg: '#D4A017', text: '#E8C158' },
  'Diseño 3D':      { bg: '#B5651D', text: '#D68A4C' },
  'Producción':     { bg: '#7A4B8C', text: '#A97FBC' },
  'Instalaciones':  { bg: '#2C6E9E', text: '#5FA0CE' },
  'Ventas':         { bg: '#A67C3D', text: '#C79F5C' },
  'Administración': { bg: '#6B7280', text: '#9CA3AF' },
};
const deptColor = (d) => DEPT_COLORS[d] || DEPT_COLORS['Administración'];

const TABS = [
  { id: 'responsables', label: 'Responsables', icon: Users },
  { id: 'departamentos', label: 'Departamentos', icon: Building2 },
  { id: 'sistema', label: 'Sistema', icon: Info },
];

export default function Configuration() {
  const { currentUser } = useApp();
  const [tab, setTab] = useState('responsables');
  const [responsables, setResp] = useState([]);
  const [departamentos, setDepts] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const unsub1 = listenToCollection(COLLECTIONS.RESPONSABLES, setResp);
    const unsub2 = listenToCollection(COLLECTIONS.DEPARTAMENTOS_CONFIG, setDepts);
    return () => { unsub1(); unsub2(); };
  }, []);

  // ─── Responsables CRUD ────────────────────────

  async function handleSaveResponsable(form) {
    const id = editTarget ? editTarget.id : 'U' + String(Date.now()).slice(-6);
    await setWithId(COLLECTIONS.RESPONSABLES, id, { ...form, id });
    setEditTarget(null);
  }

  async function handleToggleEstado(r) {
    await setWithId(COLLECTIONS.RESPONSABLES, r.id, { ...r, estado: r.estado === 'Activo' ? 'Inactivo' : 'Activo' });
  }

  async function handleDelete(id) {
    await remove(COLLECTIONS.RESPONSABLES, id);
    setDeleteConfirm(null);
  }

  // ─── Departamentos update ─────────────────────

  async function handleUpdateDept(dept) {
    await setWithId(COLLECTIONS.DEPARTAMENTOS_CONFIG, dept.id, dept);
  }

  // ─── Render ───────────────────────────────────

  return (
    <div className="p-6 max-w-[920px]">
      {/* Título */}
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-white">Configuración</h1>
        <p className="text-steel-muted text-sm mt-0.5">Administra responsables, departamentos y opciones del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1B1E23] border border-steel-line rounded-xl p-1 mb-6 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${active ? 'bg-[#101215] text-white' : 'text-steel-muted hover:text-white'}`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: Responsables ── */}
      {tab === 'responsables' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-white">Gestión de responsables</h2>
              <p className="text-steel-muted text-xs mt-0.5">
                {(responsables || []).filter(r => r.estado === 'Activo').length} activos · {(responsables || []).length} total
              </p>
            </div>
            <button onClick={() => { setEditTarget(null); setFormOpen(true); }}
              className="btn-press flex items-center gap-1.5 bg-flame hover:bg-flame-dim text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus size={15} /> Nueva persona
            </button>
          </div>

          {/* Tabla */}
          <div className="bg-[#1B1E23] border border-steel-line rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[44px_1fr_150px_130px_90px_88px] gap-0 px-4 py-2.5 border-b border-steel-line bg-[#15171B]">
              {['', 'Nombre', 'Departamento', 'Rol', 'Estado', ''].map((h, i) => (
                <div key={i} className="text-[10.5px] font-bold text-steel-faint uppercase tracking-wider">{h}</div>
              ))}
            </div>

            {(responsables || []).length === 0 && (
              <div className="text-center py-10 px-4">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-steel-muted text-[13px]">No hay responsables registrados. Crea el primero.</p>
              </div>
            )}

            {(responsables || []).map((r, i) => {
              const dc = deptColor(r.departamento);
              const activo = r.estado === 'Activo';
              const confirmingDelete = deleteConfirm === r.id;

              return (
                <div key={r.id}
                  className={`grid grid-cols-[44px_1fr_150px_130px_90px_88px] items-center px-4 py-3 transition-colors ${i < responsables.length - 1 ? 'border-b border-steel-line/60' : ''} ${confirmingDelete ? 'bg-red-950/30' : 'hover:bg-white/[0.03]'}`}
                  style={{ opacity: activo ? 1 : 0.55 }}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: activo ? dc.bg : '#374151' }}>
                    {r.iniciales}
                  </div>

                  {/* Nombre */}
                  <div>
                    <div className="text-white font-semibold text-[13.5px]">{r.nombre}</div>
                    {r.correo && <div className="text-steel-faint text-[11px]">{r.correo}</div>}
                  </div>

                  {/* Departamento */}
                  <div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: dc.bg + '1F', color: dc.text }}>
                      {r.departamento}
                    </span>
                  </div>

                  {/* Rol */}
                  <div className="text-steel-muted text-xs">{r.rol}</div>

                  {/* Estado */}
                  <div>
                    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${activo ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-steel-faint'}`}>
                      {r.estado}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-1 justify-end">
                    {confirmingDelete ? (
                      <>
                        <button onClick={() => handleDelete(r.id)} className="text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-md transition-colors">Eliminar</button>
                        <button onClick={() => setDeleteConfirm(null)} className="w-7 h-7 flex items-center justify-center border border-steel-line rounded-md text-steel-muted hover:text-white transition-colors">✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleToggleEstado(r)} title={activo ? 'Desactivar' : 'Activar'} className="w-7 h-7 flex items-center justify-center border border-steel-line rounded-md hover:bg-white/5 transition-colors">
                          <Power size={13} className={activo ? 'text-steel-muted' : 'text-green-400'} />
                        </button>
                        <button onClick={() => { setEditTarget(r); setFormOpen(true); }} title="Editar" className="w-7 h-7 flex items-center justify-center border border-steel-line rounded-md hover:bg-white/5 transition-colors">
                          <Pencil size={13} className="text-steel-muted" />
                        </button>
                        <button onClick={() => setDeleteConfirm(r.id)} title="Eliminar" className="w-7 h-7 flex items-center justify-center border border-steel-line rounded-md hover:bg-white/5 transition-colors">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: Departamentos ── */}
      {tab === 'departamentos' && (
        <div>
          <div className="mb-4">
            <h2 className="font-display text-base font-bold text-white">Departamentos</h2>
            <p className="text-steel-muted text-xs mt-0.5">Edita descripción y color. Los miembros se asignan desde Responsables.</p>
          </div>
          <DepartmentSettings
            departamentos={departamentos}
            responsables={responsables}
            onUpdateDept={handleUpdateDept}
          />
        </div>
      )}

      {/* ── TAB: Sistema ── */}
      {tab === 'sistema' && (
        <div className="flex flex-col gap-4 max-w-[560px]">
          <div className="bg-[#1B1E23] border border-steel-line rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-3.5">
              <Info size={15} className="text-steel-muted" />
              <h2 className="font-display text-sm font-bold text-white">Información del sistema</h2>
            </div>
            <InfoRow label="Aplicación"      value="FOGA Flow v2.0" />
            <InfoRow label="Almacenamiento"  value="Firebase Firestore (en la nube, compartido)" />
            <InfoRow label="Usuario activo"  value={currentUser || '—'} />
            <InfoRow label="Empresa"         value="FOGA S.A. — Cocinas en acero inoxidable" last />
          </div>
        </div>
      )}

      {/* Modal form */}
      {formOpen && (
        <ResponsibleForm
          responsable={editTarget}
          onSave={handleSaveResponsable}
          onClose={() => { setFormOpen(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div className={`flex justify-between py-2 text-[13px] ${last ? '' : 'border-b border-steel-line/60'}`}>
      <span className="text-steel-muted font-medium">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}

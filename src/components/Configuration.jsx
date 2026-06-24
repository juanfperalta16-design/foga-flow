import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Power, Users, Building2, Info, RotateCcw } from 'lucide-react';
import {
  getResponsables, setResponsables, initSettingsStorage,
  getDepartamentosConfig, setDepartamentosConfig,
} from '../utils/settingsStorage';
import { resetStorage } from '../utils/storage';
import { mockProyectos, mockActividades, mockAlertas, mockHistorial } from '../data/mockData';
import ResponsibleForm from './ResponsibleForm';
import DepartmentSettings from './DepartmentSettings';

const DEPT_COLORS = {
  'Arquitectura':        '#7C3AED',
  'Diseño':              '#2563EB',
  'Seguimiento de obra': '#D97706',
  'Producción':          '#EA580C',
  'Instalación':         '#16A34A',
  'Administración':      '#6B7280',
};

function deptColor(d) { return DEPT_COLORS[d] || '#6B7280'; }

const TABS = [
  { id: 'responsables', label: 'Responsables', icon: Users },
  { id: 'departamentos', label: 'Departamentos', icon: Building2 },
  { id: 'sistema', label: 'Sistema', icon: Info },
];

export default function Configuration() {
  const [tab, setTab] = useState('responsables');
  const [responsables, setResp] = useState([]);
  const [departamentos, setDepts] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    initSettingsStorage();
    setResp(getResponsables() || []);
    setDepts(getDepartamentosConfig() || []);
  }, []);

  // ─── Responsables CRUD ────────────────────────

  function handleSaveResponsable(form) {
    let updated;
    if (editTarget) {
      updated = (responsables || []).map(r => r.id === editTarget.id ? { ...r, ...form } : r);
    } else {
      const newId = 'U' + String(Date.now()).slice(-6);
      updated = [...(responsables || []), { ...form, id: newId }];
    }
    setResponsables(updated);
    setResp(updated);
    setEditTarget(null);
  }

  function handleToggleEstado(r) {
    const updated = (responsables || []).map(x =>
      x.id === r.id ? { ...x, estado: x.estado === 'Activo' ? 'Inactivo' : 'Activo' } : x
    );
    setResponsables(updated);
    setResp(updated);
  }

  function handleDelete(id) {
    const updated = (responsables || []).filter(r => r.id !== id);
    setResponsables(updated);
    setResp(updated);
    setDeleteConfirm(null);
  }

  // ─── Departamentos update ─────────────────────

  function handleUpdateDept(dept) {
    const updated = (departamentos || []).map(d => d.id === dept.id ? dept : d);
    setDepartamentosConfig(updated);
    setDepts(updated);
  }

  // ─── Reset ────────────────────────────────────

  function handleReset() {
    if (!resetConfirm) { setResetConfirm(true); return; }
    resetStorage(mockProyectos, mockActividades, mockAlertas, mockHistorial);
    window.location.reload();
  }

  // ─── Render ───────────────────────────────────

  return (
    <div style={{ padding: 24, maxWidth: 860, fontFamily: 'inherit' }}>
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Configuración</h1>
        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 3 }}>Administra responsables, departamentos y opciones del sistema</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
              borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: active ? '#fff' : 'transparent',
              color: active ? '#0F172A' : '#64748B',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              transition: 'all .15s',
            }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: Responsables ── */}
      {tab === 'responsables' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Gestión de responsables</h2>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                {(responsables || []).filter(r => r.estado === 'Activo').length} activos · {(responsables || []).length} total
              </p>
            </div>
            <button onClick={() => { setEditTarget(null); setFormOpen(true); }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 9,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={15} /> Nueva persona
            </button>
          </div>

          {/* Tabla */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 140px 130px 80px 80px', gap: 0, padding: '10px 16px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
              {['', 'Nombre', 'Departamento', 'Rol', 'Estado', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</div>
              ))}
            </div>

            {(responsables || []).length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                No hay responsables registrados. Crea el primero.
              </div>
            )}

            {(responsables || []).map((r, i) => {
              const color = deptColor(r.departamento);
              const activo = r.estado === 'Activo';
              const confirmingDelete = deleteConfirm === r.id;

              return (
                <div key={r.id} style={{
                  display: 'grid', gridTemplateColumns: '44px 1fr 140px 130px 80px 80px',
                  alignItems: 'center', padding: '11px 16px',
                  borderBottom: i < responsables.length - 1 ? '1px solid #F8FAFC' : 'none',
                  opacity: activo ? 1 : 0.5,
                  background: confirmingDelete ? '#FEF2F2' : 'transparent',
                  transition: 'background .15s',
                }}>
                  {/* Avatar */}
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: activo ? color : '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                    {r.iniciales}
                  </div>

                  {/* Nombre */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0F172A' }}>{r.nombre}</div>
                    {r.correo && <div style={{ fontSize: 11, color: '#94A3B8' }}>{r.correo}</div>}
                  </div>

                  {/* Departamento */}
                  <div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: color + '20', color }}>
                      {r.departamento}
                    </span>
                  </div>

                  {/* Rol */}
                  <div style={{ fontSize: 12, color: '#475569' }}>{r.rol}</div>

                  {/* Estado */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: activo ? '#DCFCE7' : '#F1F5F9', color: activo ? '#15803D' : '#94A3B8' }}>
                      {r.estado}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    {confirmingDelete ? (
                      <>
                        <button onClick={() => handleDelete(r.id)} style={btnDanger}>Eliminar</button>
                        <button onClick={() => setDeleteConfirm(null)} style={btnGhost}>✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleToggleEstado(r)} title={activo ? 'Desactivar' : 'Activar'} style={btnGhost}>
                          <Power size={13} color={activo ? '#94A3B8' : '#16A34A'} />
                        </button>
                        <button onClick={() => { setEditTarget(r); setFormOpen(true); }} title="Editar" style={btnGhost}>
                          <Pencil size={13} color="#94A3B8" />
                        </button>
                        <button onClick={() => setDeleteConfirm(r.id)} title="Eliminar" style={btnGhost}>
                          <Trash2 size={13} color="#EF4444" />
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
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Departamentos</h2>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Edita descripción y color. Los miembros se asignan desde Responsables.</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Info size={15} color="#94A3B8" />
              <h2 style={cardTitle}>Información del sistema</h2>
            </div>
            <InfoRow label="Aplicación"      value="FOGA Flow v1.0" />
            <InfoRow label="Almacenamiento"  value="LocalStorage (prototipo)" />
            <InfoRow label="Usuario activo"  value="Juan Peralta — Administrador" />
            <InfoRow label="Empresa"         value="FOGA S.A. — Cocinas en acero inoxidable" last />
          </div>

          <div style={card}>
            <h2 style={{ ...cardTitle, marginBottom: 8 }}>📦 Migración a Firebase</h2>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              El código está preparado. Reemplaza las funciones de <code style={codeStyle}>src/utils/storage.js</code> y <code style={codeStyle}>src/utils/settingsStorage.js</code> por llamadas a Firestore. El resto de la app no requiere cambios.
            </p>
          </div>

          <div style={{ ...card, background: '#FEF2F2', borderColor: '#FECACA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <RotateCcw size={15} color="#EF4444" />
              <h2 style={{ ...cardTitle, color: '#991B1B' }}>Zona peligrosa</h2>
            </div>
            <p style={{ fontSize: 13, color: '#B91C1C', marginBottom: 14 }}>
              Reinicia todos los datos al estado inicial. Esta acción no se puede deshacer.
            </p>
            <button onClick={handleReset} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: resetConfirm ? '#DC2626' : '#FEE2E2', color: resetConfirm ? '#fff' : '#991B1B', transition: 'all .2s',
            }}>
              {resetConfirm ? '⚠️ Confirmar — clic para continuar' : 'Reiniciar datos de ejemplo'}
            </button>
            {resetConfirm && <p style={{ fontSize: 11, color: '#EF4444', marginTop: 6 }}>Haz clic de nuevo para confirmar. Se recargará la página.</p>}
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

// ─── Estilos compartidos ──────────────────────────

const btnGhost = {
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: '1px solid #F1F5F9', borderRadius: 6, cursor: 'pointer',
};
const btnDanger = {
  padding: '3px 10px', fontSize: 11, fontWeight: 700, background: '#DC2626', color: '#fff',
  border: 'none', borderRadius: 6, cursor: 'pointer',
};
const card = {
  background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '18px 20px',
};
const cardTitle = { fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 };
const codeStyle = { background: '#F1F5F9', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 };

function InfoRow({ label, value, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: last ? 'none' : '1px solid #F8FAFC', fontSize: 13 }}>
      <span style={{ color: '#64748B', fontWeight: 500 }}>{label}</span>
      <span style={{ color: '#0F172A', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// =====================================================
// FOGA FLOW — SeccionProduccion.jsx
// Componente para la pestaña Producción dentro de ProjectDetail
// Maneja módulos individuales con sus 11 fases
// Integra lógica de bodega (material faltante)
// =====================================================

import { useState } from 'react';
import { CheckCircle2, Circle, Lock, Plus, X, AlertTriangle, Package, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { getNombresResponsables } from '../utils/settingsStorage';

// ── 10 fases de producción (sin "Instalando" — eso es de Instalaciones) ──
export const FASES_PRODUCCION = [
  '1. Despacho Materia Prima',
  '2. Corte Láser',
  '3. Plegado',
  '4. Mesa de Trabajo (Maestros)',
  '5. Pintura',
  '6. Abrillantado',
  '7. Terminados',
  '8. Control de Calidad',
  '9. Empaquetado',
  '10. Bodega',
  '⏸ Pendiente',
  '✓ Terminado',
];

// ── Prioridades de material faltante ──
const PRIORIDADES_MATERIAL = ['🔴 Urgente', '🟡 Normal', '🟢 Puede Esperar'];
const ESTADOS_COMPRA = ['⚠️ Pendiente', '🔄 Orden Enviada', '✓ Recibido'];

// ── Semáforo según días a entrega ──
function semaforo(fechaEntrega) {
  if (!fechaEntrega) return { color: '#6B7280', label: 'Sin fecha' };
  const hoy  = new Date();
  const ent  = new Date(fechaEntrega);
  const dias = Math.floor((ent - hoy) / 86400000);
  if (dias < 0)  return { color: '#EF4444', label: `${Math.abs(dias)}d atrasado` };
  if (dias <= 3) return { color: '#EF4444', label: `${dias}d` };
  if (dias <= 7) return { color: '#D97706', label: `${dias}d` };
  return { color: '#16A34A', label: `${dias}d` };
}

// ── Calcular días en fase ──
function diasEnFase(fechaIngresoFase) {
  if (!fechaIngresoFase) return 0;
  return Math.floor((new Date() - new Date(fechaIngresoFase)) / 86400000);
}

// ── Progreso del módulo (fase actual → % completado) ──
function progreso(faseActual) {
  const idx = FASES_PRODUCCION.indexOf(faseActual);
  if (idx < 0) return 0;
  return Math.round((idx / 11) * 100);
}

// ── Formulario de nuevo módulo ──
function NuevoModuloForm({ onSave, onClose }) {
  const responsables = getNombresResponsables() || [];
  const [form, setForm] = useState({
    nombre:        '',
    maestro:       '',
    largo: '', profundidad: '', alto: '',
    faseActual:    '1. Despacho Materia Prima',
    fechaEntrega:  '',
    fechaIngresoFase: new Date().toISOString().slice(0, 10),
    observaciones: '',
    materialFaltante: [],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ background: '#0A0D14', border: '1px solid #374151', borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', marginBottom: 12 }}>Nuevo módulo / mueble</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Nombre del módulo *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
            placeholder="Ej: Módulo Lateral Izquierdo"
            style={inp} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Dimensiones (cm)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <input type="number" min={0} value={form.largo} onChange={e => set('largo', e.target.value)} placeholder="Largo" style={inp} />
            <input type="number" min={0} value={form.profundidad} onChange={e => set('profundidad', e.target.value)} placeholder="Profundidad" style={inp} />
            <input type="number" min={0} value={form.alto} onChange={e => set('alto', e.target.value)} placeholder="Alto" style={inp} />
          </div>
        </div>
        <div>
          <label style={lbl}>Maestro responsable</label>
          <select value={form.maestro} onChange={e => set('maestro', e.target.value)} style={inp}>
            <option value="">Seleccionar...</option>
            {responsables.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Fase inicial</label>
          <select value={form.faseActual} onChange={e => set('faseActual', e.target.value)} style={inp}>
            {FASES_PRODUCCION.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Fecha de entrega</label>
          <input type="date" value={form.fechaEntrega} onChange={e => set('fechaEntrega', e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl}>Fecha ingreso a fase</label>
          <input type="date" value={form.fechaIngresoFase} onChange={e => set('fechaIngresoFase', e.target.value)} style={inp} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Observaciones</label>
          <input value={form.observaciones} onChange={e => set('observaciones', e.target.value)}
            placeholder="Notas del módulo..." style={inp} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={btn('#374151')}>Cancelar</button>
        <button onClick={() => {
          if (!form.nombre.trim()) return alert('Ingresa el nombre del módulo');
          onSave({ ...form, id: `MOD-${Date.now()}`, creadoEn: new Date().toISOString() });
          onClose();
        }} style={btn('#7A4B8C')}>Agregar módulo</button>
      </div>
    </div>
  );
}

// ── Formulario de material faltante ──
function MaterialFaltanteForm({ onSave, onClose }) {
  const [form, setForm] = useState({ material: '', cantidad: '', unidad: 'unidades', prioridad: '🟡 Normal', estadoCompra: '⚠️ Pendiente', proveedor: '', notas: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ background: '#1C1010', border: '1px solid #EF444440', borderRadius: 8, padding: 12, marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#FCA5A5', marginBottom: 10 }}>⚠️ Registrar material faltante</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Material *</label>
          <input value={form.material} onChange={e => set('material', e.target.value)} placeholder="Ej: Plancha acero 304 2mm" style={inp} />
        </div>
        <div>
          <label style={lbl}>Cantidad</label>
          <input value={form.cantidad} onChange={e => set('cantidad', e.target.value)} placeholder="4" style={inp} />
        </div>
        <div>
          <label style={lbl}>Unidad</label>
          <select value={form.unidad} onChange={e => set('unidad', e.target.value)} style={inp}>
            {['unidades','metros','piezas','kg','litros'].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Prioridad</label>
          <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)} style={inp}>
            {PRIORIDADES_MATERIAL.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Estado de compra</label>
          <select value={form.estadoCompra} onChange={e => set('estadoCompra', e.target.value)} style={inp}>
            {ESTADOS_COMPRA.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Proveedor / Notas</label>
          <input value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Ej: DIPAC — ETA 2 días" style={inp} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={btn('#374151')}>Cancelar</button>
        <button onClick={() => {
          if (!form.material.trim()) return alert('Ingresa el material');
          onSave({ ...form, id: `MAT-${Date.now()}`, fecha: new Date().toISOString().slice(0,10) });
          onClose();
        }} style={btn('#EF4444')}>Registrar faltante</button>
      </div>
    </div>
  );
}

// ── Tarjeta de módulo ──
function ModuloCard({ modulo, onUpdate, onDelete }) {
  const [expanded, setExpanded]       = useState(false);
  const [editFase, setEditFase]       = useState(false);
  const [showMaterial, setShowMaterial] = useState(false);
  const sem  = semaforo(modulo.fechaEntrega);
  const dias = diasEnFase(modulo.fechaIngresoFase);
  const pct  = progreso(modulo.faseActual);
  const hasMaterial = (modulo.materialFaltante || []).length > 0;
  const tieneUrgente = (modulo.materialFaltante || []).some(m => m.prioridad === '🔴 Urgente' && m.estadoCompra !== '✓ Recibido');

  function cambiarFase(nuevaFase) {
    onUpdate({ ...modulo, faseActual: nuevaFase, fechaIngresoFase: new Date().toISOString().slice(0,10) });
    setEditFase(false);
  }

  function agregarMaterial(mat) {
    onUpdate({ ...modulo, materialFaltante: [...(modulo.materialFaltante || []), mat] });
    setShowMaterial(false);
  }

  function actualizarMaterial(id, campo, valor) {
    onUpdate({ ...modulo, materialFaltante: (modulo.materialFaltante || []).map(m => m.id === id ? { ...m, [campo]: valor } : m) });
  }

  function eliminarMaterial(id) {
    onUpdate({ ...modulo, materialFaltante: (modulo.materialFaltante || []).filter(m => m.id !== id) });
  }

  return (
    <div style={{ background: '#141824', border: `1.5px solid ${tieneUrgente ? '#EF444450' : '#1E2433'}`, borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Semáforo */}
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: sem.color, flexShrink: 0 }} />

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {modulo.nombre}
            {tieneUrgente && <span style={{ fontSize: 9, background: '#450A0A', color: '#FCA5A5', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>MATERIAL URGENTE</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, background: '#2E1A08', color: '#E3A868', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>{modulo.faseActual}</span>
            {modulo.maestro && <span style={{ fontSize: 10, color: '#6B7280' }}>👤 {modulo.maestro}</span>}
            <span style={{ fontSize: 10, color: sem.color }}>⏱ {sem.label}</span>
            <span style={{ fontSize: 10, color: '#6B7280' }}>{dias}d en fase</span>
          </div>
          {/* Barra de progreso */}
          <div style={{ height: 3, background: '#1E2433', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#16A34A' : '#7A4B8C', borderRadius: 2, transition: 'width .3s' }} />
          </div>
        </div>

        {/* Acciones rápidas */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button onClick={() => onDelete(modulo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Expandido */}
      {expanded && (
        <div className="anim-fade-in" style={{ padding: '0 14px 14px', borderTop: '1px solid #1E2433' }}>
          {/* Cambiar fase */}
          <div style={{ marginTop: 12 }}>
            <label style={lbl}>Fase actual</label>
            {editFase
              ? <div style={{ display: 'flex', gap: 6 }}>
                  <select onChange={e => cambiarFase(e.target.value)} defaultValue={modulo.faseActual} style={{ ...inp, flex: 1 }}>
                    {FASES_PRODUCCION.map(f => <option key={f}>{f}</option>)}
                  </select>
                  <button onClick={() => setEditFase(false)} style={btn('#374151')}>Cancelar</button>
                </div>
              : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#E2E8F0' }}>{modulo.faseActual}</span>
                  <button onClick={() => setEditFase(true)} style={btn('#B5651D')}>Cambiar fase</button>
                </div>
            }
          </div>

          {/* Avance de fases visual */}
          <div style={{ marginTop: 10, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {FASES_PRODUCCION.slice(0, 10).map((fase, i) => {
              const idxActual = FASES_PRODUCCION.indexOf(modulo.faseActual);
              const pasada  = i < idxActual;
              const actual  = i === idxActual;
              return (
                <div key={fase} title={fase} style={{
                  width: 22, height: 22, borderRadius: 4, fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: pasada ? '#052E16' : actual ? '#7A4B8C' : '#1E2433',
                  color: pasada ? '#86EFAC' : actual ? '#fff' : '#374151',
                  border: actual ? '1.5px solid #7A4B8C' : '1px solid transparent',
                  cursor: 'default',
                }}>{i + 1}</div>
              );
            })}
          </div>

          {/* Responsable y fecha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <div>
              <label style={lbl}>Maestro</label>
              <select value={modulo.maestro || ''} onChange={e => onUpdate({ ...modulo, maestro: e.target.value })} style={inp}>
                <option value="">Sin asignar</option>
                {(getNombresResponsables() || []).map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Fecha de entrega</label>
              <input type="date" value={modulo.fechaEntrega || ''} onChange={e => onUpdate({ ...modulo, fechaEntrega: e.target.value })} style={inp} />
            </div>
          </div>

          {/* Observaciones */}
          <div style={{ marginTop: 8 }}>
            <label style={lbl}>Observaciones</label>
            <input value={modulo.observaciones || ''} onChange={e => onUpdate({ ...modulo, observaciones: e.target.value })} style={inp} />
          </div>

          {/* Material faltante */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ ...lbl, marginBottom: 0 }}>🏭 Material faltante / Bodega</label>
              <button onClick={() => setShowMaterial(v => !v)} style={btn('#EF444460')}>
                + Registrar faltante
              </button>
            </div>

            {showMaterial && <MaterialFaltanteForm onSave={agregarMaterial} onClose={() => setShowMaterial(false)} />}

            {(modulo.materialFaltante || []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {modulo.materialFaltante.map(mat => (
                  <div key={mat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0A0D14', border: `1px solid ${mat.estadoCompra === '✓ Recibido' ? '#16A34A40' : mat.prioridad === '🔴 Urgente' ? '#EF444440' : '#1E2433'}`, borderRadius: 7, padding: '6px 10px' }}>
                    <span style={{ fontSize: 11 }}>{mat.prioridad.split(' ')[0]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#E2E8F0', fontWeight: 600 }}>{mat.material}</div>
                      <div style={{ fontSize: 10, color: '#6B7280' }}>{mat.cantidad} {mat.unidad} {mat.notas ? `· ${mat.notas}` : ''}</div>
                    </div>
                    <select value={mat.estadoCompra} onChange={e => actualizarMaterial(mat.id, 'estadoCompra', e.target.value)}
                      style={{ background: '#141824', border: '1px solid #374151', borderRadius: 5, color: '#E2E8F0', fontSize: 10, padding: '2px 4px' }}>
                      {ESTADOS_COMPRA.map(e => <option key={e}>{e}</option>)}
                    </select>
                    <button onClick={() => eliminarMaterial(mat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal SeccionProduccion ──
export default function SeccionProduccion({ proyecto, onUpdate }) {
  const prod   = proyecto.production || {};
  const locked = !proyecto.design3d?.releasedToProduction;
  const [showNuevo, setShowNuevo] = useState(false);
  const modulos = prod.modulos || [];

  function agregarModulo(modulo) {
    onUpdate({ ...proyecto, production: { ...prod, modulos: [...modulos, modulo], status: 'En producción', partialProduction: true } });
  }

  function actualizarModulo(moduloActualizado) {
    const nuevos   = modulos.map(m => m.id === moduloActualizado.id ? moduloActualizado : m);
    const todoTerminado = nuevos.length > 0 && nuevos.every(m => m.faseActual === '✓ Terminado');
    onUpdate({
      ...proyecto,
      production: {
        ...prod,
        modulos: nuevos,
        status: todoTerminado ? 'Producción terminada' : 'En producción',
        productionFinished: todoTerminado,
      },
    });
  }

  function eliminarModulo(id) {
    const nuevos = modulos.filter(m => m.id !== id);
    onUpdate({ ...proyecto, production: { ...prod, modulos: nuevos } });
  }

  // Resumen de fases
  const resumenFases = FASES_PRODUCCION.reduce((acc, fase) => {
    acc[fase] = modulos.filter(m => m.faseActual === fase).length;
    return acc;
  }, {});

  const urgentes  = modulos.filter(m => (m.materialFaltante || []).some(mat => mat.prioridad === '🔴 Urgente' && mat.estadoCompra !== '✓ Recibido'));
  const atrasados = modulos.filter(m => m.fechaEntrega && new Date(m.fechaEntrega) < new Date());

  if (locked) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <Lock size={36} color="#374151" style={{ margin: '0 auto 12px' }} />
      <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>Producción está bloqueada</p>
      <p style={{ fontSize: 12, color: '#4B5563', marginTop: 6 }}>
        Se habilitará cuando Diseño 3D termine el modelado y despiece, y marque "Liberar a Producción".
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Alertas rápidas */}
      {(urgentes.length > 0 || atrasados.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {urgentes.length > 0 && (
            <div style={{ background: '#450A0A', border: '1px solid #EF444440', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={13} /> {urgentes.length} módulo(s) con material urgente faltante: {urgentes.map(m => m.nombre).join(', ')}
            </div>
          )}
          {atrasados.length > 0 && (
            <div style={{ background: '#3B0000', border: '1px solid #DC262640', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} /> {atrasados.length} módulo(s) atrasado(s): {atrasados.map(m => m.nombre).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Tablero de fases */}
      {modulos.length > 0 && (
        <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Tablero de fases</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FASES_PRODUCCION.filter(f => resumenFases[f] > 0).map(fase => (
              <div key={fase} style={{ background: '#141824', border: '1px solid #1E2433', borderRadius: 7, padding: '5px 10px', fontSize: 10 }}>
                <div style={{ color: '#9CA3AF' }}>{fase}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0', marginTop: 2 }}>{resumenFases[fase]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header módulos */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>Módulos / Muebles</span>
          <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 8 }}>{modulos.length} registrados</span>
        </div>
        <button onClick={() => setShowNuevo(v => !v)} style={btn('#7A4B8C')}>
          <Plus size={13} /> Agregar módulo
        </button>
      </div>

      {showNuevo && <NuevoModuloForm onSave={agregarModulo} onClose={() => setShowNuevo(false)} />}

      {modulos.length === 0 && !showNuevo && (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#4B5563', fontSize: 12 }}>
          No hay módulos registrados. Agrega el primero con el botón de arriba.
        </div>
      )}

      {modulos.map(m => (
        <ModuloCard key={m.id} modulo={m} onUpdate={actualizarModulo} onDelete={eliminarModulo} />
      ))}

      {/* Resumen carga por maestro */}
      {modulos.length > 0 && (
        <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Carga por maestro</div>
          {Object.entries(
            modulos.reduce((acc, m) => {
              const maestro = m.maestro || 'Sin asignar';
              if (!acc[maestro]) acc[maestro] = { total: 0, atrasados: 0 };
              acc[maestro].total++;
              if (m.fechaEntrega && new Date(m.fechaEntrega) < new Date()) acc[maestro].atrasados++;
              return acc;
            }, {})
          ).map(([maestro, data]) => (
            <div key={maestro} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1E2433' }}>
              <span style={{ fontSize: 12, color: '#CBD5E1' }}>{maestro}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{data.total} módulos</span>
                {data.atrasados > 0 && <span style={{ fontSize: 10, background: '#450A0A', color: '#FCA5A5', padding: '1px 6px', borderRadius: 4 }}>{data.atrasados} atrasado(s)</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Estilos ──
const lbl = { fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 };
const inp = { background: '#101215', border: '1px solid #374151', borderRadius: 7, color: '#E2E8F0', fontSize: 12, padding: '6px 10px', outline: 'none', width: '100%' };
const btn = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 });

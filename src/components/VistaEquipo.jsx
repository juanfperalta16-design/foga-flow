// =====================================================
// FOGA FLOW — VistaEquipo.jsx
// Muestra la carga de trabajo por persona
// =====================================================
import { useState } from 'react';
import { useApp } from '../App';
import { CheckCircle2, Clock, Lock, AlertTriangle } from 'lucide-react';

const FASES_PRODUCCION = [
  '1. Despacho Materia Prima','2. Corte Láser','3. Plegado',
  '4. Mesa de Trabajo (Maestros)','5. Pintura','6. Abrillantado',
  '7. Terminados','8. Control de Calidad','9. Empaquetado',
  '10. Bodega','⏸ Pendiente','✓ Terminado',
];

function semaforo(fecha) {
  if (!fecha) return { color: '#6B7280', label: 'Sin fecha' };
  const d = Math.floor((new Date(fecha) - new Date()) / 86400000);
  if (d < 0)  return { color: '#EF4444', label: `${Math.abs(d)}d atrasado` };
  if (d <= 5) return { color: '#F97316', label: `${d}d` };
  if (d <= 15) return { color: '#D97706', label: `${d}d` };
  return { color: '#16A34A', label: `${d}d` };
}

const DEPTOS_FILTRO = [
  { key: 'todos',         label: 'Todos los departamentos' },
  { key: 'arquitectura',  label: 'Arquitectura' },
  { key: 'diseno3d',      label: 'Diseño 3D' },
  { key: 'instalaciones', label: 'Instalaciones' },
  { key: 'produccion',    label: 'Producción' },
];

export default function VistaEquipo() {
  const { proyectos, goToProject } = useApp();
  const [filtroPersona, setFiltroPersona] = useState('todos');
  const [filtroDepto, setFiltroDepto] = useState('todos');

  const safeProys = (proyectos || []).filter(p => p.estadoGeneral !== 'Finalizado');

  // ── Recopilar todas las personas y su trabajo ──
  const personas = {};

  function agregarTrabajo(nombre, tipo, proyecto, extra = {}) {
    if (!nombre) return;
    if (!personas[nombre]) personas[nombre] = { nombre, arquitectura: [], diseno3d: [], instalaciones: [], produccion: [] };
    personas[nombre][tipo].push({ proyecto, ...extra });
  }

  safeProys.forEach(p => {
    const modulos = p.production?.modulos || [];

    // Arquitectura
    if (p.architecture?.responsible) {
      agregarTrabajo(p.architecture.responsible, 'arquitectura', p, {
        estado: p.architecture?.status || '—',
        modulosLiberados: modulos.filter(m => m.arquitectura?.liberadoA3D).length,
        totalModulos: modulos.length,
      });
    }

    // Diseño 3D — puede ser múltiple
    const d3 = p.design3d || {};
    const designers = d3.responsables || (d3.responsible ? [d3.responsible] : []);
    designers.forEach(nombre => {
      agregarTrabajo(nombre, 'diseno3d', p, {
        estado: d3.status || d3.estado || '—',
        liberado: !!d3.releasedToProduction,
      });
    });

    // Instalaciones
    if (p.installations?.responsible) {
      agregarTrabajo(p.installations.responsible, 'instalaciones', p, {
        estado: p.installations?.status || '—',
        obraLista: !!p.installations?.siteReady,
      });
    }

    // Producción — por módulo
    modulos.forEach(mod => {
      if (mod.maestro) {
        agregarTrabajo(mod.maestro, 'produccion', p, {
          modulo: mod.nombre || mod.pec,
          pec: mod.pec,
          fase: mod.produccion?.faseActual || '—',
          fechaEntrega: mod.fechaEntrega,
        });
      }
    });
  });

  const listaPersonas = Object.values(personas).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const personasFiltradas = listaPersonas
    .filter(p => filtroPersona === 'todos' || p.nombre === filtroPersona)
    .filter(p => filtroDepto === 'todos' || p[filtroDepto].length > 0);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: 0, fontFamily: 'var(--font-display)' }}>Carga de trabajo por persona</h1>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>
            {personasFiltradas.length} de {listaPersonas.length} personas · {safeProys.length} proyectos en curso
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select value={filtroDepto} onChange={e => setFiltroDepto(e.target.value)}
            style={{ fontSize: 13, fontWeight: 600, padding: '9px 16px', background: filtroDepto !== 'todos' ? '#2563EB' : '#141824', color: filtroDepto !== 'todos' ? '#fff' : '#9CA3AF', border: '1.5px solid #2563EB40', borderRadius: 9, cursor: 'pointer' }}>
            {DEPTOS_FILTRO.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
          <select value={filtroPersona} onChange={e => setFiltroPersona(e.target.value)}
            style={{ fontSize: 13, fontWeight: 600, padding: '9px 16px', background: filtroPersona !== 'todos' ? '#2563EB' : '#141824', color: filtroPersona !== 'todos' ? '#fff' : '#9CA3AF', border: '1.5px solid #2563EB40', borderRadius: 9, cursor: 'pointer' }}>
            <option value="todos">Todas las personas</option>
            {listaPersonas.map(p => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
          </select>
          {(filtroPersona !== 'todos' || filtroDepto !== 'todos') && (
            <button onClick={() => { setFiltroPersona('todos'); setFiltroDepto('todos'); }}
              style={{ fontSize: 13, fontWeight: 600, padding: '9px 16px', background: 'none', color: '#6B7280', border: '1.5px solid #374151', borderRadius: 9, cursor: 'pointer' }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {listaPersonas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#4B5563' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 14, color: '#6B7280' }}>No hay personas asignadas. Ve a cada proyecto → pestaña Equipo para asignar responsables.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {personasFiltradas.map(persona => {
          const totalProys = new Set([
            ...persona.arquitectura.map(t => t.proyecto.id),
            ...persona.diseno3d.map(t => t.proyecto.id),
            ...persona.instalaciones.map(t => t.proyecto.id),
            ...persona.produccion.map(t => t.proyecto.id),
          ]).size;

          const atrasados = persona.produccion.filter(t => t.fechaEntrega && new Date(t.fechaEntrega) < new Date()).length;

          return (
            <div key={persona.nombre} style={{ background: '#141824', border: '1px solid #1E2433', borderRadius: 14, overflow: 'hidden' }}>
              {/* Header persona */}
              <div style={{ padding: '14px 18px', background: '#0A0D14', borderBottom: '1px solid #1E2433', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {persona.nombre.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>{persona.nombre}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                    {totalProys} proyecto{totalProys !== 1 ? 's' : ''} activo{totalProys !== 1 ? 's' : ''}
                    {atrasados > 0 && <span style={{ color: '#EF4444', marginLeft: 8 }}>· {atrasados} módulo{atrasados !== 1 ? 's' : ''} atrasado{atrasados !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
                {/* Badges de departamentos */}
                <div style={{ display: 'flex', gap: 5 }}>
                  {persona.arquitectura.length  > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: '#2D1B69', color: '#C4B5FD', padding: '2px 7px', borderRadius: 99 }}>✏️ Arq ({persona.arquitectura.length})</span>}
                  {persona.diseno3d.length       > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: '#1E3A5F', color: '#93C5FD', padding: '2px 7px', borderRadius: 99 }}>🖥️ D3D ({persona.diseno3d.length})</span>}
                  {persona.instalaciones.length  > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: '#0F2D1A', color: '#86EFAC', padding: '2px 7px', borderRadius: 99 }}>🔧 Inst ({persona.instalaciones.length})</span>}
                  {persona.produccion.length     > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: '#3D1F00', color: '#FDBA74', padding: '2px 7px', borderRadius: 99 }}>🏭 Prod ({persona.produccion.length})</span>}
                </div>
              </div>

              <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: (filtroDepto === 'todos' || filtroDepto === 'produccion') && persona.produccion.length > 0 ? '1fr 1fr' : '1fr', gap: 12 }}>
                {/* Izquierda: Arquitectura + D3D + Instalaciones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(filtroDepto === 'todos' || filtroDepto === 'arquitectura') && persona.arquitectura.map((t, i) => (
                    <div key={i} onClick={() => goToProject(t.proyecto.id)}
                      style={{ background: '#2D1B6915', border: '1px solid #7C3AED25', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#7C3AED' }}>✏️</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{t.proyecto.nombre}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>{t.proyecto.cliente} · {t.proyecto.numeroContrato || '—'}</div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                        <span style={{ fontSize: 9, background: '#2D1B69', color: '#C4B5FD', padding: '1px 6px', borderRadius: 4 }}>{t.estado}</span>
                        {t.totalModulos > 0 && <span style={{ fontSize: 9, color: '#6B7280' }}>{t.modulosLiberados}/{t.totalModulos} en D3D</span>}
                      </div>
                    </div>
                  ))}
                  {(filtroDepto === 'todos' || filtroDepto === 'diseno3d') && persona.diseno3d.map((t, i) => (
                    <div key={i} onClick={() => goToProject(t.proyecto.id)}
                      style={{ background: '#1E3A5F15', border: '1px solid #2563EB25', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#2563EB' }}>🖥️</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{t.proyecto.nombre}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>{t.proyecto.cliente}</div>
                      <div style={{ marginTop: 5 }}>
                        <span style={{ fontSize: 9, background: '#1E3A5F', color: '#93C5FD', padding: '1px 6px', borderRadius: 4 }}>{t.estado}</span>
                      </div>
                    </div>
                  ))}
                  {(filtroDepto === 'todos' || filtroDepto === 'instalaciones') && persona.instalaciones.map((t, i) => (
                    <div key={i} onClick={() => goToProject(t.proyecto.id)}
                      style={{ background: '#0F2D1A15', border: '1px solid #16A34A25', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#16A34A' }}>🔧</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{t.proyecto.nombre}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>{t.proyecto.cliente}</div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                        <span style={{ fontSize: 9, background: '#0F2D1A', color: '#86EFAC', padding: '1px 6px', borderRadius: 4 }}>{t.estado}</span>
                        {t.obraLista && <span style={{ fontSize: 9, color: '#86EFAC' }}>✓ Obra lista</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Derecha: Producción — agrupado por proyecto, no por módulo suelto */}
                {(filtroDepto === 'todos' || filtroDepto === 'produccion') && persona.produccion.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
                      🏭 Producción
                    </div>
                    {(() => {
                      const porProyecto = {};
                      persona.produccion.forEach(t => {
                        const pid = t.proyecto.id;
                        if (!porProyecto[pid]) porProyecto[pid] = { proyecto: t.proyecto, items: [] };
                        porProyecto[pid].items.push(t);
                      });
                      return Object.values(porProyecto).map(({ proyecto: proy, items }) => (
                        <div key={proy.id} onClick={() => goToProject(proy.id)}
                          style={{ background: '#3D1F0015', border: '1px solid #EA580C25', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#E2E8F0' }}>Proyecto: {proy.nombre}</div>
                            <span style={{ fontSize: 9, color: '#6B7280', flexShrink: 0 }}>{items.length} módulo{items.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                            {items.map((t, i) => {
                              const sem = semaforo(t.fechaEntrega);
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                  <span style={{ fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {t.modulo} <span style={{ color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 9 }}>({t.pec})</span>
                                  </span>
                                  <span style={{ fontSize: 9, background: '#3D1F00', color: '#FDBA74', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{t.fase}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

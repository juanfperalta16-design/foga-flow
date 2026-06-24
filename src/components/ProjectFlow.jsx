import React, { useState } from 'react';
import { useApp } from '../App';
import {
  CheckCircle2, Circle, Lock, Unlock, Link,
  ArrowRight, AlertCircle, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  reglasDeBloqueo, liberarAInstalaciones,
  liberarADiseno3D, liberarAProduccion, registrarContrato,
  calcularEstadoGeneral,
} from '../utils/processRules';

// ─── Pill de estado ───────────────────────────────

function StatusPill({ label, color, bg }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: bg, color, display: 'inline-block' }}>
      {label}
    </span>
  );
}

// ─── Card de departamento ─────────────────────────

function DeptCard({ icon, label, color, bg, status, locked, children }) {
  const borderColor = locked ? '#374151' : color;
  return (
    <div style={{ background: '#0F1117', border: `1.5px solid ${borderColor}`, borderRadius: 12, overflow: 'hidden', opacity: locked ? 0.55 : 1, transition: 'opacity .2s' }}>
      <div style={{ background: locked ? '#0A0D14' : bg + '60', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${borderColor}30` }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: locked ? '#6B7280' : color, flex: 1 }}>{label}</span>
        {locked
          ? <Lock size={12} color="#EF4444" />
          : <Unlock size={12} color={color} />
        }
      </div>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>Estado</div>
        <StatusPill label={status} color={locked ? '#6B7280' : color} bg={locked ? '#1F2937' : bg + '80'} />
        <div style={{ marginTop: 10 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Línea de item de info ────────────────────────

function InfoRow({ label, value, link }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1E2433', fontSize: 11 }}>
      <span style={{ color: '#6B7280' }}>{label}</span>
      {link
        ? <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 3 }}>Ver <ExternalLink size={10} /></a>
        : <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{value}</span>
      }
    </div>
  );
}

// ─── Componente principal ─────────────────────────

export default function ProjectFlow({ proyecto, onUpdateProyecto }) {
  const { currentUser } = useApp();
  const [contratoInput, setContratoInput] = useState('');
  const [showContratoForm, setShowContratoForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null); // { accion, label }
  const [error, setError] = useState('');
  const [expandArch, setExpandArch] = useState(true);

  const p      = proyecto || {};
  const tieneContrato = !!(p.contratoLink || p.contratoFirmado);
  const bloqueos = reglasDeBloqueo(p);

  // ─── Acciones ───────────────────────────────────

  function aplicarCambio(resultado, mensajeError) {
    if (!resultado.ok) { setError(resultado.error || mensajeError); return; }
    setError('');
    const updated = { ...p, ...resultado.cambios };
    updated.estadoGeneral = calcularEstadoGeneral(updated);
    if (resultado.historial) {
      updated.history = [resultado.historial, ...(p.history || [])];
    }
    onUpdateProyecto && onUpdateProyecto(updated);
    setConfirmacion(null);
  }

  function handleCargarContrato() {
    aplicarCambio(registrarContrato(p, contratoInput, currentUser));
    setContratoInput('');
    setShowContratoForm(false);
  }

  function handleLiberar(accion) {
    if (confirmacion?.accion === accion) {
      if (accion === 'instalaciones') aplicarCambio(liberarAInstalaciones(p, currentUser));
      if (accion === 'diseno3d')      aplicarCambio(liberarADiseno3D(p, currentUser));
      if (accion === 'produccion')    aplicarCambio(liberarAProduccion(p, currentUser));
    } else {
      setConfirmacion({ accion, label: accion === 'instalaciones' ? 'Liberar a Instalaciones' : accion === 'diseno3d' ? 'Liberar a Diseño 3D' : 'Liberar a Producción' });
    }
  }

  // ─── Render ─────────────────────────────────────

  const arch = p.architecture  || {};
  const inst = p.installations || {};
  const d3   = p.design3d      || {};
  const prod = p.production    || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Sección 1: Estado del contrato ── */}
      <div style={{ background: '#141824', border: `1.5px solid ${tieneContrato ? '#16A34A40' : '#D9770640'}`, borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: tieneContrato ? '#052E16' : '#3D2B00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Link size={16} color={tieneContrato ? '#86EFAC' : '#FCD34D'} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: tieneContrato ? '#86EFAC' : '#FCD34D' }}>
                {tieneContrato ? '✓ Contrato cargado' : 'Sin contrato'}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {tieneContrato
                  ? `Proyecto confirmado · ${p.contratoUploadedAt?.slice(0, 10) || ''}`
                  : 'El proyecto está en propuesta. Carga el link para confirmar.'}
              </div>
            </div>
          </div>
          {tieneContrato
            ? <a href={p.contratoLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>Ver contrato <ExternalLink size={10} /></a>
            : <button onClick={() => setShowContratoForm(f => !f)} style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', background: '#D97706', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                Cargar contrato
              </button>
          }
        </div>
        {showContratoForm && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input
              value={contratoInput}
              onChange={e => setContratoInput(e.target.value)}
              placeholder="https://drive.google.com/... o link del contrato firmado"
              style={{ flex: 1, background: '#0F1117', border: '1px solid #374151', borderRadius: 8, padding: '7px 12px', color: '#E2E8F0', fontSize: 12, outline: 'none' }}
            />
            <button onClick={handleCargarContrato} style={{ padding: '7px 16px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Confirmar
            </button>
            <button onClick={() => setShowContratoForm(false)} style={{ padding: '7px 12px', background: '#1F2937', color: '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* ── Sección 2: Arquitectura (siempre activa) ── */}
      <div style={{ background: '#141824', border: '1.5px solid #7C3AED40', borderRadius: 12, overflow: 'hidden' }}>
        <button onClick={() => setExpandArch(v => !v)} style={{ width: '100%', background: '#2D1B6960', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer', borderBottom: expandArch ? '1px solid #7C3AED30' : 'none' }}>
          <span style={{ fontSize: 16 }}>✏️</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#C4B5FD', flex: 1, textAlign: 'left' }}>Arquitectura / Diseño Conceptual</span>
          <StatusPill label={arch.status || 'En propuesta'} color="#C4B5FD" bg="#2D1B69" />
          {expandArch ? <ChevronUp size={14} color="#6B7280" /> : <ChevronDown size={14} color="#6B7280" />}
        </button>

        {expandArch && (
          <div style={{ padding: '14px 16px' }}>
            {/* Info de links */}
            <div style={{ marginBottom: 12 }}>
              <InfoRow label="Responsable" value={arch.responsible} />
              <InfoRow label="Propuesta" value={arch.proposalLink} link />
              <InfoRow label="SketchUp" value={arch.sketchupLink} link />
              <InfoRow label="Plano conceptual" value={arch.conceptualPlanLink} link />
              <InfoRow label="Plano instalaciones" value={arch.installationPlanLink} link />
              {arch.observations && (
                <div style={{ marginTop: 8, padding: '6px 10px', background: '#1E3A5F30', borderRadius: 6, fontSize: 11, color: '#93C5FD' }}>
                  {arch.observations}
                </div>
              )}
            </div>

            {/* ── Panel de liberaciones ── */}
            <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 12 }}>
                Liberaciones del proyecto
              </div>

              {/* Contrato */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1E2433' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: tieneContrato ? '#16A34A' : '#D97706', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#CBD5E1', flex: 1 }}>Contrato</span>
                <StatusPill label={tieneContrato ? 'Cargado' : 'Pendiente'} color={tieneContrato ? '#86EFAC' : '#FCD34D'} bg={tieneContrato ? '#052E16' : '#451A03'} />
              </div>

              {/* Liberar a Instalaciones */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #1E2433' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.releasedToInstallations ? '#16A34A' : '#374151', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#CBD5E1' }}>Instalaciones</div>
                  {p.releasedToInstallations && <div style={{ fontSize: 10, color: '#6B7280' }}>Liberado el {p.releasedToInstallationsAt?.slice(0,10)}</div>}
                </div>
                {p.releasedToInstallations
                  ? <StatusPill label="Liberado ✓" color="#86EFAC" bg="#052E16" />
                  : <button
                      onClick={() => handleLiberar('instalaciones')}
                      disabled={!tieneContrato}
                      style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', background: confirmacion?.accion === 'instalaciones' ? '#DC2626' : tieneContrato ? '#16A34A' : '#1F2937', color: confirmacion?.accion === 'instalaciones' ? '#fff' : tieneContrato ? '#fff' : '#4B5563', border: 'none', borderRadius: 7, cursor: tieneContrato ? 'pointer' : 'not-allowed', transition: 'all .15s' }}>
                      {confirmacion?.accion === 'instalaciones' ? '¿Confirmar?' : 'Liberar a Instalaciones'}
                    </button>
                }
              </div>

              {/* Liberar a Diseño 3D */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #1E2433' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.releasedToDesign3D ? '#2563EB' : '#374151', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#CBD5E1' }}>Diseño 3D</div>
                  {p.releasedToDesign3D && <div style={{ fontSize: 10, color: '#6B7280' }}>Liberado el {p.releasedToDesign3DAt?.slice(0,10)}</div>}
                </div>
                {p.releasedToDesign3D
                  ? <StatusPill label="Liberado ✓" color="#93C5FD" bg="#1E3A5F" />
                  : <button
                      onClick={() => handleLiberar('diseno3d')}
                      disabled={!tieneContrato}
                      style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', background: confirmacion?.accion === 'diseno3d' ? '#DC2626' : tieneContrato ? '#2563EB' : '#1F2937', color: confirmacion?.accion === 'diseno3d' ? '#fff' : tieneContrato ? '#fff' : '#4B5563', border: 'none', borderRadius: 7, cursor: tieneContrato ? 'pointer' : 'not-allowed', transition: 'all .15s' }}>
                      {confirmacion?.accion === 'diseno3d' ? '¿Confirmar?' : 'Liberar a Diseño 3D'}
                    </button>
                }
              </div>

              {/* Producción — controlled by Diseño 3D */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d3.releasedToProduction ? '#EA580C' : '#374151', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#CBD5E1' }}>Producción</div>
                  <div style={{ fontSize: 10, color: '#6B7280' }}>Se libera cuando Diseño 3D complete el despiece</div>
                </div>
                <StatusPill
                  label={d3.releasedToProduction ? 'Liberado ✓' : 'Bloqueado'}
                  color={d3.releasedToProduction ? '#FDBA74' : '#6B7280'}
                  bg={d3.releasedToProduction ? '#3D1F00' : '#1F2937'}
                />
              </div>

              {error && <div style={{ marginTop: 8, fontSize: 11, color: '#F87171', background: '#450A0A', padding: '6px 10px', borderRadius: 6 }}>{error}</div>}
              {confirmacion && <div style={{ marginTop: 8, fontSize: 11, color: '#FCD34D', background: '#451A03', padding: '6px 10px', borderRadius: 6 }}>Haz clic de nuevo en el botón para confirmar la liberación.</div>}
            </div>
          </div>
        )}
      </div>

      {/* ── Sección 3: las 3 etapas siguientes en grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

        {/* Instalaciones */}
        <DeptCard icon="🔧" label="Instalaciones" color="#16A34A" bg="#0F2D1A"
          status={inst.status || 'Bloqueado'}
          locked={!p.releasedToInstallations}
        >
          <InfoRow label="Responsable" value={inst.responsible} />
          <InfoRow label="1ª Visita" value={inst.firstVisitDate} />
          <InfoRow label="Informe técnico" value={inst.initialTechnicalReportLink} link />
          <InfoRow label="2ª Visita" value={inst.secondVisitDate} />
          {inst.siteReady && <div style={{ marginTop: 6, fontSize: 11, color: '#86EFAC', fontWeight: 600 }}>✓ Obra lista</div>}
          {!p.releasedToInstallations && (
            <div style={{ marginTop: 8, fontSize: 10, color: '#4B5563' }}>
              {tieneContrato ? 'Esperando liberación de Arquitectura' : 'Esperando contrato'}
            </div>
          )}
        </DeptCard>

        {/* Diseño 3D */}
        <DeptCard icon="🖥️" label="Diseño 3D" color="#2563EB" bg="#1E3A5F"
          status={d3.status || 'Bloqueado'}
          locked={!p.releasedToDesign3D}
        >
          <InfoRow label="Responsable" value={d3.responsible} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
            {[
              { key: 'solidworksStarted',        label: 'SolidWorks iniciado' },
              { key: 'solidworksFinished',       label: 'SolidWorks terminado' },
              { key: 'autocadBreakdownStarted',  label: 'Despiece iniciado' },
              { key: 'autocadBreakdownFinished', label: 'Despiece terminado' },
              { key: 'design3DCompleted',        label: 'Diseño 3D completo' },
              { key: 'breakdownCompleted',       label: 'Despiece completo' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: d3[item.key] ? '#93C5FD' : '#374151' }}>
                {d3[item.key]
                  ? <CheckCircle2 size={10} color="#2563EB" />
                  : <Circle size={10} color="#374151" />}
                {item.label}
              </div>
            ))}
          </div>
          {/* Botón liberar a producción — lo controla Diseño 3D */}
          {p.releasedToDesign3D && d3.design3DCompleted && d3.breakdownCompleted && !d3.releasedToProduction && (
            <button onClick={() => handleLiberar('produccion')} style={{ marginTop: 10, width: '100%', fontSize: 11, fontWeight: 600, padding: '6px 0', background: confirmacion?.accion === 'produccion' ? '#DC2626' : '#EA580C', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>
              {confirmacion?.accion === 'produccion' ? '¿Confirmar liberación?' : '🏭 Liberar a Producción'}
            </button>
          )}
          {d3.releasedToProduction && <div style={{ marginTop: 8, fontSize: 11, color: '#FDBA74', fontWeight: 600 }}>✓ Producción liberada</div>}
        </DeptCard>

        {/* Producción */}
        <DeptCard icon="🏭" label="Producción" color="#EA580C" bg="#3D1F00"
          status={prod.status || 'Bloqueado'}
          locked={!d3.releasedToProduction}
        >
          <InfoRow label="Responsable" value={prod.responsible} />
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: prod.partialProduction ? '#FDBA74' : '#374151' }}>
              {prod.partialProduction ? <CheckCircle2 size={10} color="#EA580C" /> : <Circle size={10} color="#374151" />} Producción parcial
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: prod.productionFinished ? '#86EFAC' : '#374151' }}>
              {prod.productionFinished ? <CheckCircle2 size={10} color="#16A34A" /> : <Circle size={10} color="#374151" />} Producción terminada
            </div>
          </div>
          {!d3.releasedToProduction && (
            <div style={{ marginTop: 8, fontSize: 10, color: '#4B5563' }}>
              Esperando que Diseño 3D complete el despiece
            </div>
          )}
        </DeptCard>
      </div>

      {/* ── Sección 4: Bloqueos activos ── */}
      {bloqueos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {bloqueos.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#1C1917', border: '1px solid #EF444430', borderRadius: 8, padding: '8px 12px' }}>
              <AlertCircle size={13} color="#FCA5A5" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#F87171', marginBottom: 2 }}>
                  {b.departamento} — {b.gate}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{b.motivo}</div>
                <div style={{ fontSize: 11, color: '#60A5FA', fontWeight: 500, marginTop: 2 }}>→ {b.accion}</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: b.prioridad === 'Urgente' ? '#F87171' : '#FCD34D', background: b.prioridad === 'Urgente' ? '#7F1D1D' : '#451A03', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                {b.prioridad}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

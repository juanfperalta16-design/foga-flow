import { useState } from 'react';
import { useApp } from '../App';
import { ExternalLink, Lock, Unlock, CheckCircle2, Circle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { getResponsablesAgrupados } from '../utils/settingsStorage';
import { LineaBadge } from './Badge';

const CHECKLIST_ARQ = [
  { id: 'propuestaInicial',   label: 'Propuesta de diseño inicial',      desc: 'Primera propuesta presentada al equipo' },
  { id: 'borradorConceptual', label: 'Borrador del plano conceptual',    desc: 'Borrador listo para revisión' },
  { id: 'enviadoAVentas',     label: 'Enviado a Ventas para aprobación', desc: 'Email enviado al vendedor', esEmail: true },
  { id: 'ajustesRealizados',  label: 'Ajustes realizados',               desc: 'Cambios solicitados aplicados', opcional: true },
  { id: 'planosAprobados',    label: 'Planos aprobados por cliente',      desc: 'Cliente confirmó aprobación final', esFinal: true },
];

function formatDimensiones(mod) {
  if (!mod.largo && !mod.profundidad && !mod.alto) return null;
  const m = (v) => v ? (Number(v) / 100).toFixed(2) : '—';
  return `${m(mod.largo)} × ${m(mod.profundidad)} × ${m(mod.alto)} m`;
}

function ModuloArqCard({ mod, planLink, onUpdateModulo }) {
  const [expanded, setExpanded] = useState(false);
  const arch     = mod.arquitectura || {};
  const liberado = !!arch.liberadoA3D;
  const dims     = formatDimensiones(mod);
  const ESTADOS  = ['En proceso','En Diseño','En Revisión Cliente','Cambios Solicitados','Aprobado Cliente','Listo','Liberado a Diseño 3D'];

  function toggle() {
    const now = new Date().toISOString();
    onUpdateModulo({
      ...mod,
      arquitectura: { ...arch, liberadoA3D: !liberado, liberadoAt: !liberado ? now : '', estado: !liberado ? 'Liberado a Diseño 3D' : 'En proceso' },
      diseno3d: { ...mod.diseno3d, estado: !liberado ? 'Pendiente de modelado' : 'Bloqueado' },
    });
  }

  return (
    <div style={{ background: '#141824', border: `1.5px solid ${liberado ? '#7C3AED40' : '#1E2433'}`, borderRadius: 10, marginBottom: 8 }}>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div onClick={toggle} style={{ cursor: 'pointer', flexShrink: 0 }}>
          {liberado ? <Unlock size={15} color="#7C3AED" /> : <Lock size={15} color="#374151" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>{mod.nombre || 'Sin nombre'}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7280' }}>{mod.pec}</span>
            <LineaBadge linea={mod.linea} />
            <span style={{ fontSize: 9, background: liberado ? '#2D1B69' : '#1F2937', color: liberado ? '#C4B5FD' : '#6B7280', padding: '1px 6px', borderRadius: 4 }}>
              {arch.estado || 'En proceso'}
            </span>
            {mod.maestro && <span style={{ fontSize: 10, color: '#6B7280' }}>👤 {mod.maestro}</span>}
            {dims && <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>📐 {dims}</span>}
          </div>
          {mod.codigo && <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#4B5563', marginTop: 2 }}>{mod.codigo}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {liberado
            ? <span style={{ fontSize: 10, color: '#C4B5FD', fontWeight: 600 }}>✓ En Diseño 3D</span>
            : <button onClick={toggle} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>
                Liberar a D3D
              </button>
          }
          <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid #1E2433' }}>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={lbl}>Estado</label>
              <select value={arch.estado || 'En proceso'}
                onChange={e => onUpdateModulo({ ...mod, arquitectura: { ...arch, estado: e.target.value } })}
                style={inp}>
                {ESTADOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Plano conceptual</label>
              {planLink
                ? <a href={planLink} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '6px 0' }}>
                    Ver plano <ExternalLink size={10} />
                  </a>
                : <span style={{ fontSize: 11, color: '#4B5563', padding: '6px 0', display: 'block' }}>Sin plano cargado</span>
              }
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Dimensiones (cm)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <input type="number" min={0} value={mod.largo || ''} onChange={e => onUpdateModulo({ ...mod, largo: e.target.value })} placeholder="Largo" style={inp} />
                <input type="number" min={0} value={mod.profundidad || ''} onChange={e => onUpdateModulo({ ...mod, profundidad: e.target.value })} placeholder="Profundidad" style={inp} />
                <input type="number" min={0} value={mod.alto || ''} onChange={e => onUpdateModulo({ ...mod, alto: e.target.value })} placeholder="Alto" style={inp} />
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Observaciones</label>
              <textarea value={arch.observaciones || ''}
                onChange={e => onUpdateModulo({ ...mod, arquitectura: { ...arch, observaciones: e.target.value } })}
                rows={2} placeholder="Notas específicas de este módulo..."
                style={{ ...inp, resize: 'none', width: '100%' }} />
            </div>
          </div>
          {liberado && arch.liberadoAt && (
            <div style={{ marginTop: 8, fontSize: 10, color: '#6B7280' }}>
              Liberado a Diseño 3D el {arch.liberadoAt.slice(0,10)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SeccionArquitectura({ proyecto, onUpdate }) {
  const { responsables, saveAlertas, currentUser } = useApp();
  const arch      = proyecto.architecture || {};
  const modulos   = proyecto.production?.modulos || [];
  const checklist = arch.checklist || {};

  const [confirmLibAll, setConfirmLibAll]       = useState(false);
  const [alertaEnviada, setAlertaEnviada]       = useState(false);

  function enviarAlertaBloqueo() {
    saveAlertas([{
      id: `ALERTA_${proyecto.id}_${Date.now()}`,
      proyectoId: proyecto.id,
      proyecto: proyecto.nombre,
      cliente: proyecto.cliente,
      departamentoOrigen: 'Arquitectura',
      departamentoDestino: 'Diseño 3D',
      tipo: 'Bloqueo Diseño 3D',
      motivo: `Los módulos ya fueron generados pero no se pueden liberar a Diseño 3D (ej. faltan medidas del cliente).${currentUser ? ` Reportado por ${currentUser}.` : ''}`,
      accionNecesaria: 'Revisar con Arquitectura qué falta para liberar a Diseño 3D.',
      prioridad: 'Urgente',
      estado: 'Pendiente',
      fecha: new Date().toISOString().slice(0,10),
      auto: false,
    }]);
    setAlertaEnviada(true);
  }

  const respAgrupados = getResponsablesAgrupados(responsables);

  const modulosLiberados  = modulos.filter(m => m.arquitectura?.liberadoA3D);
  const todosLiberados    = modulos.length > 0 && modulosLiberados.length === modulos.length;
  const pasosObligatorios = CHECKLIST_ARQ.filter(p => !p.opcional);
  const pasosCompletados  = pasosObligatorios.filter(p => checklist[p.id]).length;
  const pct               = Math.round((pasosCompletados / pasosObligatorios.length) * 100);
  // El contrato ya no es requisito para liberar a Diseño 3D — no forma parte del flujo real de trabajo.
  const puedeLiberar      = checklist.planosAprobados;

  function toggleCheck(id) {
    onUpdate({ ...proyecto, architecture: { ...arch, checklist: { ...checklist, [id]: !checklist[id] } } });
  }

  function abrirOutlook() {
    const email  = proyecto.vendedorEmail || '';
    const asunto = `Aprobación diseño conceptual — ${proyecto.nombre} (${proyecto.numeroContrato || 'Sin PEC'})`;
    const cuerpo = `Hola ${proyecto.responsableGeneral || 'equipo de Ventas'},\n\nEl borrador del plano conceptual del proyecto "${proyecto.nombre}" para el cliente ${proyecto.cliente} está listo para revisión y aprobación.\n\nProyecto: ${proyecto.nombre}\nCliente: ${proyecto.cliente}\nPEC: ${proyecto.numeroContrato || '—'}\n\nPor favor confirma si procede o si necesitas ajustes.\n\nSaludos,\nEquipo de Arquitectura FOGA`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, '_blank');
    if (!checklist.enviadoAVentas) {
      onUpdate({ ...proyecto, architecture: { ...arch, checklist: { ...checklist, enviadoAVentas: true } } });
    }
  }

  function updateField(field, val) {
    onUpdate({ ...proyecto, architecture: { ...arch, [field]: val } });
  }

  function updateModulo(modActualizado) {
    const nuevos    = modulos.map(m => m.id === modActualizado.id ? modActualizado : m);
    const liberados = nuevos.filter(m => m.arquitectura?.liberadoA3D).length;
    const status    = liberados === nuevos.length && nuevos.length > 0
      ? 'Listo para Diseño 3D'
      : liberados > 0 ? `${liberados}/${nuevos.length} módulos liberados`
      : arch.status || 'En desarrollo de planos';
    onUpdate({
      ...proyecto,
      architecture: { ...arch, status },
      production: { ...proyecto.production, modulos: nuevos },
      releasedToDesign3D: liberados > 0,
    });
  }

  function liberarTodos() {
    if (!confirmLibAll) { setConfirmLibAll(true); return; }
    const now    = new Date().toISOString();
    const nuevos = modulos.map(m => ({
      ...m,
      arquitectura: { ...m.arquitectura, liberadoA3D: true, liberadoAt: now, estado: 'Liberado a Diseño 3D' },
      diseno3d:     { ...m.diseno3d, estado: 'Pendiente de modelado' },
    }));
    onUpdate({
      ...proyecto,
      releasedToDesign3D: true,
      architecture: { ...arch, status: 'Listo para Diseño 3D' },
      production:   { ...proyecto.production, modulos: nuevos },
    });
    setConfirmLibAll(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── 1. CHECKLIST DE PROCESO ── */}
      <div style={{ background: '#0A0D14', border: '1.5px solid #7C3AED30', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>Proceso de Diseño Conceptual</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
              {pasosCompletados}/{pasosObligatorios.length} pasos completados
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: pct === 100 ? '#86EFAC' : '#C4B5FD' }}>{pct}%</div>
            <div style={{ width: 80, height: 4, background: '#1E2433', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#16A34A' : '#7C3AED', borderRadius: 2, transition: 'width .3s' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CHECKLIST_ARQ.map((paso, i) => {
            const checked   = !!checklist[paso.id];
            const anterior  = i === 0 || !!checklist[CHECKLIST_ARQ[i - 1].id];
            const bloqueado = !anterior && !checked;

            return (
              <div key={paso.id} style={{
                background: checked ? '#2D1B6925' : bloqueado ? '#0A0D14' : '#141824',
                border: `1px solid ${checked ? '#7C3AED50' : bloqueado ? '#1E2433' : '#374151'}`,
                borderRadius: 10, padding: '12px 14px',
                opacity: bloqueado ? 0.5 : 1,
                transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Checkbox */}
                  <div
                    onClick={() => !bloqueado && !paso.esEmail && toggleCheck(paso.id)}
                    style={{
                      width: 22, height: 22,
                      borderRadius: paso.esFinal ? 6 : '50%',
                      border: `2px solid ${checked ? '#7C3AED' : '#374151'}`,
                      background: checked ? '#7C3AED' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: paso.esEmail || bloqueado ? 'default' : 'pointer',
                      flexShrink: 0, transition: 'all .15s',
                    }}>
                    {checked && <CheckCircle2 size={14} color="#fff" />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: checked ? '#C4B5FD' : bloqueado ? '#4B5563' : '#E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {i + 1}. {paso.label}
                      {paso.opcional && <span style={{ fontSize: 9, color: '#6B7280', fontWeight: 400 }}>(opcional)</span>}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{paso.desc}</div>
                  </div>

                  {/* Botón email */}
                  {paso.esEmail && (
                    <button
                      onClick={abrirOutlook}
                      disabled={!checklist.borradorConceptual}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: checked ? '#052E16' : checklist.borradorConceptual ? '#0369A1' : '#1F2937',
                        color: checked ? '#86EFAC' : checklist.borradorConceptual ? '#fff' : '#4B5563',
                        border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        padding: '6px 14px',
                        cursor: checklist.borradorConceptual ? 'pointer' : 'not-allowed',
                      }}>
                      {checked
                        ? <><CheckCircle2 size={12} /> Enviado</>
                        : <><Send size={12} /> Enviar a Ventas</>
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Aviso sin email */}
        {!proyecto.vendedorEmail && (
          <div style={{ marginTop: 10, fontSize: 10, color: '#FCD34D', background: '#451A03', border: '1px solid #D97706', borderRadius: 6, padding: '5px 10px' }}>
            ⚠ No hay email del vendedor registrado. Edita el proyecto para agregarlo.
          </div>
        )}

        {/* Botón liberar cuando checklist completo */}
        {puedeLiberar && modulos.length > 0 && !todosLiberados && (
          <div style={{ marginTop: 14, padding: '12px 14px', background: '#2D1B6920', border: '1px dashed #7C3AED60', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#C4B5FD', marginBottom: 8 }}>
              ✓ Planos aprobados y contrato cargado — puedes liberar a Diseño 3D
            </div>
            <div style={{ textAlign: 'left', marginBottom: 10 }}>
              <label style={lbl}>Fecha límite de instalación <span style={{ color: '#6B7280', fontWeight: 400 }}>(referencia: 45 días desde la liberación)</span></label>
              <input type="date" value={proyecto.fechaEntrega || ''} onChange={e => onUpdate({ ...proyecto, fechaEntrega: e.target.value })} style={inp} />
            </div>
            <button onClick={liberarTodos}
              style={{ background: confirmLibAll ? '#DC2626' : '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 20px', cursor: 'pointer' }}>
              {confirmLibAll ? '¿Confirmar? Liberar todos a Diseño 3D' : '🖥️ Liberar todos los módulos a Diseño 3D'}
            </button>
          </div>
        )}
      </div>


      {/* ── 3. INFO GENERAL ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>Responsable de Arquitectura</label>
          <select value={arch.responsible || ''} onChange={e => updateField('responsible', e.target.value)} style={inp}>
            <option value="">Seleccionar...</option>
            {Object.entries(respAgrupados).filter(([g]) => g === 'Arquitectas').map(([grupo, nombres]) => (
              <optgroup key={grupo} label="── Arquitectas ──">
                {nombres.map(n => <option key={n} value={n}>{n}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Estado general</label>
          <div style={{ fontSize: 12, color: '#9CA3AF', padding: '7px 0' }}>{arch.status || '—'}</div>
        </div>
        {[
          { field: 'sketchupLink',          label: 'Link SketchUp' },
          { field: 'conceptualPlanLink',    label: 'Link plano conceptual' },
          { field: 'installationPlanLink',  label: 'Link plano instalaciones' },
        ].map(({ field, label }) => (
          <div key={field}>
            <label style={lbl}>{label}</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={arch[field] || ''} onChange={e => updateField(field, e.target.value)}
                placeholder="https://drive.google.com/..." style={{ ...inp, flex: 1 }} />
              {arch[field] && (
                <a href={arch[field]} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '5px 8px', background: '#1E3A5F', border: '1px solid #2563EB40', borderRadius: 7, color: '#93C5FD', display: 'flex', alignItems: 'center' }}>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
        <div>
          <label style={lbl}>Observaciones</label>
          <textarea value={arch.observations || ''} onChange={e => updateField('observations', e.target.value)}
            rows={2} style={{ ...inp, resize: 'none', width: '100%' }} />
        </div>
      </div>

      {/* ── 4. MÓDULOS ── */}
      {modulos.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>Módulos del proyecto</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {modulosLiberados.length}/{modulos.length} liberados a Diseño 3D
              </div>
            </div>
            {!todosLiberados && (
              <button onClick={liberarTodos}
                style={{ fontSize: 11, fontWeight: 700, padding: '6px 14px', background: confirmLibAll ? '#DC2626' : '#2563EB20', color: confirmLibAll ? '#fff' : '#93C5FD', border: `1px solid ${confirmLibAll ? '#DC2626' : '#2563EB40'}`, borderRadius: 8, cursor: 'pointer' }}>
                {confirmLibAll ? '¿Confirmar?' : 'Liberar todos a D3D'}
              </button>
            )}
            {todosLiberados && <span style={{ fontSize: 11, color: '#86EFAC', fontWeight: 600 }}>✓ Todos liberados</span>}
          </div>
          {modulosLiberados.length === 0 && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, background: '#451A0320', border: '1px solid #D9770640', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ fontSize: 11, color: '#FCD34D', flex: 1 }}>⚠ Ningún módulo se puede liberar a Diseño 3D todavía (ej. faltan medidas del cliente)</span>
              <button onClick={enviarAlertaBloqueo} disabled={alertaEnviada}
                style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', background: alertaEnviada ? '#052E16' : '#D97706', color: alertaEnviada ? '#86EFAC' : '#fff', border: 'none', borderRadius: 7, cursor: alertaEnviada ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                {alertaEnviada ? '✓ Alerta enviada' : '🔔 Enviar alerta'}
              </button>
            </div>
          )}
          <div style={{ height: 4, background: '#1E2433', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${modulos.length > 0 ? (modulosLiberados.length / modulos.length) * 100 : 0}%`, background: '#7C3AED', borderRadius: 2, transition: 'width .3s' }} />
          </div>
          {modulos.map(mod => (
            <ModuloArqCard
              key={mod.id} mod={mod}
              planLink={proyecto.planConceptualLink || arch.conceptualPlanLink}
              onUpdateModulo={updateModulo}
            />
          ))}
        </div>
      )}

      {modulos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: '#4B5563' }}>
          Sin módulos. Edita el proyecto desde "Proyectos" para agregarlos.
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 };
const inp = { background: '#0F1117', border: '1px solid #374151', borderRadius: 7, color: '#E2E8F0', fontSize: 12, padding: '6px 10px', outline: 'none', width: '100%' };

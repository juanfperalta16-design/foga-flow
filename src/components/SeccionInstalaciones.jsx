// =====================================================
// FOGA FLOW — SeccionInstalaciones.jsx
// Seguimiento de obra: visitas, informe técnico (medidas), obra lista
// =====================================================

import { useState } from 'react';
import { useApp } from '../App';
import { CheckCircle2, Circle, ExternalLink, AlertTriangle } from 'lucide-react';
import { getResponsablesPorDept, getNombresResponsables } from '../utils/settingsStorage';

const CHECKLIST_INST = [
  { id: 'firstVisitDate',              label: '1ª visita técnica',        desc: 'Primera visita a obra realizada', esFecha: true },
  { id: 'initialTechnicalReportLink',  label: 'Informe técnico / medidas', desc: 'Medidas del cliente confirmadas en obra', esLink: true },
  { id: 'secondVisitDate',             label: '2ª visita técnica',        desc: 'Visita de verificación (si aplica)', esFecha: true, opcional: true },
  { id: 'siteReady',                   label: 'Obra lista para instalar', desc: 'Todo listo para el día de instalación', esFinal: true },
  { id: 'finalVisitDate',              label: 'Instalación realizada',    desc: 'El proyecto ya se instaló en obra — recién aquí se marca Finalizado', esFecha: true, esFinal: true },
];

export default function SeccionInstalaciones({ proyecto, onUpdate }) {
  const { responsables, saveAlertas, currentUser } = useApp();
  const inst = proyecto.installations || {};
  const responsablesInst = getResponsablesPorDept(responsables, 'Instalaciones');
  const nombresGenerales = getNombresResponsables(responsables);

  const [linkInput, setLinkInput] = useState(inst.initialTechnicalReportLink || '');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [alertaEnviada, setAlertaEnviada] = useState(false);

  function update(field, val) {
    onUpdate({ ...proyecto, installations: { ...inst, [field]: val } });
  }

  function subirInforme() {
    if (!linkInput.trim()) return;
    update('initialTechnicalReportLink', linkInput);
    setShowLinkForm(false);
  }

  function alertarRevisionMedidas() {
    saveAlertas([{
      id: `ALERTA_${proyecto.id}_${Date.now()}`,
      proyectoId: proyecto.id,
      proyecto: proyecto.nombre,
      cliente: proyecto.cliente,
      departamentoOrigen: 'Instalaciones',
      departamentoDestino: 'Arquitectura',
      tipo: 'Revisión de medidas',
      motivo: `Instalaciones tomó medidas en obra que no coinciden con el plano. Se requiere que Arquitectura verifique y ajuste el plano si es necesario.${currentUser ? ` Reportado por ${currentUser}.` : ''}`,
      accionNecesaria: 'Arquitectura: revisar medidas de obra y ajustar el plano si corresponde.',
      prioridad: 'Urgente',
      estado: 'Pendiente',
      fecha: new Date().toISOString().slice(0,10),
      auto: false,
    }]);
    setAlertaEnviada(true);
  }

  const pasosCompletados = CHECKLIST_INST.filter(p => !p.opcional && inst[p.id]).length;
  const pasosTotal       = CHECKLIST_INST.filter(p => !p.opcional).length;
  const pct              = Math.round((pasosCompletados / pasosTotal) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Responsable */}
      <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '12px 14px' }}>
        <label style={lbl}>Responsable de Instalaciones</label>
        <select value={inst.responsible || ''} onChange={e => update('responsible', e.target.value)} style={inp}>
          <option value="">Seleccionar...</option>
          {(responsablesInst.length > 0 ? responsablesInst.map(r => r.nombre) : nombresGenerales).map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {responsablesInst.length === 0 && (
          <div style={{ fontSize: 10, color: '#6B7280', marginTop: 6 }}>
            No hay nadie asignado al departamento "Instalaciones" en Configuración → Equipo. Mostrando todo el equipo mientras tanto.
          </div>
        )}
      </div>

      {/* Progreso */}
      <div style={{ background: '#0A0D14', border: '1.5px solid #16A34A30', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>Seguimiento de obra</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{pasosCompletados}/{pasosTotal} pasos completados</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: pct === 100 ? '#86EFAC' : '#86EFAC' }}>{pct}%</div>
            <div style={{ width: 80, height: 4, background: '#1E2433', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#16A34A' : '#16A34A', borderRadius: 2, transition: 'width .3s' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CHECKLIST_INST.map(paso => {
            const val = inst[paso.id];
            const checked = !!val;
            return (
              <div key={paso.id} style={{ background: checked ? '#052E1620' : '#141824', border: `1px solid ${checked ? '#16A34A50' : '#1E2433'}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!paso.esFecha && !paso.esLink && (
                    <div onClick={() => update(paso.id, !checked)} style={{ width: 22, height: 22, borderRadius: paso.esFinal ? 6 : '50%', border: `2px solid ${checked ? '#16A34A' : '#374151'}`, background: checked ? '#16A34A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      {checked && <CheckCircle2 size={14} color="#fff" />}
                    </div>
                  )}
                  {(paso.esFecha || paso.esLink) && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${checked ? '#16A34A' : '#374151'}`, background: checked ? '#16A34A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {checked && <CheckCircle2 size={14} color="#fff" />}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: checked ? '#86EFAC' : '#E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {paso.label}
                      {paso.opcional && <span style={{ fontSize: 9, color: '#6B7280', fontWeight: 400 }}>(opcional)</span>}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{paso.desc}</div>
                  </div>

                  {paso.esFecha && (
                    <input type="date" value={val || ''} onChange={e => update(paso.id, e.target.value)}
                      style={{ ...inp, width: 150 }} />
                  )}

                  {paso.esLink && (
                    val ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <a href={val} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>Ver <ExternalLink size={10} /></a>
                        <button onClick={() => { setLinkInput(val); setShowLinkForm(true); }} style={{ fontSize: 10, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar</button>
                      </div>
                    ) : !showLinkForm ? (
                      <button onClick={() => { setLinkInput(''); setShowLinkForm(true); }}
                        style={{ fontSize: 11, color: '#86EFAC', background: '#052E1620', border: '1px dashed #16A34A60', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>
                        + Subir informe
                      </button>
                    ) : null
                  )}
                </div>

                {paso.esLink && showLinkForm && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://drive.google.com/..." style={{ ...inp, flex: 1 }} />
                    <button onClick={subirInforme} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>✓</button>
                    <button onClick={() => setShowLinkForm(false)} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>✕</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Medidas no coinciden — avisar a Arquitectura */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#451A0320', border: '1px solid #D9770640', borderRadius: 10, padding: '10px 14px' }}>
        <span style={{ fontSize: 11, color: '#FCD34D', flex: 1 }}>¿Las medidas tomadas en obra no coinciden con el plano? Avisa a Arquitectura para que lo revise.</span>
        <button onClick={alertarRevisionMedidas} disabled={alertaEnviada}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '6px 12px', background: alertaEnviada ? '#052E16' : '#D97706', color: alertaEnviada ? '#86EFAC' : '#fff', border: 'none', borderRadius: 7, cursor: alertaEnviada ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
          {alertaEnviada ? <><CheckCircle2 size={12} /> Alerta enviada</> : <><AlertTriangle size={12} /> Avisar a Arquitectura</>}
        </button>
      </div>

      {/* Observaciones */}
      <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 10, padding: '12px 14px' }}>
        <label style={lbl}>Observaciones de obra</label>
        <textarea value={inst.observaciones || ''} onChange={e => update('observaciones', e.target.value)}
          rows={3} placeholder="Notas sobre la visita, condiciones de la obra, pendientes..."
          style={{ ...inp, resize: 'none', width: '100%' }} />
      </div>
    </div>
  );
}

const lbl = { fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 };
const inp = { background: '#0F1117', border: '1px solid #374151', borderRadius: 7, color: '#E2E8F0', fontSize: 12, padding: '6px 10px', outline: 'none', width: '100%' };

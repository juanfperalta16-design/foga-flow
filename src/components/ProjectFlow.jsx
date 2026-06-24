// =====================================================
// FOGA FLOW — Pestaña Flujo
// Muestra el progreso visual del proyecto (solo lectura)
// Arquitectura → Diseño 3D → Producción → Instalación
// Instalaciones monitorea en paralelo
// =====================================================
import { CheckCircle2, Circle, Lock, ExternalLink, AlertCircle } from 'lucide-react';

const ETAPAS = [
  { key: 'arch',  label: 'Arquitectura',  icon: '✏️', color: '#7C3AED', bg: '#2D1B69' },
  { key: 'd3d',   label: 'Diseño 3D',     icon: '🖥️', color: '#2563EB', bg: '#1E3A5F' },
  { key: 'prod',  label: 'Producción',    icon: '🏭', color: '#EA580C', bg: '#3D1F00' },
  { key: 'inst',  label: 'Instalación',   icon: '🔧', color: '#16A34A', bg: '#0F2D1A' },
];

function etapaStatus(proyecto, key) {
  const p = proyecto || {};
  switch(key) {
    case 'arch':
      if (p.releasedToDesign3D) return 'done';
      if (p.contratoLink || p.contratoFirmado) return 'active';
      return 'active'; // siempre activa
    case 'd3d':
      if (!p.releasedToDesign3D) return 'locked';
      if (p.design3d?.releasedToProduction) return 'done';
      return 'active';
    case 'prod':
      if (!p.design3d?.releasedToProduction) return 'locked';
      if (p.production?.productionFinished) return 'done';
      return 'active';
    case 'inst':
      if (!p.production?.productionFinished) return 'locked';
      if (p.estadoGeneral === 'Finalizado') return 'done';
      return 'active';
    default: return 'locked';
  }
}

function EtapaIcon({ status, color }) {
  if (status === 'done')   return <CheckCircle2 size={20} color={color} />;
  if (status === 'locked') return <Lock size={18} color="#374151" />;
  return <Circle size={20} color={color} strokeWidth={2.5} />;
}

export default function ProjectFlow({ proyecto, onUpdateProyecto }) {
  const p    = proyecto || {};
  const arch = p.architecture  || {};
  const d3   = p.design3d      || {};
  const prod = p.production    || {};
  const inst = p.installations || {};
  const tieneContrato = !!(p.contratoLink || p.contratoFirmado);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Línea de progreso principal ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {ETAPAS.map((etapa, i) => {
          const status = etapaStatus(p, etapa.key);
          const locked = status === 'locked';
          const done   = status === 'done';
          return (
            <div key={etapa.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {/* Nodo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: locked ? '#0A0D14' : done ? etapa.bg : etapa.bg + '80',
                  border: `2px solid ${locked ? '#1E2433' : done ? etapa.color : etapa.color + '80'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, opacity: locked ? 0.4 : 1,
                  transition: 'all .2s',
                }}>
                  {etapa.icon}
                </div>
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: locked ? '#374151' : done ? etapa.color : '#E2E8F0' }}>
                    {etapa.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>
                    {status === 'done'   ? '✓ Completado' :
                     status === 'locked' ? 'Bloqueado'    : 'En proceso'}
                  </div>
                </div>
              </div>
              {/* Conector */}
              {i < ETAPAS.length - 1 && (
                <div style={{
                  height: 2, width: 40, flexShrink: 0, marginBottom: 28,
                  background: etapaStatus(p, ETAPAS[i+1].key) !== 'locked'
                    ? etapa.color
                    : '#1E2433',
                  transition: 'background .3s',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Instalaciones en paralelo ── */}
      <div style={{ background: '#0A0D14', border: '1px solid #16A34A30', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>🔧</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#86EFAC' }}>Instalaciones — Seguimiento de Obra</span>
          <span style={{ fontSize: 10, color: '#6B7280', marginLeft: 4 }}>corre en paralelo durante todo el proyecto</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: '1ª Visita técnica', value: inst.firstVisitDate, done: !!inst.firstVisitDate },
            { label: 'Informe técnico',   value: inst.initialTechnicalReportLink, done: !!inst.initialTechnicalReportLink, link: true },
            { label: '2ª Visita',         value: inst.secondVisitDate, done: !!inst.secondVisitDate },
            { label: 'Obra lista',        value: inst.siteReady ? 'Confirmado' : null, done: !!inst.siteReady },
          ].map((item, i) => (
            <div key={i} style={{ background: '#141824', border: `1px solid ${item.done ? '#16A34A40' : '#1E2433'}`, borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                {item.done
                  ? <CheckCircle2 size={12} color="#16A34A" />
                  : <Circle size={12} color="#374151" />}
                <span style={{ fontSize: 10, fontWeight: 600, color: item.done ? '#86EFAC' : '#6B7280' }}>{item.label}</span>
              </div>
              {item.link && item.value
                ? <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>Ver informe <ExternalLink size={9} /></a>
                : <span style={{ fontSize: 10, color: item.done ? '#86EFAC' : '#4B5563' }}>{item.value || 'Pendiente'}</span>
              }
            </div>
          ))}
        </div>
        {inst.observations && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#86EFAC', background: '#0F2D1A', padding: '6px 10px', borderRadius: 6 }}>
            📝 {inst.observations}
          </div>
        )}
      </div>

      {/* ── Resumen de estado actual ── */}
      <div style={{ background: '#141824', border: '1px solid #1E2433', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
          Resumen del proyecto
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <InfoFila label="Estado general"  value={p.estadoGeneral || '—'} />
          <InfoFila label="Contrato"        value={tieneContrato ? '✓ Cargado' : 'Pendiente'} ok={tieneContrato} warn={!tieneContrato} link={tieneContrato ? p.contratoLink : null} />
          <InfoFila label="Diseño 3D"       value={p.releasedToDesign3D ? (d3.status || 'En proceso') : 'Bloqueado — espera contrato y planos'} ok={!!p.releasedToDesign3D} />
          <InfoFila label="Producción"      value={d3.releasedToProduction ? (prod.status || 'En proceso') : 'Bloqueado — espera Diseño 3D'} ok={!!d3.releasedToProduction} />
        </div>
        {p.proximaAccion && (
          <div style={{ marginTop: 10, background: '#1E3A5F30', border: '1px solid #2563EB30', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#93C5FD', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={12} color="#60A5FA" />
            <strong>Próxima acción:</strong> {p.proximaAccion}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoFila({ label, value, ok, warn, link }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: '#6B7280' }}>{label}</span>
      {link
        ? <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
            ✓ Ver contrato <ExternalLink size={9} />
          </a>
        : <span style={{ fontSize: 11, fontWeight: 600, color: ok ? '#86EFAC' : warn ? '#FCD34D' : '#9CA3AF' }}>{value}</span>
      }
    </div>
  );
}

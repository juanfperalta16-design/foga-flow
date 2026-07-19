import { useApp } from '../App';
import { AlertTriangle, Clock, User, Package, ExternalLink } from 'lucide-react';

function dias(fecha) {
  if (!fecha) return null;
  return Math.floor((new Date(fecha) - new Date()) / 86400000);
}

function SemaforoBadge({ fecha }) {
  if (!fecha) return null;
  const d = dias(fecha);
  const color = d < 0 ? '#EF4444' : d <= 5 ? '#F97316' : '#D97706';
  const bg    = d < 0 ? '#450A0A' : d <= 5 ? '#431407' : '#451A03';
  const label = d < 0 ? `${Math.abs(d)}d atrasado` : `${d}d restantes`;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, padding: '2px 8px', borderRadius: 99 }}>
      {label}
    </span>
  );
}

function TarjetaProyecto({ proyecto, motivo, color, goToProject }) {
  const modulos = proyecto.production?.modulos || [];
  const d3      = proyecto.design3d || {};
  const designers = d3.responsables || (d3.responsible ? [d3.responsible] : []);

  return (
    <div onClick={() => goToProject(proyecto.id)}
      style={{ background: '#141824', border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1f2e'}
      onMouseLeave={e => e.currentTarget.style.background = '#141824'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{proyecto.nombre}</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
            {proyecto.cliente} · <span style={{ fontFamily: 'var(--font-mono)' }}>{proyecto.numeroContrato || '—'}</span>
          </div>
          <div style={{ fontSize: 11, color, marginTop: 5, fontWeight: 600 }}>{motivo}</div>
          {/* Equipo */}
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {proyecto.architecture?.responsible && <span style={{ fontSize: 10, color: '#C4B5FD' }}>✏️ {proyecto.architecture.responsible}</span>}
            {designers.length > 0 && <span style={{ fontSize: 10, color: '#93C5FD' }}>🖥️ {designers.join(', ')}</span>}
            {proyecto.installations?.responsible && <span style={{ fontSize: 10, color: '#86EFAC' }}>🔧 {proyecto.installations.responsible}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <SemaforoBadge fecha={proyecto.fechaEntrega} />
          {proyecto.prioridad && (
            <div style={{ marginTop: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: proyecto.prioridad === 'Urgente' ? '#450A0A' : '#451A03', color: proyecto.prioridad === 'Urgente' ? '#FCA5A5' : '#FCD34D' }}>
                {proyecto.prioridad}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TarjetaModulo({ modulo, proyecto, color, motivo, goToProject }) {
  const sem = dias(modulo.fechaEntrega);
  const semColor = sem === null ? '#6B7280' : sem < 0 ? '#EF4444' : sem <= 5 ? '#F97316' : '#D97706';

  return (
    <div onClick={() => goToProject(proyecto.id)}
      style={{ background: '#141824', border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', transition: 'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1f2e'}
      onMouseLeave={e => e.currentTarget.style.background = '#141824'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7280' }}>{modulo.pec}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>{modulo.nombre || 'Sin nombre'}</span>
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{proyecto.nombre} · {proyecto.cliente}</div>
          {modulo.maestro && <div style={{ fontSize: 10, color: '#FDBA74', marginTop: 3 }}>👤 {modulo.maestro}</div>}
          <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{motivo}</div>
          {/* Material urgente */}
          {(modulo.materialFaltante || []).filter(m => m.prioridad === '🔴 Urgente' && m.estadoCompra !== '✓ Recibido').map(mat => (
            <div key={mat.id} style={{ fontSize: 10, color: '#FCA5A5', background: '#450A0A', borderRadius: 5, padding: '2px 7px', marginTop: 4, display: 'inline-block' }}>
              ⚠ Material: {mat.material}
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {modulo.fechaEntrega && <SemaforoBadge fecha={modulo.fechaEntrega} />}
          {modulo.produccion?.faseActual && (
            <div style={{ marginTop: 5, fontSize: 10, color: '#FDBA74', background: '#3D1F00', padding: '1px 6px', borderRadius: 4 }}>
              {modulo.produccion.faseActual}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TarjetaAlerta({ alerta, goToProject, onResolver }) {
  return (
    <div onClick={() => alerta.proyectoId && goToProject(alerta.proyectoId)}
      style={{ background: '#141824', border: '1px solid #DC262630', borderLeft: '3px solid #DC2626', borderRadius: 10, padding: '12px 14px', cursor: alerta.proyectoId ? 'pointer' : 'default' }}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1f2e'}
      onMouseLeave={e => e.currentTarget.style.background = '#141824'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#450A0A', color: '#FCA5A5' }}>{alerta.tipo}</span>
            {alerta.departamentoOrigen && <span style={{ fontSize: 10, color: '#6B7280' }}>{alerta.departamentoOrigen}{alerta.departamentoDestino ? ` → ${alerta.departamentoDestino}` : ''}</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{alerta.proyecto}{alerta.cliente ? ` · ${alerta.cliente}` : ''}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{alerta.motivo}</div>
          {alerta.accionNecesaria && <div style={{ fontSize: 10, color: '#93C5FD', marginTop: 4, fontWeight: 600 }}>{alerta.accionNecesaria}</div>}
        </div>
        <button onClick={e => { e.stopPropagation(); onResolver(alerta); }}
          style={{ fontSize: 10, color: '#9CA3AF', background: 'none', border: '1px solid #ffffff20', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#86EFAC'; e.currentTarget.style.borderColor = '#16653480'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#ffffff20'; }}>
          ✓ Marcar resuelta
        </button>
      </div>
    </div>
  );
}

function Seccion({ titulo, subtitulo, items, color, icon, children }) {
  return (
    <div style={{ background: '#141824', border: `1px solid ${color}30`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: color + '15', borderBottom: `1px solid ${color}30`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color }}>{titulo}</div>
          {subtitulo && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{subtitulo}</div>}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, background: color, color: '#fff', padding: '2px 10px', borderRadius: 99 }}>
          {items}
        </span>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
        {items === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: '#4B5563' }}>
            ✓ Sin alertas en esta sección
          </div>
        )}
      </div>
    </div>
  );
}

export default function Urgencies() {
  const { proyectos, alertas, saveAlertas, goToProject } = useApp();
  const safeProys = (proyectos || []);

  // ── 0. Alertas reportadas manualmente por un departamento ──
  // (ej. botón "🔔 Enviar alerta" en Arquitectura) — antes solo se
  // veían en Proyectos → pestaña Alertas; el contador del sidebar las
  // cuenta pero esta página no las mostraba, así que "desaparecían".
  const alertasReportadas = (alertas || []).filter(a => !a.auto && a.estado === 'Pendiente');
  const resolverAlerta = (al) => saveAlertas([{ ...al, estado: 'Resuelta' }]);

  // ── 1. Proyectos atrasados (fecha general) ──
  const proyAtrasados = safeProys.filter(p =>
    p.fechaEntrega &&
    new Date(p.fechaEntrega) < new Date() &&
    p.estadoGeneral !== 'Finalizado'
  );

  // ── 2. Proyectos urgentes (≤5 días) ──
  const proyUrgentes = safeProys.filter(p => {
    if (!p.fechaEntrega || p.estadoGeneral === 'Finalizado') return false;
    const d = dias(p.fechaEntrega);
    return d !== null && d >= 0 && d <= 5;
  });

  // ── 3. Sin responsable por departamento ──
  const sinResponsable = [];
  safeProys.filter(p => p.estadoGeneral !== 'Finalizado').forEach(p => {
    const d3 = p.design3d || {};
    const designers = d3.responsables || (d3.responsible ? [d3.responsible] : []);
    const modulos = p.production?.modulos || [];

    if (!p.architecture?.responsible)
      sinResponsable.push({ proyecto: p, motivo: '⚠ Sin responsable en Arquitectura' });
    if (p.releasedToDesign3D && designers.length === 0)
      sinResponsable.push({ proyecto: p, motivo: '⚠ Sin diseñador asignado en Diseño 3D' });
    if (p.releasedToInstallations && !p.installations?.responsible)
      sinResponsable.push({ proyecto: p, motivo: '⚠ Sin responsable en Instalaciones' });
    if (modulos.some(m => m.diseno3d?.liberadoProduccion && !m.maestro))
      sinResponsable.push({ proyecto: p, motivo: '⚠ Módulos en Producción sin maestro asignado' });
  });

  // ── 4. Módulos con material urgente ──
  const modMaterial = [];
  safeProys.forEach(p => {
    (p.production?.modulos || []).forEach(mod => {
      const urgentes = (mod.materialFaltante || []).filter(m => m.prioridad === '🔴 Urgente' && m.estadoCompra !== '✓ Recibido');
      if (urgentes.length > 0) modMaterial.push({ modulo: mod, proyecto: p, motivo: `${urgentes.length} material(es) urgente(s) faltante(s)` });
    });
  });

  // ── 5. Módulos atrasados en producción ──
  const modAtrasados = [];
  safeProys.forEach(p => {
    (p.production?.modulos || []).forEach(mod => {
      if (mod.fechaEntrega && new Date(mod.fechaEntrega) < new Date() && mod.produccion?.faseActual !== '✓ Terminado') {
        modAtrasados.push({ modulo: mod, proyecto: p, motivo: 'Módulo atrasado en producción' });
      }
    });
  });

  const totalAlertas = alertasReportadas.length + proyAtrasados.length + proyUrgentes.length + sinResponsable.length + modMaterial.length + modAtrasados.length;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: 0, fontFamily: 'var(--font-display)' }}>Urgencias y alertas</h1>
        <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>
          {totalAlertas === 0 ? '✓ Todo en orden' : `${totalAlertas} situaciones requieren atención`}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Alertas reportadas manualmente por un departamento */}
        <Seccion titulo="Alertas reportadas" subtitulo="Reportadas manualmente por un departamento (ej. bloqueos para liberar a otra área)" items={alertasReportadas.length} color="#DC2626" icon="🔔">
          {alertasReportadas.map(al => <TarjetaAlerta key={al.id} alerta={al} goToProject={goToProject} onResolver={resolverAlerta} />)}
        </Seccion>

        {/* Proyectos atrasados */}
        <Seccion titulo="Proyectos atrasados" subtitulo="Fecha de entrega general vencida" items={proyAtrasados.length} color="#EF4444" icon="🔴">
          {proyAtrasados.map(p => <TarjetaProyecto key={p.id} proyecto={p} motivo="Fecha de entrega vencida" color="#EF4444" goToProject={goToProject} />)}
        </Seccion>

        {/* Proyectos urgentes */}
        <Seccion titulo="Entregas próximas" subtitulo="Menos de 5 días para la entrega" items={proyUrgentes.length} color="#F97316" icon="⚡">
          {proyUrgentes.map(p => <TarjetaProyecto key={p.id} proyecto={p} motivo="Entrega en menos de 5 días" color="#F97316" goToProject={goToProject} />)}
        </Seccion>

        {/* Sin responsable */}
        <Seccion titulo="Sin responsable asignado" subtitulo="Proyectos activos sin encargado en algún departamento" items={sinResponsable.length} color="#D97706" icon="👤">
          {sinResponsable.map((item, i) => <TarjetaProyecto key={i} proyecto={item.proyecto} motivo={item.motivo} color="#D97706" goToProject={goToProject} />)}
        </Seccion>

        {/* Material urgente */}
        <Seccion titulo="Material urgente faltante" subtitulo="Módulos bloqueados por falta de material" items={modMaterial.length} color="#DC2626" icon="📦">
          {modMaterial.map((item, i) => <TarjetaModulo key={i} modulo={item.modulo} proyecto={item.proyecto} motivo={item.motivo} color="#DC2626" goToProject={goToProject} />)}
        </Seccion>

        {/* Módulos atrasados */}
        <Seccion titulo="Módulos atrasados en producción" subtitulo="Fecha de entrega de módulo vencida" items={modAtrasados.length} color="#EF4444" icon="🏭">
          {modAtrasados.map((item, i) => <TarjetaModulo key={i} modulo={item.modulo} proyecto={item.proyecto} motivo={item.motivo} color="#EF4444" goToProject={goToProject} />)}
        </Seccion>

      </div>
    </div>
  );
}

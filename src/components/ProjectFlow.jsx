import { ExternalLink, Lock, CheckCircle2, Circle, AlertTriangle, Clock } from 'lucide-react';
import { LineaBadge } from './Badge';

function dias(fecha) {
  if (!fecha) return null;
  return Math.floor((new Date(fecha) - new Date()) / 86400000);
}

function SemaforoBadge({ fecha }) {
  if (!fecha) return null;
  const d = dias(fecha);
  const color = d < 0 ? '#EF4444' : d <= 5 ? '#F97316' : '#16A34A';
  const label = d < 0 ? `${Math.abs(d)}d atrasado` : `${d}d restantes`;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: color + '15', padding: '2px 7px', borderRadius: 99 }}>
      {label}
    </span>
  );
}

function EstadoBadge({ label, color = '#6B7280', bg = '#1F2937' }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: bg, padding: '2px 8px', borderRadius: 99 }}>
      {label}
    </span>
  );
}

function formatDimensiones(mod) {
  if (!mod.largo && !mod.profundidad && !mod.alto) return null;
  const m = (v) => v ? (Number(v) / 100).toFixed(2) : '—';
  return `${m(mod.largo)} × ${m(mod.profundidad)} × ${m(mod.alto)} m`;
}

function ModuloRow({ mod, index }) {
  const arch  = mod.arquitectura  || {};
  const d3    = mod.diseno3d      || {};
  const prod  = mod.produccion    || {};

  const archOk   = !!arch.liberadoA3D;
  const d3Ok     = !!d3.liberadoProduccion;
  const prodOk   = prod.faseActual === '✓ Terminado';
  const atrasado = mod.fechaEntrega && dias(mod.fechaEntrega) < 0;

  const pct  = archOk ? (d3Ok ? (prodOk ? 100 : 66) : 33) : 0;
  const dims = formatDimensiones(mod);

  return (
    <div style={{
      background: '#101215',
      border: `1px solid ${atrasado || prod.reproceso ? '#EF444430' : '#1E2433'}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 8,
    }}>
      {/* Fila principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#4B5563', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>{mod.nombre || 'Sin nombre'}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#4B5563' }}>{mod.pec}</span>
            <LineaBadge linea={mod.linea} />
            {atrasado && <span style={{ fontSize: 9, background: '#450A0A', color: '#FCA5A5', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>ATRASADO</span>}
            {prod.reproceso && <span style={{ fontSize: 9, background: '#450A0A', color: '#FCA5A5', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>⚠ REPROCESO</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            {mod.maestro && <span style={{ fontSize: 10, color: '#6B7280' }}>👤 {mod.maestro}</span>}
            <SemaforoBadge fecha={mod.fechaEntrega} />
            {dims && <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>📐 {dims}</span>}
          </div>
          {mod.codigo && <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#4B5563', marginTop: 2 }}>{mod.codigo}</div>}
        </div>
      </div>

      {/* Barra de progreso del módulo — el color de relleno es el color de
          temple de la etapa donde está el módulo ahora mismo; llega a verde
          (fabricación terminada) recién cuando todo el tramo visible cierra. */}
      <div style={{ height: 3, background: '#1E2433', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#16A34A' : pct >= 66 ? '#7A4B8C' : pct >= 33 ? '#B5651D' : '#D4A017', borderRadius: 2, transition: 'width .4s' }} />
      </div>

      {/* Estados por departamento */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {/* Arquitectura */}
        <div style={{ background: archOk ? '#33290530' : '#1F2937', border: `1px solid ${archOk ? '#D4A01740' : '#1E2433'}`, borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#D4A017', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>✏️ Arquitectura</div>
          {archOk
            ? <div style={{ fontSize: 10, color: '#F0D687', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11} color="#D4A017" /> Liberado a D3D</div>
            : <div style={{ fontSize: 10, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}><Circle size={11} color="#374151" /> {arch.estado || 'En proceso'}</div>
          }
          {arch.observaciones && <div style={{ marginTop: 5, fontSize: 10, color: '#F0D687', background: '#33290530', borderLeft: '2px solid #D4A017', padding: '3px 6px', borderRadius: '0 4px 4px 0' }}>💬 {arch.observaciones}</div>}
        </div>

        {/* Diseño 3D */}
        <div style={{ background: archOk ? (d3Ok ? '#2E1A0830' : '#2E1A0815') : '#0A0D14', border: `1px solid ${d3Ok ? '#B5651D40' : archOk ? '#B5651D20' : '#1E2433'}`, borderRadius: 8, padding: '8px 10px', opacity: archOk ? 1 : 0.4 }}>
          <div style={{ fontSize: 10, color: '#B5651D', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            🖥️ Diseño 3D
          </div>
          {!archOk
            ? <div style={{ fontSize: 10, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={11} color="#374151" /> Bloqueado</div>
            : d3Ok
              ? <div style={{ fontSize: 10, color: '#E3A868', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11} color="#B5651D" /> Liberado a Prod.</div>
              : <div style={{ fontSize: 10, color: '#E3A868', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Circle size={11} color="#B5651D" strokeWidth={2.5} />
                  {d3.estado || 'Pendiente'}
                </div>
          }
          {archOk && !d3Ok && d3.planCorteLink && (
            <a href={d3.planCorteLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none', marginTop: 3 }}>
              Ver plano <ExternalLink size={9} />
            </a>
          )}
        </div>

        {/* Producción */}
        <div style={{ background: d3Ok ? '#241A2B20' : '#0A0D14', border: `1px solid ${prodOk ? '#16A34A40' : d3Ok ? '#7A4B8C30' : '#1E2433'}`, borderRadius: 8, padding: '8px 10px', opacity: d3Ok ? 1 : 0.4 }}>
          <div style={{ fontSize: 10, color: '#7A4B8C', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            🏭 Producción
          </div>
          {!d3Ok
            ? <div style={{ fontSize: 10, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={11} color="#374151" /> Bloqueado</div>
            : prodOk
              ? <div style={{ fontSize: 10, color: '#86EFAC', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11} color="#16A34A" /> Terminado</div>
              : <div style={{ fontSize: 10, color: '#C9A8D6', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Circle size={11} color="#7A4B8C" strokeWidth={2.5} />
                  {prod.faseActual || 'Pendiente'}
                </div>
          }
        </div>
      </div>
    </div>
  );
}

export default function ProjectFlow({ proyecto, onUpdateProyecto }) {
  const p    = proyecto || {};
  const arch = p.architecture  || {};
  const inst = p.installations || {};
  const d3   = p.design3d      || {};
  const modulos = p.production?.modulos || [];

  const totalMods     = modulos.length;
  const liberadosArq  = modulos.filter(m => m.arquitectura?.liberadoA3D).length;
  const liberadosD3D  = modulos.filter(m => m.diseno3d?.liberadoProduccion).length;
  const terminadosProd = modulos.filter(m => m.produccion?.faseActual === '✓ Terminado').length;
  const atrasados     = modulos.filter(m => m.fechaEntrega && dias(m.fechaEntrega) < 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Línea de etapas principal ── */}
      <div style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {[
            { icon: '✏️', label: 'Arquitectura', done: liberadosArq > 0, active: true, color: '#D4A017', sub: totalMods > 0 ? `${liberadosArq}/${totalMods} liberados` : arch.status || 'En proceso' },
            { icon: '🖥️', label: 'Diseño 3D',   done: liberadosD3D > 0, active: liberadosArq > 0, color: '#B5651D', sub: totalMods > 0 ? `${liberadosD3D}/${liberadosArq || totalMods} liberados` : d3.status || 'Bloqueado' },
            { icon: '🏭', label: 'Producción',   done: terminadosProd > 0, active: liberadosD3D > 0, color: '#7A4B8C', sub: totalMods > 0 ? `${terminadosProd}/${liberadosD3D || totalMods} terminados` : 'Bloqueado' },
            { icon: '🔧', label: 'Instalación',  done: false, active: terminadosProd === totalMods && totalMods > 0, color: '#2C6E9E', sub: 'Corre en paralelo' },
          ].map((e, i, arr) => (
            <div key={e.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', fontSize: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: e.done ? e.color + '30' : e.active ? e.color + '15' : '#101215',
                  border: `2px solid ${e.done ? e.color : e.active ? e.color + '60' : '#1E2433'}`,
                  opacity: e.active || e.done ? 1 : 0.4,
                  transition: 'background 250ms ease, border-color 250ms ease, opacity 250ms ease',
                }}>
                  {e.icon}
                </div>
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: e.done || e.active ? '#E2E8F0' : '#374151' }}>{e.label}</div>
                  <div style={{ fontSize: 10, color: e.done ? e.color : '#6B7280', marginTop: 2, maxWidth: 90 }}>{e.sub}</div>
                </div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ height: 2, width: 32, background: e.done ? e.color : '#1E2433', flexShrink: 0, marginBottom: 28, borderRadius: 1, transition: 'background 250ms ease' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Fecha de entrega del proyecto ── */}
      {p.fechaEntrega && (() => {
        const d = Math.floor((new Date(p.fechaEntrega) - new Date()) / 86400000);
        const atrasadoFecha = d < 0;
        const urgente = d >= 0 && d <= 7;
        const color = atrasadoFecha ? '#EF4444' : urgente ? '#F97316' : '#16A34A';
        const bg    = atrasadoFecha ? '#450A0A' : urgente ? '#431407' : '#052E16';
        const label = atrasadoFecha ? `Vencido hace ${Math.abs(d)} día${Math.abs(d) !== 1 ? 's' : ''}` : `${d} día${d !== 1 ? 's' : ''} restante${d !== 1 ? 's' : ''}`;
        return (
          <div style={{ background: bg, border: `1px solid ${color}40`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={16} color={color} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color }}>
                  {atrasadoFecha ? '⚠ Proyecto atrasado' : urgente ? '⚡ Entrega próxima' : '✓ Entrega en tiempo'}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  Fecha estimada: <strong style={{ color }}>{p.fechaEntrega}</strong>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="font-stamp" style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{Math.abs(d)}</div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>días {atrasadoFecha ? 'vencido' : 'restantes'}</div>
            </div>
          </div>
        );
      })()}

      {/* ── Alertas rápidas ── */}
      {(atrasados > 0 || (totalMods > 0 && liberadosArq === 0)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {totalMods > 0 && liberadosArq === 0 && (
            <div style={{ background: '#451A03', border: '1px solid #D97706', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#FCD34D', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={13} /> Módulos generados pero ninguno liberado a Diseño 3D — revisa si falta algo (ej. medidas del cliente)
            </div>
          )}
          {atrasados > 0 && (
            <div style={{ background: '#450A0A', border: '1px solid #EF4444', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} /> {atrasados} módulo{atrasados > 1 ? 's' : ''} con fecha de entrega vencida
            </div>
          )}
        </div>
      )}

      {/* ── Instalaciones en paralelo ── */}
      <div style={{ background: '#0A0D14', border: '1px solid #2C6E9E20', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>🔧 Instalaciones / Obra</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { label: '1ª Visita', done: !!inst.firstVisitDate, value: inst.firstVisitDate },
            { label: 'Informe técnico', done: !!inst.initialTechnicalReportLink, link: inst.initialTechnicalReportLink },
            { label: '2ª Visita', done: !!inst.secondVisitDate, value: inst.secondVisitDate },
            { label: 'Obra lista', done: !!inst.siteReady },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.done ? <CheckCircle2 size={11} color="#2C6E9E" /> : <Circle size={11} color="#374151" />}
              <span style={{ fontSize: 11, color: item.done ? '#8FC3E3' : '#6B7280' }}>{item.label}</span>
              {item.link && item.done && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', fontSize: 10 }}>
                  Ver <ExternalLink size={9} />
                </a>
              )}
              {item.value && !item.link && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4B5563' }}>{item.value}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Módulos ── */}
      {totalMods > 0 && (
        <div>
          {/* Resumen estadístico */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Total módulos',    value: totalMods,       color: '#E2E8F0' },
              { label: 'En Diseño 3D',     value: liberadosArq,    color: '#E3A868' },
              { label: 'En Producción',    value: liberadosD3D,    color: '#C9A8D6' },
              { label: 'Terminados',       value: terminadosProd,  color: terminadosProd === totalMods ? '#86EFAC' : '#9CA3AF' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#0A0D14', border: '1px solid #1E2433', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div className="font-stamp" style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
            Estado por módulo
          </div>
          {modulos.map((mod, i) => <ModuloRow key={mod.id} mod={mod} index={i} />)}
        </div>
      )}

      {totalMods === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: '#4B5563', background: '#0A0D14', borderRadius: 10 }}>
          Este proyecto no tiene módulos registrados. Edítalo desde "Proyectos" para agregarlos.
        </div>
      )}
    </div>
  );
}

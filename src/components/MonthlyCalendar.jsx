import { useState } from 'react';
import { useApp } from '../App';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function diasEnMes(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function primerDia(year, month) {
  return new Date(year, month, 1).getDay();
}

function semaforo(fecha) {
  if (!fecha) return null;
  const d = Math.floor((new Date(fecha) - new Date()) / 86400000);
  if (d < 0)  return { color: '#EF4444', bg: '#450A0A', dot: '#EF4444', label: 'Atrasado' };
  if (d <= 5) return { color: '#F97316', bg: '#431407', dot: '#F97316', label: `${d}d` };
  if (d <= 15) return { color: '#D97706', bg: '#451A03', dot: '#D97706', label: `${d}d` };
  return { color: '#16A34A', bg: '#052E16', dot: '#16A34A', label: `${d}d` };
}

function prioridadColor(p) {
  if (p === 'Urgente') return '#EF4444';
  if (p === 'Alta')    return '#D97706';
  return '#2563EB';
}

export default function MonthlyCalendar() {
  const { proyectos, goToProject } = useApp();
  const hoy = new Date();
  const [year, setYear]   = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());
  const [hoveredDay, setHoveredDay] = useState(null);

  const safeProys = (proyectos || []).filter(p => p.fechaEntrega && p.estadoGeneral !== 'Finalizado');

  // Proyectos por día del mes actual
  function proyectosDelDia(dia) {
    const fechaStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    return safeProys.filter(p => p.fechaEntrega === fechaStr);
  }

  // Proyectos del mes (para la lista lateral)
  const proyectosMes = safeProys
    .filter(p => {
      const f = new Date(p.fechaEntrega + 'T00:00:00');
      return f.getFullYear() === year && f.getMonth() === month;
    })
    .sort((a, b) => a.fechaEntrega.localeCompare(b.fechaEntrega));

  // Proyectos atrasados (entrega pasada)
  const atrasados = safeProys.filter(p => {
    const f = new Date(p.fechaEntrega + 'T00:00:00');
    return f < new Date(new Date().toDateString());
  });

  function navMes(dir) {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  const totalDias  = diasEnMes(year, month);
  const primerDot  = primerDia(year, month);
  const hoyStr     = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '100vh', background: '#0F1117' }}>

      {/* ── Panel lateral izquierdo ── */}
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid #1E2433', padding: '20px 16px', overflowY: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 14 }}>
          {MESES[month]} {year}
        </div>

        {/* Atrasados */}
        {atrasados.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                Atrasados — {atrasados.length}
              </span>
            </div>
            {atrasados.map(p => (
              <div key={p.id} onClick={() => goToProject(p.id)}
                style={{ background: '#450A0A', border: '1px solid #EF444430', borderRadius: 8, padding: '8px 10px', marginBottom: 5, cursor: 'pointer' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#FCA5A5' }}>{p.nombre}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{p.cliente}</div>
                <div style={{ fontSize: 10, color: '#EF4444', fontWeight: 600, marginTop: 3 }}>Venció el {p.fechaEntrega}</div>
              </div>
            ))}
          </div>
        )}

        {/* Proyectos del mes */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Este mes — {proyectosMes.length}
            </span>
          </div>
          {proyectosMes.length === 0 && (
            <div style={{ fontSize: 11, color: '#4B5563', textAlign: 'center', padding: '16px 0' }}>Sin entregas este mes</div>
          )}
          {proyectosMes.map(p => {
            const sem = semaforo(p.fechaEntrega);
            const dia = parseInt(p.fechaEntrega.split('-')[2]);
            return (
              <div key={p.id} onClick={() => goToProject(p.id)}
                style={{ background: '#141824', border: `1px solid ${sem?.dot || '#1E2433'}25`, borderLeft: `3px solid ${sem?.dot || '#2563EB'}`, borderRadius: '0 8px 8px 0', padding: '8px 10px', marginBottom: 5, cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a1f2e'}
                onMouseLeave={e => e.currentTarget.style.background = '#141824'}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{p.cliente}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sem?.color || '#6B7280' }}>{dia}</div>
                    <div style={{ fontSize: 9, color: sem?.color || '#6B7280', fontWeight: 600 }}>{sem?.label}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: p.prioridad === 'Urgente' ? '#450A0A' : p.prioridad === 'Alta' ? '#451A03' : '#1F2937', color: p.prioridad === 'Urgente' ? '#FCA5A5' : p.prioridad === 'Alta' ? '#FCD34D' : '#9CA3AF', fontWeight: 600 }}>
                    {p.prioridad}
                  </span>
                  {p.lineaProyecto && (
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: p.lineaProyecto === 'Element' ? '#2D1B69' : '#1E3A5F', color: p.lineaProyecto === 'Element' ? '#C4B5FD' : '#93C5FD', fontWeight: 600 }}>
                      {p.lineaProyecto}
                    </span>
                  )}
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#1F2937', color: '#9CA3AF' }}>{p.estadoGeneral}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Calendario principal ── */}
      <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: 0, fontFamily: 'var(--font-display)' }}>Calendario de entregas</h1>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Fechas de entrega estimadas por proyecto</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navMes(-1)} style={{ background: '#141824', border: '1px solid #1E2433', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', minWidth: 140, textAlign: 'center' }}>
              {MESES[month]} {year}
            </span>
            <button onClick={() => navMes(1)} style={{ background: '#141824', border: '1px solid #1E2433', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => { setMonth(hoy.getMonth()); setYear(hoy.getFullYear()); }}
              style={{ background: '#2563EB20', border: '1px solid #2563EB40', borderRadius: 8, color: '#93C5FD', cursor: 'pointer', padding: '6px 14px', fontSize: 12, fontWeight: 600 }}>
              Hoy
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#4B5563', padding: '6px 0', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid del mes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {/* Celdas vacías al inicio */}
          {Array.from({ length: primerDot }).map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: 90, background: '#0A0D14', borderRadius: 8, opacity: 0.3 }} />
          ))}

          {/* Días del mes */}
          {Array.from({ length: totalDias }).map((_, i) => {
            const dia = i + 1;
            const fechaStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
            const esHoy    = fechaStr === hoyStr;
            const proys    = proyectosDelDia(dia);
            const hayAtrasados = proys.some(p => new Date(p.fechaEntrega) < new Date(new Date().toDateString()));

            return (
              <div key={dia}
                onMouseEnter={() => setHoveredDay(dia)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  minHeight: 90, background: esHoy ? '#1E3A5F20' : hoveredDay === dia ? '#141824' : '#0F1117',
                  border: `1px solid ${esHoy ? '#2563EB40' : hayAtrasados ? '#EF444420' : '#1E2433'}`,
                  borderRadius: 8, padding: '6px 8px', transition: 'all .1s', position: 'relative',
                }}>
                {/* Número del día */}
                <div style={{
                  fontSize: 12, fontWeight: esHoy ? 700 : 500,
                  color: esHoy ? '#fff' : '#9CA3AF',
                  background: esHoy ? '#2563EB' : 'transparent',
                  width: esHoy ? 24 : 'auto', height: esHoy ? 24 : 'auto',
                  borderRadius: esHoy ? '50%' : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 4,
                }}>{dia}</div>

                {/* Proyectos del día */}
                {proys.slice(0, 3).map(p => {
                  const sem = semaforo(p.fechaEntrega);
                  return (
                    <div key={p.id} onClick={() => goToProject(p.id)}
                      style={{
                        background: sem?.bg || '#1F2937',
                        border: `1px solid ${sem?.dot || '#374151'}40`,
                        borderRadius: 5, padding: '3px 6px', marginBottom: 2,
                        cursor: 'pointer', transition: 'opacity .1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: sem?.color || '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nombre}
                      </div>
                      <div style={{ fontSize: 9, color: '#6B7280', marginTop: 1 }}>{p.cliente}</div>
                    </div>
                  );
                })}

                {/* Más proyectos */}
                {proys.length > 3 && (
                  <div style={{ fontSize: 9, color: '#6B7280', fontWeight: 600, padding: '2px 4px' }}>
                    +{proys.length - 3} más
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, padding: '12px 16px', background: '#141824', borderRadius: 10, border: '1px solid #1E2433' }}>
          {[
            { color: '#EF4444', label: 'Atrasado' },
            { color: '#F97316', label: 'Urgente (≤5 días)' },
            { color: '#D97706', label: 'Próximo (≤15 días)' },
            { color: '#16A34A', label: 'En tiempo' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

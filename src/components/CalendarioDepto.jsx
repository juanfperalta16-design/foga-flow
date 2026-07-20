// =====================================================
// FOGA FLOW — CalendarioDepto.jsx
// Calendario de entregas interno por departamento
// Muestra fecha que el jefe asignó para ese depto
// =====================================================
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function semaforo(fecha) {
  if (!fecha) return null;
  const d = Math.floor((new Date(fecha) - new Date()) / 86400000);
  if (d < 0)   return { color: '#EF4444', bg: '#450A0A', label: `${Math.abs(d)}d atrasado` };
  if (d <= 5)  return { color: '#F97316', bg: '#431407', label: `${d}d` };
  if (d <= 15) return { color: '#D97706', bg: '#451A03', label: `${d}d` };
  return { color: '#16A34A', bg: '#052E16', label: `${d}d` };
}

export default function CalendarioDepto({ proyectos, departamento, cfg, onGoProject }) {
  const hoy   = new Date();
  const [year, setYear]   = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());

  function navMes(dir) {
    let m = month + dir, y = year;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    setMonth(m); setYear(y);
  }

  // Obtener fecha del departamento por proyecto
  function fechaDepto(p) {
    const fd = p.fechasDepto || {};
    switch(departamento) {
      case 'Arquitectura':  return fd.arquitectura  || null;
      case 'Diseño 3D':     return fd.diseno3d      || null;
      // Producción debe ver la fecha real de instalación del cliente (fechaEntrega)
      // si no se cargó una fecha interna propia — es el plazo real que importa.
      case 'Producción':    return fd.produccion || p.fechaEntrega || null;
      // Instalaciones ya no se carga a mano — es la fecha de instalación que puso el cliente.
      case 'Instalaciones': return p.fechaEntrega || null;
      default: return null;
    }
  }

  const safeProys = (proyectos || []).filter(p => {
    const f = fechaDepto(p);
    return f && p.estadoGeneral !== 'Finalizado';
  });

  const totalDias = new Date(year, month + 1, 0).getDate();
  const primerDia = new Date(year, month, 1).getDay();
  const hoyStr    = hoy.toISOString().slice(0,10);

  function proyectosDelDia(dia) {
    const fechaStr = `${year}-${String(month+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    return safeProys.filter(p => fechaDepto(p) === fechaStr);
  }

  // Lista del mes
  const delMes = safeProys
    .filter(p => { const f = fechaDepto(p); if (!f) return false; const d = new Date(f); return d.getFullYear() === year && d.getMonth() === month; })
    .sort((a,b) => fechaDepto(a).localeCompare(fechaDepto(b)));

  const atrasados = safeProys.filter(p => { const f = fechaDepto(p); return f && new Date(f) < new Date(new Date().toDateString()); });

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%' }}>

      {/* Panel lateral */}
      <div style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${cfg.color}20`, padding: '16px 14px', overflowY: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
          📅 Entregas — {MESES[month]}
        </div>

        {/* Atrasados */}
        {atrasados.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
              ⚠ Atrasados — {atrasados.length}
            </div>
            {atrasados.map(p => {
              const f   = fechaDepto(p);
              const sem = semaforo(f);
              return (
                <div key={p.id} onClick={() => onGoProject && onGoProject(p.id)}
                  style={{ background: '#450A0A', border: '1px solid #EF444430', borderRadius: 7, padding: '7px 10px', marginBottom: 5, cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#FCA5A5' }}>{p.nombre}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{p.cliente}</div>
                  <div style={{ fontSize: 10, color: '#EF4444', fontWeight: 600, marginTop: 3 }}>Venció: {f}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Del mes */}
        {delMes.length === 0 && atrasados.length === 0 && (
          <div style={{ fontSize: 11, color: '#4B5563', textAlign: 'center', padding: '20px 0' }}>
            Sin entregas este mes
          </div>
        )}
        {delMes.map(p => {
          const f   = fechaDepto(p);
          const sem = semaforo(f);
          const dia = parseInt(f?.split('-')[2]);
          return (
            <div key={p.id} onClick={() => onGoProject && onGoProject(p.id)}
              style={{ background: '#141824', borderLeft: `3px solid ${sem?.color || cfg.color}`, borderRadius: '0 8px 8px 0', padding: '8px 10px', marginBottom: 5, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                  <div style={{ fontSize: 10, color: '#6B7280' }}>{p.cliente}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: sem?.color || cfg.color }}>{dia}</div>
                  <div style={{ fontSize: 9, color: sem?.color || '#6B7280', fontWeight: 600 }}>{sem?.label}</div>
                </div>
              </div>
              {p.prioridad && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, marginTop: 4, display: 'inline-block', background: p.prioridad === 'Urgente' ? '#450A0A' : p.prioridad === 'Alta' ? '#451A03' : '#1F2937', color: p.prioridad === 'Urgente' ? '#FCA5A5' : p.prioridad === 'Alta' ? '#FCD34D' : '#9CA3AF' }}>
                  {p.prioridad}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Grilla del mes */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
        {/* Nav mes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => navMes(-1)} style={{ background: '#141824', border: `1px solid ${cfg.color}30`, borderRadius: 7, color: '#9CA3AF', cursor: 'pointer', padding: '5px 8px', display: 'flex' }}>
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>{MESES[month]} {year}</span>
          <button onClick={() => navMes(1)} style={{ background: '#141824', border: `1px solid ${cfg.color}30`, borderRadius: 7, color: '#9CA3AF', cursor: 'pointer', padding: '5px 8px', display: 'flex' }}>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Días semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
          {DIAS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#4B5563', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '.4px' }}>{d}</div>)}
        </div>

        {/* Celdas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {Array.from({ length: primerDia }).map((_, i) => (
            <div key={`e${i}`} style={{ minHeight: 80, background: '#0A0D14', borderRadius: 6, opacity: 0.3 }} />
          ))}
          {Array.from({ length: totalDias }).map((_, i) => {
            const dia      = i + 1;
            const fechaStr = `${year}-${String(month+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
            const esHoy    = fechaStr === hoyStr;
            const proys    = proyectosDelDia(dia);

            return (
              <div key={dia} style={{
                minHeight: 80, background: esHoy ? `${cfg.color}10` : '#101215',
                border: `1px solid ${esHoy ? cfg.color + '50' : proys.length > 0 ? cfg.color + '20' : '#1E2433'}`,
                borderRadius: 6, padding: '5px 6px',
              }}>
                <div style={{ fontSize: 11, fontWeight: esHoy ? 700 : 500, color: esHoy ? cfg.color : '#6B7280', background: esHoy ? cfg.color + '20' : 'transparent', width: esHoy ? 22 : 'auto', height: esHoy ? 22 : 'auto', borderRadius: esHoy ? '50%' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  {dia}
                </div>
                {proys.slice(0,2).map(p => {
                  const sem = semaforo(fechaStr);
                  return (
                    <div key={p.id} onClick={() => onGoProject && onGoProject(p.id)}
                      style={{ background: sem?.bg || cfg.bg, borderRadius: 4, padding: '2px 5px', marginBottom: 2, cursor: 'pointer' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: sem?.color || cfg.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                    </div>
                  );
                })}
                {proys.length > 2 && <div style={{ fontSize: 9, color: '#6B7280' }}>+{proys.length - 2}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '../App';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDiasDelMes, getNombreDia, getNombreMes, today, formatFechaCorta } from '../utils/dateHelpers';
import { getDeptColor, getStatusColor } from '../utils/statusHelpers';
import ActivityModal from './ActivityModal';

const DEPTS = ['Arquitectura','Diseño','Obra','Producción','Instalación'];

export default function MonthlyCalendar() {
  const { actividades } = useApp();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);
  const [view, setView] = useState('dept'); // 'month' | 'dept'
  const [selectedAct, setSelectedAct] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const hoy = today();

  const dias = getDiasDelMes(year, month);

  const actsByDate = {};
  actividades.forEach(a => {
    if (!a.fechaInicio) return;
    const start = a.fechaInicio;
    const end = a.fechaLimite || start;
    dias.forEach(dia => {
      if (dia >= start && dia <= end) {
        if (!actsByDate[dia]) actsByDate[dia] = [];
        actsByDate[dia].push(a);
      }
    });
  });

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const ActCard = ({ act, compact = false }) => {
    const c = getDeptColor(act.departamento);
    const sc = getStatusColor(act.estado);
    return (
      <div onClick={(e) => { e.stopPropagation(); setSelectedAct(act); }}
        className={`cursor-pointer rounded px-1.5 py-1 border-l-2 ${c.border} ${c.light} hover:brightness-125 transition-all mb-1`}>
        {!compact && <div className={`text-[9px] font-bold ${c.text} mb-0.5`}>{act.departamento}</div>}
        <div className="text-[10px] font-medium text-white leading-tight truncate">{act.proyecto}</div>
        <div className="text-[9px] text-slate-400 truncate">{act.actividad}</div>
        {!compact && <div className="flex items-center gap-1 mt-0.5">
          <span className={`text-[8px] px-1 py-0.5 rounded ${sc.bg} ${sc.text}`}>{act.estado}</span>
        </div>}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendario</h1>
          <p className="text-slate-400 text-sm">{getNombreMes(month)} {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {[['dept','Por departamentos'],['month','Vista mensual']].map(([v,l]) => (
              <button key={v} onClick={() => setView(v)} className={`text-xs px-3 py-1.5 transition-colors ${view === v ? 'bg-blue-600 text-white' : 'bg-[#161820] text-slate-400 hover:text-white'}`}>{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm text-white font-medium w-28 text-center">{getNombreMes(month)} {year}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {DEPTS.map(d => {
          const c = getDeptColor(d);
          return (
            <button key={d} onClick={() => setFilterDept(filterDept === d ? '' : d)}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-all ${filterDept === d ? `${c.bg} border-transparent text-white` : `${c.border} ${c.text} border-opacity-50 hover:border-opacity-100`}`}>
              <span className={`w-2 h-2 rounded-full ${c.bg}`} />{d}
            </button>
          );
        })}
        {filterDept && <button onClick={() => setFilterDept('')} className="text-xs text-slate-500 hover:text-white">✕ Limpiar</button>}
      </div>

      {view === 'month' ? (
        <MonthView dias={dias} actsByDate={actsByDate} hoy={hoy} ActCard={ActCard} filterDept={filterDept} />
      ) : (
        <DeptView dias={dias} actividades={actividades} hoy={hoy} setSelectedAct={setSelectedAct} filterDept={filterDept} year={year} month={month} />
      )}

      {selectedAct && <ActivityModal actividad={selectedAct} onClose={() => setSelectedAct(null)} />}
    </div>
  );
}

function MonthView({ dias, actsByDate, hoy, ActCard, filterDept }) {
  const firstDay = new Date(dias[0] + 'T12:00:00').getDay();
  const padded = Array(firstDay).fill(null).concat(dias);
  const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  return (
    <div className="bg-[#161820] border border-white/5 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-white/5">
        {DIAS_SEMANA.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-500 py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {padded.map((dia, i) => {
          if (!dia) return <div key={i} className="border-r border-b border-white/5 min-h-24" />;
          const acts = (actsByDate[dia] || []).filter(a => !filterDept || a.departamento === filterDept);
          const isToday = dia === hoy;
          const dayNum = parseInt(dia.split('-')[2]);
          return (
            <div key={dia} className={`border-r border-b border-white/5 min-h-24 p-1.5 ${isToday ? 'bg-blue-950/30' : 'hover:bg-white/3'} transition-colors`}>
              <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-500 text-white' : 'text-slate-400'}`}>{dayNum}</div>
              <div className="overflow-hidden">
                {acts.slice(0, 3).map(a => <ActCard key={a.id} act={a} compact />)}
                {acts.length > 3 && <div className="text-[9px] text-slate-500 pl-1">+{acts.length - 3} más</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeptView({ dias, actividades, hoy, setSelectedAct, filterDept, year, month }) {
  const DEPTS_SHOW = filterDept ? [filterDept] : ['Arquitectura','Diseño','Obra','Producción','Instalación'];

  const getActsForDeptDay = (dept, dia) => {
    return actividades.filter(a => {
      if (a.departamento !== dept) return false;
      const start = a.fechaInicio || '';
      const end = a.fechaLimite || start;
      return dia >= start && dia <= end;
    });
  };

  // Only show days that have at least one activity or are today
  const diasConActividad = dias.filter(dia => {
    if (dia === hoy) return true;
    return DEPTS_SHOW.some(d => getActsForDeptDay(d, dia).length > 0);
  });

  if (diasConActividad.length === 0) {
    return <div className="bg-[#161820] border border-white/5 rounded-xl p-8 text-center text-slate-500">Sin actividades en este mes</div>;
  }

  return (
    <div className="bg-[#161820] border border-white/5 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-[10px] font-bold text-slate-500 uppercase px-3 py-3 w-24 sticky left-0 bg-[#161820] z-10">Día</th>
              {DEPTS_SHOW.map(d => {
                const c = getDeptColor(d);
                return <th key={d} className="text-left px-3 py-3 min-w-44">
                  <span className={`text-[10px] font-bold ${c.text} uppercase`}>{d}</span>
                </th>;
              })}
            </tr>
          </thead>
          <tbody>
            {diasConActividad.map(dia => {
              const isToday = dia === hoy;
              const dayNum = parseInt(dia.split('-')[2]);
              const dayName = getNombreDia(dia);
              return (
                <tr key={dia} className={`border-b border-white/5 ${isToday ? 'bg-blue-950/20' : 'hover:bg-white/2'}`}>
                  <td className={`px-3 py-2 sticky left-0 z-10 ${isToday ? 'bg-blue-950/40' : 'bg-[#161820]'}`}>
                    <div className={`text-sm font-bold ${isToday ? 'text-blue-400' : 'text-white'}`}>{dayNum}</div>
                    <div className="text-[9px] text-slate-500 uppercase">{dayName}</div>
                    {isToday && <span className="text-[8px] bg-blue-500 text-white px-1 rounded">HOY</span>}
                  </td>
                  {DEPTS_SHOW.map(dept => {
                    const acts = getActsForDeptDay(dept, dia);
                    const c = getDeptColor(dept);
                    return (
                      <td key={dept} className="px-2 py-2 align-top">
                        {acts.map(a => {
                          const sc = getStatusColor(a.estado);
                          return (
                            <div key={a.id} onClick={() => setSelectedAct(a)}
                              className={`cursor-pointer rounded-lg border-l-2 ${c.border} ${c.light} px-2 py-1.5 mb-1 hover:brightness-125 transition-all`}>
                              <div className="text-[10px] font-semibold text-white truncate">{a.proyecto}</div>
                              <div className="text-[9px] text-slate-300 truncate">{a.actividad}</div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[8px] text-slate-500">{a.responsable?.split(' ')[0]}</span>
                                <span className={`text-[8px] px-1 py-0.5 rounded ${sc.bg} ${sc.text}`}>{a.estado}</span>
                              </div>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

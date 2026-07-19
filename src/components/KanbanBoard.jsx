import { useState } from 'react';
import { useApp } from '../App';
import { isAtrasado, formatFecha } from '../utils/dateHelpers';
import { getDeptColor, getDeptActual } from '../utils/statusHelpers';
import { StatusChip, DeptChip } from './StatusChip';

const COLUMNAS_GENERAL = [
  { id: 'arquitectura', label: 'Arquitectura', color: 'border-purple-600' },
  { id: 'diseno', label: 'Diseño 3D', color: 'border-blue-600' },
  { id: 'obra', label: 'Instalaciones', color: 'border-amber-600' },
  { id: 'produccion', label: 'Producción', color: 'border-orange-600' },
  { id: 'instalacion', label: 'Instalación', color: 'border-green-600' },
  { id: 'finalizado', label: 'Finalizado', color: 'border-slate-600' },
];

// Mapea el departamento real (calculado con getDeptActual) a la columna del tablero.
const DEPT_TO_COL = {
  'Finalizado':  'finalizado',
  'Producción':  'produccion',
  'Diseño':      'diseno',
  'Instalación': 'instalacion',
  'Obra':        'obra',
  'Arquitectura':'arquitectura',
};

const getKanbanCol = (p) => DEPT_TO_COL[getDeptActual(p)] || 'arquitectura';

export default function KanbanBoard() {
  const { proyectos, goToProject } = useApp();
  const [filterDept, setFilterDept] = useState('');

  const filtered = filterDept ? proyectos.filter(p => getDeptActual(p) === filterDept) : proyectos;

  const DEPTS = ['Arquitectura','Diseño','Obra','Producción','Instalación'];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Kanban</h1>
          <p className="text-slate-400 text-sm">{filtered.length} proyectos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterDept('')} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!filterDept ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-slate-400 hover:text-white'}`}>Todos</button>
          {DEPTS.map(d => {
            const c = getDeptColor(d);
            return <button key={d} onClick={() => setFilterDept(filterDept === d ? '' : d)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filterDept === d ? `${c.bg} border-transparent text-white` : `${c.border} ${c.text}`}`}>{d}</button>;
          })}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNAS_GENERAL.map(col => {
          const items = filtered.filter(p => getKanbanCol(p) === col.id);
          return (
            <div key={col.id} className={`shrink-0 w-60 bg-[#161820] border-t-2 ${col.color} rounded-xl flex flex-col`}>
              <div className="px-3 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-white">{col.label}</span>
                <span className="text-xs bg-white/10 text-slate-300 px-1.5 py-0.5 rounded">{items.length}</span>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[70vh]">
                {items.map(p => {
                  const atrasado = isAtrasado(p.fechaEntrega, p.estadoGeneral);
                  return (
                    <div key={p.id} onClick={() => goToProject(p.id)}
                      className={`cursor-pointer bg-[#0F1117] border rounded-lg p-3 hover:border-white/20 transition-all ${atrasado ? 'border-red-800/70' : 'border-white/5'}`}>
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div className="text-xs font-medium text-white leading-tight">{p.nombre}</div>
                        {atrasado && <span className="text-[8px] bg-red-700 text-white px-1 py-0.5 rounded font-bold shrink-0">ATR.</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mb-2">{p.cliente}</div>
                      <div className="flex items-center gap-1 flex-wrap mb-2">
                        <DeptChip dept={getDeptActual(p)} size="xs" />
                      </div>
                      {p.proximaAccion && <div className="text-[9px] text-blue-400 truncate">{p.proximaAccion}</div>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[9px] text-slate-500">{p.responsableGeneral}</span>
                        <span className="text-[9px] text-slate-500">{formatFecha(p.fechaEntrega)}</span>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <div className="text-[10px] text-slate-600 text-center py-4">Vacío</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '../App';
import { isAtrasado, formatFecha } from '../utils/dateHelpers';
import { getDeptColor } from '../utils/statusHelpers';
import { StatusChip, DeptChip, PrioridadChip } from './StatusChip';
import { Search, Plus, Filter, ChevronRight } from 'lucide-react';
import ProjectForm from './ProjectForm';

export default function Projects() {
  const { proyectos, goToProject } = useApp();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = proyectos.filter(p => {
    const matchSearch = !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.cliente.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || p.departamentoActual === filterDept;
    const matchEstado = !filterEstado || p.estadoGeneral === filterEstado;
    const matchPrio = !filterPrioridad || p.prioridad === filterPrioridad;
    return matchSearch && matchDept && matchEstado && matchPrio;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proyectos</h1>
          <p className="text-slate-400 text-sm">{filtered.length} proyectos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Plus size={14} /> Nuevo proyecto
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyecto o cliente..." className="w-full bg-[#161820] border border-white/10 rounded-lg text-sm text-white pl-8 pr-3 py-2 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
        </div>
        {[
          { val: filterDept, set: setFilterDept, opts: ['','Arquitectura','Diseño','Obra','Producción','Instalación','Proyectos'], label: 'Departamento' },
          { val: filterEstado, set: setFilterEstado, opts: ['','Esperando contrato','En arquitectura','En diseño','En obra','En producción','En instalación','Con observaciones','Finalizado'], label: 'Estado' },
          { val: filterPrioridad, set: setFilterPrioridad, opts: ['','Baja','Normal','Alta','Urgente'], label: 'Prioridad' },
        ].map(({ val, set, opts, label }) => (
          <select key={label} value={val} onChange={e => set(e.target.value)} className="bg-[#161820] border border-white/10 rounded-lg text-sm text-slate-300 px-3 py-2 focus:outline-none focus:border-blue-500">
            {opts.map(o => <option key={o} value={o}>{o || label}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#161820] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Proyecto / Cliente','Contrato','Departamento','Arq.','Diseño','Obra','Prod.','Inst.','Entrega','Prioridad','Estado',''].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-3 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(p => {
                const atrasado = isAtrasado(p.fechaEntrega, p.estadoGeneral);
                const etapas = [
                  { val: p.arquitectura?.estadoArquitectura },
                  { val: p.diseno?.estadoDiseno },
                  { val: p.obra?.estadoObra },
                  { val: p.produccion?.estadoProduccion },
                  { val: p.instalacion?.estadoInstalacion },
                ];
                return (
                  <tr key={p.id} className={`hover:bg-white/3 cursor-pointer transition-colors ${atrasado ? 'bg-red-950/20' : ''}`} onClick={() => goToProject(p.id)}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {atrasado && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />}
                        <div>
                          <div className="font-medium text-white text-xs">{p.nombre}</div>
                          <div className="text-slate-500 text-[10px]">{p.cliente}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.contratoFirmado ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {p.contratoFirmado ? '✓ Firmado' : '✗ Pendiente'}
                      </span>
                    </td>
                    <td className="px-3 py-3"><DeptChip dept={p.departamentoActual} size="xs" /></td>
                    {etapas.map((e, i) => (
                      <td key={i} className="px-3 py-3"><StatusChip estado={e.val || '—'} size="xs" /></td>
                    ))}
                    <td className="px-3 py-3">
                      <span className={`text-[10px] ${atrasado ? 'text-red-400 font-bold' : 'text-slate-400'}`}>{formatFecha(p.fechaEntrega)}</span>
                    </td>
                    <td className="px-3 py-3"><PrioridadChip prioridad={p.prioridad} /></td>
                    <td className="px-3 py-3"><StatusChip estado={p.estadoGeneral} size="xs" /></td>
                    <td className="px-3 py-3">
                      <ChevronRight size={14} className="text-slate-600" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-slate-500">No se encontraron proyectos</div>}
        </div>
      </div>

      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '../App';
import { isAtrasado, formatFecha } from '../utils/dateHelpers';
import { StatusChip, DeptChip, PrioridadChip } from './StatusChip';
import { Search, Plus, ChevronRight, Trash2 } from 'lucide-react';
import ProjectForm from './ProjectForm';
import { buildNuevoProyecto } from '../data/mockData';

export default function Projects() {
  const { proyectos, goToProject, updateProyecto, loadData } = useApp();
  const [search, setSearch]               = useState('');
  const [filterEstado, setFilterEstado]   = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [showForm, setShowForm]           = useState(false);
  const [editando, setEditando]           = useState(null); // proyecto a editar
  const [confirmDelete, setConfirmDelete] = useState(null); // id a eliminar

  // ── Filtros ──
  const filtered = (proyectos || []).filter(p => {
    const matchSearch = !search ||
      (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.cliente || '').toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filterEstado || p.estadoGeneral === filterEstado;
    const matchPrio   = !filterPrioridad || p.prioridad === filterPrioridad;
    return matchSearch && matchEstado && matchPrio;
  });

  // ── Estados únicos para el filtro ──
  const estadosUnicos = [...new Set((proyectos || []).map(p => p.estadoGeneral).filter(Boolean))];

  // ── Eliminar proyecto ──
  function eliminarProyecto(id) {
    const actualizados = (proyectos || []).filter(p => p.id !== id);
    // Guardar en localStorage directamente
    try { localStorage.setItem('foga_proyectos', JSON.stringify(actualizados)); } catch(e) {}
    loadData();
    setConfirmDelete(null);
  }

  // ── Nuevo proyecto ──
  function handleNuevo() {
    setEditando(null);
    setShowForm(true);
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proyectos</h1>
          <p className="text-slate-400 text-sm">{filtered.length} de {(proyectos||[]).length} proyectos</p>
        </div>
        <button onClick={handleNuevo}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium">
          <Plus size={14} /> Nuevo proyecto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proyecto o cliente..."
            className="w-full bg-[#161820] border border-white/10 rounded-lg text-sm text-white pl-8 pr-3 py-2 placeholder-slate-600 focus:outline-none focus:border-purple-500" />
        </div>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
          className="bg-[#161820] border border-white/10 rounded-lg text-sm text-slate-300 px-3 py-2 focus:outline-none focus:border-purple-500">
          <option value="">Todos los estados</option>
          {estadosUnicos.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filterPrioridad} onChange={e => setFilterPrioridad(e.target.value)}
          className="bg-[#161820] border border-white/10 rounded-lg text-sm text-slate-300 px-3 py-2 focus:outline-none focus:border-purple-500">
          <option value="">Todas las prioridades</option>
          {['Baja','Normal','Alta','Urgente'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-[#161820] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Proyecto / Cliente','Contrato','Estado','Prioridad','Entrega','Arq.','Inst.','D3D','Prod.',''].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-3 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(p => {
                const atrasado = isAtrasado(p.fechaEntrega, p.estadoGeneral);
                return (
                  <tr key={p.id}
                    className={`hover:bg-white/3 transition-colors ${atrasado ? 'bg-red-950/20' : ''}`}>
                    {/* Nombre */}
                    <td className="px-3 py-3 cursor-pointer" onClick={() => goToProject(p.id)}>
                      <div className="flex items-center gap-2">
                        {atrasado && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />}
                        <div>
                          <div className="font-medium text-white text-xs">{p.nombre}</div>
                          <div className="text-slate-500 text-[10px]">{p.cliente}</div>
                        </div>
                      </div>
                    </td>
                    {/* Contrato */}
                    <td className="px-3 py-3">
                      {p.contratoLink || p.contratoFirmado
                        ? <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-900 text-green-300">✓ Firmado</span>
                        : <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-900/60 text-red-300">Pendiente</span>
                      }
                    </td>
                    {/* Estado */}
                    <td className="px-3 py-3 cursor-pointer" onClick={() => goToProject(p.id)}>
                      <StatusChip estado={p.estadoGeneral} size="xs" />
                    </td>
                    {/* Prioridad */}
                    <td className="px-3 py-3"><PrioridadChip prioridad={p.prioridad} /></td>
                    {/* Entrega */}
                    <td className="px-3 py-3">
                      <span className={`text-[10px] ${atrasado ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                        {formatFecha(p.fechaEntrega) || '—'}
                      </span>
                    </td>
                    {/* Estados por dept */}
                    <td className="px-3 py-3"><StatusChip estado={p.architecture?.status || p.arquitectura?.estadoArquitectura || '—'} size="xs" /></td>
                    <td className="px-3 py-3"><StatusChip estado={p.installations?.status || p.instalacion?.estadoInstalacion || '—'} size="xs" /></td>
                    <td className="px-3 py-3"><StatusChip estado={p.design3d?.status || p.diseno?.estadoDiseno || '—'} size="xs" /></td>
                    <td className="px-3 py-3"><StatusChip estado={p.production?.status || p.produccion?.estadoProduccion || '—'} size="xs" /></td>
                    {/* Acciones */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => goToProject(p.id)} className="text-slate-600 hover:text-white transition-colors">
                          <ChevronRight size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id); }}
                          className="text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              {(proyectos||[]).length === 0 ? 'No hay proyectos. Crea el primero.' : 'No se encontraron proyectos con esos filtros.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161820] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold text-lg mb-2">¿Eliminar proyecto?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Esta acción no se puede deshacer. El proyecto será eliminado permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 text-slate-400 hover:text-white text-sm py-2 rounded-lg hover:bg-white/5 transition-colors border border-white/10">
                Cancelar
              </button>
              <button onClick={() => eliminarProyecto(confirmDelete)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition-colors font-medium">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form nuevo/editar */}
      {showForm && <ProjectForm onClose={() => { setShowForm(false); setEditando(null); }} proyecto={editando} />}
    </div>
  );
}

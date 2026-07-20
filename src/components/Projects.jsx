import { useState } from 'react';
import { useApp } from '../App';
import { isAtrasado, formatFecha } from '../utils/dateHelpers';
import { StatusChip, PrioridadChip } from './StatusChip';
import { Search, Plus, ChevronRight, Trash2, Package, AlertTriangle } from 'lucide-react';
import ProjectForm from './ProjectForm';

function disenador3D(p) {
  const d3 = p.design3d || {};
  const nombres = d3.responsables || (d3.responsible ? [d3.responsible] : []);
  return nombres.join(', ') || '—';
}

function bloqueadoD3D(p) {
  const mods = p.production?.modulos || [];
  if (mods.length === 0 || p.estadoGeneral === 'Finalizado') return false;
  return mods.every(m => !m.arquitectura?.liberadoA3D);
}

function etapaActual(p) {
  const d3      = p.design3d     || {};
  const prod    = p.production   || {};
  const arch    = p.architecture || {};
  const inst    = p.installations || {};
  const modulos = prod.modulos   || [];

  // ── Finalizado ──
  if (p.estadoGeneral === 'Finalizado') return { texto: 'Finalizado', color: '#86EFAC' };

  // ── Instalaciones activa ──
  if (p.releasedToInstallations || inst.firstVisitDate) {
    if (inst.siteReady) return { texto: 'Instalaciones — Obra lista', color: '#8FC3E3' };
    if (inst.secondVisitDate) return { texto: 'Instalaciones — 2ª visita realizada', color: '#8FC3E3' };
    if (inst.initialTechnicalReportLink) return { texto: 'Instalaciones — Informe técnico cargado', color: '#8FC3E3' };
    if (inst.firstVisitDate) return { texto: 'Instalaciones — 1ª visita realizada', color: '#8FC3E3' };
  }

  // ── Producción ──
  // Solo mostrar si realmente fue liberado por Diseño 3D
  const modsProd = modulos.filter(m => m.diseno3d?.liberadoProduccion);
  if (modsProd.length > 0 || d3.releasedToProduction) {
    const todosTerminados = modulos.length > 0 && modulos.every(m => m.produccion?.faseActual === '✓ Terminado');
    if (todosTerminados || prod.productionFinished) return { texto: 'Producción — Terminada', color: '#86EFAC' };

    // Módulo más avanzado
    const faseIndex = (fase) => {
      const fases = ['1. Despacho Materia Prima','2. Corte Láser','3. Plegado','4. Mesa de Trabajo (Maestros)','5. Pintura','6. Abrillantado','7. Terminados','8. Control de Calidad','9. Empaquetado','10. Bodega'];
      return fases.indexOf(fase);
    };
    const modActivo = modulos
      .filter(m => m.produccion?.faseActual && m.produccion.faseActual !== '✓ Terminado' && faseIndex(m.produccion.faseActual) >= 0)
      .sort((a,b) => faseIndex(b.produccion.faseActual) - faseIndex(a.produccion.faseActual))[0];
    if (modActivo) return { texto: `Producción — ${modActivo.produccion.faseActual}`, color: '#C9A8D6' };
    if (prod.partialProduction) return { texto: 'Producción — En proceso', color: '#C9A8D6' };
    return { texto: 'Producción — Pendiente inicio', color: '#C9A8D6' };
  }

  // ── Diseño 3D ──
  // Leer de módulos primero (fuente real), luego del proyecto
  if (p.releasedToDesign3D || modulos.some(m => m.arquitectura?.liberadoA3D)) {
    // Revisar estado más avanzado entre todos los módulos
    const modsD3D = modulos.filter(m => m.arquitectura?.liberadoA3D);
    const tieneDespiece      = modsD3D.some(m => m.diseno3d?.autocadBreakdownFinished || m.diseno3d?.breakdownCompleted);
    const tieneDespieceInicio = modsD3D.some(m => m.diseno3d?.autocadBreakdownStarted);
    const tieneSWTerminado   = modsD3D.some(m => m.diseno3d?.solidworksFinished || m.diseno3d?.design3DCompleted);
    const tieneSWInicio      = modsD3D.some(m => m.diseno3d?.solidworksStarted);
    const tieneLibProd       = modsD3D.some(m => m.diseno3d?.liberadoProduccion);
    const tienePlanCorte     = modsD3D.some(m => m.diseno3d?.planCorteLink);

    // También leer del proyecto general (para compatibilidad)
    const swInicio  = tieneSWInicio      || d3.solidworksStarted;
    const swFin     = tieneSWTerminado   || d3.solidworksFinished || d3.design3DCompleted;
    const dcInicio  = tieneDespieceInicio || d3.autocadBreakdownStarted;
    const dcFin     = tieneDespiece      || d3.autocadBreakdownFinished || d3.breakdownCompleted;
    const planCorte = tienePlanCorte     || !!d3.planCorteLink;
    const libProd   = tieneLibProd       || !!d3.releasedToProduction;

    if (libProd)   return { texto: 'Diseño 3D — Liberado a Producción', color: '#E3A868' };
    if (planCorte && dcFin) return { texto: 'Diseño 3D — Plano de corte listo', color: '#E3A868' };
    if (dcFin)     return { texto: 'Diseño 3D — Despiece terminado', color: '#E3A868' };
    if (dcInicio)  return { texto: 'Diseño 3D — Despiece AutoCAD en proceso', color: '#E3A868' };
    if (swFin)     return { texto: 'Diseño 3D — SolidWorks terminado', color: '#E3A868' };
    if (swInicio)  return { texto: 'Diseño 3D — Modelado SolidWorks en proceso', color: '#E3A868' };
    return { texto: 'Diseño 3D — Pendiente de inicio', color: '#E3A868' };
  }

  // ── Arquitectura ──
  const checklist = arch.checklist || {};
  if (checklist.planosAprobados)    return { texto: 'Arquitectura — Planos aprobados', color: '#F0D687' };
  if (checklist.ajustesRealizados)  return { texto: 'Arquitectura — Ajustes realizados', color: '#F0D687' };
  if (checklist.enviadoAVentas)     return { texto: 'Arquitectura — Enviado a Ventas', color: '#F0D687' };
  if (checklist.borradorConceptual) return { texto: 'Arquitectura — Borrador plano', color: '#F0D687' };
  if (checklist.propuestaInicial)   return { texto: 'Arquitectura — Propuesta inicial', color: '#F0D687' };
  if (arch.status && arch.status !== 'En propuesta') return { texto: `Arquitectura — ${arch.status}`, color: '#F0D687' };

  return { texto: 'En propuesta', color: '#9CA3AF' };
}

export default function Projects() {
  const { proyectos, prospectos, alertas, saveAlertas, goToProject, deleteProyecto } = useApp();
  const [tab, setTab]                         = useState('proyectos');
  const [search, setSearch]                   = useState('');
  const [filterEstado, setFilterEstado]       = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [filterMes, setFilterMes]             = useState('');
  const [showForm, setShowForm]               = useState(false);
  const [confirmDelete, setConfirmDelete]     = useState(null);

  const filtered = (proyectos || []).filter(p => {
    const matchSearch = !search ||
      (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.cliente || '').toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filterEstado    || p.estadoGeneral === filterEstado;
    const matchPrio   = !filterPrioridad || p.prioridad    === filterPrioridad;
    const matchMes    = !filterMes       || p.fechaEntrega?.slice(0,7) === filterMes;
    return matchSearch && matchEstado && matchPrio && matchMes;
  });

  const estadosUnicos = [...new Set((proyectos || []).map(p => p.estadoGeneral).filter(Boolean))];
  const mesesUnicos = [...new Set((proyectos || []).map(p => p.fechaEntrega?.slice(0,7)).filter(Boolean))].sort();
  const MESES_NOMBRE = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const labelMes = (ym) => { const [y,m] = ym.split('-'); return `${MESES_NOMBRE[parseInt(m,10)-1]} ${y}`; };

  async function eliminarProyecto(id) {
    await deleteProyecto(id);
    setConfirmDelete(null);
  }

  function modulosInfo(p) {
    const mods = p.production?.modulos || [];
    if (mods.length === 0) return null;
    const element   = mods.filter(m => m.linea === 'Element').length;
    const fogaFull  = mods.filter(m => m.linea === 'Santa Ana').length;
    const equifrigo = mods.filter(m => m.linea === 'Equifrigo').length;
    const atrasados = mods.filter(m => m.fechaEntrega && new Date(m.fechaEntrega) < new Date()).length;
    return { total: mods.length, element, fogaFull, equifrigo, atrasados };
  }

  function getMaestros(p) {
    const mods = p.production?.modulos || [];
    const maestros = [...new Set(mods.map(m => m.maestro).filter(Boolean))];
    return maestros.join(', ') || '—';
  }

  function ultimaActualizacion(p) {
    const checklist = p.checklist || {};
    const fechas = ['propuestaInicial','borradorConceptual','enviadoAVentas','ajustesRealizados','planosAprobados']
      .map(id => checklist[`${id}Fecha`]).filter(Boolean);
    if (fechas.length === 0) return p.fechaIngreso || null;
    return [...fechas].sort().slice(-1)[0];
  }

  const alertasPendientes = (alertas || []).filter(a => a.estado === 'Pendiente');

  function resolverAlerta(al) {
    if (al.auto) return;
    saveAlertas([{ ...al, estado: 'Resuelta' }]);
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Proyectos</h1>
          <p className="text-steel-muted text-sm">{filtered.length} de {(proyectos||[]).length} proyectos</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-flame hover:bg-flame-dim text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium">
          <Plus size={14} /> Nuevo proyecto
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {[['proyectos','📋 Proyectos'],['prospectos','✏️ Prospectos'],['alertas','⚠️ Alertas']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`text-sm px-5 py-2 rounded-t-lg transition-colors font-medium ${tab === id ? 'bg-white/10 text-white border-b-2 border-flame' : 'text-steel-muted hover:text-white'}`}>
            {label}
            {id === 'prospectos' && prospectos.length > 0 && (
              <span className="ml-2 text-[10px] bg-flame text-white px-1.5 py-0.5 rounded-full font-stamp">{prospectos.length}</span>
            )}
            {id === 'alertas' && alertasPendientes.length > 0 && (
              <span className="ml-2 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full">{alertasPendientes.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB PROSPECTOS ── */}
      {tab === 'prospectos' && (
        <div className="space-y-3">
          {/* Alerta */}
          <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-300">Prospectos en proceso — solo lectura</div>
              <div className="text-xs text-amber-400/80 mt-1">
                Estos prospectos están siendo trabajados por el departamento de Arquitectura. Aún no son proyectos confirmados y no se puede iniciar Diseño 3D ni Producción hasta que sean aprobados y convertidos a proyecto oficial con PEC y módulos asignados.
              </div>
            </div>
          </div>

          {prospectos.length === 0 && (
            <div className="bg-[#1B1E23] border border-steel-line rounded-xl py-12 text-center text-steel-faint text-sm">
              No hay prospectos activos. Arquitectura los gestiona desde su departamento.
            </div>
          )}

          {prospectos.length > 0 && (() => {
            const estColors = {
              'En propuesta':              'bg-slate-800 text-slate-300',
              'Propuesta inicial lista':    'bg-blue-900/60 text-blue-300',
              'Borrador conceptual listo':  'bg-blue-900/60 text-blue-300',
              'Presentado al cliente':      'bg-amber-900/60 text-amber-300',
              'Con cambios':                'bg-orange-900/60 text-orange-300',
              'Aprobado':                   'bg-green-900/60 text-green-300',
              'No ganado':                  'bg-red-900/60 text-red-300',
            };
            const grupos = {};
            prospectos.forEach(p => {
              const nombre = p.disenadora || 'Sin asignar';
              if (!grupos[nombre]) grupos[nombre] = [];
              grupos[nombre].push(p);
            });
            return Object.entries(grupos).sort(([a],[b]) => a === 'Sin asignar' ? 1 : b === 'Sin asignar' ? -1 : a.localeCompare(b)).map(([nombre, lista]) => (
              <div key={nombre} className="bg-[#1B1E23] border border-steel-line rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-steel-line bg-white/3">
                  <div className="w-8 h-8 rounded-full bg-flame flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                    {nombre === 'Sin asignar' ? '—' : nombre.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{nombre}</div>
                    <div className="text-[11px] text-steel-faint">{lista.length} prospecto{lista.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-steel-line">
                        {['Cliente','Vendedor','Línea','Estado','Última actualización','Cambios','Observación'].map(h => (
                          <th key={h} className="text-left text-[10px] font-bold text-steel-faint uppercase px-3 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-steel-line">
                      {lista.map(p => (
                        <tr key={p.id} className="hover:bg-white/3 transition-colors">
                          <td className="px-3 py-3">
                            <div className="font-medium text-white text-xs">{p.cliente}</div>
                            {p.convertido && <div className="text-[10px] text-green-400 mt-0.5">✓ Convertido a proyecto</div>}
                          </td>
                          <td className="px-3 py-3 text-[11px] text-steel-muted">{p.vendedor || '—'}</td>
                          <td className="px-3 py-3">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${p.linea === 'Element' ? 'bg-purple-900/50 text-purple-300' : p.linea === 'Equifrigo' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-blue-900/50 text-blue-300'}`}>
                              {p.linea || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${estColors[p.estado] || 'bg-slate-800 text-slate-300'}`}>
                              {p.estado}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-[11px] text-steel-muted">{ultimaActualizacion(p) || '—'}</td>
                          <td className="px-3 py-3 text-[11px] text-steel-muted text-center">{p.nCambios || 0}</td>
                          <td className="px-3 py-3 text-[10px] text-steel-faint max-w-48 truncate">{p.observacion || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── TAB ALERTAS ── */}
      {tab === 'alertas' && (
        <div className="space-y-2">
          {alertasPendientes.length === 0 && (
            <div className="bg-[#1B1E23] border border-steel-line rounded-xl py-12 text-center text-steel-faint text-sm">
              ✓ Sin alertas pendientes.
            </div>
          )}
          {alertasPendientes.map(al => (
            <div key={al.id} className="bg-[#1B1E23] border border-steel-line rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => al.proyectoId && goToProject(al.proyectoId)}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${al.prioridad === 'Urgente' ? 'bg-red-900 text-red-300' : 'bg-amber-900 text-amber-300'}`}>{al.tipo}</span>
                  {al.departamentoOrigen && <span className="text-[10px] text-steel-muted">{al.departamentoOrigen}{al.departamentoDestino ? ` → ${al.departamentoDestino}` : ''}</span>}
                  {al.auto && <span className="text-[9px] text-steel-faint">· automática</span>}
                </div>
                <div className="text-sm text-white font-medium">{al.proyecto}{al.cliente ? ` · ${al.cliente}` : ''}</div>
                <div className="text-[11px] text-steel-muted mt-0.5">{al.motivo}</div>
                {al.accionNecesaria && <div className="text-[10px] text-blue-400 mt-1 font-medium">{al.accionNecesaria}</div>}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${al.prioridad === 'Urgente' ? 'bg-red-600 text-white' : 'bg-amber-700 text-amber-200'}`}>{al.prioridad}</span>
                {!al.auto && (
                  <button onClick={() => resolverAlerta(al)} className="text-[10px] text-steel-muted hover:text-green-400 border border-white/10 hover:border-green-700 rounded px-2 py-1 transition-colors whitespace-nowrap">
                    ✓ Marcar resuelta
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB PROYECTOS ── */}
      {tab === 'proyectos' && (
        <>
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-faint" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar proyecto o cliente..."
                className="w-full bg-[#1B1E23] border border-white/10 rounded-lg text-sm text-white pl-8 pr-3 py-2 placeholder-slate-600 focus:outline-none focus:border-flame" />
            </div>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
              className="bg-[#1B1E23] border border-white/10 rounded-lg text-sm text-slate-300 px-3 py-2 focus:outline-none focus:border-flame">
              <option value="">Todos los estados</option>
              {estadosUnicos.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={filterPrioridad} onChange={e => setFilterPrioridad(e.target.value)}
              className="bg-[#1B1E23] border border-white/10 rounded-lg text-sm text-slate-300 px-3 py-2 focus:outline-none focus:border-flame">
              <option value="">Todas las prioridades</option>
              {['Baja','Normal','Alta','Urgente'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {mesesUnicos.length > 0 && (
              <select value={filterMes} onChange={e => setFilterMes(e.target.value)}
                className="bg-[#1B1E23] border border-white/10 rounded-lg text-sm text-slate-300 px-3 py-2 focus:outline-none focus:border-flame">
                <option value="">Todos los meses (entrega)</option>
                {mesesUnicos.map(m => <option key={m} value={m}>{labelMes(m)}</option>)}
              </select>
            )}
          </div>

          {/* Tabla */}
          <div className="bg-[#1B1E23] border border-steel-line rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-steel-line">
                    {['Proyecto / Cliente','PEC','Módulos','Línea','Vendedor','Diseñador 3D','Etapa actual','Maestro','Entrega','Días',''].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-steel-faint uppercase px-3 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-line">
                  {filtered.map(p => {
                    const atrasado = isAtrasado(p.fechaEntrega, p.estadoGeneral);
                    const bloqueado = bloqueadoD3D(p);
                    const mods     = modulosInfo(p);
                    const etapa    = etapaActual(p);
                    const dias     = p.fechaEntrega ? Math.floor((new Date(p.fechaEntrega) - new Date()) / 86400000) : null;
                    const dColor   = dias === null ? '#6B7280' : dias < 0 ? '#EF4444' : dias <= 5 ? '#F97316' : '#86EFAC';
                    const dBg      = dias === null ? '#1F2937' : dias < 0 ? '#450A0A' : dias <= 5 ? '#431407' : '#052E16';

                    return (
                      <tr key={p.id} className={`hover:bg-white/3 transition-colors ${atrasado ? 'bg-red-950/20' : bloqueado ? 'bg-amber-950/20' : ''}`}>
                        {/* Proyecto */}
                        <td className="px-3 py-3 cursor-pointer" onClick={() => goToProject(p.id)}>
                          <div className="flex items-center gap-2">
                            {atrasado && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />}
                            <div>
                              <div className="font-medium text-white text-xs">{p.nombre}</div>
                              <div className="text-steel-faint text-[10px]">{p.cliente}</div>
                            </div>
                          </div>
                        </td>
                        {/* PEC */}
                        <td className="px-3 py-3">
                          <span className="text-[10px] font-mono text-steel-muted">{p.numeroContrato || '—'}</span>
                        </td>
                        {/* Módulos */}
                        <td className="px-3 py-3">
                          {mods ? (
                            <div className="flex items-center gap-1">
                              <Package size={11} className="text-orange-400" />
                              <span className="text-[11px] font-bold text-orange-400">{mods.total}</span>
                              {mods.element  > 0 && <span className="text-[9px] bg-purple-900/50 text-purple-300 px-1 py-0.5 rounded">E:{mods.element}</span>}
                              {mods.fogaFull > 0 && <span className="text-[9px] bg-blue-900/50 text-blue-300 px-1 py-0.5 rounded">F:{mods.fogaFull}</span>}
                              {mods.equifrigo > 0 && <span className="text-[9px] bg-yellow-900/50 text-yellow-300 px-1 py-0.5 rounded">Q:{mods.equifrigo}</span>}
                              {mods.atrasados > 0 && <span className="text-[9px] bg-red-900/60 text-red-300 px-1 py-0.5 rounded">⚠{mods.atrasados}</span>}
                            </div>
                          ) : <span className="text-[10px] text-steel-faint">Sin módulos</span>}
                        </td>
                        {/* Línea */}
                        <td className="px-3 py-3">
                          {p.lineaProyecto
                            ? <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${p.lineaProyecto === 'Element' ? 'bg-purple-900/50 text-purple-300' : p.lineaProyecto === 'Equifrigo' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-blue-900/50 text-blue-300'}`}>
                                {p.lineaProyecto}
                              </span>
                            : <span className="text-[10px] text-steel-faint">—</span>}
                        </td>
                        {/* Vendedor */}
                        <td className="px-3 py-3 text-[11px] text-steel-muted">{p.responsableGeneral || '—'}</td>
                        {/* Diseñador 3D */}
                        <td className="px-3 py-3">
                          <span className="text-[10px] font-medium text-slate-300">{disenador3D(p)}</span>
                        </td>
                        {/* Etapa actual */}
                        <td className="px-3 py-3">
                          <span style={{ fontSize: 11, fontWeight: 600, color: etapa.color }}>{etapa.texto}</span>
                          {bloqueado && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle size={10} className="text-amber-400 shrink-0" />
                              <span className="text-[9px] font-bold text-amber-400">No puede pasar a Diseño 3D</span>
                            </div>
                          )}
                        </td>
                        {/* Maestro */}
                        <td className="px-3 py-3 text-[11px] text-steel-muted">{getMaestros(p)}</td>
                        {/* Entrega */}
                        <td className="px-3 py-3">
                          <div className="text-[10px] text-steel-faint">{p.fechaEntrega || '—'}</div>
                        </td>
                        {/* Días */}
                        <td className="px-3 py-3">
                          {dias !== null
                            ? <span style={{ fontSize: 10, fontWeight: 700, color: dColor, background: dBg, padding: '2px 7px', borderRadius: 99 }}>
                                {dias < 0 ? `${Math.abs(dias)}d atr.` : `${dias}d`}
                              </span>
                            : <span className="text-[10px] text-steel-faint">—</span>}
                        </td>
                        {/* Acciones */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => goToProject(p.id)} className="text-steel-faint hover:text-white transition-colors">
                              <ChevronRight size={14} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setConfirmDelete(p.id); }}
                              className="text-steel-faint hover:text-red-400 transition-colors">
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
                <div className="py-12 text-center text-steel-faint">
                  {(proyectos||[]).length === 0 ? 'No hay proyectos. Crea el primero.' : 'No se encontraron proyectos.'}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 anim-backdrop-in">
          <div className="bg-[#1B1E23] border border-white/10 rounded-2xl p-6 w-full max-w-sm anim-panel-in">
            <h3 className="text-white font-bold text-lg mb-2">¿Eliminar proyecto?</h3>
            <p className="text-steel-muted text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 text-steel-muted hover:text-white text-sm py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button onClick={() => eliminarProyecto(confirmDelete)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition-colors transition-transform duration-100 active:scale-[0.97] font-medium">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

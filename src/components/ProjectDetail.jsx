import { useState } from 'react';
import { useApp } from '../App';
import { ArrowLeft, Edit, Clock, User, Calendar, CheckSquare } from 'lucide-react';
import { StatusChip, DeptChip, PrioridadChip } from './StatusChip';
import { formatFecha, isAtrasado } from '../utils/dateHelpers';
import { getStatusColor, getDeptColor } from '../utils/statusHelpers';
import ProjectFlow from './ProjectFlow';
import ProjectForm from './ProjectForm';
import { getNombresResponsables } from '../utils/settingsStorage';
import { crearEntradaHistorial } from '../utils/historyHelpers';

const CHECKLIST_LABELS = {
  arquitectura: { contratoFirmado:'Contrato firmado', medidasIniciales:'Medidas iniciales', requerimientosCliente:'Requerimientos del cliente', estadoObraRegistrado:'Estado de obra registrado', disenoConceptual:'Diseño conceptual', revisionCliente:'Revisión con cliente', aprobacionCliente:'Aprobación del cliente', observacionesCerradas:'Observaciones cerradas' },
  diseno: { disenoConceptualAprobado:'Diseño conceptual aprobado', medidasVerificadas:'Medidas verificadas', listaEquiposDefinida:'Lista de equipos definida', acabadosConfirmados:'Acabados confirmados', modelado3DRealizado:'Modelado 3D realizado', planoTecnicoGenerado:'Plano técnico generado', planoCorteGenerado:'Plano de corte generado', observacionesCerradas:'Observaciones cerradas', aprobacionProduccion:'Aprobación para producción' },
  obra: { estadoObraRegistrado:'Estado de obra registrado', visitaRequerida:'Visita requerida', fechaVisitaRegistrada:'Fecha de visita registrada', medidasFinalesTomadas:'Medidas finales tomadas', observacionesObraRegistradas:'Observaciones registradas', aprobacionFabricacion:'Aprobación para fabricación' },
  produccion: { planosFinalesRecibidos:'Planos finales recibidos', listaMaterialesRecibida:'Lista de materiales recibida', medidasFinalesVerificadas:'Medidas finales verificadas', prioridadDefinida:'Prioridad definida', responsableAsignado:'Responsable asignado', fechaEntregaRegistrada:'Fecha de entrega registrada', produccionTerminada:'Producción terminada', revisionCalidad:'Revisión de calidad' },
  instalacion: { visitaAgendada:'Visita agendada', responsableAsignado:'Responsable asignado', medidasTomadas:'Medidas tomadas', obraLista:'Obra lista', equiposTerminados:'Equipos terminados', transporteCoordinado:'Transporte coordinado', fechaConfirmadaCliente:'Fecha confirmada con cliente', instalacionesVerificadas:'Instalaciones verificadas', observacionesCerradas:'Observaciones cerradas', instalacionFinalizada:'Instalación finalizada' }
};

const ESTADO_OPTIONS = {
  arquitectura: ['Esperando contrato','Contrato firmado','Diseño conceptual en proceso','En revisión con cliente','Observado por cliente','Aprobado para diseño'],
  diseno: ['Pendiente de arquitectura','Recibido de arquitectura','Modelado 3D en proceso','Plano técnico en proceso','Plano de corte en proceso','En revisión técnica','Observado','Listo para producción'],
  obra: ['Obra gris','Pendiente visita','Visita agendada','Medidas tomadas','Medidas observadas','Aprobado para fabricación','Pendiente por cliente'],
  produccion: ['Pendiente de diseño','Recibido para producción','Programado','En fabricación','En armado','En revisión de calidad','Con novedad','Terminado','Listo para instalación'],
  instalacion: ['Visita pendiente','Visita agendada','Medidas tomadas','Instalación pendiente','En instalación','Instalado','Con novedad'],
};

function DeptSection({ deptKey, deptName, data, proyecto, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...data });
  const c = getDeptColor(deptName);
  const checkItems = CHECKLIST_LABELS[deptKey] || {};
  const checkDone = Object.values(form.checklist || {}).filter(Boolean).length;
  const checkTotal = Object.keys(checkItems).length;
  const stateField = { arquitectura:'estadoArquitectura', diseno:'estadoDiseno', obra:'estadoObra', produccion:'estadoProduccion', instalacion:'estadoInstalacion' }[deptKey];

  const handleSave = () => {
    onUpdate(deptKey, form);
    setOpen(false);
  };

  const setCheck = (key, val) => setForm(f => ({ ...f, checklist: { ...f.checklist, [key]: val } }));

  return (
    <div className={`border ${c.border} rounded-xl overflow-hidden`}>
      <div className={`${c.light} px-4 py-3 flex items-center justify-between cursor-pointer`} onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <span className={`${c.bg} text-white text-xs font-bold px-2 py-0.5 rounded`}>{deptName}</span>
          <StatusChip estado={form[stateField] || '—'} size="xs" />
          <span className="text-[10px] text-slate-400">{form.responsable || 'Sin responsable'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400">{checkDone}/{checkTotal} checklist</span>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full ${c.bg} rounded-full`} style={{ width: `${checkTotal > 0 ? (checkDone/checkTotal)*100 : 0}%` }} />
          </div>
        </div>
      </div>

      {open && (
        <div className="px-4 py-4 space-y-4 bg-[#0F1117]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Estado</label>
              <select value={form[stateField] || ''} onChange={e => setForm(f => ({ ...f, [stateField]: e.target.value }))} className="w-full bg-[#161820] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500">
                {(ESTADO_OPTIONS[deptKey] || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Responsable</label>
              <select value={form.responsable || ''} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} className="w-full bg-[#161820] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Seleccionar...</option>
                {(getNombresResponsables() || []).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-2 font-medium">Checklist</div>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(checkItems).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer py-1">
                  <input type="checkbox" checked={!!form.checklist?.[key]} onChange={e => setCheck(key, e.target.checked)} className="w-3.5 h-3.5 accent-blue-500 rounded" />
                  <span className={`text-[11px] ${form.checklist?.[key] ? 'text-green-400 line-through' : 'text-slate-400'}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Observaciones</label>
            <textarea value={form.observaciones || form.observacionesObra || ''} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value, observacionesObra: e.target.value }))} rows={2} className="w-full bg-[#161820] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg transition-colors">Guardar cambios</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetail({ proyectoId }) {
  const { proyectos, historial, actividades, updateProyecto, addHistorial, currentUser, setPage } = useApp();
  const [activeTab, setActiveTab] = useState('info');
  const [editForm, setEditForm] = useState(false);

  const proyecto = proyectos.find(p => p.id === proyectoId);
  if (!proyecto) return <div className="p-6 text-slate-400">Proyecto no encontrado</div>;

  const pHistorial = historial.filter(h => h.proyectoId === proyectoId);
  const pActividades = actividades.filter(a => a.proyectoId === proyectoId);
  const atrasado = isAtrasado(proyecto.fechaEntrega, proyecto.estadoGeneral);

  const handleDeptUpdate = (deptKey, data) => {
    const updated = { ...proyecto, [deptKey]: data, updatedAt: new Date().toISOString() };
    updateProyecto(updated);
    addHistorial(crearEntradaHistorial({ proyectoId: proyecto.id, usuario: currentUser, departamento: deptKey, accion: 'Actualización', campoModificado: deptKey, valorAnterior: '—', valorNuevo: JSON.stringify(data).slice(0, 80), observacion: '' }));
  };

  const TABS = [
    { id: 'info', label: 'Info general' },
    { id: 'flujo', label: 'Flujo' },
    { id: 'departamentos', label: 'Departamentos' },
    { id: 'actividades', label: `Actividades (${pActividades.length})` },
    { id: 'historial', label: `Historial (${pHistorial.length})` },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setPage('proyectos')} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm transition-colors">
          <ArrowLeft size={15} /> Proyectos
        </button>
      </div>

      <div className={`bg-[#161820] border rounded-xl p-4 ${atrasado ? 'border-red-800/70' : 'border-white/5'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-white">{proyecto.nombre}</h1>
              {atrasado && <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-bold">ATRASADO</span>}
            </div>
            <div className="text-slate-400 text-sm">{proyecto.cliente} · {proyecto.numeroContrato || 'Sin contrato'}</div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusChip estado={proyecto.estadoGeneral} />
              <DeptChip dept={proyecto.departamentoActual} />
              <PrioridadChip prioridad={proyecto.prioridad} />
              <span className={`text-[10px] px-2 py-0.5 rounded ${proyecto.contratoFirmado ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{proyecto.contratoFirmado ? '✓ Contrato firmado' : '✗ Sin contrato'}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-500">Entrega</div>
            <div className={`text-sm font-bold ${atrasado ? 'text-red-400' : 'text-white'}`}>{formatFecha(proyecto.fechaEntrega)}</div>
            <div className="text-xs text-slate-500 mt-1">Resp: {proyecto.responsableGeneral}</div>
            <button onClick={() => setEditForm(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"><Edit size={11} /> Editar</button>
          </div>
        </div>
        {proyecto.proximaAccion && (
          <div className="mt-3 bg-blue-900/20 border border-blue-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <Clock size={12} className="text-blue-400 shrink-0" />
            <span className="text-xs text-blue-300 font-medium">{proyecto.proximaAccion}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`text-xs px-4 py-2 rounded-t-lg transition-colors ${activeTab === t.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-2 gap-4">
          {[['Cliente', proyecto.cliente],['Contrato', proyecto.numeroContrato || '—'],['Inicio', formatFecha(proyecto.fechaInicio)],['Entrega', formatFecha(proyecto.fechaEntrega)],['Responsable', proyecto.responsableGeneral || '—'],['Dpto. actual', proyecto.departamentoActual],['Prioridad', proyecto.prioridad],['Estado', proyecto.estadoGeneral]].map(([k,v]) => (
            <div key={k} className="bg-[#161820] border border-white/5 rounded-xl p-3">
              <div className="text-[10px] text-slate-500 mb-1">{k}</div>
              <div className="text-sm text-white font-medium">{v}</div>
            </div>
          ))}
          {proyecto.observaciones && (
            <div className="col-span-2 bg-amber-900/20 border border-amber-800/50 rounded-xl p-3">
              <div className="text-[10px] text-amber-400 mb-1">Observaciones</div>
              <div className="text-sm text-amber-200">{proyecto.observaciones}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'flujo' && (
        <div className="bg-[#161820] border border-white/5 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">Flujo del proyecto</h3>
          <p className="text-xs text-slate-500 mb-4">Haz clic en cada etapa para ver y marcar sus pasos. Los GATEs deben completarse para desbloquear la siguiente etapa.</p>
          <ProjectFlow
            proyecto={proyecto}
            onUpdateProyecto={(updated) => {
              updateProyecto({ ...updated, updatedAt: new Date().toISOString() });
              addHistorial(crearEntradaHistorial({ proyectoId: proyecto.id, usuario: currentUser, departamento: 'Flujo', accion: 'Actualización gate', campoModificado: 'flujo', valorAnterior: '-', valorNuevo: 'Paso actualizado', observacion: '' }));
            }}
          />
        </div>
      )}

      {activeTab === 'departamentos' && (
        <div className="space-y-3">
          {[
            { key: 'arquitectura', name: 'Arquitectura', data: proyecto.arquitectura },
            { key: 'diseno', name: 'Diseño', data: proyecto.diseno },
            { key: 'obra', name: 'Obra', data: proyecto.obra },
            { key: 'produccion', name: 'Producción', data: proyecto.produccion },
            { key: 'instalacion', name: 'Instalación', data: proyecto.instalacion },
          ].map(({ key, name, data }) => (
            <DeptSection key={key} deptKey={key} deptName={name} data={data} proyecto={proyecto} onUpdate={handleDeptUpdate} />
          ))}
        </div>
      )}

      {activeTab === 'actividades' && (
        <div className="bg-[#161820] border border-white/5 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {pActividades.length === 0 && <div className="py-8 text-center text-slate-500 text-sm">Sin actividades registradas</div>}
            {pActividades.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                <DeptChip dept={a.departamento} size="xs" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white">{a.actividad}</div>
                  <div className="text-[10px] text-slate-500">{a.responsable} · {formatFecha(a.fechaLimite)}</div>
                </div>
                <StatusChip estado={a.estado} size="xs" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="bg-[#161820] border border-white/5 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {pHistorial.length === 0 && <div className="py-8 text-center text-slate-500 text-sm">Sin historial</div>}
            {pHistorial.map(h => (
              <div key={h.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-slate-500">{h.fecha} {h.hora}</span>
                  <span className="text-[10px] text-white font-medium">{h.usuario}</span>
                  <span className="text-[10px] text-slate-500">·</span>
                  <span className="text-[10px] text-slate-400">{h.departamento}</span>
                </div>
                <div className="text-xs text-white">{h.accion}: <span className="text-slate-400">{h.campoModificado}</span></div>
                {h.valorAnterior !== '—' && <div className="text-[10px] text-slate-500 mt-0.5">{h.valorAnterior} → <span className="text-green-400">{h.valorNuevo}</span></div>}
                {h.observacion && <div className="text-[10px] text-slate-400 italic mt-0.5">{h.observacion}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {editForm && <ProjectForm proyecto={proyecto} onClose={() => setEditForm(false)} />}
    </div>
  );
}

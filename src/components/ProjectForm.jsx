import { useState } from 'react';
import { useApp } from '../App';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { PRIORIDADES } from '../data/mockData';
import { getResponsablesAgrupados } from '../utils/settingsStorage';
import { SelectGrupoTailwind } from './SelectGrupo';
import { crearEntradaHistorial } from '../utils/historyHelpers';
import { buildNuevoProyecto } from '../data/mockData';

const LINEAS = ['Element', 'Santa Ana'];

const FASES = [
  '1. Despacho Materia Prima','2. Corte Láser','3. Plegado',
  '4. Mesa de Trabajo (Maestros)','5. Pintura','6. Abrillantado',
  '7. Terminados','8. Control de Calidad','9. Empaquetado',
  '10. Bodega','⏸ Pendiente','✓ Terminado',
];

function buildModulo(pec, index, maestro = '') {
  const num = String(index + 1).padStart(2, '0');
  return {
    id:     `MOD-${Date.now()}-${index}`,
    pec:    `${pec}-(${num})`,
    nombre: '',
    linea:  'Element',
    maestro,
    largo: '', profundidad: '', alto: '',
    fechaEntrega: '',
    observaciones: '',
    casoEspecialMaestro: false,
    arquitectura: { estado: 'En proceso', observaciones: '', liberadoA3D: false, liberadoAt: '' },
    diseno3d:     { estado: 'Bloqueado', planCorteLink: '', observaciones: '', liberadoProduccion: false, liberadoAt: '' },
    produccion:   { estado: 'Bloqueado', faseActual: '1. Despacho Materia Prima', fechaIngresoFase: '', observaciones: '', materialFaltante: [] },
  };
}

export default function ProjectForm({ onClose, proyecto: existing, onCreated }) {
  const { updateProyecto, addHistorial, currentUser, responsables } = useApp();
  const esDesdeProspecto = !!(existing?._prospectoId);
  // Un proyecto "desde prospecto" todavía no existe en Firestore — es creación, no edición,
  // aunque venga con datos pre-cargados en `existing`. Solo es edición real si ya existe
  // y no trae _prospectoId (ese campo se elimina al guardar, ver handleSave).
  const isEdit = !!existing && !esDesdeProspecto;
  const respAgrupados   = getResponsablesAgrupados(responsables);
  const vendedoresOpts  = respAgrupados['Vendedores'] || [];
  const disenadorasOpts = respAgrupados['Arquitectas'] || [];

  const [form, setForm] = useState(() => existing ? { ...existing } : buildNuevoProyecto());
  const [modulos, setModulos] = useState(() => existing?.production?.modulos || []);
  const [planConceptualLink, setPlanConceptualLink] = useState(existing?.planConceptualLink || '');
  const [expandedMod, setExpandedMod] = useState(null);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  // El maestro ya no se asigna aquí — Arquitectura no decide quién fabrica.
  // Lo asigna el Jefe de Producción, por módulo, desde la pestaña Producción.
  function agregarModulo() {
    const pec = form.numeroContrato || 'PEC';
    const lineaDefault = form.lineaProyecto || 'Element';
    setModulos(m => [...m, { ...buildModulo(pec, m.length), linea: lineaDefault }]);
  }

  // Auto-actualizar PEC de módulos cuando cambia el PEC del proyecto
  function setPEC(val) {
    set('numeroContrato', val);
    if (val.trim()) {
      setModulos(ms => ms.map((m, i) => ({
        ...m,
        pec: `${val}-(${String(i + 1).padStart(2, '0')})`
      })));
    }
  }

  function actualizarModulo(id, field, val) {
    setModulos(ms => ms.map(m => m.id === id ? { ...m, [field]: val } : m));
  }

  function eliminarModulo(id) {
    setModulos(ms => ms.filter(m => m.id !== id));
  }

  const handleSave = () => {
    if (!form.nombre?.trim() || !form.cliente?.trim()) return alert('Nombre y cliente son requeridos');
    if (!isEdit && modulos.length === 0) return alert('Agrega al menos un módulo antes de generar el proyecto.');
    const now = new Date().toISOString();
    const updated = {
      ...form,
      planConceptualLink,
      updatedAt: now,
      production: {
        ...form.production,
        modulos,
        status: modulos.length > 0 ? 'Con módulos' : 'Bloqueado',
      },
    };
    if (!isEdit) {
      if (esDesdeProspecto) {
        updated.estadoGeneral = 'Plano listo — Pendiente Diseño 3D';
        updated.architecture  = { ...updated.architecture, status: 'Plano conceptual listo', responsible: form.architecture?.responsible || '' };
      } else {
        updated.estadoGeneral = 'En propuesta';
        updated.architecture  = { ...updated.architecture, status: 'En propuesta', responsible: form.architecture?.responsible || '' };
      }
    }
    // _prospectoId es solo un puente hacia onProyectoCreado (abajo) — no debe quedar
    // guardado en el proyecto, o una futura edición real se seguiría creyendo "creación".
    const { _prospectoId, ...paraGuardar } = updated;
    updateProyecto(paraGuardar);
    if (onCreated) onCreated(updated);
    if (isEdit) {
      addHistorial(crearEntradaHistorial({
        proyectoId: form.id, usuario: currentUser, departamento: 'Proyectos',
        accion: 'Edición', campoModificado: 'Proyecto',
        valorAnterior: existing.nombre, valorNuevo: form.nombre, observacion: '',
      }));
    }
    onClose();
  };

  const totalMods  = modulos.length;
  const element    = modulos.filter(m => m.linea === 'Element').length;
  const santaAna   = modulos.filter(m => m.linea === 'Santa Ana').length;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161820] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold text-lg">{isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
            {esDesdeProspecto && <p className="text-green-400 text-xs mt-0.5">Desde prospecto — datos pre-cargados</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="px-6 py-4 space-y-5">

          {/* ── Info básica ── */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Información del proyecto</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Nombre del proyecto *</label>
                <input value={form.nombre || ''} onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej: Cocina Gran Bay Manta"
                  className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500 placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Cliente *</label>
                <input value={form.cliente || ''} onChange={e => set('cliente', e.target.value)}
                  placeholder="Ej: Gran Bay Manta"
                  className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500 placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Código PEC</label>
                <input value={form.numeroContrato || ''} onChange={e => set('numeroContrato', e.target.value)}
                  placeholder="Ej: PEC-274"
                  className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500 placeholder:text-slate-600" />
              </div>

              {/* Vendedor — solo lectura si viene de prospecto */}
              {esDesdeProspecto ? (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Vendedor</label>
                  <div className="bg-[#0F1117] border border-white/5 rounded-lg text-sm text-slate-400 px-3 py-2">{form.responsableGeneral || '—'}</div>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Vendedor</label>
                  <select value={form.responsableGeneral || ''} onChange={e => set('responsableGeneral', e.target.value)}
                    className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500">
                    <option value="">Seleccionar...</option>
                    {vendedoresOpts.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              )}

              {/* Diseñadora — responsable de Arquitectura */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Diseñadora (Arquitectura)</label>
                <select value={form.architecture?.responsible || ''} onChange={e => set('architecture', { ...form.architecture, responsible: e.target.value })}
                  className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500">
                  <option value="">Seleccionar...</option>
                  {disenadorasOpts.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Línea del proyecto</label>
                <select value={form.lineaProyecto || ''} onChange={e => set('lineaProyecto', e.target.value)}
                  className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500">
                  <option value="">Seleccionar línea...</option>
                  {LINEAS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Prioridad</label>
                <select value={form.prioridad || 'Normal'} onChange={e => set('prioridad', e.target.value)}
                  className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500">
                  {(PRIORIDADES || ['Baja','Normal','Alta','Urgente']).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Fechas */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Fecha de ingreso</label>
                <input type="date" value={form.fechaIngreso || ''} onChange={e => set('fechaIngreso', e.target.value)}
                  className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Fecha estimada de instalación</label>
                <input type="date" value={form.fechaEntrega || ''} onChange={e => set('fechaEntrega', e.target.value)}
                  className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500" />
              </div>

              {/* Plano conceptual */}
              {!esDesdeProspecto && (
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Link plano conceptual general</label>
                  <input value={planConceptualLink} onChange={e => setPlanConceptualLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500 placeholder:text-slate-600" />
                </div>
              )}
            </div>
          </div>

          {/* ── Módulos ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Módulos / Muebles</div>
                <div className="text-xs text-slate-600 mt-0.5">{totalMods} módulo{totalMods !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={agregarModulo}
                className="flex items-center gap-1.5 bg-orange-600/20 border border-orange-600/40 text-orange-400 text-xs px-3 py-1.5 rounded-lg hover:bg-orange-600/30 transition-colors font-medium">
                <Plus size={12} /> Agregar módulo
              </button>
            </div>

            {modulos.length === 0 && (
              <div className="bg-[#0F1117] border border-white/5 rounded-lg px-4 py-5 text-center text-slate-600 text-xs">
                Agrega los módulos — cada módulo es un mueble o equipo independiente
              </div>
            )}

            <div className="space-y-2">
              {modulos.map((mod, i) => (
                <div key={mod.id} className="bg-[#0F1117] border border-white/10 rounded-xl overflow-hidden">
                  {/* Header módulo */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedMod(expandedMod === mod.id ? null : mod.id)}>
                    <span className="text-xs font-bold text-orange-400 shrink-0">#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white">{mod.nombre || <span className="text-slate-600">Sin nombre</span>}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500">{mod.pec}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${mod.linea === 'Element' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}>{mod.linea}</span>
                        {(mod.largo || mod.profundidad || mod.alto) && (
                          <span className="text-[11px] font-semibold text-slate-400">📐 {mod.largo || '—'}×{mod.profundidad || '—'}×{mod.alto || '—'} cm</span>
                        )}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); eliminarModulo(mod.id); }}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={12} />
                    </button>
                    {expandedMod === mod.id ? <ChevronUp size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
                  </div>

                  {expandedMod === mod.id && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">
                            Código PEC
                            {esDesdeProspecto && <span className="text-amber-400 ml-1">(asigna el número)</span>}
                          </label>
                          <input value={mod.pec} onChange={e => actualizarModulo(mod.id, 'pec', e.target.value)}
                            className="w-full bg-[#161820] border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-orange-500" />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">Línea</label>
                          <select value={mod.linea} onChange={e => actualizarModulo(mod.id, 'linea', e.target.value)}
                            className="w-full bg-[#161820] border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-orange-500">
                            {LINEAS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-500 mb-1 block">Nombre del módulo *</label>
                          <input value={mod.nombre} onChange={e => actualizarModulo(mod.id, 'nombre', e.target.value)}
                            placeholder="Ej: Módulo Lateral Derecho"
                            className="w-full bg-[#161820] border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-orange-500 placeholder:text-slate-700" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-500 mb-1 block">Dimensiones (cm)</label>
                          <div className="grid grid-cols-3 gap-2">
                            <input type="number" min={0} value={mod.largo} onChange={e => actualizarModulo(mod.id, 'largo', e.target.value)}
                              placeholder="Largo"
                              className="w-full bg-[#161820] border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-orange-500 placeholder:text-slate-700" />
                            <input type="number" min={0} value={mod.profundidad} onChange={e => actualizarModulo(mod.id, 'profundidad', e.target.value)}
                              placeholder="Profundidad"
                              className="w-full bg-[#161820] border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-orange-500 placeholder:text-slate-700" />
                            <input type="number" min={0} value={mod.alto} onChange={e => actualizarModulo(mod.id, 'alto', e.target.value)}
                              placeholder="Alto"
                              className="w-full bg-[#161820] border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-orange-500 placeholder:text-slate-700" />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-500 mb-1 block">Observaciones</label>
                          <input value={mod.observaciones || ''} onChange={e => actualizarModulo(mod.id, 'observaciones', e.target.value)}
                            placeholder="Ej: Campana cúbica 220x90x85..."
                            className="w-full bg-[#161820] border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-orange-500 placeholder:text-slate-700" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Resumen */}
            {totalMods > 0 && (
              <div className="bg-[#0F1117] border border-white/5 rounded-lg px-4 py-3 flex gap-6 mt-2">
                <div><div className="text-[10px] text-slate-500">Total</div><div className="text-lg font-bold text-white">{totalMods}</div></div>
                {element > 0   && <div><div className="text-[10px] text-slate-500">Element</div><div className="text-lg font-bold text-purple-400">{element}</div></div>}
                {santaAna > 0  && <div><div className="text-[10px] text-slate-500">Santa Ana</div><div className="text-lg font-bold text-blue-400">{santaAna}</div></div>}
              </div>
            )}
          </div>

          {/* Banner info */}
          {!isEdit && esDesdeProspecto && (
            <div className="bg-green-900/20 border border-green-800/40 rounded-lg px-3 py-2">
              <p className="text-xs text-green-300">
                <strong>Desde prospecto:</strong> Solo asigna el PEC y define los módulos. El proyecto entrará en estado "Plano listo — Pendiente Diseño 3D".
              </p>
            </div>
          )}
          {!isEdit && !esDesdeProspecto && (
            <div className="bg-purple-900/20 border border-purple-800/40 rounded-lg px-3 py-2">
              <p className="text-xs text-purple-300">
                <strong>Flujo:</strong> El proyecto inicia en Arquitectura. Los módulos estarán disponibles en todas las pestañas.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-2">
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={!isEdit && totalMods === 0}
            className={`text-sm px-5 py-2 rounded-lg transition-colors font-medium ${!isEdit && totalMods === 0 ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
            {isEdit ? 'Guardar cambios' : totalMods > 0 ? `Crear proyecto con ${totalMods} módulo${totalMods > 1 ? 's' : ''}` : 'Agrega un módulo para continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}

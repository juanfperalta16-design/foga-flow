// =====================================================
// FOGA FLOW — Contabilidad
// Control de pase de instalación: Producción (fábrica) + Contabilidad (autorización)
// =====================================================

import { useState } from 'react';
import { useApp } from '../App';
import { DollarSign, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { fabricaTerminada, paseInstalacionAbierto as paseAbierto } from '../utils/processRules';

function diasPara(fecha) {
  if (!fecha) return null;
  return Math.floor((new Date(fecha) - new Date()) / 86400000);
}

export default function Contabilidad() {
  const { proyectos, updateProyecto, saveAlertas, currentUser, goToProject } = useApp();
  const [filtro, setFiltro] = useState('todas');

  const todosActivos = (proyectos || []).filter(p => p.estadoGeneral !== 'Finalizado');

  const proximos10 = todosActivos.filter(p => { const d = diasPara(p.fechaEntrega); return d !== null && d >= 0 && d <= 10; });
  const conPase     = todosActivos.filter(paseAbierto);
  const enRiesgo    = todosActivos.filter(p => { const d = diasPara(p.fechaEntrega); return !paseAbierto(p) && d !== null && d <= 7; });
  const sinPase     = todosActivos.filter(p => !paseAbierto(p));

  const filtros = {
    todas:    todosActivos,
    riesgo:   enRiesgo,
    sinpase:  sinPase,
    semana:   todosActivos.filter(p => { const d = diasPara(p.fechaEntrega); return d !== null && d >= 0 && d <= 7; }),
  };
  const lista = [...(filtros[filtro] || todosActivos)].sort((a,b) => (a.fechaEntrega || '').localeCompare(b.fechaEntrega || ''));

  function toggleAutorizado(p) {
    const actual = !!p.contabilidad?.autorizado;
    const nuevoAutorizado = !actual;
    const now = new Date().toISOString();
    updateProyecto({
      ...p,
      contabilidad: {
        ...p.contabilidad,
        autorizado: nuevoAutorizado,
        autorizadoAt: nuevoAutorizado ? now : '',
        autorizadoPor: nuevoAutorizado ? (currentUser || '') : '',
      },
    });
    // Si al autorizar la fábrica ya había terminado, el pase queda abierto de inmediato —
    // avisar a Instalaciones para que proceda, sin que nadie tenga que acordarse de avisar.
    if (nuevoAutorizado && fabricaTerminada(p)) {
      saveAlertas([{
        id: `ALERTA_${p.id}_pase_${Date.now()}`,
        proyectoId: p.id,
        proyecto: p.nombre,
        cliente: p.cliente,
        departamentoOrigen: 'Contabilidad',
        departamentoDestino: 'Instalaciones',
        tipo: 'Pase abierto — listo para instalar',
        motivo: `Producción terminada y pago autorizado por Contabilidad${currentUser ? ` (${currentUser})` : ''}. Ya se puede proceder a instalar.`,
        accionNecesaria: 'Instalaciones: coordinar y proceder con la instalación.',
        prioridad: 'Alta',
        estado: 'Pendiente',
        fecha: now.slice(0,10),
        auto: false,
      }]);
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-yellow-900/30 flex items-center justify-center shrink-0">
          <DollarSign size={22} className="text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Contabilidad</h1>
          <p className="text-slate-400 text-sm">Todos los proyectos activos — control de pase para instalación</p>
        </div>
      </div>

      {/* Regla */}
      <div className="bg-[#161820] border-l-4 border-yellow-600 rounded-r-xl px-4 py-3">
        <p className="text-xs text-slate-300">
          <strong className="text-yellow-400">Regla de despacho:</strong> Instalaciones solo puede proceder con <strong className="text-white">Pase Abierto</strong>. El pase se abre cuando Producción termina todos los módulos en fábrica <strong className="text-white">y</strong> Contabilidad autoriza.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Instalaciones próximos 10 días', value: proximos10.length, color: 'text-white' },
          { label: 'Con pase abierto',                value: conPase.length,   color: 'text-green-400' },
          { label: 'En riesgo — ≤7 días sin pase',    value: enRiesgo.length,  color: 'text-red-400' },
          { label: 'Sin pase (total)',                value: sinPase.length,   color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#161820] border border-white/5 rounded-xl px-4 py-3">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-[11px] text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-1 border-b border-white/10">
        {[['todas','Todas'],['semana','Esta semana'],['riesgo','En riesgo'],['sinpase','Sin pase']].map(([id, label]) => (
          <button key={id} onClick={() => setFiltro(id)}
            className={`text-sm px-4 py-2 rounded-t-lg transition-colors font-medium ${filtro === id ? 'bg-white/10 text-white border-b-2 border-yellow-500' : 'text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {lista.length === 0 ? (
        <div className="bg-[#161820] border border-white/5 rounded-xl py-12 text-center text-slate-500 text-sm">
          No hay proyectos en este filtro.
        </div>
      ) : (
        <div className="bg-[#161820] border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Cliente','PEC','Instalación','T-','Fábrica','Autoriz.','Pase'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {lista.map(p => {
                  const dias = diasPara(p.fechaEntrega);
                  const fab  = fabricaTerminada(p);
                  const aut  = !!p.contabilidad?.autorizado;
                  const pase = fab && aut;
                  const dColor = dias === null ? '#6B7280' : dias < 0 ? '#EF4444' : dias <= 3 ? '#EF4444' : dias <= 7 ? '#F97316' : '#86EFAC';
                  return (
                    <tr key={p.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-3 py-3 cursor-pointer" onClick={() => goToProject(p.id)}>
                        <div className="font-medium text-white text-xs">{p.nombre}</div>
                        <div className="text-slate-500 text-[10px]">{p.cliente}</div>
                      </td>
                      <td className="px-3 py-3 text-[11px] font-mono text-slate-400">{p.numeroContrato || '—'}</td>
                      <td className="px-3 py-3 text-[11px] text-slate-300">{p.fechaEntrega || '—'}</td>
                      <td className="px-3 py-3">
                        <span style={{ fontSize: 10, fontWeight: 700, color: dColor, background: dColor + '20', border: `1px solid ${dColor}40`, padding: '2px 8px', borderRadius: 6 }}>
                          {dias === null ? '—' : dias < 0 ? `${Math.abs(dias)}d atr.` : `T-${dias}`}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {fab ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-slate-600" />}
                      </td>
                      <td className="px-3 py-3">
                        <button onClick={() => toggleAutorizado(p)}
                          title={aut ? `Autorizado por ${p.contabilidad?.autorizadoPor || '—'} el ${p.contabilidad?.autorizadoAt?.slice(0,10) || ''}` : 'Marcar como autorizado'}>
                          {aut ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-slate-600 hover:text-slate-400" />}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        {pase ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-green-900/60 text-green-300">✓ PASE ABIERTO</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-red-950 text-red-400 flex items-center gap-1 w-fit">
                            <AlertTriangle size={10} /> SIN PASE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

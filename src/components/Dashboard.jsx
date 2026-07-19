import { useApp } from '../App';
import { isAtrasado, today, formatFecha } from '../utils/dateHelpers';
import { getDeptColor, getDeptActual } from '../utils/statusHelpers';
import { StatusChip, DeptChip } from './StatusChip';
import { AlertTriangle, Clock, CheckCircle, TrendingUp, Building2, Zap, Package, FileWarning } from 'lucide-react';

export default function Dashboard() {
  const { proyectos, alertas, goToProject } = useApp();
  const hoy = today();

  const activosProys = proyectos.filter(p => p.estadoGeneral !== 'Finalizado');
  const activos = activosProys;
  const atrasados = proyectos.filter(p => isAtrasado(p.fechaEntrega, p.estadoGeneral));
  const urgentes = alertas.filter(a => a.prioridad === 'Urgente' && a.estado === 'Pendiente');
  const finalizados = proyectos.filter(p => p.estadoGeneral === 'Finalizado');
  const pendienteInstalar = proyectos.filter(p => p.estadoGeneral === 'Producción terminada — Pendiente instalación');

  // Módulos con material urgente faltante (misma definición que Urgencias)
  const materialUrgente = activosProys.filter(p =>
    (p.production?.modulos || []).some(m =>
      (m.materialFaltante || []).some(mat => mat.prioridad === '🔴 Urgente' && mat.estadoCompra !== '✓ Recibido')
    )
  );

  // Obra iniciada pero aún no validada como lista para instalar
  const obraPendiente = activosProys.filter(p => {
    const inst = p.installations || {};
    return (p.releasedToInstallations || inst.firstVisitDate) && !inst.siteReady;
  });

  // Diseño 3D terminado (modelado + despiece) pero todavía sin liberar a Producción
  const listosProd = activosProys.filter(p => {
    const d3 = p.design3d || {};
    const modulos = p.production?.modulos || [];
    const modsListos = modulos.some(m => m.diseno3d?.design3DCompleted && m.diseno3d?.autocadBreakdownFinished && !m.diseno3d?.liberadoProduccion);
    return modsListos || (d3.design3DCompleted && d3.breakdownCompleted && !d3.releasedToProduction);
  });

  // Carga por departamento — cuenta proyectos activos según su etapa real actual
  const DEPTS_DASHBOARD = ['Arquitectura', 'Diseño', 'Obra', 'Producción', 'Instalación'];
  const cargaDept = DEPTS_DASHBOARD.map(dept => ({
    dept,
    count: activosProys.filter(p => getDeptActual(p) === dept).length,
  }));

  // Carga por responsable — a partir de los responsables reales asignados por proyecto/módulo
  const cargaResp = {};
  function sumarCarga(nombre) {
    if (!nombre) return;
    cargaResp[nombre] = (cargaResp[nombre] || 0) + 1;
  }
  activosProys.forEach(p => {
    sumarCarga(p.architecture?.responsible);
    const d3 = p.design3d || {};
    const designers = d3.responsables?.length ? d3.responsables : (d3.responsible ? [d3.responsible] : []);
    designers.forEach(sumarCarga);
    sumarCarga(p.installations?.responsible);
    (p.production?.modulos || []).forEach(m => sumarCarga(m.maestro));
  });

  const stats = [
    { label: 'Proyectos activos', value: activos.length, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-900/30' },
    { label: 'Atrasados', value: atrasados.length, icon: Clock, color: 'text-red-400', bg: 'bg-red-900/30' },
    { label: 'Urgencias', value: urgentes.length, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-900/30' },
    { label: 'Finalizados', value: finalizados.length, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/30' },
    { label: 'Material urgente', value: materialUrgente.length, icon: FileWarning, color: 'text-amber-400', bg: 'bg-amber-900/30' },
    { label: 'Pendiente instalar', value: pendienteInstalar.length, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-900/30' },
    { label: 'Obra pendiente', value: obraPendiente.length, icon: Building2, color: 'text-amber-400', bg: 'bg-amber-900/30' },
    { label: 'Listos producción', value: listosProd.length, icon: Package, color: 'text-orange-400', bg: 'bg-orange-900/30' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Resumen operativo · {formatFecha(hoy)}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`${s.bg} border border-white/5 rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs">{s.label}</span>
                <Icon size={14} className={s.color} />
              </div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Alertas */}
        <div className="col-span-2 bg-[#161820] border border-white/5 rounded-xl">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><AlertTriangle size={14} className="text-red-400" /> Alertas activas</h2>
            <span className="text-xs text-slate-500">{alertas.filter(a=>a.estado==='Pendiente').length} pendientes</span>
          </div>
          <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
            {alertas.filter(a => a.estado === 'Pendiente').slice(0, 8).map(al => (
              <div key={al.id} className="px-4 py-3 hover:bg-white/3 cursor-pointer" onClick={() => goToProject(al.proyectoId)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${al.prioridad === 'Urgente' ? 'bg-red-900 text-red-300' : 'bg-amber-900 text-amber-300'}`}>{al.tipo}</span>
                      <span className="text-[10px] text-slate-400">{al.departamentoOrigen} → {al.departamentoDestino}</span>
                    </div>
                    <div className="text-xs text-white font-medium truncate">{al.proyecto}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{al.motivo}</div>
                    <div className="text-[10px] text-blue-400 mt-1 font-medium">{al.accionNecesaria}</div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${al.prioridad === 'Urgente' ? 'bg-red-600 text-white' : 'bg-amber-700 text-amber-200'}`}>{al.prioridad}</span>
                </div>
              </div>
            ))}
            {alertas.filter(a => a.estado === 'Pendiente').length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">Sin alertas pendientes</div>
            )}
          </div>
        </div>

        {/* Carga por departamento */}
        <div className="space-y-3">
          <div className="bg-[#161820] border border-white/5 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Carga por departamento</h2>
            <div className="space-y-2">
              {cargaDept.map(({ dept, count }) => {
                const c = getDeptColor(dept);
                const max = Math.max(...cargaDept.map(d => d.count), 1);
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={c.text}>{dept}</span>
                      <span className="text-slate-400">{count}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${c.bg} rounded-full transition-all`} style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-[#161820] border border-white/5 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Carga por responsable</h2>
            <div className="space-y-1.5">
              {Object.entries(cargaResp).sort((a,b) => b[1]-a[1]).map(([resp, n]) => (
                <div key={resp} className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 truncate flex-1 mr-2">{resp}</span>
                  <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Proyectos activos recientes */}
      <div className="bg-[#161820] border border-white/5 rounded-xl">
        <div className="px-4 py-3 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Proyectos en curso</h2>
        </div>
        <div className="divide-y divide-white/5">
          {activos.slice(0, 6).map(p => {
            const atrasado = isAtrasado(p.fechaEntrega, p.estadoGeneral);
            return (
              <div key={p.id} className="px-4 py-3 flex items-center gap-4 hover:bg-white/3 cursor-pointer" onClick={() => goToProject(p.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white truncate">{p.nombre}</span>
                    {atrasado && <span className="text-[9px] bg-red-900 text-red-300 px-1.5 py-0.5 rounded font-bold">ATRASADO</span>}
                  </div>
                  <div className="text-xs text-slate-400">{p.cliente} · Entrega: {formatFecha(p.fechaEntrega)}</div>
                </div>
                <DeptChip dept={getDeptActual(p)} />
                <StatusChip estado={p.estadoGeneral} />
                <span className="text-xs text-slate-500 hidden lg:block">{p.responsableGeneral}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

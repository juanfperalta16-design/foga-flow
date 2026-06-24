import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { getEffectiveStatus, getDeptStyle, getStatusStyle } from '../utils/statusHelpers';
import { formatShortDate } from '../utils/dateHelpers';

export default function Urgencies({
  activities = [],
  projects = [],
  alerts = [],
  history = [],
  onViewActivity,
}) {
  const safeActs = Array.isArray(activities) ? activities : [];

  const urgentes  = safeActs.filter(a => getEffectiveStatus(a) === 'Urgente');
  const atrasadas = safeActs.filter(a => getEffectiveStatus(a) === 'Atrasado');
  const conObs    = safeActs.filter(a => a.estado === 'Con observaciones');

  const Section = ({ icon: Icon, title, acts, color, bg }) => (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: color + '44' }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ background: bg }}>
        <Icon size={16} style={{ color }} />
        <h2 className="font-bold text-sm" style={{ color }}>{title}</h2>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>{acts.length}</span>
      </div>
      {acts.length === 0
        ? <div className="bg-white px-5 py-6 text-center text-sm text-slate-400">Sin {title.toLowerCase()}</div>
        : (
          <div className="bg-white divide-y divide-slate-100">
            {acts.map(a => {
              const dept   = getDeptStyle(a.departamento);
              const status = getEffectiveStatus(a);
              const st     = getStatusStyle(status);
              return (
                <div key={a.id} onClick={() => onViewActivity && onViewActivity(a)}
                  className="px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: dept.border }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800">{a.actividad}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: dept.bg, color: dept.text }}>{a.departamento}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{a.proyecto} · 👤 {a.responsable}</div>
                    {a.observaciones && (
                      <div className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-0.5 mt-1 inline-block">
                        💬 {a.observaciones}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full block mb-1" style={{ background: st.bg, color: st.text }}>{status}</span>
                    <div className="text-xs text-slate-400">Límite: {formatShortDate(a.fechaLimite)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Urgencias y atrasos</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {urgentes.length + atrasadas.length + conObs.length} situaciones requieren atención
        </p>
      </div>
      <Section icon={AlertTriangle} title="Urgentes"          acts={urgentes}  color="#ef4444" bg="#fee2e2" />
      <Section icon={Clock}         title="Atrasadas"         acts={atrasadas} color="#dc2626" bg="#fecaca" />
      <Section icon={XCircle}       title="Con observaciones" acts={conObs}    color="#d97706" bg="#fef3c7" />
    </div>
  );
}

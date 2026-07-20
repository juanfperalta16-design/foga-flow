import { getDeptStyle, getEffectiveStatus, getStatusStyle, checklistProgress } from '../utils/statusHelpers';
import { formatShortDate } from '../utils/dateHelpers';

export default function ActivityCard({ actividad, onClick, compact = false }) {
  const dept = getDeptStyle(actividad.departamento);
  const status = getEffectiveStatus(actividad);
  const st = getStatusStyle(status);
  const progress = checklistProgress(actividad);

  if (compact) {
    return (
      <div
        onClick={() => onClick && onClick(actividad)}
        className="rounded-lg px-2 py-1.5 cursor-pointer hover:brightness-95 transition-all text-xs"
        style={{ background: dept.bg, borderLeft: `3px solid ${dept.border}` }}
      >
        <div className="font-semibold truncate" style={{ color: dept.text }}>{actividad.actividad}</div>
        <div className="text-steel-faint truncate">{actividad.responsable}</div>
        <div className="mt-1 flex items-center gap-1">
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: st.bg, color: st.text }}>{status}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick && onClick(actividad)}
      className="rounded-xl p-3 cursor-pointer hover:shadow-md transition-all border border-white/80 animate-fadein"
      style={{ background: dept.bg, borderLeft: `4px solid ${dept.border}` }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-semibold text-sm text-slate-800 leading-tight">{actividad.actividad}</div>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap" style={{ background: st.bg, color: st.text }}>{status}</span>
      </div>
      <div className="text-xs text-steel-faint mb-1 font-medium">{actividad.proyecto}</div>
      <div className="flex items-center justify-between text-xs text-steel-faint">
        <span>👤 {actividad.responsable}</span>
        <span>{formatShortDate(actividad.fechaLimite)}</span>
      </div>
      {progress < 100 && (
        <div className="mt-2">
          <div className="h-1 rounded-full bg-white/60">
            <div className="h-1 rounded-full transition-all" style={{ width: `${progress}%`, background: dept.border }} />
          </div>
        </div>
      )}
    </div>
  );
}

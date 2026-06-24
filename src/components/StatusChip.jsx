import { getStatusColor, getDeptColor, PRIORIDAD_COLORS } from '../utils/statusHelpers';

export function StatusChip({ estado, size = 'sm' }) {
  const c = getStatusColor(estado);
  const p = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]';
  return <span className={`${c.bg} ${c.text} ${p} rounded font-medium whitespace-nowrap`}>{estado}</span>;
}

export function DeptChip({ dept, size = 'sm' }) {
  const c = getDeptColor(dept);
  const p = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]';
  return <span className={`${c.bg} text-white ${p} rounded font-medium whitespace-nowrap`}>{dept}</span>;
}

export function PrioridadChip({ prioridad }) {
  return <span className={`${PRIORIDAD_COLORS[prioridad] || 'bg-slate-700 text-slate-300'} px-2 py-0.5 text-[10px] rounded font-medium`}>{prioridad}</span>;
}

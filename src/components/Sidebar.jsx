import { LayoutDashboard, FolderKanban, Calendar, Columns, AlertTriangle, Settings, Building2, Monitor, Factory, Wrench, Users, LogOut, DollarSign, HelpCircle } from 'lucide-react';
import logoFoga from '../assets/LOGO_FOGA.png';

// Color por departamento = su posición en la escala de temple del acero
// (pajizo -> bronce -> violeta -> azul), la misma lógica que src/utils/statusHelpers.js.
const NAV = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'proyectos',    label: 'Proyectos',    icon: FolderKanban },
  { type: 'divider',    label: 'DEPARTAMENTOS' },
  { id: 'arquitectura', label: 'Arquitectura', icon: Building2, color: 'text-[#D4A017]' },
  { id: 'diseno3d',     label: 'Diseño 3D',    icon: Monitor,   color: 'text-[#B5651D]', badge: 'reproceso' },
  { id: 'produccion',   label: 'Producción',   icon: Factory,   color: 'text-[#7A4B8C]' },
  { id: 'instalaciones',label: 'Instalaciones',icon: Wrench,    color: 'text-[#2C6E9E]' },
  { id: 'contabilidad', label: 'Contabilidad', icon: DollarSign, color: 'text-[#A67C3D]' },
  { type: 'divider',    label: 'VISTAS' },
  { id: 'calendario',   label: 'Calendario',   icon: Calendar },
  { id: 'kanban',       label: 'Kanban',       icon: Columns },
  { id: 'equipo',       label: 'Equipo',       icon: Users },
  { type: 'divider',    label: 'CONTROL' },
  { id: 'urgencias',    label: 'Urgencias',    icon: AlertTriangle, color: 'text-red-400', badge: 'urgencias' },
  { id: 'configuracion',label: 'Configuración',icon: Settings },
  { id: 'ayuda',        label: 'Ayuda',        icon: HelpCircle },
];

export default function Sidebar({ page, setPage, urgentCount, atrasadosCount, reprocesoCount, currentUser, onLogout }) {
  const nombre = currentUser || 'Usuario';
  const iniciales = nombre.split(/[@.]/)[0].slice(0, 2).toUpperCase();
  return (
    <aside className="w-56 shrink-0 bg-steel-sidebar border-r border-steel-line flex flex-col h-screen">
      <div className="px-5 py-4 border-b border-steel-line">
        <div className="flex items-center gap-3">
          <img src={logoFoga} alt="FOGA" style={{ height: 32, filter: 'invert(1)', opacity: 0.95 }} />
          <div>
            <div className="text-white font-display font-bold text-sm leading-none">Flow</div>
            <div className="text-steel-faint text-[10px] mt-0.5 font-stamp">v1.0 · Sistema interno</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map((item, i) => {
          if (item.type === 'divider') return (
            <div key={i} className="px-3 pt-4 pb-1">
              <span className="text-[9px] font-bold tracking-widest text-steel-faint uppercase font-stamp">{item.label}</span>
            </div>
          );
          const Icon   = item.icon;
          const active = page === item.id;
          const total  = item.badge === 'urgencias' ? (urgentCount + atrasadosCount) : item.badge === 'reproceso' ? reprocesoCount : 0;
          return (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all mb-0.5 border-l-2 ${active ? 'bg-flame/10 border-flame text-white' : 'border-transparent text-steel-muted hover:text-slate-200 hover:bg-white/5'}`}>
              <Icon size={15} className={item.color || (active ? 'text-white' : '')} />
              <span className="text-xs font-medium flex-1">{item.label}</span>
              {total > 0 && <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full font-stamp">{total}</span>}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-steel-line">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-flame flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold font-stamp">{iniciales}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white font-medium truncate">{nombre}</div>
            <div className="text-[10px] text-steel-faint">Sesión activa</div>
          </div>
          <button onClick={onLogout} title="Cerrar sesión" className="text-steel-faint hover:text-red-400 transition-colors shrink-0">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

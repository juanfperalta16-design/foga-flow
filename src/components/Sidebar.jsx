import { LayoutDashboard, FolderKanban, Calendar, Columns, AlertTriangle, Settings, Building2, Monitor, Factory, Wrench } from 'lucide-react';

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'proyectos',    label: 'Proyectos',    icon: FolderKanban },
  { type: 'divider',    label: 'DEPARTAMENTOS' },
  { id: 'arquitectura', label: 'Arquitectura', icon: Building2, color: 'text-purple-400' },
  { id: 'diseno3d',     label: 'Diseño 3D',    icon: Monitor,   color: 'text-blue-400' },
  { id: 'instalaciones',label: 'Instalaciones',icon: Wrench,    color: 'text-green-400' },
  { id: 'produccion',   label: 'Producción',   icon: Factory,   color: 'text-orange-400' },
  { type: 'divider',    label: 'VISTAS' },
  { id: 'calendario',   label: 'Calendario',   icon: Calendar },
  { id: 'kanban',       label: 'Kanban',       icon: Columns },
  { type: 'divider',    label: 'CONTROL' },
  { id: 'urgencias',    label: 'Urgencias',    icon: AlertTriangle, color: 'text-red-400', badge: true },
  { id: 'configuracion',label: 'Configuración',icon: Settings },
];

export default function Sidebar({ page, setPage, urgentCount, atrasadosCount }) {
  return (
    <aside className="w-56 shrink-0 bg-[#161820] border-r border-white/5 flex flex-col h-screen">
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">F</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">FOGA Flow</div>
            <div className="text-slate-500 text-[10px] mt-0.5 font-mono">v1.0 · FOGA</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map((item, i) => {
          if (item.type === 'divider') return (
            <div key={i} className="px-3 pt-4 pb-1">
              <span className="text-[9px] font-bold tracking-widest text-slate-600 uppercase">{item.label}</span>
            </div>
          );
          const Icon = item.icon;
          const active = page === item.id;
          const total  = item.badge ? (urgentCount + atrasadosCount) : 0;
          return (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all mb-0.5 ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
              <Icon size={15} className={active ? 'text-blue-400' : (item.color || '')} />
              <span className="text-xs font-medium flex-1">{item.label}</span>
              {total > 0 && <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{total}</span>}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">JP</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white font-medium truncate">Juan Peralta</div>
            <div className="text-[10px] text-slate-500">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

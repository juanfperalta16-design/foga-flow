import { useState } from 'react';
import { resetStorage } from '../utils/storage';
import { MOCK_RESPONSABLES, DEPARTAMENTOS } from '../data/mockData';
import { RotateCcw, Users, Building2, Info } from 'lucide-react';

export default function Config() {
  const [confirmed, setConfirmed] = useState(false);

  function handleReset() {
    if (!confirmed) { setConfirmed(true); return; }
    resetStorage();
    window.location.reload();
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Configuración</h1>
        <p className="text-sm text-steel-muted mt-0.5">Opciones del sistema FOGA Flow</p>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-steel-muted" />
          <h2 className="font-bold text-slate-700">Información del sistema</h2>
        </div>
        <div className="space-y-2 text-sm text-steel-faint">
          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="font-medium text-steel-faint">Aplicación</span>
            <span className="font-semibold">FOGA Flow v1.0</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="font-medium text-steel-faint">Almacenamiento</span>
            <span className="font-semibold">LocalStorage (prototipo)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="font-medium text-steel-faint">Usuario activo</span>
            <span className="font-semibold">Juan Peralta (Administrador)</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="font-medium text-steel-faint">Empresa</span>
            <span className="font-semibold">FOGA S.A. — Equipos de cocina en acero inoxidable</span>
          </div>
        </div>
      </div>

      {/* Departamentos */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={16} className="text-steel-muted" />
          <h2 className="font-bold text-slate-700">Departamentos</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEPARTAMENTOS.map(d => (
            <span key={d} className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-full">{d}</span>
          ))}
        </div>
      </div>

      {/* Responsables */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-steel-muted" />
          <h2 className="font-bold text-slate-700">Responsables registrados</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MOCK_RESPONSABLES.map(r => (
            <div key={r} className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                {r.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Migración */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-bold text-slate-700 mb-2">📦 Migración a Firebase / Supabase</h2>
        <div className="text-sm text-steel-faint space-y-1.5">
          <p>El código está preparado para migrar. Solo debes modificar <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">src/utils/storage.js</code>:</p>
          <ul className="list-disc list-inside text-xs space-y-1 text-steel-faint ml-2">
            <li>Reemplaza <code className="bg-slate-100 px-1 rounded font-mono">localStorage.getItem</code> por llamadas a Firestore o Supabase.</li>
            <li>Las funciones <code className="bg-slate-100 px-1 rounded font-mono">getProyectos()</code>, <code className="bg-slate-100 px-1 rounded font-mono">saveProyectos()</code>, etc. son el único punto de cambio.</li>
            <li>El hook <code className="bg-slate-100 px-1 rounded font-mono">useAppState.js</code> no necesita cambios.</li>
          </ul>
        </div>
      </div>

      {/* Reset */}
      <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <RotateCcw size={16} className="text-red-400" />
          <h2 className="font-bold text-red-700">Zona peligrosa</h2>
        </div>
        <p className="text-sm text-red-600 mb-3">Reinicia todos los datos al estado inicial (datos de ejemplo). Esta acción no se puede deshacer.</p>
        <button onClick={handleReset} className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${confirmed ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
          {confirmed ? '⚠️ Confirmar reset (clic para confirmar)' : 'Reiniciar datos de ejemplo'}
        </button>
        {confirmed && <p className="text-xs text-red-500 mt-1.5">Haz clic de nuevo para confirmar. Se recargará la página.</p>}
      </div>
    </div>
  );
}

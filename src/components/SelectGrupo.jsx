// =====================================================
// FOGA FLOW — SelectGrupo.jsx
// Select con optgroups por grupo de personas
// =====================================================
import { useApp } from '../App';
import { getResponsablesAgrupados } from '../utils/settingsStorage';

export function SelectGrupoTailwind({ value, onChange, grupos, placeholder = 'Seleccionar...' }) {
  const { responsables } = useApp();
  const agrupados = getResponsablesAgrupados(responsables);
  const gruposFiltrados = grupos
    ? Object.fromEntries(Object.entries(agrupados).filter(([g]) => grupos.includes(g)))
    : agrupados;

  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-flame">
      <option value="">{placeholder}</option>
      {Object.entries(gruposFiltrados).map(([grupo, nombres]) => (
        <optgroup key={grupo} label={`── ${grupo} ──`}>
          {nombres.map(nombre => (
            <option key={nombre} value={nombre}>{nombre}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

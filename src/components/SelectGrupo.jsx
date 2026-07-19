// =====================================================
// FOGA FLOW — SelectGrupo.jsx
// Select con optgroups por grupo de personas
// Uso: <SelectGrupo value={val} onChange={setVal} grupos={['Maestros']} placeholder="..." />
// Si no se pasan grupos, muestra todos
// =====================================================
import { useApp } from '../App';
import { getResponsablesAgrupados } from '../utils/settingsStorage';

export default function SelectGrupo({ value, onChange, grupos, placeholder = 'Seleccionar...', style = {}, className = '' }) {
  const { responsables } = useApp();
  const agrupados = getResponsablesAgrupados(responsables);

  // Filtrar solo los grupos pedidos (o todos si no se especifica)
  const gruposFiltrados = grupos
    ? Object.fromEntries(Object.entries(agrupados).filter(([g]) => grupos.includes(g)))
    : agrupados;

  const baseStyle = {
    background: '#0F1117',
    border: '1px solid #374151',
    borderRadius: 7,
    color: value ? '#E2E8F0' : '#6B7280',
    fontSize: 12,
    padding: '7px 10px',
    outline: 'none',
    width: '100%',
    ...style,
  };

  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      style={baseStyle} className={className}>
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

// Versión Tailwind para ProjectForm
export function SelectGrupoTailwind({ value, onChange, grupos, placeholder = 'Seleccionar...' }) {
  const { responsables } = useApp();
  const agrupados = getResponsablesAgrupados(responsables);
  const gruposFiltrados = grupos
    ? Object.fromEntries(Object.entries(agrupados).filter(([g]) => grupos.includes(g)))
    : agrupados;

  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      className="w-full bg-[#0F1117] border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-purple-500">
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

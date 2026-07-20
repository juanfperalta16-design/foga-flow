// ─── Color & Status Utilities ────────────────────────

// Misma paleta de temple del acero que src/utils/statusHelpers.js (un solo
// sistema de color conceptual para todo el pipeline, aquí en versión "light chip"
// para Badge.jsx). Ver esa constante para la lógica detrás de estos colores.
export const DEPT_COLORS = {
  "Diseño": { bg: "bg-[#B5651D]", text: "text-[#E3A868]", light: "bg-[#B5651D]/10", border: "border-[#B5651D]/40", hex: "#B5651D" },
  "Arquitectura": { bg: "bg-[#D4A017]", text: "text-[#F0D687]", light: "bg-[#D4A017]/10", border: "border-[#D4A017]/40", hex: "#D4A017" },
  "Producción": { bg: "bg-[#7A4B8C]", text: "text-[#C9A8D6]", light: "bg-[#7A4B8C]/10", border: "border-[#7A4B8C]/40", hex: "#7A4B8C" },
  "Instalación": { bg: "bg-[#2C6E9E]", text: "text-[#8FC3E3]", light: "bg-[#2C6E9E]/10", border: "border-[#2C6E9E]/40", hex: "#2C6E9E" },
  "Toma de medidas": { bg: "bg-[#A67C3D]", text: "text-[#D9BC85]", light: "bg-[#A67C3D]/10", border: "border-[#A67C3D]/40", hex: "#A67C3D" },
  "Finalizado": { bg: "bg-gray-500", text: "text-gray-300", light: "bg-gray-500/10", border: "border-gray-500/40", hex: "#6B7280" },
};

export const STATUS_COLORS = {
  "No iniciado": { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  "En proceso": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  "En revisión": { bg: "bg-cyan-100", text: "text-cyan-700", dot: "bg-cyan-500" },
  "Con observaciones": { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  "Pausado": { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  "Urgente": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  "Atrasado": { bg: "bg-red-200", text: "text-red-900", dot: "bg-red-800" },
  "Finalizado": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  "Aprobado": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export const PRIORITY_COLORS = {
  "Baja": { bg: "bg-gray-100", text: "text-gray-600" },
  "Normal": { bg: "bg-blue-100", text: "text-blue-700" },
  "Alta": { bg: "bg-orange-100", text: "text-orange-700" },
  "Urgente": { bg: "bg-red-100", text: "text-red-700" },
};

// Línea del módulo/proyecto — un solo lugar para las 3 líneas, así
// agregar una línea nueva no implica tocar cada badge por separado.
export const LINEA_COLORS = {
  "Element":   { bg: "#2D1B69", text: "#C4B5FD" },
  "Santa Ana": { bg: "#1E3A5F", text: "#93C5FD" },
  "Equifrigo": { bg: "#452B03", text: "#FCD34D" },
};

export const getDeptColor = (dept) =>
  DEPT_COLORS[dept] || { bg: "bg-slate-500", text: "text-slate-700", light: "bg-slate-50", border: "border-slate-300", hex: "#64748B" };

export const getStatusColor = (status) =>
  STATUS_COLORS[status] || { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };

export const getPriorityColor = (priority) =>
  PRIORITY_COLORS[priority] || { bg: "bg-gray-100", text: "text-gray-600" };

export const getLineaColor = (linea) =>
  LINEA_COLORS[linea] || { bg: "#1E3A5F", text: "#93C5FD" };

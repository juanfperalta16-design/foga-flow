// ─── Color Utilities ──────────────────────────────

// Línea del módulo/proyecto — un solo lugar para las 3 líneas, así
// agregar una línea nueva no implica tocar cada badge por separado.
export const LINEA_COLORS = {
  "Element":   { bg: "#2D1B69", text: "#C4B5FD" },
  "Santa Ana": { bg: "#1E3A5F", text: "#93C5FD" },
  "Equifrigo": { bg: "#452B03", text: "#FCD34D" },
};

export const getLineaColor = (linea) =>
  LINEA_COLORS[linea] || { bg: "#1E3A5F", text: "#93C5FD" };

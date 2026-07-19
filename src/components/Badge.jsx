// ─── Badge ────────────────────────────────────────────

import React from "react";
import { getDeptColor, getStatusColor, getPriorityColor, getLineaColor } from "../utils/colorUtils";

export function DeptBadge({ dept, small }) {
  const c = getDeptColor(dept);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium
      ${small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}
      ${c.light} ${c.text} border ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.bg}`} />
      {dept}
    </span>
  );
}

export function StatusBadge({ status, small }) {
  const c = getStatusColor(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium
      ${small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}
      ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority, small }) {
  const c = getPriorityColor(priority);
  return (
    <span className={`inline-flex items-center rounded-full font-medium
      ${small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}
      ${c.bg} ${c.text}`}>
      {priority}
    </span>
  );
}

export function LineaBadge({ linea }) {
  if (!linea) return null;
  const c = getLineaColor(linea);
  return (
    <span style={{ fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, padding: '2px 8px', borderRadius: 5 }}>
      {linea}
    </span>
  );
}

// ─── Badge ────────────────────────────────────────────

import React from "react";
import { getLineaColor } from "../utils/colorUtils";

export function LineaBadge({ linea }) {
  if (!linea) return null;
  const c = getLineaColor(linea);
  return (
    <span style={{ fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, padding: '2px 8px', borderRadius: 5 }}>
      {linea}
    </span>
  );
}

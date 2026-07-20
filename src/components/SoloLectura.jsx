// =====================================================
// FOGA FLOW — SoloLectura.jsx
// Envuelve una sección editable: si `permitido` es false, la muestra igual
// (nada se oculta) pero deshabilita toda interacción y avisa por qué.
// =====================================================
export default function SoloLectura({ permitido, children, mensaje = 'Solo lectura — esta sección no te corresponde a ti' }) {
  if (permitido) return <>{children}</>;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#FCD34D', background: '#451A0320', border: '1px solid #D9770640', borderRadius: 8, padding: '7px 12px', marginBottom: 12 }}>
        🔒 {mensaje}
      </div>
      <div style={{ opacity: 0.55, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>
    </div>
  );
}

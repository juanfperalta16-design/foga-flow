export const crearEntradaHistorial = ({ proyectoId, usuario, departamento, accion, campoModificado, valorAnterior, valorNuevo, observacion = '' }) => ({
  id: `H${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
  proyectoId, usuario, departamento, accion,
  campoModificado, valorAnterior, valorNuevo, observacion,
  fecha: new Date().toISOString().split('T')[0],
  hora: new Date().toTimeString().slice(0, 5),
});

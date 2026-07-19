// =====================================================
// FOGA FLOW — Seed inicial de Firestore
// Si una colección está vacía, la llena con los datos de arranque
// (mismo comportamiento que antes tenía initStorage() con localStorage)
// =====================================================

import { getAll, setWithId, remove, COLLECTIONS } from "./firestoreService";
import { mockProyectos } from "../data/mockData";
import { RESPONSABLES_INICIALES, DEPARTAMENTOS_CONFIG_INICIALES } from "../utils/settingsStorage";

async function seedColeccion(col, items, idField = "id") {
  const existentes = await getAll(col);
  if (existentes.length > 0) return;
  await Promise.all(items.map(item => setWithId(col, item[idField], item)));
}

async function vaciarColeccion(col) {
  const docs = await getAll(col);
  await Promise.all(docs.map(d => remove(col, d.id)));
}

export async function seedIfEmpty() {
  await seedColeccion(COLLECTIONS.PROYECTOS, mockProyectos);
  await seedColeccion(COLLECTIONS.RESPONSABLES, RESPONSABLES_INICIALES);
  await seedColeccion(COLLECTIONS.DEPARTAMENTOS_CONFIG, DEPARTAMENTOS_CONFIG_INICIALES);
}

// Reinicia proyectos/actividades/alertas/historial al estado inicial de ejemplo.
// No toca responsables ni departamentos_config.
export async function resetDatos() {
  await vaciarColeccion(COLLECTIONS.PROYECTOS);
  await Promise.all(mockProyectos.map(p => setWithId(COLLECTIONS.PROYECTOS, p.id, p)));
  await vaciarColeccion(COLLECTIONS.ACTIVIDADES);
  await vaciarColeccion(COLLECTIONS.ALERTAS);
  await vaciarColeccion(COLLECTIONS.HISTORIAL);
}

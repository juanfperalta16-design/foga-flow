// =====================================================
// FOGA FLOW — Firestore Service
// Todas las operaciones CRUD centralizadas
// =====================================================

import {
  collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc,
  deleteDoc, onSnapshot, serverTimestamp
} from "firebase/firestore";
import { db } from "./config";

// ─── Colecciones ──────────────────────────────────
// Nombres reales usados por la app (src/App.jsx, utils/storage.js, settingsStorage.js)
export const COLLECTIONS = {
  PROYECTOS: "proyectos",
  ACTIVIDADES: "actividades",
  ALERTAS: "alertas",
  HISTORIAL: "historial",
  RESPONSABLES: "responsables",
  DEPARTAMENTOS_CONFIG: "departamentos_config",
  PROSPECTOS: "prospectos",
};

// ─── Helpers genéricos ────────────────────────────
export const getAll = async (col) => {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getById = async (col, id) => {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const create = async (col, data) => {
  const ref = await addDoc(collection(db, col), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

// setWithId: crea o reemplaza un documento con un ID propio (ej. "P001"),
// necesario para conservar los IDs que ya usa toda la app.
export const setWithId = async (col, id, data) => {
  await setDoc(doc(db, col, id), data, { merge: true });
};

export const update = async (col, id, data) => {
  await updateDoc(doc(db, col, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const remove = async (col, id) => {
  await deleteDoc(doc(db, col, id));
};

// ─── Listeners en tiempo real ─────────────────────
// Sin orderBy: no todos los documentos garantizan el mismo campo/tipo de fecha
// (datos sembrados con fechas en texto vs. escrituras nuevas con serverTimestamp).
// El orden, cuando importa, se resuelve del lado de la app.
export const listenToCollection = (col, callback) => {
  return onSnapshot(collection(db, col), (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

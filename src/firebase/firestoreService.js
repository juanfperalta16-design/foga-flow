// =====================================================
// FOGA FLOW — Firestore Service
// Todas las operaciones CRUD centralizadas
// =====================================================

import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, orderBy, where,
  serverTimestamp, writeBatch
} from "firebase/firestore";
import { db } from "./config";

// ─── Colecciones ──────────────────────────────────
export const COLLECTIONS = {
  USERS: "users",
  DEPARTMENTS: "departments",
  RESPONSABLES: "responsables",
  PROJECTS: "projects",
  ACTIVITIES: "activities",
  CHECKLISTS: "checklists",
  SETTINGS: "settings",
  HISTORY: "history",
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
export const listenToCollection = (col, callback, orderField = "createdAt") => {
  const q = query(collection(db, col), orderBy(orderField, "desc"));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

export const listenToActivities = (callback) => {
  const q = query(collection(db, COLLECTIONS.ACTIVITIES), orderBy("fechaInicio", "asc"));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

export const listenToProjects = (callback) => {
  const q = query(collection(db, COLLECTIONS.PROJECTS), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

// ─── Historial ────────────────────────────────────
export const addHistory = async (entry) => {
  await addDoc(collection(db, COLLECTIONS.HISTORY), {
    ...entry,
    timestamp: serverTimestamp(),
  });
};

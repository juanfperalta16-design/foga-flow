// =====================================================
// FOGA FLOW — Seed de datos iniciales
// Se ejecuta UNA sola vez si Firestore está vacío
// =====================================================

import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const RESPONSABLES = [
  { nombre: "Juan Peralta", departamento: "Diseño", activo: true },
  { nombre: "Santiago Vanegas", departamento: "Diseño", activo: true },
  { nombre: "Manuel Aguirre", departamento: "Diseño", activo: true },
  { nombre: "Joaquín Chica", departamento: "Diseño", activo: true },
  { nombre: "Paúl Laica", departamento: "Producción", activo: true },
  { nombre: "Jose Luis Yanza", departamento: "Producción", activo: true },
  { nombre: "Diego Montero", departamento: "Arquitectura", activo: true },
  { nombre: "Jose Luis Pesantez", departamento: "Instalación", activo: true },
  { nombre: "Jaime Dominguez", departamento: "Instalación", activo: true },
  { nombre: "Michael Aguayza", departamento: "Producción", activo: true },
  { nombre: "Bryam Casierra", departamento: "Producción", activo: true },
];

const DEPARTAMENTOS = [
  { nombre: "Diseño", color: "#3B82F6", orden: 1, activo: true },
  { nombre: "Arquitectura", color: "#8B5CF6", orden: 2, activo: true },
  { nombre: "Producción", color: "#F97316", orden: 3, activo: true },
  { nombre: "Instalación", color: "#22C55E", orden: 4, activo: true },
  { nombre: "Toma de medidas", color: "#EAB308", orden: 5, activo: true },
  { nombre: "Finalizado", color: "#6B7280", orden: 6, activo: true },
];

const ESTADOS = [
  { nombre: "No iniciado", color: "#6B7280", orden: 1 },
  { nombre: "En proceso", color: "#3B82F6", orden: 2 },
  { nombre: "En revisión", color: "#06B6D4", orden: 3 },
  { nombre: "Con observaciones", color: "#EAB308", orden: 4 },
  { nombre: "Pausado", color: "#9CA3AF", orden: 5 },
  { nombre: "Urgente", color: "#EF4444", orden: 6 },
  { nombre: "Atrasado", color: "#991B1B", orden: 7 },
  { nombre: "Finalizado", color: "#22C55E", orden: 8 },
  { nombre: "Aprobado", color: "#16A34A", orden: 9 },
];

const PRIORIDADES = [
  { nombre: "Baja", color: "#6B7280", orden: 1 },
  { nombre: "Normal", color: "#3B82F6", orden: 2 },
  { nombre: "Alta", color: "#F97316", orden: 3 },
  { nombre: "Urgente", color: "#EF4444", orden: 4 },
];

const ETAPAS = [
  { nombre: "Diseño", orden: 1 },
  { nombre: "Arquitectura", orden: 2 },
  { nombre: "Producción", orden: 3 },
  { nombre: "Instalación", orden: 4 },
  { nombre: "Finalizado", orden: 5 },
];

async function seedCollection(colName, data) {
  const snap = await getDocs(collection(db, colName));
  if (!snap.empty) return; // Ya tiene datos

  for (const item of data) {
    await addDoc(collection(db, colName), {
      ...item,
      createdAt: serverTimestamp(),
    });
  }
  console.log(`✅ ${colName} inicializado`);
}

export async function seedInitialData() {
  try {
    await seedCollection("responsables", RESPONSABLES);
    await seedCollection("departments", DEPARTAMENTOS);
    await seedCollection("estados", ESTADOS);
    await seedCollection("prioridades", PRIORIDADES);
    await seedCollection("etapas", ETAPAS);
    console.log("✅ Datos iniciales cargados");
  } catch (err) {
    console.error("Error en seed:", err);
  }
}

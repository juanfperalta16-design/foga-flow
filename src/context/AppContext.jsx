// =====================================================
// FOGA FLOW — Global App Context
// Estado global: proyectos, actividades, config
// =====================================================

import React, { createContext, useContext, useState, useEffect } from "react";
import { listenToProjects, listenToActivities, listenToCollection, addHistory } from "../firebase/firestoreService";
import { seedInitialData } from "../data/seedInitialData";
import { isOverdue } from "../utils/dateUtils";

const AppContext = createContext(null);

// Usuario actual simulado (hasta integrar Firebase Auth)
const CURRENT_USER = { id: "user_1", nombre: "Juan Peralta", rol: "admin" };

export function AppProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [estados, setEstados] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    let unsubs = [];

    const init = async () => {
      // Sembrar datos si Firestore está vacío
      await seedInitialData();

      // Listeners en tiempo real
      unsubs.push(listenToProjects(setProjects));
      unsubs.push(listenToActivities(setActivities));
      unsubs.push(listenToCollection("responsables", setResponsables, "nombre"));
      unsubs.push(listenToCollection("departments", setDepartments, "orden"));
      unsubs.push(listenToCollection("estados", setEstados, "orden"));
      unsubs.push(listenToCollection("prioridades", setPrioridades, "orden"));
      unsubs.push(listenToCollection("etapas", setEtapas, "orden"));
      unsubs.push(listenToCollection("history", setHistory, "timestamp"));

      setLoading(false);
    };

    init();
    return () => unsubs.forEach(u => u && u());
  }, []);

  // Actividades con detección de atraso automática
  const enrichedActivities = activities.map(a => ({
    ...a,
    estado: isOverdue(a.fechaLimite, a.estado) && a.estado !== "Finalizado" && a.estado !== "Aprobado"
      ? "Atrasado"
      : a.estado,
  }));

  const logHistory = async (accion, coleccion, docId, anterior, nuevo) => {
    await addHistory({
      usuario: CURRENT_USER.nombre,
      accion,
      coleccion,
      docId,
      valorAnterior: anterior,
      valorNuevo: nuevo,
    });
  };

  return (
    <AppContext.Provider value={{
      projects, activities: enrichedActivities,
      responsables, departments, estados, prioridades, etapas, history,
      loading, activeTab, setActiveTab,
      currentUser: CURRENT_USER, logHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

import { useState, useEffect, createContext, useContext } from 'react';
import { mockProyectos, mockActividades, mockAlertas, mockHistorial } from './data/mockData';
import { initStorage, getProyectos, setProyectos, getActividades, setActividades, getAlertas, setAlertas, getHistorial, setHistorial } from './utils/storage';
import { initSettingsStorage, getResponsablesActivos } from './utils/settingsStorage';
import { generarAlertasAutomaticas, calcularEstadoGeneral } from './utils/processRules';
import { isAtrasado } from './utils/dateHelpers';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import ProjectDetail from './components/ProjectDetail';
import MonthlyCalendar from './components/MonthlyCalendar';
import KanbanBoard from './components/KanbanBoard';
import DepartmentView from './components/DepartmentView';
import Urgencies from './components/Urgencies';
import Configuration from './components/Configuration';

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export default function App() {
  const [page, setPage]                           = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [proyectos, setProyectosState]            = useState([]);
  const [actividades, setActividadesState]        = useState([]);
  const [alertas, setAlertasState]                = useState([]);
  const [historial, setHistorialState]            = useState([]);
  const [responsables, setResponsablesState]      = useState([]);
  const [currentUser]                             = useState('Juan Peralta');

  useEffect(() => {
    initStorage(mockProyectos, mockActividades, mockAlertas, mockHistorial);
    initSettingsStorage();
    loadData();
  }, []);

  const loadData = () => {
    const p = getProyectos() || mockProyectos;
    const a = getActividades() || mockActividades;
    const h = getHistorial() || mockHistorial;
    const r = getResponsablesActivos() || [];

    const aConEstado = (Array.isArray(a) ? a : []).map(act => ({
      ...act,
      estado: isAtrasado(act.fechaLimite, act.estado) ? 'Atrasado' : act.estado,
    }));

    const proyectosActualizados = (Array.isArray(p) ? p : []).map(proy => ({
      ...proy,
      estadoGeneral: calcularEstadoGeneral(proy),
    }));

    const autoAlertas   = generarAlertasAutomaticas(proyectosActualizados);
    const manualAlertas = ((getAlertas() || mockAlertas) || []).filter(al => !al.auto);

    setProyectosState(proyectosActualizados);
    setActividadesState(aConEstado);
    setAlertasState([...manualAlertas, ...autoAlertas]);
    setHistorialState(Array.isArray(h) ? h : []);
    setResponsablesState(Array.isArray(r) ? r : []);
  };

  const saveProyectos   = (data) => { setProyectos(data);   setProyectosState(data); };
  const saveActividades = (data) => { setActividades(data); setActividadesState(data); };
  const saveAlertas     = (data) => { const manual = data.filter(a => !a.auto); setAlertas(manual); setAlertasState(data); };
  const saveHistorial   = (data) => { setHistorial(data);   setHistorialState(data); };

  const updateProyecto = (proyecto) => {
    const pConEstado = { ...proyecto, estadoGeneral: calcularEstadoGeneral(proyecto) };
    // Si existe lo actualiza, si es nuevo lo agrega
    const existe  = proyectos.some(p => p.id === pConEstado.id);
    const updated = existe
      ? proyectos.map(p => p.id === pConEstado.id ? pConEstado : p)
      : [...proyectos, pConEstado];
    const autoAlertas = generarAlertasAutomaticas(updated);
    const manual = alertas.filter(a => !a.auto);
    saveProyectos(updated);
    setAlertasState([...manual, ...autoAlertas]);
    setAlertas(manual);
  };

  const updateActividad = (actividad) => {
    saveActividades(actividades.map(a => a.id === actividad.id ? actividad : a));
  };

  const addActividad = (actividad) => {
    saveActividades([...actividades, actividad]);
  };

  const addHistorial = (entry) => {
    saveHistorial([entry, ...historial]);
  };

  const goToProject = (id) => { setSelectedProjectId(id); setPage('project-detail'); };

  const reloadResponsables = () => {
    setResponsablesState(getResponsablesActivos() || []);
  };

  const ctx = {
    proyectos, actividades, alertas, historial, responsables, currentUser,
    updateProyecto, updateActividad, addActividad, addHistorial,
    goToProject, setPage, saveAlertas, loadData, reloadResponsables,
  };

  const urgentCount    = alertas.filter(a => a.estado === 'Pendiente' && a.prioridad === 'Urgente').length;
  const atrasadosCount = proyectos.filter(p => isAtrasado(p.fechaEntrega, p.estadoGeneral)).length;

  const deptProps = {
    actividades,
    proyectos,
    alerts:            alertas,
    history:           historial,
    responsables,
    onViewActivity:    null,
    onCreateActividad: addActividad,
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':      return <Dashboard />;
      case 'proyectos':      return <Projects />;
      case 'project-detail': return <ProjectDetail proyectoId={selectedProjectId} />;
      case 'arquitectura':   return <DepartmentView departamento="Arquitectura"  {...deptProps} />;
      case 'instalaciones':  return <DepartmentView departamento="Instalaciones" {...deptProps} />;
      case 'diseno3d':       return <DepartmentView departamento="Diseño 3D"     {...deptProps} />;
      case 'produccion':     return <DepartmentView departamento="Producción"    {...deptProps} />;
      case 'diseno':         return <DepartmentView departamento="Diseño 3D"     {...deptProps} />;
      case 'instalacion':    return <DepartmentView departamento="Instalaciones" {...deptProps} />;
      case 'obra':           return <DepartmentView departamento="Instalaciones" {...deptProps} />;
      case 'calendario':     return <MonthlyCalendar />;
      case 'kanban':         return <KanbanBoard />;
      case 'urgencias':      return <Urgencies activities={actividades} projects={proyectos} alerts={alertas} history={historial} />;
      case 'configuracion':  return <Configuration />;
      default:               return <Dashboard />;
    }
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex h-screen overflow-hidden bg-[#0F1117]">
        <Sidebar page={page} setPage={setPage} urgentCount={urgentCount} atrasadosCount={atrasadosCount} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </AppContext.Provider>
  );
}

import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/config';
import { COLLECTIONS, listenToCollection, setWithId, remove } from './firebase/firestoreService';
import { generarAlertasAutomaticas, calcularEstadoGeneral } from './utils/processRules';
import { isAtrasado } from './utils/dateHelpers';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import ProjectDetail from './components/ProjectDetail';
import MonthlyCalendar from './components/MonthlyCalendar';
import KanbanBoard from './components/KanbanBoard';
import DepartmentView from './components/DepartmentView';
import Urgencias from './components/Urgencies';
import VistaEquipo from './components/VistaEquipo';
import ExportExcel from './components/ExportExcel';
import Configuration from './components/Configuration';
import Contabilidad from './components/Contabilidad';
import Ayuda from './components/Ayuda';

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export default function App() {
  const [user, setUser]                           = useState(undefined); // undefined = verificando, null = sin sesión
  const [page, setPage]                           = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [proyectos, setProyectosState]            = useState([]);
  const [actividades, setActividadesState]        = useState([]);
  const [alertasManuales, setAlertasManuales]     = useState([]);
  const [historial, setHistorialState]            = useState([]);
  const [responsables, setResponsablesState]      = useState([]);
  const [prospectos, setProspectosState]          = useState([]);
  const [departamentosConfig, setDepartamentosConfig] = useState([]);

  // ── Sesión ──
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // ── Datos en tiempo real desde Firestore (solo con sesión activa) ──
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let unsubs = [];

    (async () => {
      if (cancelled) return;
      unsubs = [
        listenToCollection(COLLECTIONS.PROYECTOS, data =>
          setProyectosState(data.map(p => ({ ...p, estadoGeneral: calcularEstadoGeneral(p) })))
        ),
        listenToCollection(COLLECTIONS.ACTIVIDADES, data =>
          setActividadesState(data.map(a => ({ ...a, estado: isAtrasado(a.fechaLimite, a.estado) ? 'Atrasado' : a.estado })))
        ),
        listenToCollection(COLLECTIONS.ALERTAS, setAlertasManuales),
        listenToCollection(COLLECTIONS.HISTORIAL, setHistorialState),
        listenToCollection(COLLECTIONS.RESPONSABLES, data =>
          setResponsablesState(data.filter(r => r.estado === 'Activo'))
        ),
        listenToCollection(COLLECTIONS.PROSPECTOS, setProspectosState),
        listenToCollection(COLLECTIONS.DEPARTAMENTOS_CONFIG, setDepartamentosConfig),
      ];
    })();

    return () => { cancelled = true; unsubs.forEach(u => u && u()); };
  }, [user]);

  // ── Escrituras ──
  const updateProyecto = async (proyecto) => {
    const conEstado = { ...proyecto, estadoGeneral: calcularEstadoGeneral(proyecto) };
    await setWithId(COLLECTIONS.PROYECTOS, conEstado.id, conEstado);
  };

  const deleteProyecto = async (id) => {
    const alertasRelacionadas = alertasManuales.filter(a => a.proyectoId === id);
    await Promise.all(alertasRelacionadas.map(a => remove(COLLECTIONS.ALERTAS, a.id)));
    await remove(COLLECTIONS.PROYECTOS, id);
  };

  const updateActividad = async (actividad) => {
    await setWithId(COLLECTIONS.ACTIVIDADES, actividad.id, actividad);
  };

  const addActividad = async (actividad) => {
    await setWithId(COLLECTIONS.ACTIVIDADES, actividad.id, actividad);
  };

  const addHistorial = async (entry) => {
    const id = entry.id || `H${Date.now()}`;
    await setWithId(COLLECTIONS.HISTORIAL, id, { ...entry, id });
  };

  const saveAlertas = async (data) => {
    const manuales = (data || []).filter(a => !a.auto);
    await Promise.all(manuales.map(a => setWithId(COLLECTIONS.ALERTAS, a.id, a)));
  };

  const updateProspecto = async (prospecto) => {
    await setWithId(COLLECTIONS.PROSPECTOS, prospecto.id, prospecto);
  };

  const deleteProspecto = async (id) => {
    await remove(COLLECTIONS.PROSPECTOS, id);
  };

  const goToProject = (id) => { setSelectedProjectId(id); setPage('project-detail'); };
  const handleLogout = () => signOut(auth);

  // ── Alertas: manuales (Firestore) + automáticas (calculadas en el momento) ──
  // Se descartan alertas manuales que ya no aplican:
  // - huérfanas: su proyecto ya no existe (fue eliminado).
  // - resueltas por el propio flujo: ej. "Bloqueo Diseño 3D" cuando Arquitectura ya liberó módulos,
  //   sin que nadie tenga que acordarse de marcarla "Resuelta" a mano.
  const proyectosPorId = new Map(proyectos.map(p => [p.id, p]));
  const alertaSigueVigente = (a) => {
    if (!a.proyectoId) return true;
    const p = proyectosPorId.get(a.proyectoId);
    if (!p) return false;
    if (a.tipo === 'Bloqueo Diseño 3D') {
      const liberados = (p.production?.modulos || []).some(m => m.arquitectura?.liberadoA3D);
      if (liberados || p.releasedToDesign3D) return false;
    }
    return true;
  };
  const alertasManualesVivas = alertasManuales.filter(alertaSigueVigente);
  const alertas = [...alertasManualesVivas, ...generarAlertasAutomaticas(proyectos)];
  const currentUser = user?.email || '';

  // ── Permisos por rol ──
  // Se enlaza la cuenta logueada con su ficha de Responsable por correo. Sin
  // ficha vinculada (correo no cargado) o sin rol asignado, se trata como
  // Administrador (acceso completo) para no bloquear cuentas existentes que
  // todavía no tengan el correo cargado en Configuración → Responsables.
  // Esto es una restricción a nivel de interfaz, no de base de datos: las
  // reglas de Firestore (firestore.rules) siguen permitiendo leer/escribir
  // todo a cualquier cuenta logueada.
  const miResponsable = responsables.find(r => (r.correo || '').trim().toLowerCase() === currentUser.trim().toLowerCase());
  const miRol = miResponsable?.rol || 'Administrador';
  const ROL_A_DEPTO_EDITABLE = { 'Arquitectura': 'Arquitectura', 'Diseño': 'Diseño 3D', 'Producción': 'Producción', 'Instalación': 'Instalaciones' };
  const puedeEditar = (depto) => {
    if (miRol === 'Administrador') return true;
    if (miRol === 'Consulta') return false;
    return ROL_A_DEPTO_EDITABLE[miRol] === depto;
  };

  const ctx = {
    proyectos, actividades, alertas, historial, responsables, prospectos, currentUser, departamentosConfig,
    updateProyecto, deleteProyecto, updateActividad, addActividad, addHistorial,
    saveAlertas, updateProspecto, deleteProspecto,
    goToProject, setPage,
    miRol, puedeEditar,
  };

  const urgentCount    = alertas.filter(a => a.estado === 'Pendiente' && a.prioridad === 'Urgente').length;
  const atrasadosCount = proyectos.filter(p => isAtrasado(p.fechaEntrega, p.estadoGeneral)).length;
  // Módulos en reproceso (Producción encontró un problema y Diseño 3D todavía no
  // resolvió) — se muestra como badge en "Diseño 3D" del menú para que no dependa
  // de que alguien entre a revisar cada proyecto para notarlo.
  const reprocesoCount = proyectos.reduce((acc, p) => acc + (p.production?.modulos || []).filter(m => m.produccion?.reproceso).length, 0);

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
      case 'arquitectura':   return <DepartmentView key="Arquitectura"  departamento="Arquitectura"  {...deptProps} />;
      case 'instalaciones':  return <DepartmentView key="Instalaciones" departamento="Instalaciones" {...deptProps} />;
      case 'diseno3d':       return <DepartmentView key="Diseño 3D"     departamento="Diseño 3D"     {...deptProps} />;
      case 'produccion':     return <DepartmentView key="Producción"    departamento="Producción"    {...deptProps} />;
      case 'contabilidad':   return <Contabilidad />;
      case 'calendario':     return <MonthlyCalendar />;
      case 'kanban':         return <KanbanBoard />;
      case 'urgencias':      return <Urgencias />;
      case 'equipo':         return <VistaEquipo />;
      case 'configuracion':  return <Configuration />;
      case 'ayuda':          return <Ayuda />;
      default:               return <Dashboard />;
    }
  };

  if (user === undefined) {
    return <div className="flex items-center justify-center min-h-screen bg-steel-ink text-steel-muted text-sm font-stamp">Cargando...</div>;
  }
  if (user === null) {
    return <Login />;
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex h-screen overflow-hidden bg-steel-ink">
        <Sidebar page={page} setPage={setPage} urgentCount={urgentCount} atrasadosCount={atrasadosCount} reprocesoCount={reprocesoCount} currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
      <ExportExcel />
    </AppContext.Provider>
  );
}

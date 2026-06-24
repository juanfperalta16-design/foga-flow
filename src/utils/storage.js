const KEYS = {
  PROYECTOS: 'foga_proyectos',
  ACTIVIDADES: 'foga_actividades',
  ALERTAS: 'foga_alertas',
  HISTORIAL: 'foga_historial',
};

export const storage = {
  get: (key) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
  remove: (key) => { try { localStorage.removeItem(key); return true; } catch { return false; } },
};

export const getProyectos = () => storage.get(KEYS.PROYECTOS);
export const setProyectos = (data) => storage.set(KEYS.PROYECTOS, data);
export const getActividades = () => storage.get(KEYS.ACTIVIDADES);
export const setActividades = (data) => storage.set(KEYS.ACTIVIDADES, data);
export const getAlertas = () => storage.get(KEYS.ALERTAS);
export const setAlertas = (data) => storage.set(KEYS.ALERTAS, data);
export const getHistorial = () => storage.get(KEYS.HISTORIAL);
export const setHistorial = (data) => storage.set(KEYS.HISTORIAL, data);

export const initStorage = (mockProyectos, mockActividades, mockAlertas, mockHistorial) => {
  if (!getProyectos()) setProyectos(mockProyectos);
  if (!getActividades()) setActividades(mockActividades);
  if (!getAlertas()) setAlertas(mockAlertas);
  if (!getHistorial()) setHistorial(mockHistorial);
};

export const resetStorage = (mockProyectos, mockActividades, mockAlertas, mockHistorial) => {
  setProyectos(mockProyectos);
  setActividades(mockActividades);
  setAlertas(mockAlertas);
  setHistorial(mockHistorial);
};

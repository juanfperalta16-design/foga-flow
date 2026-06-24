import { useState, useCallback } from 'react';
import { getProyectos, saveProyectos, getActividades, saveActividades } from '../utils/storage';
import { buildHistorialEntry, getEffectiveStatus } from '../utils/statusHelpers';
import { isAtrasada } from '../utils/dateHelpers';
import { getDefaultChecklist } from '../utils/statusHelpers';

export function useAppState() {
  const [proyectos, setProyectos] = useState(() => getProyectos());
  const [actividades, setActividades] = useState(() => {
    const acts = getActividades();
    // Auto-detect atrasos
    return acts.map(a => ({
      ...a,
      estado: isAtrasada(a) && a.estado !== 'Finalizado' && a.estado !== 'Aprobado' ? 'Atrasado' : a.estado
    }));
  });
  const [currentUser] = useState('Juan Peralta');

  const updateActividad = useCallback((id, changes, usuario) => {
    setActividades(prev => {
      const updated = prev.map(a => {
        if (a.id !== id) return a;
        const historial = [...(a.historialCambios || [])];
        Object.keys(changes).forEach(campo => {
          if (a[campo] !== changes[campo]) {
            historial.push(buildHistorialEntry(usuario || 'Sistema', campo, a[campo], changes[campo]));
          }
        });
        return { ...a, ...changes, historialCambios: historial };
      });
      saveActividades(updated);
      return updated;
    });
  }, []);

  const createActividad = useCallback((data, usuario) => {
    const newAct = {
      id: `a_${Date.now()}`,
      historialCambios: [buildHistorialEntry(usuario || 'Sistema', 'creado', null, 'nueva actividad')],
      checklist: data.checklist || getDefaultChecklist(data.departamento),
      ...data,
    };
    setActividades(prev => {
      const updated = [...prev, newAct];
      saveActividades(updated);
      return updated;
    });
    return newAct;
  }, []);

  const deleteActividad = useCallback((id) => {
    setActividades(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveActividades(updated);
      return updated;
    });
  }, []);

  const createProyecto = useCallback((data) => {
    const newP = { id: `p_${Date.now()}`, activo: true, ...data };
    setProyectos(prev => {
      const updated = [...prev, newP];
      saveProyectos(updated);
      return updated;
    });
    return newP;
  }, []);

  const updateProyecto = useCallback((id, changes) => {
    setProyectos(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...changes } : p);
      saveProyectos(updated);
      return updated;
    });
  }, []);

  const deleteProyecto = useCallback((id) => {
    setProyectos(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveProyectos(updated);
      return updated;
    });
    setActividades(prev => {
      const updated = prev.filter(a => a.proyectoId !== id);
      saveActividades(updated);
      return updated;
    });
  }, []);

  return {
    proyectos, actividades, currentUser,
    updateActividad, createActividad, deleteActividad,
    createProyecto, updateProyecto, deleteProyecto,
  };
}

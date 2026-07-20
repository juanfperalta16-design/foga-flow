// =====================================================
// FOGA FLOW — Ayuda
// Manual de uso dentro de la app, pensado para alguien que
// entra por primera vez. Agrupa las pantallas igual que el
// menú lateral, con una explicación corta y los pasos típicos.
// =====================================================
import { useState } from 'react';
import {
  Search, ChevronDown, ChevronUp, LayoutDashboard, FolderKanban, Building2, Monitor,
  Factory, Wrench, DollarSign, Calendar, Columns, Users, AlertTriangle, Settings, FileSpreadsheet,
} from 'lucide-react';

const SECCIONES = [
  {
    id: 'dashboard', grupo: 'Empezar', icon: LayoutDashboard, color: '#8A9099',
    titulo: 'Dashboard',
    resumen: 'La primera pantalla que ves al entrar — un resumen del día.',
    pasos: [
      'Revisa las tarjetas de arriba para un vistazo rápido: proyectos activos, atrasados, urgencias, listos para producción, etc.',
      'Haz clic en cualquier alerta de la lista para ir directo al proyecto que la generó.',
      'Es solo de lectura — para hacer cambios entra al proyecto o al departamento correspondiente.',
    ],
  },
  {
    id: 'proyectos', grupo: 'Empezar', icon: FolderKanban, color: '#8A9099',
    titulo: 'Proyectos',
    resumen: 'El listado maestro de todos los proyectos, con 3 pestañas.',
    pasos: [
      'Pestaña "Proyectos": busca, filtra por estado/prioridad/mes, y usa "Nuevo proyecto" para crear uno con sus módulos.',
      'Pestaña "Prospectos": solo de lectura — los gestiona Arquitectura hasta que se convierten en proyecto oficial.',
      'Pestaña "Alertas": las mismas situaciones pendientes que ves en Urgencias.',
      'Haz clic en cualquier fila de la tabla para abrir el detalle completo de ese proyecto.',
    ],
  },
  {
    id: 'arquitectura', grupo: 'Departamentos', icon: Building2, color: '#D4A017',
    titulo: 'Arquitectura',
    resumen: 'Bandeja de trabajo de Arquitectura: checklist y liberación a Diseño 3D.',
    pasos: [
      'Entra a un proyecto y marca cada paso del checklist a medida que avanza (propuesta → borrador → enviado a ventas → ajustes → planos aprobados).',
      'Usa el botón de enviar correo a Ventas cuando corresponda avisarles.',
      'Cuando los planos estén aprobados, libera los módulos a Diseño 3D — uno por uno o todos a la vez.',
      'Tiene su propio Calendario (pestaña arriba) con las fechas que Producción le asignó a este departamento.',
    ],
  },
  {
    id: 'diseno3d', grupo: 'Departamentos', icon: Monitor, color: '#B5651D',
    titulo: 'Diseño 3D',
    resumen: 'Por módulo: modelado, despiece, plano de corte y liberación a Producción.',
    pasos: [
      'Marca SolidWorks y Despiece como iniciados y luego terminados, módulo por módulo.',
      'Sube el plano de corte del módulo — sin él no se puede liberar a Producción.',
      'El botón "Liberar a Producción" se habilita recién cuando SolidWorks, despiece y plano de corte están listos.',
      'Si Producción marca un módulo en "reproceso", la alerta aparece acá: revisa el problema y sube el archivo corregido.',
    ],
  },
  {
    id: 'produccion', grupo: 'Departamentos', icon: Factory, color: '#7A4B8C',
    titulo: 'Producción',
    resumen: 'Por módulo: maestro asignado, fase de fabricación y reprocesos.',
    pasos: [
      'Asigna un maestro a cada módulo liberado por Diseño 3D.',
      'Haz clic en el número de la fase para avanzar el módulo por las 10 etapas de fabricación (corte, plegado, pintura, etc.).',
      'Si encuentras un problema de diseño en un módulo, márcalo como "reproceso" — eso le avisa automáticamente a Diseño 3D.',
      'Registra la fecha de validación del Jefe de Producción cuando corresponda.',
    ],
  },
  {
    id: 'instalaciones', grupo: 'Departamentos', icon: Wrench, color: '#2C6E9E',
    titulo: 'Instalaciones',
    resumen: 'Checklist de visitas hasta la instalación final.',
    pasos: [
      'Agenda y registra la primera visita técnica al sitio.',
      'Sube el informe técnico con las medidas tomadas.',
      'Marca "obra lista" cuando el sitio esté preparado para instalar.',
      'Marca "instalación realizada" al terminar — recién ahí el proyecto pasa a Finalizado, no antes.',
    ],
  },
  {
    id: 'contabilidad', grupo: 'Departamentos', icon: DollarSign, color: '#A67C3D',
    titulo: 'Contabilidad',
    resumen: 'Controla el "pase de instalación": fábrica terminada + pago en regla.',
    pasos: [
      'Usa los filtros (próximos 10 días / en riesgo / sin pase) para priorizar qué revisar primero.',
      'Autoriza el pase cuando el pago esté confirmado — sin esta autorización, Instalaciones no puede proceder aunque la fábrica ya haya terminado.',
    ],
  },
  {
    id: 'calendario', grupo: 'Vistas', icon: Calendar, color: '#8A9099',
    titulo: 'Calendario',
    resumen: 'Panorama general de fechas de instalación (la fecha que puso el cliente).',
    pasos: [
      'Usa el panel lateral para ver de un vistazo los proyectos atrasados y las entregas del mes.',
      'Es distinto del calendario que tiene cada departamento por dentro — ese muestra las fechas internas que Producción asignó a ese departamento específico.',
    ],
  },
  {
    id: 'kanban', grupo: 'Vistas', icon: Columns, color: '#8A9099',
    titulo: 'Kanban',
    resumen: 'Tablero de 6 columnas — Arquitectura, Diseño 3D, Instalaciones, Producción, Instalación, Finalizado.',
    pasos: [
      'Cada proyecto aparece en una sola columna: la de la etapa en la que está ahora mismo.',
      'Al avanzar de etapa, la tarjeta se mueve a la siguiente columna — no deja rastro en la anterior.',
      'Usa los botones de arriba para filtrar por departamento, y haz clic en una tarjeta para abrir el proyecto.',
    ],
  },
  {
    id: 'equipo', grupo: 'Vistas', icon: Users, color: '#8A9099',
    titulo: 'Equipo',
    resumen: 'Carga de trabajo por persona, en todos los departamentos a la vez.',
    pasos: [
      'Filtra por persona o por departamento para ver rápidamente qué tiene asignado cada quien.',
      'Haz clic en cualquier tarjeta de proyecto para abrirlo.',
    ],
  },
  {
    id: 'urgencias', grupo: 'Control', icon: AlertTriangle, color: '#F87171',
    titulo: 'Urgencias',
    resumen: 'El centro real de alertas — junta 6 categorías distintas en un solo lugar.',
    pasos: [
      'Revisa esta pantalla como punto de partida del día: alertas del sistema, proyectos atrasados, entregas próximas, sin responsable, material urgente faltante y módulos atrasados.',
      'Haz clic en cualquier tarjeta para ir directo al proyecto o módulo involucrado.',
      'El número rojo junto a "Urgencias" en el menú cuenta lo mismo que ves acá.',
    ],
  },
  {
    id: 'configuracion', grupo: 'Control', icon: Settings, color: '#8A9099',
    titulo: 'Configuración',
    resumen: 'Gestión de responsables, departamentos e información del sistema.',
    pasos: [
      'Pestaña "Responsables": crea, edita, desactiva o elimina personas — cada una con su departamento y rol.',
      'Pestaña "Departamentos": cambia el color, la descripción y (para Diseño 3D) la meta mensual por diseñador.',
      'Pestaña "Sistema": datos generales de la app, sin nada que editar.',
    ],
  },
  {
    id: 'excel', grupo: 'Control', icon: FileSpreadsheet, color: '#16A34A',
    titulo: 'Exportar a Excel',
    resumen: 'El botón verde flotante (abajo a la derecha) — disponible desde cualquier pantalla.',
    pasos: [
      'Haz clic en el botón verde y luego en "Descargar Excel".',
      'Genera un archivo con 12 hojas: resumen general, flujo por módulo (con su código y dimensiones), por persona, producción, prospectos, cada departamento en detalle, contabilidad y el registro mensual de diseño.',
    ],
  },
];

const GRUPOS_ORDEN = ['Empezar', 'Departamentos', 'Vistas', 'Control'];

export default function Ayuda() {
  const [busqueda, setBusqueda] = useState('');
  const [abiertas, setAbiertas] = useState(() => new Set(['dashboard']));

  const toggle = (id) => setAbiertas(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const q = busqueda.trim().toLowerCase();
  const filtradas = q
    ? SECCIONES.filter(s =>
        s.titulo.toLowerCase().includes(q) ||
        s.resumen.toLowerCase().includes(q) ||
        s.pasos.some(p => p.toLowerCase().includes(q)))
    : SECCIONES;

  return (
    <div className="p-6 max-w-[760px]">
      {/* Título */}
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-white">Ayuda</h1>
        <p className="text-steel-muted text-sm mt-0.5">Guía rápida de cada pantalla — pensada para la primera vez que usas FOGA Flow.</p>
      </div>

      {/* Bienvenida */}
      <div className="bg-flame/10 border border-flame/30 rounded-xl px-4 py-3 mb-5">
        <div className="text-sm font-semibold text-flame">¿Primera vez acá?</div>
        <div className="text-xs text-slate-300 mt-1 leading-relaxed">
          El menú de la izquierda está organizado igual que esta guía: cada proyecto avanza por los departamentos en orden
          (Arquitectura → Diseño 3D → Producción → Instalaciones), y "Urgencias" siempre te dice qué necesita atención hoy.
          Explora las secciones de abajo o busca una palabra clave.
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-faint" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar, ej: 'liberar módulo', 'excel', 'reproceso'..."
          className="w-full bg-[#1B1E23] border border-steel-line rounded-lg text-sm text-white pl-9 pr-3 py-2.5 focus:outline-none focus:border-flame placeholder:text-steel-faint" />
      </div>

      {filtradas.length === 0 && (
        <div className="bg-[#1B1E23] border border-steel-line rounded-xl py-10 text-center text-steel-faint text-sm">
          Sin resultados para "{busqueda}".
        </div>
      )}

      {/* Secciones agrupadas */}
      <div className="flex flex-col gap-5">
        {GRUPOS_ORDEN.map(grupo => {
          const items = filtradas.filter(s => s.grupo === grupo);
          if (items.length === 0) return null;
          return (
            <div key={grupo}>
              <div className="text-[10px] font-bold tracking-widest text-steel-faint uppercase font-stamp mb-2">{grupo}</div>
              <div className="flex flex-col gap-2">
                {items.map(s => {
                  const Icon = s.icon;
                  const open = abiertas.has(s.id);
                  return (
                    <div key={s.id} className="bg-[#1B1E23] border border-steel-line rounded-xl overflow-hidden">
                      <button onClick={() => toggle(s.id)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
                        <Icon size={16} style={{ color: s.color }} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white">{s.titulo}</div>
                          <div className="text-xs text-steel-muted mt-0.5 truncate">{s.resumen}</div>
                        </div>
                        {open ? <ChevronUp size={15} className="text-steel-muted shrink-0" /> : <ChevronDown size={15} className="text-steel-muted shrink-0" />}
                      </button>
                      {open && (
                        <div className="px-4 pb-4 pt-1 border-t border-steel-line anim-fade-in">
                          <ul className="flex flex-col gap-2 mt-3">
                            {s.pasos.map((paso, i) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] text-slate-300 leading-snug">
                                <span className="text-flame font-bold shrink-0 mt-0.5">·</span>
                                {paso}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

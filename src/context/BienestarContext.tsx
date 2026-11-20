import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  BienestarState,
  ManualData,
  MatrizMetadata,
  NormaItem,
  ProcessStep,
  ProgramaBienestar,
  RegistroSeguimiento,
  TerminoItem,
} from '../types/bienestar';
import { INITIAL_BIENESTAR_STATE } from '../data/initialData';

const STORAGE_KEY = 'frikaz_bienestar_social_v1';

interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'info' | 'warning';
}

interface BienestarContextValue {
  state: BienestarState;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  notify: (text: string, tone?: ToastMessage['tone']) => void;
  // Manual
  updatePortada: (portada: ManualData['portada']) => void;
  updateManualField: (
    field: 'introduccion' | 'objetivoGeneral' | 'justificacion' | 'alcance',
    value: string
  ) => void;
  addObjetivoEspecifico: (texto: string) => void;
  updateObjetivoEspecifico: (id: string, texto: string) => void;
  deleteObjetivoEspecifico: (id: string) => void;
  // Normograma
  addNorma: (norma: Omit<NormaItem, 'id'>) => void;
  updateNorma: (norma: NormaItem) => void;
  deleteNorma: (id: string) => void;
  // Terminología
  addTermino: (termino: Omit<TerminoItem, 'id'>) => void;
  updateTermino: (termino: TerminoItem) => void;
  deleteTermino: (id: string) => void;
  // Matriz & Flujograma (integrados)
  updateMatrizMeta: (meta: MatrizMetadata) => void;
  addProcessStep: (step: Omit<ProcessStep, 'id'>, insertAfterId?: string) => string;
  updateProcessStep: (step: ProcessStep) => void;
  deleteProcessStep: (id: string) => void;
  moveProcessStep: (id: string, direction: 'up' | 'down') => void;
  // Plan de Bienestar
  addPrograma: (programa: Omit<ProgramaBienestar, 'id'>) => void;
  updatePrograma: (programa: ProgramaBienestar) => void;
  deletePrograma: (id: string) => void;
  // Seguimiento
  addSeguimiento: (registro: Omit<RegistroSeguimiento, 'id'>) => void;
  updateSeguimiento: (registro: RegistroSeguimiento) => void;
  deleteSeguimiento: (id: string) => void;
  // Backup & Reset
  resetToInitial: () => void;
  importState: (rawJson: string) => boolean;
}

const BienestarContext = createContext<BienestarContextValue | null>(null);

function normalizeEmpresaName(value?: string): string {
  if (!value || !value.trim()) return 'Frikaz S.A.S.';
  if (/frikaz/i.test(value)) return 'Frikaz S.A.S.';
  return value;
}

function loadInitialState(): BienestarState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_BIENESTAR_STATE;
    const parsed = JSON.parse(raw) as Partial<BienestarState>;
    if (!parsed || !parsed.manual || !Array.isArray(parsed.proceso)) {
      return INITIAL_BIENESTAR_STATE;
    }
    return {
      ...INITIAL_BIENESTAR_STATE,
      ...parsed,
      manual: {
        ...INITIAL_BIENESTAR_STATE.manual,
        ...parsed.manual,
        portada: {
          ...INITIAL_BIENESTAR_STATE.manual.portada,
          ...(parsed.manual?.portada || {}),
          empresa: normalizeEmpresaName(parsed.manual?.portada?.empresa),
        },
      },
      matrizMeta: {
        ...INITIAL_BIENESTAR_STATE.matrizMeta,
        ...(parsed.matrizMeta || {}),
        empresa: normalizeEmpresaName(parsed.matrizMeta?.empresa),
      },
    };
  } catch {
    return INITIAL_BIENESTAR_STATE;
  }
}

export function BienestarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BienestarState>(loadInitialState);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (text: string, tone: ToastMessage['tone'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3200);
    },
    [dismissToast]
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota fallback silently ignored if full
    }
  }, [state]);

  const touch = (prev: BienestarState, partial: Partial<BienestarState>): BienestarState => ({
    ...prev,
    ...partial,
    lastUpdated: new Date().toISOString(),
  });

  const updatePortada = (portada: ManualData['portada']) => {
    setState((prev) =>
      touch(prev, {
        manual: { ...prev.manual, portada },
      })
    );
    notify('Portada documental actualizada y guardada.');
  };

  const updateManualField = (
    field: 'introduccion' | 'objetivoGeneral' | 'justificacion' | 'alcance',
    value: string
  ) => {
    setState((prev) =>
      touch(prev, {
        manual: { ...prev.manual, [field]: value },
      })
    );
    notify('Sección del manual guardada.');
  };

  const addObjetivoEspecifico = (texto: string) => {
    const id = `obj-${Date.now()}`;
    setState((prev) =>
      touch(prev, {
        manual: {
          ...prev.manual,
          objetivosEspecificos: [...prev.manual.objetivosEspecificos, { id, texto }],
        },
      })
    );
    notify('Objetivo específico agregado.');
  };

  const updateObjetivoEspecifico = (id: string, texto: string) => {
    setState((prev) =>
      touch(prev, {
        manual: {
          ...prev.manual,
          objetivosEspecificos: prev.manual.objetivosEspecificos.map((o) =>
            o.id === id ? { ...o, texto } : o
          ),
        },
      })
    );
    notify('Objetivo específico actualizado.');
  };

  const deleteObjetivoEspecifico = (id: string) => {
    setState((prev) =>
      touch(prev, {
        manual: {
          ...prev.manual,
          objetivosEspecificos: prev.manual.objetivosEspecificos.filter((o) => o.id !== id),
        },
      })
    );
    notify('Objetivo específico eliminado.', 'info');
  };

  const addNorma = (norma: Omit<NormaItem, 'id'>) => {
    const id = `norm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) =>
      touch(prev, {
        normograma: [...prev.normograma, { ...norma, id }],
      })
    );
    notify('Norma agregada al normograma.');
  };

  const updateNorma = (norma: NormaItem) => {
    setState((prev) =>
      touch(prev, {
        normograma: prev.normograma.map((n) => (n.id === norma.id ? norma : n)),
      })
    );
    notify('Norma actualizada.');
  };

  const deleteNorma = (id: string) => {
    setState((prev) =>
      touch(prev, {
        normograma: prev.normograma.filter((n) => n.id !== id),
      })
    );
    notify('Norma eliminada del normograma.', 'info');
  };

  const addTermino = (termino: Omit<TerminoItem, 'id'>) => {
    const id = `term-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) =>
      touch(prev, {
        terminologia: [...prev.terminologia, { ...termino, id }],
      })
    );
    notify('Término agregado al diccionario.');
  };

  const updateTermino = (termino: TerminoItem) => {
    setState((prev) =>
      touch(prev, {
        terminologia: prev.terminologia.map((t) => (t.id === termino.id ? termino : t)),
      })
    );
    notify('Término actualizado.');
  };

  const deleteTermino = (id: string) => {
    setState((prev) =>
      touch(prev, {
        terminologia: prev.terminologia.filter((t) => t.id !== id),
      })
    );
    notify('Término eliminado del diccionario.', 'info');
  };

  const updateMatrizMeta = (meta: MatrizMetadata) => {
    setState((prev) => touch(prev, { matrizMeta: meta }));
    notify('Encabezado de la Matriz Detallada guardado.');
  };

  const addProcessStep = (step: Omit<ProcessStep, 'id'>, insertAfterId?: string) => {
    const id = `step-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const newStep: ProcessStep = { ...step, id };
    setState((prev) => {
      const list = [...prev.proceso];
      if (insertAfterId) {
        const idx = list.findIndex((s) => s.id === insertAfterId);
        if (idx !== -1) {
          const prevStep = list[idx];
          if (!prevStep.isDecision) {
            newStep.nextTargetId = prevStep.nextTargetId;
            list[idx] = { ...prevStep, nextTargetId: id };
          }
          list.splice(idx + 1, 0, newStep);
          return touch(prev, { proceso: list });
        }
      }
      // By default insert before FIN if FIN exists
      const finIdx = list.findIndex((s) => s.actividad.trim().toUpperCase() === 'FIN');
      if (finIdx > 0) {
        const beforeFin = list[finIdx - 1];
        if (!beforeFin.isDecision && !beforeFin.isAdjustment) {
          newStep.nextTargetId = list[finIdx].id;
          list[finIdx - 1] = { ...beforeFin, nextTargetId: id };
        }
        list.splice(finIdx, 0, newStep);
      } else {
        list.push(newStep);
      }
      return touch(prev, { proceso: list });
    });
    notify('Actividad agregada y sincronizada entre Matriz y Flujograma.');
    return id;
  };

  const updateProcessStep = (step: ProcessStep) => {
    setState((prev) =>
      touch(prev, {
        proceso: prev.proceso.map((s) => (s.id === step.id ? step : s)),
      })
    );
    notify('Actividad actualizada en Matriz y Flujograma.');
  };

  const deleteProcessStep = (id: string) => {
    setState((prev) => {
      const target = prev.proceso.find((s) => s.id === id);
      const fallbackNext = target?.nextTargetId || target?.yesTargetId;
      const updated = prev.proceso
        .filter((s) => s.id !== id)
        .map((s) => ({
          ...s,
          nextTargetId: s.nextTargetId === id ? fallbackNext : s.nextTargetId,
          yesTargetId: s.yesTargetId === id ? fallbackNext : s.yesTargetId,
          noTargetId: s.noTargetId === id ? undefined : s.noTargetId,
        }));
      return touch(prev, { proceso: updated });
    });
    notify('Actividad eliminada de Matriz y Flujograma.', 'info');
  };

  const moveProcessStep = (id: string, direction: 'up' | 'down') => {
    setState((prev) => {
      const idx = prev.proceso.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.proceso.length) return prev;
      const list = [...prev.proceso];
      const [item] = list.splice(idx, 1);
      list.splice(targetIdx, 0, item);
      return touch(prev, { proceso: list });
    });
    notify('Orden de actividades actualizado.');
  };

  const addPrograma = (programa: Omit<ProgramaBienestar, 'id'>) => {
    const id = `prog-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) =>
      touch(prev, {
        planBienestar: [...prev.planBienestar, { ...programa, id }],
      })
    );
    notify('Programa registrado en el Plan de Bienestar.');
  };

  const updatePrograma = (programa: ProgramaBienestar) => {
    setState((prev) =>
      touch(prev, {
        planBienestar: prev.planBienestar.map((p) => (p.id === programa.id ? programa : p)),
      })
    );
    notify('Programa actualizado.');
  };

  const deletePrograma = (id: string) => {
    setState((prev) =>
      touch(prev, {
        planBienestar: prev.planBienestar.filter((p) => p.id !== id),
      })
    );
    notify('Programa eliminado del Plan de Bienestar.', 'info');
  };

  const addSeguimiento = (registro: Omit<RegistroSeguimiento, 'id'>) => {
    const id = `seg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) =>
      touch(prev, {
        seguimiento: [...prev.seguimiento, { ...registro, id }],
      })
    );
    notify('Registro de seguimiento guardado.');
  };

  const updateSeguimiento = (registro: RegistroSeguimiento) => {
    setState((prev) =>
      touch(prev, {
        seguimiento: prev.seguimiento.map((r) => (r.id === registro.id ? registro : r)),
      })
    );
    notify('Registro de seguimiento actualizado.');
  };

  const deleteSeguimiento = (id: string) => {
    setState((prev) =>
      touch(prev, {
        seguimiento: prev.seguimiento.filter((r) => r.id !== id),
      })
    );
    notify('Registro de seguimiento eliminado.', 'info');
  };

  const resetToInitial = () => {
    setState(INITIAL_BIENESTAR_STATE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BIENESTAR_STATE));
    notify('Información restablecida a los documentos originales.', 'info');
  };

  const importState = (rawJson: string): boolean => {
    try {
      const parsed = JSON.parse(rawJson) as BienestarState;
      if (!parsed || !parsed.manual || !Array.isArray(parsed.normograma) || !Array.isArray(parsed.terminologia)) {
        notify('El archivo no tiene el formato válido del sistema.', 'warning');
        return false;
      }
      setState(parsed);
      notify('Respaldo importado correctamente.');
      return true;
    } catch {
      notify('No fue posible leer el archivo de respaldo.', 'warning');
      return false;
    }
  };

  return (
    <BienestarContext.Provider
      value={{
        state,
        toasts,
        dismissToast,
        notify,
        updatePortada,
        updateManualField,
        addObjetivoEspecifico,
        updateObjetivoEspecifico,
        deleteObjetivoEspecifico,
        addNorma,
        updateNorma,
        deleteNorma,
        addTermino,
        updateTermino,
        deleteTermino,
        updateMatrizMeta,
        addProcessStep,
        updateProcessStep,
        deleteProcessStep,
        moveProcessStep,
        addPrograma,
        updatePrograma,
        deletePrograma,
        addSeguimiento,
        updateSeguimiento,
        deleteSeguimiento,
        resetToInitial,
        importState,
      }}
    >
      {children}
    </BienestarContext.Provider>
  );
}

export function useBienestar() {
  const ctx = useContext(BienestarContext);
  if (!ctx) throw new Error('useBienestar must be used within BienestarProvider');
  return ctx;
}

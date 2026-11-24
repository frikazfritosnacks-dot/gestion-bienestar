import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  BienestarState,
  ConvenioItem,
  ListaAsistenciaActividad,
  ManualData,
  MatrizMetadata,
  NormaItem,
  PlanGeneralInfo,
  PresupuestoCostoItem,
  PresupuestoGeneral2027,
  ProcessStep,
  ProgramaBienestar,
  RegistroSeguimiento,
  RespuestaEncuesta,
  TerminoItem,
  WordSyncInfo,
} from '../types/bienestar';
import { INITIAL_BIENESTAR_STATE } from '../data/initialData';
import {
  loadRecordsFromIndexedDB,
  persistStateToIndexedDB,
} from '../utils/bienestarDatabase';

const STORAGE_KEY = 'frikaz_bienestar_social_v1';

export function computeManualSyncHash(
  state: Pick<BienestarState, 'manual' | 'normograma' | 'terminologia' | 'matrizMeta' | 'proceso'>
): string {
  const payload = JSON.stringify({
    manual: state.manual,
    normograma: state.normograma,
    terminologia: state.terminologia,
    matrizMeta: state.matrizMeta,
    proceso: state.proceso,
  });
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

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
  // Matriz & Flujograma
  updateMatrizMeta: (meta: MatrizMetadata) => void;
  addProcessStep: (step: Omit<ProcessStep, 'id'>, insertAfterId?: string) => string;
  updateProcessStep: (step: ProcessStep) => void;
  deleteProcessStep: (id: string) => void;
  moveProcessStep: (id: string, direction: 'up' | 'down') => void;
  // Plan Anual de Bienestar & Presupuesto General 2027
  updatePlanGeneral: (info: PlanGeneralInfo) => void;
  addPrograma: (programa: Omit<ProgramaBienestar, 'id'>) => void;
  updatePrograma: (programa: ProgramaBienestar) => void;
  deletePrograma: (id: string) => void;
  updatePresupuestoGeneralConfig: (
    patch: Partial<
      Pick<
        PresupuestoGeneral2027,
        | 'presupuestoTotalAprobado'
        | 'reservaImprevistos'
        | 'reservaAutorizada'
        | 'reservaEjecutada'
        | 'reservaMotivoAutorizacion'
        | 'poblacionTrabajadores'
      >
    >
  ) => void;
  addPresupuestoCostoItem: (item: Omit<PresupuestoCostoItem, 'id'>) => void;
  updatePresupuestoCostoItem: (item: PresupuestoCostoItem) => void;
  deletePresupuestoCostoItem: (id: string) => void;
  // Encuestas de Satisfacción (registro independiente persistente)
  addRespuestaEncuesta: (
    resp: Omit<RespuestaEncuesta, 'id' | 'numeroRegistro' | 'fechaHoraRegistro' | 'calificacionGeneral'>
  ) => { ok: boolean; error?: string; record?: RespuestaEncuesta };
  updateRespuestaEncuestaAuthorized: (
    resp: RespuestaEncuesta,
    autorizador: string
  ) => void;
  // Listas de Asistencia (registro independiente persistente por jornada)
  addListaAsistencia: (
    lista: Omit<ListaAsistenciaActividad, 'id' | 'numeroRegistro' | 'fechaHoraRegistro'>
  ) => { ok: boolean; error?: string; record?: ListaAsistenciaActividad };
  updateListaAsistenciaAuthorized: (
    lista: ListaAsistenciaActividad,
    autorizador: string
  ) => void;
  // Convenios
  addConvenio: (conv: Omit<ConvenioItem, 'id'>) => void;
  updateConvenio: (conv: ConvenioItem) => void;
  deleteConvenio: (id: string) => void;
  // Seguimiento
  addSeguimiento: (registro: Omit<RegistroSeguimiento, 'id'>) => void;
  updateSeguimiento: (registro: RegistroSeguimiento) => void;
  deleteSeguimiento: (id: string) => void;
  // Backup & Reset
  resetToInitial: () => void;
  importState: (rawJson: string) => boolean;
  // Word Synchronization
  hasPendingWordSync: boolean;
  currentWordHash: string;
  syncWordDocument: (silent?: boolean) => WordSyncInfo;
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
    if (!raw) {
      return {
        ...INITIAL_BIENESTAR_STATE,
        wordSync: {
          lastSyncedAt: INITIAL_BIENESTAR_STATE.lastUpdated,
          lastSyncedHash: computeManualSyncHash(INITIAL_BIENESTAR_STATE),
          syncedVersion: INITIAL_BIENESTAR_STATE.manual.portada.version,
        },
      };
    }
    const parsed = JSON.parse(raw) as Partial<BienestarState>;
    if (!parsed || !parsed.manual || !Array.isArray(parsed.proceso)) {
      return {
        ...INITIAL_BIENESTAR_STATE,
        wordSync: {
          lastSyncedAt: INITIAL_BIENESTAR_STATE.lastUpdated,
          lastSyncedHash: computeManualSyncHash(INITIAL_BIENESTAR_STATE),
          syncedVersion: INITIAL_BIENESTAR_STATE.manual.portada.version,
        },
      };
    }

    // Migrar caché anterior de 2026 al Plan Anual 2027 (10 trabajadores, presupuesto $2.150.000, cronograma ene-dic 2027)
    // manteniendo intactos Manual, Normograma, Terminología, Matriz y Flujograma
    const cachedPlan = Array.isArray(parsed.planBienestar) ? parsed.planBienestar : [];
    const hasPlan2027 =
      Boolean(parsed.presupuestoGeneral2027?.items?.length) &&
      parsed.planGeneral?.vigenciaAnual === '2027' &&
      cachedPlan.some((p) => p.id === 'act-1' && p.fechaInicio?.startsWith('2027'));

    let finalPlan: ProgramaBienestar[];
    if (hasPlan2027) {
      const initialActMap = new Map(INITIAL_BIENESTAR_STATE.planBienestar.map((a) => [a.id, a]));
      const mergedMap = new Map<string, ProgramaBienestar>();
      for (const base of INITIAL_BIENESTAR_STATE.planBienestar) {
        mergedMap.set(base.id, base);
      }
      for (const item of cachedPlan) {
        const base = initialActMap.get(item.id);
        mergedMap.set(item.id, {
          ...(base || ({} as ProgramaBienestar)),
          ...item,
        });
      }
      finalPlan = Array.from(mergedMap.values());
    } else {
      finalPlan = INITIAL_BIENESTAR_STATE.planBienestar;
    }

    const merged: BienestarState = {
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
      planGeneral: hasPlan2027 && parsed.planGeneral
        ? parsed.planGeneral
        : INITIAL_BIENESTAR_STATE.planGeneral,
      planBienestar: finalPlan,
      presupuestoGeneral2027:
        hasPlan2027 && parsed.presupuestoGeneral2027
          ? parsed.presupuestoGeneral2027
          : INITIAL_BIENESTAR_STATE.presupuestoGeneral2027,
      respuestasEncuestas: Array.isArray(parsed.respuestasEncuestas)
        ? parsed.respuestasEncuestas
            .filter(
              (r) =>
                !(
                  (r.id === 'resp-1' && r.nombreParticipante === 'Camila Andrea Torres') ||
                  (r.id === 'resp-2' && r.nombreParticipante === 'Julián David Ospina')
                )
            )
            .map((r, idx) => ({
              ...r,
              numeroRegistro: r.numeroRegistro ?? idx + 1,
              fechaHoraRegistro: r.fechaHoraRegistro || `${r.fechaRealizacion}T12:00:00.000Z`,
              calificacionGeneral:
                r.calificacionGeneral ??
                Number(
                  (
                    Object.values(r.calificaciones).reduce((a, b) => a + b, 0) /
                    Math.max(1, Object.values(r.calificaciones).length)
                  ).toFixed(2)
                ),
            }))
        : [],
      listasAsistencia: Array.isArray(parsed.listasAsistencia)
        ? parsed.listasAsistencia
            .filter(
              (l) =>
                Boolean(l.fechaHoraRegistro) ||
                (l.participantes.length > 0 &&
                  !l.participantes.every((p) => p.firma === 'Por firmar'))
            )
            .map((l, idx) => ({
              ...l,
              id: l.id || `asist-mig-${idx + 1}-${l.actividadId}`,
              numeroRegistro: l.numeroRegistro ?? idx + 1,
              fechaHoraRegistro: l.fechaHoraRegistro || `${l.fecha || '2027-01-01'}T12:00:00.000Z`,
            }))
        : [],
      convenios:
        hasPlan2027 && Array.isArray(parsed.convenios) && parsed.convenios.length > 0
          ? parsed.convenios
          : INITIAL_BIENESTAR_STATE.convenios,
    };
    if (!merged.wordSync) {
      merged.wordSync = {
        lastSyncedAt: merged.lastUpdated || new Date().toISOString(),
        lastSyncedHash: computeManualSyncHash(merged),
        syncedVersion: merged.manual.portada.version,
      };
    }
    return merged;
  } catch {
    return {
      ...INITIAL_BIENESTAR_STATE,
      wordSync: {
        lastSyncedAt: INITIAL_BIENESTAR_STATE.lastUpdated,
        lastSyncedHash: computeManualSyncHash(INITIAL_BIENESTAR_STATE),
        syncedVersion: INITIAL_BIENESTAR_STATE.manual.portada.version,
      },
    };
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
    let cancelled = false;
    loadRecordsFromIndexedDB().then((dbRecords) => {
      if (cancelled || !dbRecords) return;
      setState((prev) => {
        const encIds = new Set(prev.respuestasEncuestas.map((r) => r.id));
        const extraEnc = dbRecords.encuestas.filter((r) => !encIds.has(r.id));
        const asistIds = new Set(prev.listasAsistencia.map((l) => l.id));
        const extraAsist = dbRecords.asistencias.filter((l) => !asistIds.has(l.id));
        if (extraEnc.length === 0 && extraAsist.length === 0) return prev;
        return {
          ...prev,
          respuestasEncuestas: [...prev.respuestasEncuestas, ...extraEnc],
          listasAsistencia: [...prev.listasAsistencia, ...extraAsist],
        };
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota fallback silently ignored if full
    }
    void persistStateToIndexedDB(state);
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

  const updatePlanGeneral = (info: PlanGeneralInfo) => {
    setState((prev) => touch(prev, { planGeneral: info }));
    notify('Información general del Plan Anual actualizada.');
  };

  const addPrograma = (programa: Omit<ProgramaBienestar, 'id'>) => {
    const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) =>
      touch(prev, {
        planBienestar: [...prev.planBienestar, { ...programa, id }],
      })
    );
    notify('Actividad registrada en el Plan de Bienestar.');
  };

  const updatePrograma = (programa: ProgramaBienestar) => {
    setState((prev) =>
      touch(prev, {
        planBienestar: prev.planBienestar.map((p) => (p.id === programa.id ? programa : p)),
      })
    );
    notify('Ficha de actividad y seguimiento actualizados.');
  };

  const deletePrograma = (id: string) => {
    setState((prev) =>
      touch(prev, {
        planBienestar: prev.planBienestar.filter((p) => p.id !== id),
      })
    );
    notify('Actividad eliminada del Plan de Bienestar.', 'info');
  };

  const syncActivitiesFromBudgetItems = (
    plan: ProgramaBienestar[],
    items: PresupuestoCostoItem[]
  ): ProgramaBienestar[] =>
    plan.map((act) => {
      const actItems = items.filter((it) => it.actividadId === act.id);
      if (actItems.length === 0) return act;
      const nextPresupuesto = actItems.reduce(
        (acc, it) => acc + Math.max(0, it.cantidad) * Math.max(0, it.valorUnitario),
        0
      );
      const nextEjecutado = actItems.reduce((acc, it) => acc + Math.max(0, it.ejecutado), 0);
      return {
        ...act,
        presupuesto: nextPresupuesto,
        presupuestoEjecutado: nextEjecutado,
      };
    });

  const updatePresupuestoGeneralConfig = (
    patch: Partial<
      Pick<
        PresupuestoGeneral2027,
        | 'presupuestoTotalAprobado'
        | 'reservaImprevistos'
        | 'reservaAutorizada'
        | 'reservaEjecutada'
        | 'reservaMotivoAutorizacion'
        | 'poblacionTrabajadores'
      >
    >
  ) => {
    setState((prev) =>
      touch(prev, {
        presupuestoGeneral2027: {
          ...prev.presupuestoGeneral2027,
          ...patch,
        },
      })
    );
    notify('Parámetros del Presupuesto General 2027 actualizados.');
  };

  const addPresupuestoCostoItem = (item: Omit<PresupuestoCostoItem, 'id'>) => {
    const id = `cost-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) => {
      const nextItems = [...prev.presupuestoGeneral2027.items, { ...item, id }];
      return touch(prev, {
        presupuestoGeneral2027: {
          ...prev.presupuestoGeneral2027,
          items: nextItems,
        },
        planBienestar: syncActivitiesFromBudgetItems(prev.planBienestar, nextItems),
      });
    });
    notify('Recurso agregado y presupuesto actualizado automáticamente.');
  };

  const updatePresupuestoCostoItem = (item: PresupuestoCostoItem) => {
    setState((prev) => {
      const nextItems = prev.presupuestoGeneral2027.items.map((it) =>
        it.id === item.id ? item : it
      );
      return touch(prev, {
        presupuestoGeneral2027: {
          ...prev.presupuestoGeneral2027,
          items: nextItems,
        },
        planBienestar: syncActivitiesFromBudgetItems(prev.planBienestar, nextItems),
      });
    });
    notify('Desglose de costo actualizado y sincronizado.');
  };

  const deletePresupuestoCostoItem = (id: string) => {
    setState((prev) => {
      const nextItems = prev.presupuestoGeneral2027.items.filter((it) => it.id !== id);
      return touch(prev, {
        presupuestoGeneral2027: {
          ...prev.presupuestoGeneral2027,
          items: nextItems,
        },
        planBienestar: syncActivitiesFromBudgetItems(prev.planBienestar, nextItems),
      });
    });
    notify('Ítem de costo eliminado del desglose.', 'info');
  };

  const addRespuestaEncuesta = (
    resp: Omit<
      RespuestaEncuesta,
      'id' | 'numeroRegistro' | 'fechaHoraRegistro' | 'calificacionGeneral'
    >
  ): { ok: boolean; error?: string; record?: RespuestaEncuesta } => {
    if (!resp.actividadId || !resp.fechaRealizacion || !resp.loQueMasGusto.trim() || !resp.aspectosMejorar.trim()) {
      const error = 'Completa todos los campos obligatorios antes de enviar la encuesta.';
      notify(error, 'warning');
      return { ok: false, error };
    }

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const isDuplicate = state.respuestasEncuestas.some((prev) => {
      const prevTime = prev.fechaHoraRegistro ? Date.parse(prev.fechaHoraRegistro) : 0;
      const withinWindow = Math.abs(nowMs - prevTime) < 60000;
      return (
        withinWindow &&
        prev.actividadId === resp.actividadId &&
        prev.fechaRealizacion === resp.fechaRealizacion &&
        (prev.nombreParticipante || '') === (resp.nombreParticipante || '') &&
        prev.loQueMasGusto.trim() === resp.loQueMasGusto.trim() &&
        prev.aspectosMejorar.trim() === resp.aspectosMejorar.trim()
      );
    });

    if (isDuplicate) {
      const error =
        'Registro duplicado detectado: esta misma respuesta fue guardada hace unos segundos.';
      notify(error, 'warning');
      return { ok: false, error };
    }

    const scores = Object.values(resp.calificaciones);
    const calificacionGeneral = Number(
      (scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length)).toFixed(2)
    );
    const maxNum = state.respuestasEncuestas.reduce(
      (max, r, idx) => Math.max(max, r.numeroRegistro ?? idx + 1),
      0
    );
    const actDim =
      resp.dimension ||
      state.planBienestar.find((a) => a.id === resp.actividadId)?.dimension ||
      '';

    const newRecord: RespuestaEncuesta = {
      ...resp,
      id: `resp-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
      numeroRegistro: maxNum + 1,
      dimension: actDim,
      fechaHoraRegistro: nowIso,
      calificacionGeneral,
    };

    setState((prev) =>
      touch(prev, {
        respuestasEncuestas: [...prev.respuestasEncuestas, newRecord],
      })
    );
    notify(
      `Encuesta #${String(newRecord.numeroRegistro).padStart(3, '0')} guardada en el Registro de Encuestas de Satisfacción.`
    );
    return { ok: true, record: newRecord };
  };

  const updateRespuestaEncuestaAuthorized = (
    resp: RespuestaEncuesta,
    autorizador: string
  ) => {
    const scores = Object.values(resp.calificaciones);
    const calificacionGeneral = Number(
      (scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length)).toFixed(2)
    );
    setState((prev) =>
      touch(prev, {
        respuestasEncuestas: prev.respuestasEncuestas.map((r) =>
          r.id === resp.id
            ? {
                ...resp,
                calificacionGeneral,
                ultimaCorreccionAt: new Date().toISOString(),
                corregidoPor: autorizador.trim() || 'Talento Humano Autorizado',
              }
            : r
        ),
      })
    );
    notify('Registro de encuesta corregido con autorización.');
  };

  const addListaAsistencia = (
    lista: Omit<ListaAsistenciaActividad, 'id' | 'numeroRegistro' | 'fechaHoraRegistro'>
  ): { ok: boolean; error?: string; record?: ListaAsistenciaActividad } => {
    if (
      !lista.actividadId ||
      !lista.fecha ||
      !lista.horaInicio ||
      !lista.horaFin ||
      !lista.lugar.trim() ||
      !lista.responsable.trim()
    ) {
      const error = 'Diligencia fecha, horarios, lugar y responsable antes de guardar la lista.';
      notify(error, 'warning');
      return { ok: false, error };
    }
    if (lista.participantes.length === 0) {
      const error = 'Agrega al menos un participante antes de guardar la lista de asistencia.';
      notify(error, 'warning');
      return { ok: false, error };
    }

    const participantSig = lista.participantes
      .map((p) => `${p.nombreCompleto.toLowerCase()}|${p.cargo.toLowerCase()}`)
      .join(';');
    const duplicateList = state.listasAsistencia.some((prev) => {
      const prevSig = prev.participantes
        .map((p) => `${p.nombreCompleto.toLowerCase()}|${p.cargo.toLowerCase()}`)
        .join(';');
      return (
        prev.actividadId === lista.actividadId &&
        prev.fecha === lista.fecha &&
        prev.horaInicio === lista.horaInicio &&
        prevSig === participantSig
      );
    });

    if (duplicateList) {
      const error =
        'Registro duplicado prevenido: ya existe una lista guardada con la misma actividad, fecha, hora y participantes.';
      notify(error, 'warning');
      return { ok: false, error };
    }

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const maxNum = state.listasAsistencia.reduce(
      (max, l, idx) => Math.max(max, l.numeroRegistro ?? idx + 1),
      0
    );

    const newRecord: ListaAsistenciaActividad = {
      ...lista,
      id: `asist-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
      numeroRegistro: maxNum + 1,
      fechaHoraRegistro: nowIso,
    };

    setState((prev) =>
      touch(prev, {
        listasAsistencia: [...prev.listasAsistencia, newRecord],
      })
    );
    notify(
      `Lista de asistencia ASIST-2027-${String(newRecord.numeroRegistro).padStart(3, '0')} guardada de forma permanente.`
    );
    return { ok: true, record: newRecord };
  };

  const updateListaAsistenciaAuthorized = (
    lista: ListaAsistenciaActividad,
    autorizador: string
  ) => {
    setState((prev) =>
      touch(prev, {
        listasAsistencia: prev.listasAsistencia.map((l) =>
          l.id === lista.id
            ? {
                ...lista,
                ultimaCorreccionAt: new Date().toISOString(),
                corregidoPor: autorizador.trim() || 'Talento Humano Autorizado',
              }
            : l
        ),
      })
    );
    notify('Lista de asistencia corregida bajo permiso autorizado.');
  };

  const addConvenio = (conv: Omit<ConvenioItem, 'id'>) => {
    const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) =>
      touch(prev, {
        convenios: [...prev.convenios, { ...conv, id }],
      })
    );
    notify('Convenio institucional registrado.');
  };

  const updateConvenio = (conv: ConvenioItem) => {
    setState((prev) =>
      touch(prev, {
        convenios: prev.convenios.map((c) => (c.id === conv.id ? conv : c)),
      })
    );
    notify('Convenio actualizado.');
  };

  const deleteConvenio = (id: string) => {
    setState((prev) =>
      touch(prev, {
        convenios: prev.convenios.filter((c) => c.id !== id),
      })
    );
    notify('Convenio eliminado.', 'info');
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
      if (
        !parsed ||
        !parsed.manual ||
        !Array.isArray(parsed.normograma) ||
        !Array.isArray(parsed.terminologia)
      ) {
        notify('El archivo no tiene el formato válido del sistema.', 'warning');
        return false;
      }
      setState({
        ...INITIAL_BIENESTAR_STATE,
        ...parsed,
      });
      notify('Respaldo importado correctamente.');
      return true;
    } catch {
      notify('No fue posible leer el archivo de respaldo.', 'warning');
      return false;
    }
  };

  const currentWordHash = computeManualSyncHash(state);
  const hasPendingWordSync =
    !state.wordSync || state.wordSync.lastSyncedHash !== currentWordHash;

  const syncWordDocument = useCallback(
    (silent = false): WordSyncInfo => {
      const info: WordSyncInfo = {
        lastSyncedAt: new Date().toISOString(),
        lastSyncedHash: computeManualSyncHash(state),
        syncedVersion: state.manual.portada.version,
      };
      setState((prev) => ({
        ...prev,
        wordSync: info,
      }));
      if (!silent) {
        notify('Documento Word sincronizado con los datos vigentes del sistema.');
      }
      return info;
    },
    [state, notify]
  );

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
        updatePlanGeneral,
        addPrograma,
        updatePrograma,
        deletePrograma,
        updatePresupuestoGeneralConfig,
        addPresupuestoCostoItem,
        updatePresupuestoCostoItem,
        deletePresupuestoCostoItem,
        addRespuestaEncuesta,
        updateRespuestaEncuestaAuthorized,
        addListaAsistencia,
        updateListaAsistenciaAuthorized,
        addConvenio,
        updateConvenio,
        deleteConvenio,
        addSeguimiento,
        updateSeguimiento,
        deleteSeguimiento,
        resetToInitial,
        importState,
        hasPendingWordSync,
        currentWordHash,
        syncWordDocument,
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

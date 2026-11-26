import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  PresupuestoHistorialItem,
  ProcessStep,
  ProgramaBienestar,
  RegistroSeguimiento,
  RespuestaEncuesta,
  TerminoItem,
  WordSyncInfo,
} from '../types/bienestar';
import {
  CURRENT_MANUAL_CONTENT_VERSION,
  INITIAL_BIENESTAR_STATE,
} from '../data/initialData';
import {
  loadAppStateFromIndexedDB,
  loadRecordsFromIndexedDB,
  persistStateToIndexedDB,
} from '../utils/bienestarDatabase';

const STORAGE_KEY = 'frikaz_bienestar_social_v1';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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

interface MutationOptions {
  silent?: boolean;
}

interface BienestarContextValue {
  state: BienestarState;
  isSaving: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  lastSavedAt: string | null;
  retrySave: () => void;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  notify: (text: string, tone?: ToastMessage['tone']) => void;
  // Manual
  updatePortada: (portada: ManualData['portada'], opts?: MutationOptions) => void;
  updateManualField: (
    field: 'introduccion' | 'objetivoGeneral' | 'justificacion' | 'alcance',
    value: string,
    opts?: MutationOptions
  ) => void;
  addObjetivoEspecifico: (texto: string) => void;
  updateObjetivoEspecifico: (id: string, texto: string, opts?: MutationOptions) => void;
  deleteObjetivoEspecifico: (id: string) => void;
  // Normograma
  addNorma: (norma: Omit<NormaItem, 'id'>) => void;
  updateNorma: (norma: NormaItem, opts?: MutationOptions) => void;
  deleteNorma: (id: string) => void;
  // Terminología
  addTermino: (termino: Omit<TerminoItem, 'id'>) => void;
  updateTermino: (termino: TerminoItem, opts?: MutationOptions) => void;
  deleteTermino: (id: string) => void;
  // Matriz & Flujograma
  updateMatrizMeta: (meta: MatrizMetadata, opts?: MutationOptions) => void;
  addProcessStep: (step: Omit<ProcessStep, 'id'>, insertAfterId?: string) => string;
  updateProcessStep: (step: ProcessStep, opts?: MutationOptions) => void;
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
        | 'poblacionTrabajadores'
      >
    >
  ) => void;
  addPresupuestoCostoItem: (
    item: Omit<PresupuestoCostoItem, 'id'>,
    usuario?: string
  ) => { ok: boolean; error?: string };
  updatePresupuestoCostoItem: (
    item: PresupuestoCostoItem,
    usuario?: string
  ) => { ok: boolean; error?: string };
  deletePresupuestoCostoItem: (id: string, usuario?: string) => void;
  reviewPresupuestoGerencia: (payload: {
    decision: 'Aprobado por Gerencia' | 'En ajuste';
    gerenteNombre: string;
    observaciones?: string;
  }) => { ok: boolean; error?: string };
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

    // Migrar caché anterior al esquema limpio 2027 (sin reserva ficticia de $200.000 ni aprobación/ejecución previa sin firma de Gerencia)
    const cachedPlan = Array.isArray(parsed.planBienestar) ? parsed.planBienestar : [];
    const hasPlan2027 =
      Boolean(parsed.presupuestoGeneral2027?.items?.length) &&
      parsed.planGeneral?.vigenciaAnual === '2027' &&
      cachedPlan.some((p) => p.id === 'act-1' && p.fechaInicio?.startsWith('2027'));

    const rawBudget = hasPlan2027 ? parsed.presupuestoGeneral2027 : undefined;
    const isExplicitlyApprovedByGerencia =
      rawBudget?.estadoAprobacion === 'Aprobado por Gerencia' &&
      Boolean(rawBudget?.gerenteAprobador?.trim());

    const migratedBudget: PresupuestoGeneral2027 = rawBudget
      ? {
          ...INITIAL_BIENESTAR_STATE.presupuestoGeneral2027,
          ...rawBudget,
          estadoAprobacion: isExplicitlyApprovedByGerencia
            ? 'Aprobado por Gerencia'
            : rawBudget.estadoAprobacion === 'En ajuste'
              ? 'En ajuste'
              : 'Propuesta pendiente de aprobación',
          presupuestoTotalAprobado: isExplicitlyApprovedByGerencia
            ? rawBudget.presupuestoTotalAprobado ||
              rawBudget.items.reduce(
                (acc, it) => acc + Math.max(0, it.cantidad) * Math.max(0, it.valorUnitario),
                0
              )
            : 0,
          reservaImprevistos: 0,
          reservaAutorizada: false,
          reservaEjecutada: 0,
          reservaMotivoAutorizacion: '',
          items: rawBudget.items.map((it) => ({
            ...it,
            ejecutado: isExplicitlyApprovedByGerencia ? Math.max(0, it.ejecutado || 0) : 0,
          })),
          historialModificaciones: Array.isArray(rawBudget.historialModificaciones)
            ? rawBudget.historialModificaciones
            : [],
        }
      : INITIAL_BIENESTAR_STATE.presupuestoGeneral2027;

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
          estadoAprobacion: isExplicitlyApprovedByGerencia
            ? 'Aprobado'
            : migratedBudget.estadoAprobacion === 'En ajuste'
              ? 'En ajuste'
              : 'Pendiente de aprobación',
          presupuestoEjecutado: isExplicitlyApprovedByGerencia
            ? Math.max(0, item.presupuestoEjecutado || 0)
            : 0,
          presupuestoEstado: isExplicitlyApprovedByGerencia
            ? item.presupuestoEstado
            : 'Propuesta pendiente de aprobación',
        });
      }
      finalPlan = Array.from(mergedMap.values());
    } else {
      finalPlan = INITIAL_BIENESTAR_STATE.planBienestar;
    }

    const cleanSeguimiento = Array.isArray(parsed.seguimiento)
      ? parsed.seguimiento.filter(
          (s) =>
            !(
              (s.id === 'seg-1' || s.id === 'seg-2') &&
              (s.convocados === 48 || s.fecha?.startsWith('2026'))
            )
        )
      : [];

    const cachedVersion = parsed.manualContentVersion ?? 1;
    const needsFullManualV2Upgrade = cachedVersion < 2;
    const needsMatrizConciseV3Upgrade = cachedVersion < CURRENT_MANUAL_CONTENT_VERSION;

    const initialStepMap = new Map(INITIAL_BIENESTAR_STATE.proceso.map((s) => [s.id, s]));
    const upgradedProceso = needsFullManualV2Upgrade
      ? INITIAL_BIENESTAR_STATE.proceso
      : needsMatrizConciseV3Upgrade && Array.isArray(parsed.proceso)
        ? parsed.proceso.map((step) => {
            const initStep = initialStepMap.get(step.id);
            if (!initStep) return step;
            const desc = (step.descripcion || '').trim();
            const isLegacyTemplate =
              !desc ||
              desc.startsWith('Consiste en ') ||
              desc.includes('Pasos a seguir:') ||
              desc.length < 110;
            return isLegacyTemplate ? { ...step, descripcion: initStep.descripcion } : step;
          })
        : Array.isArray(parsed.proceso)
          ? parsed.proceso
          : INITIAL_BIENESTAR_STATE.proceso;

    const merged: BienestarState = {
      ...INITIAL_BIENESTAR_STATE,
      ...parsed,
      manualContentVersion: CURRENT_MANUAL_CONTENT_VERSION,
      manual: needsFullManualV2Upgrade
        ? {
            ...INITIAL_BIENESTAR_STATE.manual,
            portada: {
              ...INITIAL_BIENESTAR_STATE.manual.portada,
              ...(parsed.manual?.portada || {}),
              empresa: normalizeEmpresaName(parsed.manual?.portada?.empresa),
            },
          }
        : {
            ...INITIAL_BIENESTAR_STATE.manual,
            ...parsed.manual,
            portada: {
              ...INITIAL_BIENESTAR_STATE.manual.portada,
              ...(parsed.manual?.portada || {}),
              empresa: normalizeEmpresaName(parsed.manual?.portada?.empresa),
            },
          },
      normograma: needsFullManualV2Upgrade
        ? INITIAL_BIENESTAR_STATE.normograma
        : Array.isArray(parsed.normograma)
          ? parsed.normograma
          : INITIAL_BIENESTAR_STATE.normograma,
      terminologia: needsFullManualV2Upgrade
        ? INITIAL_BIENESTAR_STATE.terminologia
        : Array.isArray(parsed.terminologia)
          ? parsed.terminologia
          : INITIAL_BIENESTAR_STATE.terminologia,
      proceso: upgradedProceso,
      matrizMeta: {
        ...INITIAL_BIENESTAR_STATE.matrizMeta,
        ...(parsed.matrizMeta || {}),
        empresa: normalizeEmpresaName(parsed.matrizMeta?.empresa),
      },
      planGeneral: hasPlan2027 && parsed.planGeneral
        ? parsed.planGeneral
        : INITIAL_BIENESTAR_STATE.planGeneral,
      planBienestar: finalPlan,
      presupuestoGeneral2027: migratedBudget,
      seguimiento: cleanSeguimiento,
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
    if (!merged.wordSync || needsMatrizConciseV3Upgrade) {
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isSaving = saveStatus === 'saving';

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (text: string, tone: ToastMessage['tone'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3600);
    },
    [dismissToast]
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadAppStateFromIndexedDB(), loadRecordsFromIndexedDB()]).then(
      ([idbAppState, dbRecords]) => {
        if (cancelled) return;
        setState((prev) => {
          let next = prev;
          if (
            idbAppState &&
            idbAppState.manualContentVersion === CURRENT_MANUAL_CONTENT_VERSION &&
            idbAppState.lastUpdated &&
            prev.lastUpdated &&
            new Date(idbAppState.lastUpdated).getTime() > new Date(prev.lastUpdated).getTime()
          ) {
            next = {
              ...prev,
              ...idbAppState,
              manualContentVersion: CURRENT_MANUAL_CONTENT_VERSION,
            };
          }
          if (dbRecords) {
            const encIds = new Set(next.respuestasEncuestas.map((r) => r.id));
            const extraEnc = dbRecords.encuestas.filter((r) => !encIds.has(r.id));
            const asistIds = new Set(next.listasAsistencia.map((l) => l.id));
            const extraAsist = dbRecords.asistencias.filter((l) => !asistIds.has(l.id));
            if (extraEnc.length > 0 || extraAsist.length > 0) {
              next = {
                ...next,
                respuestasEncuestas: [...next.respuestasEncuestas, ...extraEnc],
                listasAsistencia: [...next.listasAsistencia, ...extraAsist],
              };
            }
          }
          return next;
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const latestStateRef = useRef<BienestarState>(state);
  latestStateRef.current = state;
  const saveTimerRef = useRef<number | null>(null);
  const isFirstRenderRef = useRef(true);
  const saveSeqRef = useRef(0);
  const lastErrorToastAtRef = useRef(0);
  const lastBudgetToastRef = useRef<{ itemId: string; at: number }>({ itemId: '', at: 0 });
  const lastBudgetHistoryRef = useRef<{ itemId: string; historyId: string; at: number }>({
    itemId: '',
    historyId: '',
    at: 0,
  });

  const flushPersistence = useCallback(
    async (snapshot: BienestarState) => {
      const seq = ++saveSeqRef.current;
      let localOk = false;
      let localErrMsg = '';
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        localOk = true;
      } catch (err) {
        localOk = false;
        localErrMsg =
          err instanceof Error && err.message
            ? err.message
            : 'No se pudo escribir en el almacenamiento local del navegador.';
      }

      const idbResult = await persistStateToIndexedDB(snapshot);
      if (seq !== saveSeqRef.current) return;

      const idbOk = !idbResult.available || idbResult.ok;
      if (localOk && idbOk) {
        setSaveStatus('saved');
        setSaveError(null);
        setLastSavedAt(new Date().toISOString());
      } else {
        const msg = !localOk
          ? `No se pudieron guardar los cambios en el almacenamiento local (${localErrMsg}). Usa "Reintentar" para volver a guardar.`
          : `Error al confirmar el respaldo persistente (${idbResult.error || 'IndexedDB'}). Usa "Reintentar".`;
        setSaveStatus('error');
        setSaveError(msg);
        const now = Date.now();
        if (now - lastErrorToastAtRef.current > 4000) {
          lastErrorToastAtRef.current = now;
          notify(msg, 'warning');
        }
      }
    },
    [notify]
  );

  const retrySave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSaveStatus('saving');
    void flushPersistence(latestStateRef.current);
  }, [flushPersistence]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      setSaveStatus('saving');
      void flushPersistence(state);
      return;
    }
    setSaveStatus('saving');
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void flushPersistence(latestStateRef.current);
    }, 280);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [state, flushPersistence]);

  useEffect(() => {
    const handleFlushOnExit = () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(latestStateRef.current));
      } catch {
        // Handled by active save error feedback when app is open
      }
    };
    window.addEventListener('beforeunload', handleFlushOnExit);
    window.addEventListener('pagehide', handleFlushOnExit);
    return () => {
      window.removeEventListener('beforeunload', handleFlushOnExit);
      window.removeEventListener('pagehide', handleFlushOnExit);
      handleFlushOnExit();
    };
  }, []);

  const touch = (prev: BienestarState, partial: Partial<BienestarState>): BienestarState => ({
    ...prev,
    ...partial,
    lastUpdated: new Date().toISOString(),
  });

  const updatePortada = (portada: ManualData['portada'], opts?: MutationOptions) => {
    setState((prev) =>
      touch(prev, {
        manual: { ...prev.manual, portada },
      })
    );
    if (!opts?.silent) notify('Portada documental actualizada y guardada.');
  };

  const updateManualField = (
    field: 'introduccion' | 'objetivoGeneral' | 'justificacion' | 'alcance',
    value: string,
    opts?: MutationOptions
  ) => {
    setState((prev) =>
      touch(prev, {
        manual: { ...prev.manual, [field]: value },
      })
    );
    if (!opts?.silent) notify('Sección del manual guardada.');
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

  const updateObjetivoEspecifico = (id: string, texto: string, opts?: MutationOptions) => {
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
    if (!opts?.silent) notify('Objetivo específico actualizado.');
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
    const cleanName = norma.nombre.trim().toLowerCase();
    if (!cleanName) {
      notify('El nombre de la norma es obligatorio.', 'warning');
      return;
    }
    if (state.normograma.some((n) => n.nombre.trim().toLowerCase() === cleanName)) {
      notify('Ya existe una disposición con ese mismo nombre en el Normograma.', 'warning');
      return;
    }
    const id = `norm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) =>
      touch(prev, {
        normograma: [...prev.normograma, { ...norma, id }],
      })
    );
    notify('Norma agregada al normograma.');
  };

  const updateNorma = (norma: NormaItem, opts?: MutationOptions) => {
    setState((prev) =>
      touch(prev, {
        normograma: prev.normograma.map((n) => (n.id === norma.id ? norma : n)),
      })
    );
    if (!opts?.silent) notify('Norma actualizada.');
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
    const cleanTerm = termino.termino.trim().toLowerCase();
    if (!cleanTerm) {
      notify('El nombre del término es obligatorio.', 'warning');
      return;
    }
    if (state.terminologia.some((t) => t.termino.trim().toLowerCase() === cleanTerm)) {
      notify('Ese término ya existe en el diccionario institucional.', 'warning');
      return;
    }
    const id = `term-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) =>
      touch(prev, {
        terminologia: [...prev.terminologia, { ...termino, id }],
      })
    );
    notify('Término agregado al diccionario.');
  };

  const updateTermino = (termino: TerminoItem, opts?: MutationOptions) => {
    setState((prev) =>
      touch(prev, {
        terminologia: prev.terminologia.map((t) => (t.id === termino.id ? termino : t)),
      })
    );
    if (!opts?.silent) notify('Término actualizado.');
  };

  const deleteTermino = (id: string) => {
    setState((prev) =>
      touch(prev, {
        terminologia: prev.terminologia.filter((t) => t.id !== id),
      })
    );
    notify('Término eliminado del diccionario.', 'info');
  };

  const updateMatrizMeta = (meta: MatrizMetadata, opts?: MutationOptions) => {
    setState((prev) => touch(prev, { matrizMeta: meta }));
    if (!opts?.silent) notify('Encabezado de la Matriz Detallada guardado.');
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

  const updateProcessStep = (step: ProcessStep, opts?: MutationOptions) => {
    setState((prev) =>
      touch(prev, {
        proceso: prev.proceso.map((s) => (s.id === step.id ? step : s)),
      })
    );
    if (!opts?.silent) notify('Actividad actualizada en Matriz y Flujograma.');
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
    items: PresupuestoCostoItem[],
    isApproved: boolean
  ): ProgramaBienestar[] =>
    plan.map((act) => {
      const actItems = items.filter((it) => it.actividadId === act.id);
      if (actItems.length === 0) return act;
      const nextPresupuesto = actItems.reduce(
        (acc, it) => acc + Math.max(0, it.cantidad) * Math.max(0, it.valorUnitario),
        0
      );
      const nextEjecutado = isApproved
        ? actItems.reduce((acc, it) => acc + Math.max(0, it.ejecutado), 0)
        : 0;
      return {
        ...act,
        presupuesto: nextPresupuesto,
        presupuestoEjecutado: nextEjecutado,
      };
    });

  const calcProjectedBudgetTotal = (items: PresupuestoCostoItem[]) =>
    items.reduce((acc, it) => acc + Math.max(0, it.cantidad) * Math.max(0, it.valorUnitario), 0);

  const buildAuditEntry = (
    tipo: PresupuestoHistorialItem['tipo'],
    descripcion: string,
    valorAnterior: number,
    valorNuevo: number,
    usuario = 'Talento Humano'
  ): PresupuestoHistorialItem => ({
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    fechaHora: new Date().toISOString(),
    usuario,
    tipo,
    descripcion,
    valorAnterior,
    valorNuevo,
  });

  const updatePresupuestoGeneralConfig = (
    patch: Partial<
      Pick<
        PresupuestoGeneral2027,
        | 'presupuestoTotalAprobado'
        | 'poblacionTrabajadores'
      >
    >
  ) => {
    setState((prev) => {
      const prevTotal = calcProjectedBudgetTotal(prev.presupuestoGeneral2027.items);
      const historyItem = buildAuditEntry(
        'Edición',
        `Actualización de parámetros generales (Población: ${patch.poblacionTrabajadores ?? prev.presupuestoGeneral2027.poblacionTrabajadores} trabajadores)`,
        prevTotal,
        prevTotal
      );
      return touch(prev, {
        presupuestoGeneral2027: {
          ...prev.presupuestoGeneral2027,
          ...patch,
          reservaImprevistos: 0,
          historialModificaciones: [
            historyItem,
            ...(prev.presupuestoGeneral2027.historialModificaciones || []),
          ],
        },
      });
    });
    notify('Parámetros del Presupuesto General 2027 actualizados.');
  };

  const addPresupuestoCostoItem = (
    item: Omit<PresupuestoCostoItem, 'id'>,
    usuario = 'Talento Humano'
  ): { ok: boolean; error?: string } => {
    if (!item.recursoMaterial.trim() || item.cantidad <= 0 || item.valorUnitario < 0) {
      const error = 'Ingresa descripción del recurso, cantidad mayor a cero y valor unitario válido.';
      notify(error, 'warning');
      return { ok: false, error };
    }
    const cleanName = item.recursoMaterial.trim().toLowerCase();
    const isDuplicate = state.presupuestoGeneral2027.items.some(
      (it) =>
        it.actividadId === item.actividadId &&
        it.recursoMaterial.trim().toLowerCase() === cleanName
    );
    if (isDuplicate) {
      const error = 'Ya existe un recurso con el mismo nombre en esta actividad.';
      notify(error, 'warning');
      return { ok: false, error };
    }

    const id = `cost-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) => {
      const isApproved = prev.presupuestoGeneral2027.estadoAprobacion === 'Aprobado por Gerencia';
      const sanitizedItem: PresupuestoCostoItem = {
        ...item,
        id,
        ejecutado: isApproved ? Math.max(0, item.ejecutado || 0) : 0,
      };
      const prevTotal = calcProjectedBudgetTotal(prev.presupuestoGeneral2027.items);
      const nextItems = [...prev.presupuestoGeneral2027.items, sanitizedItem];
      const nextTotal = calcProjectedBudgetTotal(nextItems);
      const actName =
        prev.planBienestar.find((a) => a.id === item.actividadId)?.actividad || item.actividadId;
      const historyItem = buildAuditEntry(
        'Creación',
        `Nuevo recurso "${sanitizedItem.recursoMaterial}" en ${actName} (${sanitizedItem.cantidad} × $${sanitizedItem.valorUnitario.toLocaleString('es-CO')})`,
        prevTotal,
        nextTotal,
        usuario
      );
      return touch(prev, {
        presupuestoGeneral2027: {
          ...prev.presupuestoGeneral2027,
          items: nextItems,
          historialModificaciones: [
            historyItem,
            ...(prev.presupuestoGeneral2027.historialModificaciones || []),
          ],
        },
        planBienestar: syncActivitiesFromBudgetItems(prev.planBienestar, nextItems, isApproved),
      });
    });
    notify('Recurso agregado y proyección presupuestal actualizada.');
    return { ok: true };
  };

  const updatePresupuestoCostoItem = (
    item: PresupuestoCostoItem,
    usuario = 'Talento Humano'
  ): { ok: boolean; error?: string } => {
    if (!item.recursoMaterial.trim() || item.cantidad < 0 || item.valorUnitario < 0) {
      const error = 'Los valores del recurso deben ser válidos y no negativos.';
      notify(error, 'warning');
      return { ok: false, error };
    }
    const isApproved = state.presupuestoGeneral2027.estadoAprobacion === 'Aprobado por Gerencia';
    if (!isApproved && item.ejecutado > 0) {
      const error =
        'No se puede registrar dinero ejecutado hasta que Gerencia apruebe el Presupuesto General.';
      notify(error, 'warning');
      return { ok: false, error };
    }

    const nowMs = Date.now();
    setState((prev) => {
      const prevItem = prev.presupuestoGeneral2027.items.find((it) => it.id === item.id);
      const sanitizedItem: PresupuestoCostoItem = {
        ...item,
        ejecutado: isApproved ? Math.max(0, item.ejecutado || 0) : 0,
      };
      const prevTotal = calcProjectedBudgetTotal(prev.presupuestoGeneral2027.items);
      const nextItems = prev.presupuestoGeneral2027.items.map((it) =>
        it.id === item.id ? sanitizedItem : it
      );
      const nextTotal = calcProjectedBudgetTotal(nextItems);
      const actName =
        prev.planBienestar.find((a) => a.id === item.actividadId)?.actividad || item.actividadId;
      const isExecutionOnly =
        prevItem &&
        prevItem.cantidad === sanitizedItem.cantidad &&
        prevItem.valorUnitario === sanitizedItem.valorUnitario &&
        prevItem.ejecutado !== sanitizedItem.ejecutado;
      const existingHistory = prev.presupuestoGeneral2027.historialModificaciones || [];
      const canCoalesce =
        lastBudgetHistoryRef.current.itemId === item.id &&
        nowMs - lastBudgetHistoryRef.current.at <= 2000 &&
        existingHistory[0]?.id === lastBudgetHistoryRef.current.historyId;

      const nextHistory = (() => {
        if (canCoalesce && existingHistory[0]) {
          const updatedTop: PresupuestoHistorialItem = {
            ...existingHistory[0],
            fechaHora: new Date().toISOString(),
            tipo: isExecutionOnly ? 'Ejecución' : 'Edición',
            descripcion: isExecutionOnly
              ? `Registro de ejecución real en "${sanitizedItem.recursoMaterial}" (${actName}): $${sanitizedItem.ejecutado.toLocaleString('es-CO')} COP`
              : `Modificación de "${sanitizedItem.recursoMaterial}" en ${actName} (${sanitizedItem.cantidad} ${sanitizedItem.unidadMedida} × $${sanitizedItem.valorUnitario.toLocaleString('es-CO')})`,
            valorNuevo: isExecutionOnly ? sanitizedItem.ejecutado : nextTotal,
          };
          lastBudgetHistoryRef.current = {
            itemId: item.id,
            historyId: updatedTop.id,
            at: nowMs,
          };
          return [updatedTop, ...existingHistory.slice(1)];
        }
        const historyItem = buildAuditEntry(
          isExecutionOnly ? 'Ejecución' : 'Edición',
          isExecutionOnly
            ? `Registro de ejecución real en "${sanitizedItem.recursoMaterial}" (${actName}): $${sanitizedItem.ejecutado.toLocaleString('es-CO')} COP`
            : `Modificación de "${sanitizedItem.recursoMaterial}" en ${actName} (${sanitizedItem.cantidad} ${sanitizedItem.unidadMedida} × $${sanitizedItem.valorUnitario.toLocaleString('es-CO')})`,
          isExecutionOnly ? prevItem?.ejecutado || 0 : prevTotal,
          isExecutionOnly ? sanitizedItem.ejecutado : nextTotal,
          usuario
        );
        lastBudgetHistoryRef.current = {
          itemId: item.id,
          historyId: historyItem.id,
          at: nowMs,
        };
        return [historyItem, ...existingHistory];
      })();

      return touch(prev, {
        presupuestoGeneral2027: {
          ...prev.presupuestoGeneral2027,
          items: nextItems,
          historialModificaciones: nextHistory,
        },
        planBienestar: syncActivitiesFromBudgetItems(prev.planBienestar, nextItems, isApproved),
      });
    });
    if (
      lastBudgetToastRef.current.itemId !== item.id ||
      nowMs - lastBudgetToastRef.current.at > 2000
    ) {
      lastBudgetToastRef.current = { itemId: item.id, at: nowMs };
      notify('Desglose de costo actualizado y registrado en historial.');
    }
    return { ok: true };
  };

  const deletePresupuestoCostoItem = (id: string, usuario = 'Talento Humano') => {
    setState((prev) => {
      const isApproved = prev.presupuestoGeneral2027.estadoAprobacion === 'Aprobado por Gerencia';
      const target = prev.presupuestoGeneral2027.items.find((it) => it.id === id);
      const prevTotal = calcProjectedBudgetTotal(prev.presupuestoGeneral2027.items);
      const nextItems = prev.presupuestoGeneral2027.items.filter((it) => it.id !== id);
      const nextTotal = calcProjectedBudgetTotal(nextItems);
      const actName =
        prev.planBienestar.find((a) => a.id === target?.actividadId)?.actividad || '';
      const historyItem = buildAuditEntry(
        'Eliminación',
        `Eliminación de "${target?.recursoMaterial || 'Ítem'}"${actName ? ` en ${actName}` : ''}`,
        prevTotal,
        nextTotal,
        usuario
      );
      return touch(prev, {
        presupuestoGeneral2027: {
          ...prev.presupuestoGeneral2027,
          items: nextItems,
          historialModificaciones: [
            historyItem,
            ...(prev.presupuestoGeneral2027.historialModificaciones || []),
          ],
        },
        planBienestar: syncActivitiesFromBudgetItems(prev.planBienestar, nextItems, isApproved),
      });
    });
    notify('Ítem de costo eliminado del desglose.', 'info');
  };

  const reviewPresupuestoGerencia = (payload: {
    decision: 'Aprobado por Gerencia' | 'En ajuste';
    gerenteNombre: string;
    observaciones?: string;
  }): { ok: boolean; error?: string } => {
    if (!payload.gerenteNombre.trim()) {
      const error = 'Ingresa el nombre de la Gerente que realiza la revisión.';
      notify(error, 'warning');
      return { ok: false, error };
    }
    if (payload.decision === 'En ajuste' && !payload.observaciones?.trim()) {
      const error = 'Especifica las observaciones o ajustes requeridos para la propuesta.';
      notify(error, 'warning');
      return { ok: false, error };
    }

    setState((prev) => {
      const projectedTotal = calcProjectedBudgetTotal(prev.presupuestoGeneral2027.items);
      const isApproved = payload.decision === 'Aprobado por Gerencia';
      const nowIso = new Date().toISOString();
      const historyItem = buildAuditEntry(
        isApproved ? 'Aprobación' : 'Ajuste',
        isApproved
          ? `Aprobación formal del Presupuesto General 2027 por Gerencia (${payload.gerenteNombre.trim()}).${payload.observaciones?.trim() ? ` Obs: ${payload.observaciones.trim()}` : ''}`
          : `Gerencia (${payload.gerenteNombre.trim()}) solicitó ajustes a la propuesta: ${payload.observaciones?.trim()}`,
        prev.presupuestoGeneral2027.presupuestoTotalAprobado,
        isApproved ? projectedTotal : 0,
        payload.gerenteNombre.trim()
      );
      const nextItems = isApproved
        ? prev.presupuestoGeneral2027.items
        : prev.presupuestoGeneral2027.items.map((it) => ({ ...it, ejecutado: 0 }));

      return touch(prev, {
        presupuestoGeneral2027: {
          ...prev.presupuestoGeneral2027,
          estadoAprobacion: payload.decision,
          presupuestoTotalAprobado: isApproved ? projectedTotal : 0,
          gerenteAprobador: payload.gerenteNombre.trim(),
          fechaAprobacion: nowIso,
          observacionesGerencia: payload.observaciones?.trim() || '',
          reservaImprevistos: 0,
          items: nextItems,
          historialModificaciones: [
            historyItem,
            ...(prev.presupuestoGeneral2027.historialModificaciones || []),
          ],
        },
        planBienestar: prev.planBienestar.map((act) => ({
          ...act,
          estadoAprobacion: isApproved ? 'Aprobado' : 'En ajuste',
          presupuestoEstado: isApproved
            ? 'Aprobado por Gerencia'
            : 'En ajuste según revisión de Gerencia',
          presupuestoEjecutado: isApproved ? act.presupuestoEjecutado : 0,
        })),
      });
    });

    notify(
      payload.decision === 'Aprobado por Gerencia'
        ? 'Presupuesto General 2027 aprobado formalmente por Gerencia.'
        : 'Solicitud de ajuste registrada por Gerencia.',
      payload.decision === 'Aprobado por Gerencia' ? 'success' : 'info'
    );
    return { ok: true };
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
    if (lista.horaFin <= lista.horaInicio) {
      const error = 'La hora de finalización debe ser posterior a la hora de inicio.';
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
    const duplicate = state.convenios.some(
      (c) =>
        c.nombreConvenio.trim().toLowerCase() === conv.nombreConvenio.trim().toLowerCase() &&
        c.entidad.trim().toLowerCase() === conv.entidad.trim().toLowerCase()
    );
    if (duplicate) {
      notify('Ya existe un convenio registrado con la misma entidad y nombre.', 'warning');
      return;
    }
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
    const duplicate = state.seguimiento.some(
      (s) =>
        s.nombreActividad.trim().toLowerCase() === registro.nombreActividad.trim().toLowerCase() &&
        s.fecha === registro.fecha
    );
    if (duplicate) {
      notify('Ya existe un registro de seguimiento para esa actividad en la misma fecha.', 'warning');
      return;
    }
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
    notify('Información restablecida a los documentos oficiales del Manual.', 'info');
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
        manualContentVersion: CURRENT_MANUAL_CONTENT_VERSION,
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
        isSaving,
        saveStatus,
        saveError,
        lastSavedAt,
        retrySave,
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
        reviewPresupuestoGerencia,
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

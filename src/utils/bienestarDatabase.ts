import {
  BienestarState,
  ListaAsistenciaActividad,
  RespuestaEncuesta,
} from '../types/bienestar';

const DB_NAME = 'FrikazBienestarDB';
const DB_VERSION = 1;
const STORE_APP = 'appState';
const STORE_ENCUESTAS = 'encuestas';
const STORE_ASISTENCIAS = 'asistencias';

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_APP)) {
          db.createObjectStore(STORE_APP, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_ENCUESTAS)) {
          db.createObjectStore(STORE_ENCUESTAS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_ASISTENCIAS)) {
          db.createObjectStore(STORE_ASISTENCIAS, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function txPromise<T>(req: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export interface IndexedDBWriteResult {
  ok: boolean;
  available: boolean;
  error?: string;
}

/**
 * Persiste el estado integral y sincroniza las colecciones independientes de
 * Encuestas y Listas de Asistencia en IndexedDB para almacenamiento durable.
 */
export async function persistStateToIndexedDB(
  state: BienestarState
): Promise<IndexedDBWriteResult> {
  if (typeof indexedDB === 'undefined') {
    return { ok: true, available: false };
  }

  const db = await openDatabase();
  if (!db) {
    return {
      ok: false,
      available: true,
      error: 'No fue posible abrir el almacenamiento persistente (IndexedDB).',
    };
  }

  try {
    const tx = db.transaction(
      [STORE_APP, STORE_ENCUESTAS, STORE_ASISTENCIAS],
      'readwrite'
    );
    tx.objectStore(STORE_APP).put({ key: 'main', value: state });

    const encStore = tx.objectStore(STORE_ENCUESTAS);
    encStore.clear();
    for (const resp of state.respuestasEncuestas) {
      encStore.put(resp);
    }

    const asistStore = tx.objectStore(STORE_ASISTENCIAS);
    asistStore.clear();
    for (const lista of state.listasAsistencia) {
      asistStore.put(lista);
    }

    return await new Promise<IndexedDBWriteResult>((resolve) => {
      tx.oncomplete = () => resolve({ ok: true, available: true });
      tx.onerror = () =>
        resolve({
          ok: false,
          available: true,
          error: tx.error?.message || 'Error al escribir en IndexedDB.',
        });
      tx.onabort = () =>
        resolve({
          ok: false,
          available: true,
          error: tx.error?.message || 'La escritura en IndexedDB fue cancelada.',
        });
    });
  } catch (err) {
    return {
      ok: false,
      available: true,
      error: err instanceof Error ? err.message : 'Error inesperado al persistir en IndexedDB.',
    };
  } finally {
    db.close();
  }
}

export async function loadAppStateFromIndexedDB(): Promise<BienestarState | null> {
  const db = await openDatabase();
  if (!db) return null;

  try {
    const tx = db.transaction([STORE_APP], 'readonly');
    const record = await txPromise<{ key: string; value?: BienestarState } | undefined>(
      tx.objectStore(STORE_APP).get('main')
    );
    return record?.value ?? null;
  } catch {
    return null;
  } finally {
    db.close();
  }
}

export async function loadRecordsFromIndexedDB(): Promise<{
  encuestas: RespuestaEncuesta[];
  asistencias: ListaAsistenciaActividad[];
} | null> {
  const db = await openDatabase();
  if (!db) return null;

  try {
    const tx = db.transaction([STORE_ENCUESTAS, STORE_ASISTENCIAS], 'readonly');
    const [encuestas, asistencias] = await Promise.all([
      txPromise<RespuestaEncuesta[]>(tx.objectStore(STORE_ENCUESTAS).getAll()),
      txPromise<ListaAsistenciaActividad[]>(tx.objectStore(STORE_ASISTENCIAS).getAll()),
    ]);
    return {
      encuestas: Array.isArray(encuestas) ? encuestas : [],
      asistencias: Array.isArray(asistencias) ? asistencias : [],
    };
  } catch {
    return null;
  } finally {
    db.close();
  }
}

/**
 * Enmascara el número de documento de identidad conforme a la protección de datos personales
 * (Ley 1581 de 2012) para consultas públicas y listados generales no autorizados.
 */
export function maskDocumentoPersonal(doc?: string): string {
  const clean = (doc || '').trim();
  if (!clean || clean === '—') return 'No registrado';
  if (clean.length <= 4) return '**** (Protegido)';
  return `••••${clean.slice(-3)} (Protegido)`;
}

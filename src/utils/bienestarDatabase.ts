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

/**
 * Persiste el estado integral y sincroniza las colecciones independientes de
 * Encuestas y Listas de Asistencia en IndexedDB para almacenamiento durable.
 */
export async function persistStateToIndexedDB(state: BienestarState): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

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

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Fallback silencioso a localStorage
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

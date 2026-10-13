const DB_NAME = "hanlu";
const STORE = "progress";
const KEY = "state";
const LEGACY = "hanlu-progress-v1";
let writeQueue: Promise<void> = Promise.resolve();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export type Loaded<T> = { ok: true; data: T | null } | { ok: false };

export async function loadDeviceProgress<T>(): Promise<Loaded<T>> {
  try {
    const db = await openDb();
    const stored = await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => reject(request.error);
    }).finally(() => db.close());
    if (stored) return { ok: true, data: stored };
  } catch {
    return readLegacy<T>();
  }
  try {
    const raw = localStorage.getItem(LEGACY);
    if (!raw) return { ok: true, data: null };
    const parsed = JSON.parse(raw) as T;
    await saveDeviceProgress(parsed);
    return { ok: true, data: parsed };
  } catch {
    return { ok: true, data: null };
  }
}

function readLegacy<T>(): Loaded<T> {
  try {
    const raw = localStorage.getItem(LEGACY);
    if (!raw) return { ok: false };
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return { ok: false };
  }
}

export async function saveDeviceProgress(data: unknown): Promise<boolean> {
  const serialized = JSON.stringify(data);
  const snapshot = serialized === undefined ? null : JSON.parse(serialized) as unknown;
  const result = writeQueue.then(() => writeDeviceProgress(snapshot));
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function writeDeviceProgress(data: unknown): Promise<boolean> {
  let saved = false;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }).finally(() => db.close());
    saved = true;
  } catch {
    // Keep the legacy copy below even if IndexedDB is unavailable.
  }
  try {
    localStorage.setItem(LEGACY, JSON.stringify(data));
    saved = true;
  } catch {
    // Private mode can refuse both stores. The session still works in memory.
  }
  return saved;
}

export async function clearDeviceProgress(): Promise<boolean> {
  const result = writeQueue.then(async () => {
    let cleared = false;
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }).finally(() => db.close());
      cleared = true;
    } catch {
      // Keep trying the legacy store below.
    }
    try {
      localStorage.removeItem(LEGACY);
      cleared = true;
    } catch {
      // Private mode can refuse both stores.
    }
    return cleared;
  });
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

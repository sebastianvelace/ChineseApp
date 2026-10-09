const DB_NAME = "hanlu";
const STORE = "progress";
const KEY = "state";
const LEGACY = "hanlu-progress-v1";

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

export async function loadDeviceProgress<T>(): Promise<T | null> {
  try {
    const db = await openDb();
    const stored = await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    if (stored) return stored;
  } catch {
    // IndexedDB can be blocked. Fall through to the legacy copy.
  }
  try {
    const raw = localStorage.getItem(LEGACY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    await saveDeviceProgress(parsed);
    return parsed;
  } catch {
    return null;
  }
}

export async function saveDeviceProgress(data: unknown): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Keep the legacy copy below even if IndexedDB is unavailable.
  }
  try {
    localStorage.setItem(LEGACY, JSON.stringify(data));
  } catch {
    // Private mode can refuse both stores. The session still works in memory.
  }
}

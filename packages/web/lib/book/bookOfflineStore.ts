import type {DbBookOfflineBundle} from '@/lib/api/db/book/buildDbBookOfflineBundle';

const DB_NAME = 'so-book-offline';
const STORE = 'bundles';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IDB open failed'));
  });
}

export async function saveBookOfflineBundle(podId: string, bundle: DbBookOfflineBundle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(bundle, podId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IDB write failed'));
  });
  db.close();
}

export async function loadBookOfflineBundle(podId: string): Promise<DbBookOfflineBundle | undefined> {
  const db = await openDb();
  const bundle = await new Promise<DbBookOfflineBundle | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(podId);
    req.onsuccess = () => resolve(req.result as DbBookOfflineBundle | undefined);
    req.onerror = () => reject(req.error ?? new Error('IDB read failed'));
  });
  db.close();
  return bundle;
}

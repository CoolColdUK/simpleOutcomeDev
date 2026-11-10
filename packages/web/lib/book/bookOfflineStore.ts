import type {DbBookOfflineBundle} from '@/lib/api/db/book/buildDbBookOfflineBundle';
import {collectBookOfflineImagePaths} from '@so/model';

const DB_NAME = 'so-book-offline';
const BUNDLE_STORE = 'bundles';
const IMAGE_STORE = 'imageBlobs';
const DB_VERSION = 2;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BUNDLE_STORE)) {
        db.createObjectStore(BUNDLE_STORE);
      }
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IDB open failed'));
  });
}

function imageKey(podId: string, storagePath: string): string {
  return `${podId}\0${storagePath}`;
}

export async function saveBookOfflineBundle(podId: string, bundle: DbBookOfflineBundle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BUNDLE_STORE, 'readwrite');
    tx.objectStore(BUNDLE_STORE).put(bundle, podId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IDB write failed'));
  });

  const paths = collectBookOfflineImagePaths({
    coverStoragePath: bundle.book.coverStoragePath,
    markdownBodies: [
      bundle.book.summaryMd,
      ...bundle.outline.flatMap((entry) => [entry.summaryMd, entry.contentMd]),
      ...bundle.assets.map((asset) => asset.descriptionMd),
    ],
    assetGalleryStoragePaths: bundle.assets.flatMap((asset) => asset.images.map((img) => img.storagePath)),
  });

  await Promise.all(
    paths.map(async (path) => {
      const signedUrl = bundle.signedUrlMap[path];
      if (signedUrl === undefined) {
        return;
      }
      const response = await fetch(signedUrl);
      if (!response.ok) {
        return;
      }
      const blob = await response.blob();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IMAGE_STORE, 'readwrite');
        tx.objectStore(IMAGE_STORE).put(blob, imageKey(podId, path));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('IDB image write failed'));
      });
    }),
  );

  db.close();
}

export async function loadBookOfflineBundle(podId: string): Promise<DbBookOfflineBundle | undefined> {
  const db = await openDb();
  const bundle = await new Promise<DbBookOfflineBundle | undefined>((resolve, reject) => {
    const tx = db.transaction(BUNDLE_STORE, 'readonly');
    const req = tx.objectStore(BUNDLE_STORE).get(podId);
    req.onsuccess = () => resolve(req.result as DbBookOfflineBundle | undefined);
    req.onerror = () => reject(req.error ?? new Error('IDB read failed'));
  });
  db.close();
  return bundle;
}

export async function loadOfflineImageBlobUrlMap(
  podId: string,
  storagePaths: readonly string[],
): Promise<Record<string, string>> {
  const db = await openDb();
  const entries = await Promise.all(
    storagePaths.map(
      (path) =>
        new Promise<[string, string] | undefined>((resolve, reject) => {
          const tx = db.transaction(IMAGE_STORE, 'readonly');
          const req = tx.objectStore(IMAGE_STORE).get(imageKey(podId, path));
          req.onsuccess = () => {
            const value = req.result;
            if (!(value instanceof Blob)) {
              resolve(undefined);
              return;
            }
            resolve([path, URL.createObjectURL(value)]);
          };
          req.onerror = () => reject(req.error ?? new Error('IDB image read failed'));
        }),
    ),
  );
  db.close();
  return Object.fromEntries(entries.filter((entry): entry is [string, string] => entry !== undefined));
}

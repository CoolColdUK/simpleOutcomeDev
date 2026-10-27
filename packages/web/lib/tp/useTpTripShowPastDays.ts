'use client';

import {useCallback, useSyncExternalStore} from 'react';

const STORAGE_PREFIX = 'so.tp.trip.showPastDays.';
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function getSnapshot(tripId: string): boolean {
  if (tripId === '') {
    return false;
  }
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${tripId}`);
  return raw === '1';
}

export default function useTpTripShowPastDays(tripId: string): {
  readonly showPastDays: boolean;
  readonly setShowPastDays: (show: boolean) => void;
} {
  const showPastDays = useSyncExternalStore(
    subscribe,
    () => getSnapshot(tripId),
    () => false,
  );
  const setShowPastDays = useCallback(
    (next: boolean) => {
      if (tripId === '') {
        return;
      }
      window.localStorage.setItem(`${STORAGE_PREFIX}${tripId}`, next ? '1' : '0');
      emit();
    },
    [tripId],
  );
  return {showPastDays, setShowPastDays};
}

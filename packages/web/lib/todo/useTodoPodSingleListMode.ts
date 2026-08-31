'use client';

import {useCallback, useSyncExternalStore} from 'react';

const STORAGE_PREFIX = 'so.todo.pod.singleList.';
const MOBILE_MQ = '(max-width: 767px)';
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener('change', onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    mq.removeEventListener('change', onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function readStored(podId: string): boolean | undefined {
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${podId}`);
  if (raw === '1') {
    return true;
  }
  if (raw === '0') {
    return false;
  }
  return undefined;
}

function getSnapshot(podId: string): boolean {
  return readStored(podId) ?? window.matchMedia(MOBILE_MQ).matches;
}

export default function useTodoPodSingleListMode(podId: string): {
  readonly enabled: boolean;
  readonly setEnabled: (enabled: boolean) => void;
} {
  const enabled = useSyncExternalStore(
    subscribe,
    () => getSnapshot(podId),
    () => false,
  );
  const setEnabled = useCallback((next: boolean) => {
    window.localStorage.setItem(`${STORAGE_PREFIX}${podId}`, next ? '1' : '0');
    emit();
  }, [podId]);
  return {enabled, setEnabled};
}

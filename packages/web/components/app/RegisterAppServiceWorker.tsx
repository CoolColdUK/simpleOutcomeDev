'use client';

import {useEffect} from 'react';

export default function RegisterAppServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }
    void navigator.serviceWorker.register('/sw.js', {scope: '/app'});
  }, []);

  return null;
}

'use client';

import createCache, {type EmotionCache} from '@emotion/cache';
import {CacheProvider} from '@emotion/react';
import {useServerInsertedHTML} from 'next/navigation';
import type {ReactNode} from 'react';
import {useState} from 'react';

export interface EmotionCacheProviderProps {
  readonly children: ReactNode;
}

interface EmotionRegistry {
  readonly cache: EmotionCache;
  readonly flush: () => readonly string[];
}

function createEmotionRegistry(): EmotionRegistry {
  const cache = createCache({key: 'css', prepend: true});
  cache.compat = true;

  const insertedNames: string[] = [];
  const originalInsert = cache.insert.bind(cache);
  cache.insert = (...insertArgs: Parameters<typeof originalInsert>) => {
    const serialized = insertArgs[1];
    if (serialized !== undefined && cache.inserted[serialized.name] === undefined) {
      insertedNames.push(serialized.name);
    }
    return originalInsert(...insertArgs);
  };

  const flush = (): readonly string[] => {
    const names = [...insertedNames];
    insertedNames.length = 0;
    return names;
  };

  return {cache, flush};
}

export default function EmotionCacheProvider({children}: EmotionCacheProviderProps) {
  const [registry] = useState(createEmotionRegistry);

  useServerInsertedHTML(() => {
    const names = registry.flush();
    if (names.length === 0) {
      return undefined;
    }

    const stylesHtml = names
      .map((name) => registry.cache.inserted[name])
      .filter((style): style is string => typeof style === 'string')
      .join('');

    if (stylesHtml === '') {
      return undefined;
    }

    return (
      <style
        data-emotion={`${registry.cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{__html: stylesHtml}}
      />
    );
  });

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
}

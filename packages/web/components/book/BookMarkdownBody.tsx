'use client';

import {useEffect, useState} from 'react';
import SoMarkdown from '@/lib/markdown/SoMarkdown';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';

export interface BookMarkdownBodyProps {
  readonly markdown: string;
}

export default function BookMarkdownBody({markdown}: BookMarkdownBodyProps) {
  const [resolved, setResolved] = useState(markdown);
  useEffect(() => {
    let cancelled = false;
    void resolveStorageBookImageSignedUrls(markdown)
      .then((next) => {
        if (!cancelled) {
          setResolved(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolved(markdown);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [markdown]);
  return <SoMarkdown markdown={resolved} />;
}

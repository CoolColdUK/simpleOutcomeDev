'use client';

import {useEffect, useMemo, useState} from 'react';
import {applySoImageUrlMapToMarkdown, extractSoImageObjectPathsFromBody} from '@so/model';
import SoMarkdown from '@/lib/markdown/SoMarkdown';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';

export interface BookMarkdownBodyProps {
  readonly markdown: string;
  readonly offlineImageUrlByPath?: Readonly<Record<string, string>>;
}

export default function BookMarkdownBody({markdown, offlineImageUrlByPath}: BookMarkdownBodyProps) {
  const offlineMarkdown = useMemo(() => {
    if (offlineImageUrlByPath === undefined) {
      return undefined;
    }
    const paths = extractSoImageObjectPathsFromBody(markdown);
    const subset = Object.fromEntries(
      paths
        .map((path) => [path, offlineImageUrlByPath[path]] as const)
        .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
    );
    return applySoImageUrlMapToMarkdown(markdown, subset);
  }, [markdown, offlineImageUrlByPath]);

  const [networkResolved, setNetworkResolved] = useState(markdown);

  useEffect(() => {
    if (offlineMarkdown !== undefined) {
      return;
    }
    let cancelled = false;
    void resolveStorageBookImageSignedUrls(markdown)
      .then((next) => {
        if (!cancelled) {
          setNetworkResolved(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNetworkResolved(markdown);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [markdown, offlineMarkdown]);

  const resolved = offlineMarkdown ?? networkResolved;

  return <SoMarkdown markdown={resolved} />;
}

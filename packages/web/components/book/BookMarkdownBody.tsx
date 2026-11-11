'use client';

import {useCallback, useEffect, useMemo, useState, type MouseEvent} from 'react';
import {Box} from '@chakra-ui/react';
import {applySoImageUrlMapToMarkdown, bookMarkdownForDisplay, extractSoImageObjectPathsFromBody} from '@so/model';
import SoMarkdown from '@/lib/markdown/SoMarkdown';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';
import BookImageLightboxDialog from '@/components/book/BookImageLightboxDialog';

export interface BookMarkdownBodyProps {
  readonly markdown: string;
  readonly offlineImageUrlByPath?: Readonly<Record<string, string>>;
  readonly enableImageLightbox?: boolean;
  readonly showImageDownload?: boolean;
  readonly onError?: (message: string) => void;
}

function pathFromResolvedImageSrc(src: string, objectPathBySignedUrl: Readonly<Record<string, string>>): string | undefined {
  return objectPathBySignedUrl[src];
}

export default function BookMarkdownBody({
  markdown,
  offlineImageUrlByPath,
  enableImageLightbox = false,
  showImageDownload = false,
  onError,
}: BookMarkdownBodyProps) {
  const displayMarkdown = useMemo(() => bookMarkdownForDisplay(markdown), [markdown]);
  const offlineMarkdown = useMemo(() => {
    if (offlineImageUrlByPath === undefined) {
      return undefined;
    }
    const paths = extractSoImageObjectPathsFromBody(displayMarkdown);
    const subset = Object.fromEntries(
      paths
        .map((path) => [path, offlineImageUrlByPath[path]] as const)
        .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
    );
    return applySoImageUrlMapToMarkdown(displayMarkdown, subset);
  }, [displayMarkdown, offlineImageUrlByPath]);

  const [networkResolved, setNetworkResolved] = useState(displayMarkdown);
  const [pathByUrl, setPathByUrl] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<{url: string; path: string} | undefined>(undefined);

  useEffect(() => {
    if (offlineMarkdown !== undefined) {
      return;
    }
    let cancelled = false;
    const paths = extractSoImageObjectPathsFromBody(displayMarkdown);
    void resolveStorageBookImageSignedUrls(displayMarkdown)
      .then((next) => {
        if (!cancelled) {
          setNetworkResolved(next);
          if (enableImageLightbox || showImageDownload) {
            void import('@/lib/api/storage/storageBookSignedUrlCache')
              .then(({getStorageBookSignedUrls}) => getStorageBookSignedUrls(paths))
              .then((map) => {
                if (!cancelled) {
                  setPathByUrl(Object.fromEntries(Object.entries(map).map(([path, url]) => [url, path])));
                }
              });
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNetworkResolved(displayMarkdown);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [displayMarkdown, enableImageLightbox, offlineMarkdown, showImageDownload]);

  const resolved = offlineMarkdown ?? networkResolved;

  const onImageClick = useCallback(
    (event: MouseEvent) => {
      if (!enableImageLightbox) {
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || target.src === '') {
        return;
      }
      const path = pathFromResolvedImageSrc(target.src, pathByUrl);
      setLightbox({url: target.src, path: path ?? target.src});
    },
    [enableImageLightbox, pathByUrl],
  );

  return (
  <>
    <Box onClick={onImageClick} css={enableImageLightbox ? {'& img': {cursor: 'zoom-in'}} : undefined}>
      <SoMarkdown markdown={resolved} />
    </Box>
    <BookImageLightboxDialog
      open={lightbox !== undefined}
      signedUrl={lightbox?.url ?? ''}
      storagePath={lightbox?.path ?? ''}
      showDownload={showImageDownload}
      onClose={() => setLightbox(undefined)}
      onError={onError}
    />
  </>
  );
}

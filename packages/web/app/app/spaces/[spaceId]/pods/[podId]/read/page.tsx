'use client';

import {useEffect, useMemo, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button, HStack, Image, Input, Stack, Switch, Text} from '@chakra-ui/react';
import {BookOutlineKind, bookOutlineListLabel} from '@so/model';
import loadDbBookWorkspace from '@/lib/api/db/book/loadDbBookWorkspace';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import {extractSoImageObjectPathsFromBody} from '@so/model';
import {loadBookOfflineBundle, loadOfflineImageBlobUrlMap} from '@/lib/book/bookOfflineStore';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';

const NOTES_STORAGE_KEY = 'so-book-reader-include-notes';

function readIncludeNotesInitial(podId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(`${NOTES_STORAGE_KEY}:${podId}`) === 'true';
}

type ReaderItem = {
  readonly id: string;
  readonly title: string;
  readonly contentMd: string;
  readonly kind: BookOutlineKind;
  readonly chapterNumber: number | undefined;
  readonly noteNumber: number | undefined;
  readonly chapterImageStoragePath: string | undefined;
};

export default function BookReadPage() {
  const params = useParams<{spaceId: string; podId: string}>();
  const router = useRouter();
  const [includeNotes, setIncludeNotes] = useState(() => readIncludeNotesInitial(params.podId));
  const [index, setIndex] = useState(0);
  const [outline, setOutline] = useState<ReaderItem[]>([]);
  const [title, setTitle] = useState('');
  const [offlineImageUrlByPath, setOfflineImageUrlByPath] = useState<Record<string, string> | undefined>(undefined);
  const [chapterImageNetworkUrl, setChapterImageNetworkUrl] = useState('');
  const [jumpInput, setJumpInput] = useState('');

  const mapItem = (entry: {
    id: string;
    title: string;
    contentMd: string;
    kind: BookOutlineKind;
    chapterNumber?: number;
    noteNumber?: number;
    chapterImageStoragePath?: string;
  }): ReaderItem => ({
    id: entry.id,
    title: entry.title,
    contentMd: entry.contentMd,
    kind: entry.kind,
    chapterNumber: entry.chapterNumber,
    noteNumber: entry.noteNumber,
    chapterImageStoragePath: entry.chapterImageStoragePath,
  });

  useEffect(() => {
    const blobUrls: string[] = [];
    void (async () => {
      const offline = await loadBookOfflineBundle(params.podId);
      if (offline !== undefined) {
        const items = offline.outline
          .filter((entry) => entry.kind === BookOutlineKind.CHAPTER || (includeNotes && entry.kind === BookOutlineKind.NOTE))
          .map((entry) => mapItem(entry));
        setOutline(items);
        setTitle('Offline copy');
        const paths = new Set<string>();
        items.forEach((entry) => {
          extractSoImageObjectPathsFromBody(entry.contentMd).forEach((path) => paths.add(path));
          if (entry.chapterImageStoragePath !== undefined) {
            paths.add(entry.chapterImageStoragePath);
          }
        });
        if (offline.book.coverStoragePath !== undefined) {
          paths.add(offline.book.coverStoragePath);
        }
        const blobMap = await loadOfflineImageBlobUrlMap(params.podId, [...paths]);
        blobUrls.push(...Object.values(blobMap));
        setOfflineImageUrlByPath(blobMap);
        return;
      }
      setOfflineImageUrlByPath(undefined);
      const workspace = await loadDbBookWorkspace(params.podId);
      if (workspace === undefined) {
        return;
      }
      const items = workspace.outline
        .filter((entry) => entry.kind === BookOutlineKind.CHAPTER || (includeNotes && entry.kind === BookOutlineKind.NOTE))
        .map((entry) => mapItem(entry));
      setOutline(items);
      setTitle('Book');
    })();
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [includeNotes, params.podId]);

  const current = useMemo(() => outline[index], [index, outline]);

  const chapterImageUrl =
    current?.chapterImageStoragePath === undefined
      ? ''
      : (offlineImageUrlByPath?.[current.chapterImageStoragePath] ?? chapterImageNetworkUrl);

  useEffect(() => {
    if (current?.chapterImageStoragePath === undefined) {
      return;
    }
    if (offlineImageUrlByPath?.[current.chapterImageStoragePath] !== undefined) {
      return;
    }
    let cancelled = false;
    void resolveStorageBookImageSignedUrls(`![](soimg:${encodeURIComponent(current.chapterImageStoragePath)})`).then((resolved) => {
      const match = resolved.match(/\]\(<([^>]+)>\)/);
      if (!cancelled && match?.[1] !== undefined) {
        setChapterImageNetworkUrl(match[1]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [current?.chapterImageStoragePath, offlineImageUrlByPath]);

  const heading = useMemo(() => {
    if (current === undefined) {
      return '';
    }
    return bookOutlineListLabel(current.kind, current.title, current.chapterNumber, current.noteNumber);
  }, [current]);

  const maxChapter = useMemo(() => {
    const chapters = outline.filter((entry) => entry.kind === BookOutlineKind.CHAPTER);
    return chapters.length;
  }, [outline]);

  const jumpToChapter = (): void => {
    const n = Number.parseInt(jumpInput, 10);
    if (Number.isNaN(n) || n < 1 || n > maxChapter) {
      return;
    }
    const chapterIndex = outline.findIndex((entry, itemIndex) => {
      if (entry.kind !== BookOutlineKind.CHAPTER) {
        return false;
      }
      const chapterOrdinal = outline.slice(0, itemIndex + 1).filter((item) => item.kind === BookOutlineKind.CHAPTER).length;
      return chapterOrdinal === n;
    });
    if (chapterIndex >= 0) {
      setIndex(chapterIndex);
    }
  };

  if (current === undefined) {
    return <Text>No chapters to read.</Text>;
  }

  return (
    <Stack gap={4} p={4}>
      <HStack justify="space-between" wrap="wrap">
        <Text fontWeight="semibold">{title}</Text>
        <Switch.Root
          checked={includeNotes}
          onCheckedChange={(details) => {
            const next = details.checked === true;
            setIncludeNotes(next);
            localStorage.setItem(`${NOTES_STORAGE_KEY}:${params.podId}`, String(next));
            setIndex(0);
          }}
        >
          <Switch.HiddenInput />
          <Switch.Control />
          <Switch.Label>Include notes</Switch.Label>
        </Switch.Root>
      </HStack>
      <Text fontSize="lg" fontWeight="bold">
        {heading}
      </Text>
      {current.chapterImageStoragePath !== undefined && chapterImageUrl !== '' ? (
        <Image src={chapterImageUrl} alt="" maxH="280px" borderRadius="md" objectFit="contain" />
      ) : null}
      <BookMarkdownBody markdown={current.contentMd} offlineImageUrlByPath={offlineImageUrlByPath} />
      <HStack wrap="wrap" gap={2}>
        <Button disabled={index <= 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
          Previous
        </Button>
        <Button disabled={index >= outline.length - 1} onClick={() => setIndex((value) => Math.min(outline.length - 1, value + 1))}>
          Next
        </Button>
        <HStack>
          <Text fontSize="sm">Go to chapter</Text>
          <Input
            size="sm"
            w="16"
            value={jumpInput}
            onChange={(event) => setJumpInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                jumpToChapter();
              }
            }}
            placeholder={`1–${maxChapter}`}
          />
          <Button size="sm" variant="outline" onClick={jumpToChapter}>
            Go
          </Button>
        </HStack>
        <Button variant="outline" onClick={() => router.push(`/app/spaces/${params.spaceId}/pods/${params.podId}`)}>
          Back to workspace
        </Button>
      </HStack>
    </Stack>
  );
}

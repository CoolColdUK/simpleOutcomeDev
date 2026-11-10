'use client';

import {useEffect, useMemo, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button, HStack, Stack, Switch, Text} from '@chakra-ui/react';
import {BookOutlineKind} from '@so/model';
import loadDbBookWorkspace from '@/lib/api/db/book/loadDbBookWorkspace';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import {extractSoImageObjectPathsFromBody} from '@so/model';
import {loadBookOfflineBundle, loadOfflineImageBlobUrlMap} from '@/lib/book/bookOfflineStore';

const NOTES_STORAGE_KEY = 'so-book-reader-include-notes';

function readIncludeNotesInitial(podId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(`${NOTES_STORAGE_KEY}:${podId}`) === 'true';
}

export default function BookReadPage() {
  const params = useParams<{spaceId: string; podId: string}>();
  const router = useRouter();
  const [includeNotes, setIncludeNotes] = useState(() => readIncludeNotesInitial(params.podId));
  const [index, setIndex] = useState(0);
  const [outline, setOutline] = useState<{id: string; title: string; contentMd: string; kind: BookOutlineKind}[]>([]);
  const [title, setTitle] = useState('');
  const [offlineImageUrlByPath, setOfflineImageUrlByPath] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    const blobUrls: string[] = [];
    void (async () => {
      const offline = await loadBookOfflineBundle(params.podId);
      if (offline !== undefined) {
        const items = offline.outline
          .filter((entry) => entry.kind === BookOutlineKind.CHAPTER || (includeNotes && entry.kind === BookOutlineKind.NOTE))
          .map((entry) => ({
            id: entry.id,
            title: entry.title,
            contentMd: entry.contentMd,
            kind: entry.kind,
          }));
        setOutline(items);
        setTitle('Offline copy');
        const paths = new Set<string>();
        items.forEach((entry) => extractSoImageObjectPathsFromBody(entry.contentMd).forEach((path) => paths.add(path)));
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
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          contentMd: entry.contentMd,
          kind: entry.kind,
        }));
      setOutline(items);
      setTitle('Book');
    })();
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [includeNotes, params.podId]);

  const current = useMemo(() => outline[index], [index, outline]);

  if (current === undefined) {
    return <Text>No chapters to read.</Text>;
  }

  return (
    <Stack gap={4} p={4}>
      <HStack justify="space-between">
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
        {current.title}
      </Text>
      <BookMarkdownBody markdown={current.contentMd} offlineImageUrlByPath={offlineImageUrlByPath} />
      <HStack>
        <Button disabled={index <= 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
          Previous
        </Button>
        <Button disabled={index >= outline.length - 1} onClick={() => setIndex((value) => Math.min(outline.length - 1, value + 1))}>
          Next
        </Button>
        <Button variant="outline" onClick={() => router.push(`/app/spaces/${params.spaceId}/pods/${params.podId}`)}>
          Back to workspace
        </Button>
      </HStack>
    </Stack>
  );
}

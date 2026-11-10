'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  Accordion,
  Box,
  Button,
  Checkbox,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {SortableContext, arrayMove, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {BookChapterStatus, BookOutlineKind, bookOutlineListLabel} from '@so/model';
import type {DbBookWorkspace} from '@/lib/api/db/book/loadDbBookWorkspace';
import type {DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';
import loadDbBookWorkspace from '@/lib/api/db/book/loadDbBookWorkspace';
import updateDbBkBook from '@/lib/api/db/book/updateDbBkBook';
import createDbBkOutlineEntry from '@/lib/api/db/book/createDbBkOutlineEntry';
import updateDbBkOutlineEntry from '@/lib/api/db/book/updateDbBkOutlineEntry';
import deleteDbBkOutlineEntry from '@/lib/api/db/book/deleteDbBkOutlineEntry';
import reorderDbBkOutline from '@/lib/api/db/book/reorderDbBkOutline';
import createDbBkAsset from '@/lib/api/db/book/createDbBkAsset';
import deleteDbBkAsset from '@/lib/api/db/book/deleteDbBkAsset';
import createDbBkAssetType from '@/lib/api/db/book/createDbBkAssetType';
import deleteDbBkAssetType from '@/lib/api/db/book/deleteDbBkAssetType';
import updateDbBkAsset from '@/lib/api/db/book/updateDbBkAsset';
import uploadStorageBookCover from '@/lib/api/storage/uploadStorageBookCover';
import uploadStorageBookInlineImageMarkdownFragment from '@/lib/api/storage/uploadStorageBookInlineImageMarkdownFragment';
import buildDbBookOfflineBundle from '@/lib/api/db/book/buildDbBookOfflineBundle';
import buildDbBookEpub from '@/lib/api/db/book/buildDbBookEpub';
import {saveBookOfflineBundle} from '@/lib/book/bookOfflineStore';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import BookAssetImageGallery from '@/components/book/BookAssetImageGallery';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import insertAtCaret from '@/components/todo/insertAtCaret';

export interface BookWorkspaceProps {
  readonly spaceId: string;
  readonly podId: string;
  readonly podName: string;
  readonly canWrite: boolean;
}

type OutlineFilter = 'all' | 'chapters' | 'notes' | 'assets';

function SortableOutlineRow({
  entry,
  selected,
  onSelect,
}: {
  readonly entry: DbBkOutlineEntry;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: entry.id});
  const style = {transform: CSS.Transform.toString(transform), transition};
  return (
    <Box
      ref={setNodeRef}
      style={style}
      borderWidth="1px"
      borderColor={selected ? 'colorPalette.solid' : 'border.subtle'}
      borderRadius="md"
      p={2}
      mb={2}
      cursor="pointer"
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <Text fontWeight="medium">{bookOutlineListLabel(entry.kind, entry.title, entry.chapterNumber, entry.noteNumber)}</Text>
      {entry.kind === BookOutlineKind.CHAPTER && entry.status !== undefined ? <Text fontSize="sm">Status: {entry.status}</Text> : null}
    </Box>
  );
}

export default function BookWorkspace({spaceId, podId, podName, canWrite}: BookWorkspaceProps) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 6}}));
  const [workspace, setWorkspace] = useState<DbBookWorkspace | undefined>(undefined);
  const [filter, setFilter] = useState<OutlineFilter>('all');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [subtitle, setSubtitle] = useState('');
  const [summaryMd, setSummaryMd] = useState('');
  const [includeNotesExport, setIncludeNotesExport] = useState(false);
  const [error, setError] = useState('');
  const [contentDraftById, setContentDraftById] = useState<Record<string, string>>({});
  const [summaryDraftById, setSummaryDraftById] = useState<Record<string, string>>({});
  const contentDraft =
    selectedId === undefined
      ? ''
      : (contentDraftById[selectedId] ?? workspace?.outline.find((entry) => entry.id === selectedId)?.contentMd ?? '');
  const summaryDraft =
    selectedId === undefined
      ? ''
      : (summaryDraftById[selectedId] ?? workspace?.outline.find((entry) => entry.id === selectedId)?.summaryMd ?? '');

  const load = useCallback(async (): Promise<void> => {
    const data = await loadDbBookWorkspace(podId);
    setWorkspace(data);
    if (data !== undefined) {
      setSubtitle(data.book.subtitle);
      setSummaryMd(data.book.summaryMd);
    }
  }, [podId]);

  useEffect(() => {
    queueMicrotask(() => {
      void load().catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    });
  }, [load]);

  const selected = workspace?.outline.find((entry) => entry.id === selectedId);

  const filteredOutline = useMemo(() => {
    if (workspace === undefined) {
      return [];
    }
    if (filter === 'chapters') {
      return workspace.outline.filter((entry) => entry.kind === BookOutlineKind.CHAPTER);
    }
    if (filter === 'notes') {
      return workspace.outline.filter((entry) => entry.kind === BookOutlineKind.NOTE);
    }
    if (filter === 'assets') {
      return [];
    }
    return workspace.outline;
  }, [filter, workspace]);

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    if (workspace === undefined || !canWrite) {
      return;
    }
    const {active, over} = event;
    if (over === null || active.id === over.id) {
      return;
    }
    const ids = workspace.outline.map((entry) => entry.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
  if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const nextIds = arrayMove(ids, oldIndex, newIndex);
    await reorderDbBkOutline(podId, nextIds);
    await load();
  };

  const saveMeta = async (): Promise<void> => {
    await updateDbBkBook(podId, {subtitle, summaryMd});
    await load();
  };

  const addEntry = async (kind: BookOutlineKind): Promise<void> => {
    const created = await createDbBkOutlineEntry(podId, {kind, title: kind === BookOutlineKind.CHAPTER ? 'New chapter' : 'New note'});
    await load();
    setSelectedId(created.id);
  };

  const saveEntry = async (): Promise<void> => {
    if (selected === undefined) {
      return;
    }
    await updateDbBkOutlineEntry(selected.id, {contentMd: contentDraft, summaryMd: summaryDraft});
    await load();
  };

  const downloadOffline = async (): Promise<void> => {
    if (workspace === undefined) {
      return;
    }
    const bundle = await buildDbBookOfflineBundle(podId, workspace);
    await saveBookOfflineBundle(podId, bundle);
  };

  const exportEpub = async (): Promise<void> => {
    if (workspace === undefined) {
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const bytes = await buildDbBookEpub(supabase, workspace, {title: podName, includeNotes: includeNotesExport});
    const blob = new Blob([Uint8Array.from(bytes)], {type: 'application/epub+zip'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${podName.replaceAll(/\s+/g, '-').toLowerCase() || 'book'}.epub`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (workspace === undefined) {
    return <Text>Loading book…</Text>;
  }

  return (
    <Stack gap={4}>
      {error !== '' ? <Text color="fg.error">{error}</Text> : null}
      <Accordion.Root collapsible defaultValue={[]}>
        <Accordion.Item value="book-info">
          <Accordion.ItemTrigger>Book info</Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Stack gap={3} pt={2}>
              <Text fontWeight="semibold">{podName}</Text>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" disabled={!canWrite} />
              <Textarea value={summaryMd} onChange={(e) => setSummaryMd(e.target.value)} placeholder="Summary (markdown)" rows={4} disabled={!canWrite} />
              {summaryMd !== '' ? <BookMarkdownBody markdown={summaryMd} /> : null}
              {canWrite ? (
                <HStack>
                  <Button onClick={() => void saveMeta()}>Save info</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/jpeg,image/png,image/webp';
                      input.onchange = () => {
                        const file = input.files?.[0];
                        if (file === undefined) {
                          return;
                        }
                        void uploadStorageBookCover(podId, file)
                          .then((path) => updateDbBkBook(podId, {coverStoragePath: path}))
                          .then(() => load())
                          .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
                      };
                      input.click();
                    }}
                  >
                    Upload cover
                  </Button>
                </HStack>
              ) : null}
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
      <HStack wrap="wrap" gap={2}>
        {(['all', 'chapters', 'notes', 'assets'] as const).map((value) => (
          <Button key={value} size="sm" variant={filter === value ? 'solid' : 'outline'} onClick={() => setFilter(value)}>
            {value}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => void downloadOffline()}>
          Download offline
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push(`/app/spaces/${spaceId}/pods/${podId}/read`)}>
          Read
        </Button>
        <Checkbox.Root checked={includeNotesExport} onCheckedChange={(d) => setIncludeNotesExport(d.checked === true)}>
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Include notes in EPUB</Checkbox.Label>
        </Checkbox.Root>
        <Button size="sm" onClick={() => void exportEpub()}>
          Export EPUB
        </Button>
      </HStack>
      {filter !== 'assets' ? (
        <HStack align="start" gap={4}>
          <Box flex="1">
            {canWrite ? (
              <HStack mb={2}>
                <Button size="sm" onClick={() => void addEntry(BookOutlineKind.CHAPTER)}>
                  Add chapter
                </Button>
                <Button size="sm" onClick={() => void addEntry(BookOutlineKind.NOTE)}>
                  Add note
                </Button>
              </HStack>
            ) : null}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void onDragEnd(e)}>
              <SortableContext items={filteredOutline.map((entry) => entry.id)} strategy={verticalListSortingStrategy}>
                {filteredOutline.map((entry) => (
                  <SortableOutlineRow key={entry.id} entry={entry} selected={selectedId === entry.id} onSelect={() => setSelectedId(entry.id)} />
                ))}
              </SortableContext>
            </DndContext>
          </Box>
          {selected !== undefined ? (
            <Stack flex="2" gap={2}>
              <Input
                value={selected.title}
                onChange={(e) => void updateDbBkOutlineEntry(selected.id, {title: e.target.value}).then(() => load())}
                disabled={!canWrite}
              />
              {selected.kind === BookOutlineKind.CHAPTER ? (
                <NativeSelect.Root size="sm" disabled={!canWrite}>
                  <NativeSelect.Field
                    value={selected.status ?? BookChapterStatus.OUTLINE}
                    onChange={(e) =>
                      void updateDbBkOutlineEntry(selected.id, {status: e.target.value as BookChapterStatus}).then(() => load())
                    }
                  >
                    {Object.values(BookChapterStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              ) : null}
              <Text fontSize="sm" fontWeight="medium">
                Summary
              </Text>
              <Textarea
                key={`${selected.id}-summary`}
                value={summaryDraft}
                onChange={(e) => setSummaryDraftById((prev) => ({...prev, [selected.id]: e.target.value}))}
                rows={4}
                placeholder="Chapter or note summary (markdown)"
                disabled={!canWrite}
              />
              {summaryDraft !== '' ? <BookMarkdownBody markdown={summaryDraft} /> : null}
              <Text fontSize="sm" fontWeight="medium">
                Content
              </Text>
              <Textarea
                key={selected.id}
                value={contentDraft}
                onChange={(e) => setContentDraftById((prev) => ({...prev, [selected.id]: e.target.value}))}
                rows={14}
                disabled={!canWrite}
                onPaste={(e) => {
                  const file = [...e.clipboardData.items].map((item) => item.getAsFile()).find((picked) => picked?.type.startsWith('image/') ?? false);
                  if (file === undefined || file === null || !canWrite) {
                    return;
                  }
                  e.preventDefault();
                  void uploadStorageBookInlineImageMarkdownFragment(podId, selected.id, file).then((fragment) => {
                    const ta = e.target as HTMLTextAreaElement;
                    const {next} = insertAtCaret(contentDraft, ta, fragment);
                    setContentDraftById((prev) => ({...prev, [selected.id]: next}));
                  });
                }}
              />
              <BookMarkdownBody markdown={contentDraft} />
              {canWrite ? (
                <HStack>
                  <Button onClick={() => void saveEntry()}>Save content</Button>
                  <Button
                    colorPalette="red"
                    variant="outline"
                    onClick={() => void deleteDbBkOutlineEntry(selected.id, podId).then(() => load()).then(() => setSelectedId(undefined))}
                  >
                    Delete
                  </Button>
                </HStack>
              ) : null}
            </Stack>
          ) : null}
        </HStack>
      ) : (
        <Stack gap={4}>
          {workspace.assetTypes.map((type) => (
            <Box key={type.id} borderWidth="1px" borderRadius="md" p={3}>
              <HStack justify="space-between">
                <Text fontWeight="semibold">{type.label}</Text>
                {canWrite && !type.isSystem ? (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => void deleteDbBkAssetType(podId, type.id).then(() => load()).catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))}
                  >
                    Delete type
                  </Button>
                ) : null}
              </HStack>
              {workspace.assets
                .filter((asset) => asset.assetTypeId === type.id)
                .map((asset) => (
                  <Box key={asset.id} mt={2} p={2} bg="bg.subtle" borderRadius="sm">
                    <Input
                      value={asset.name}
                      onChange={(e) => void updateDbBkAsset(asset.id, {name: e.target.value}).then(() => load())}
                      disabled={!canWrite}
                    />
                    <Textarea
                      mt={2}
                      value={asset.descriptionMd}
                      rows={3}
                      onChange={(e) => void updateDbBkAsset(asset.id, {descriptionMd: e.target.value}).then(() => load())}
                      disabled={!canWrite}
                    />
                    <BookAssetImageGallery
                      podId={podId}
                      assetId={asset.id}
                      images={asset.images}
                      canWrite={canWrite}
                      onChanged={load}
                      onError={(message) => setError(message)}
                    />
                    {canWrite ? (
                      <Button
                        size="xs"
                        mt={2}
                        colorPalette="red"
                        variant="outline"
                        onClick={() => void deleteDbBkAsset(asset.id, podId).then(() => load())}
                      >
                        Delete asset
                      </Button>
                    ) : null}
                  </Box>
                ))}
              {canWrite ? (
                <Button size="sm" mt={2} onClick={() => void createDbBkAsset(podId, type.id, 'New asset').then(() => load())}>
                  Add asset
                </Button>
              ) : null}
            </Box>
          ))}
          {canWrite ? (
            <Button
              variant="outline"
              onClick={() => {
                const label = window.prompt('Asset type label');
                if (label === null || label.trim() === '') {
                  return;
                }
                const slug = label.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
                void createDbBkAssetType(podId, label.trim(), slug).then(() => load());
              }}
            >
              Add custom asset type
            </Button>
          ) : null}
        </Stack>
      )}
    </Stack>
  );
}

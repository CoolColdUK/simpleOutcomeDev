'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Accordion, Box, Button, HStack, Stack, Text, Textarea} from '@chakra-ui/react';
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
import {BookOutlineKind, bookOutlineListLabel} from '@so/model';
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
import buildDbBookOfflineBundle from '@/lib/api/db/book/buildDbBookOfflineBundle';
import buildDbBookEpub, {type BookEpubExportScope} from '@/lib/api/db/book/buildDbBookEpub';
import {loadBookOfflineBundle, saveBookOfflineBundle} from '@/lib/book/bookOfflineStore';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import BookOutlineEntryDialog from '@/components/book/BookOutlineEntryDialog';
import BookAssetEditDialog from '@/components/book/BookAssetEditDialog';
import BookAssetReadOnlyCard from '@/components/book/BookAssetReadOnlyCard';
import BookAddAssetTypeDialog from '@/components/book/BookAddAssetTypeDialog';
import SoToaster from '@/components/ui/SoToaster';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import {soToaster} from '@/lib/ui/soToaster';

export interface BookWorkspaceProps {
  readonly spaceId: string;
  readonly podId: string;
  readonly podName: string;
  readonly canWrite: boolean;
}

type OutlineFilter = 'all' | 'chapters' | 'notes' | 'assets';

function SortableOutlineRow({entry, onEdit}: {readonly entry: DbBkOutlineEntry; readonly onEdit: () => void}) {
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: entry.id});
  const style = {transform: CSS.Transform.toString(transform), transition};
  return (
    <Box
      ref={setNodeRef}
      style={style}
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="md"
      p={2}
      mb={2}
      {...attributes}
      {...listeners}
    >
      <Button variant="ghost" w="full" justifyContent="start" onClick={onEdit}>
        {bookOutlineListLabel(entry.kind, entry.title, entry.chapterNumber, entry.noteNumber)}
      </Button>
    </Box>
  );
}

export default function BookWorkspace({spaceId, podId, podName, canWrite}: BookWorkspaceProps) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 6}}));
  const [workspace, setWorkspace] = useState<DbBookWorkspace | undefined>(undefined);
  const [filter, setFilter] = useState<OutlineFilter>('all');
  const [editorEntryId, setEditorEntryId] = useState<string | undefined>(undefined);
  const [editorSaving, setEditorSaving] = useState(false);
  const [assetEditorId, setAssetEditorId] = useState<string | undefined>(undefined);
  const [assetTypeDialogOpen, setAssetTypeDialogOpen] = useState(false);
  const [summaryMd, setSummaryMd] = useState('');
  const [error, setError] = useState('');
  const [offlineReady, setOfflineReady] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    const data = await loadDbBookWorkspace(podId);
    setWorkspace(data);
    if (data !== undefined) {
      setSummaryMd(data.book.summaryMd);
      const offline = await loadBookOfflineBundle(podId);
      setOfflineReady(offline !== undefined && offline.version === data.book.offlineBundleVersion);
    }
  }, [podId]);

  useEffect(() => {
    queueMicrotask(() => {
      void load().catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    });
  }, [load]);

  const editorEntry = workspace?.outline.find((entry) => entry.id === editorEntryId);
  const editAsset = workspace?.assets.find((asset) => asset.id === assetEditorId);
  const editAssetType = editAsset === undefined ? undefined : workspace?.assetTypes.find((type) => type.id === editAsset.assetTypeId);

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

  const epubScope = useMemo((): BookEpubExportScope => {
    if (filter === 'notes') {
      return 'notes';
    }
    if (filter === 'chapters') {
      return 'chapters';
    }
    return 'all';
  }, [filter]);

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

  const saveBookSummary = async (): Promise<void> => {
    await updateDbBkBook(podId, {summaryMd});
    await load();
  };

  const addEntry = async (kind: BookOutlineKind): Promise<void> => {
    const created = await createDbBkOutlineEntry(podId, {kind, title: kind === BookOutlineKind.CHAPTER ? 'New chapter' : 'New note'});
    await load();
    setEditorEntryId(created.id);
  };

  const downloadOffline = async (): Promise<void> => {
    if (workspace === undefined) {
      return;
    }
    soToaster.create({title: 'Downloading offline copy…', type: 'info'});
    try {
      const bundle = await buildDbBookOfflineBundle(podId, workspace);
      const result = await saveBookOfflineBundle(podId, bundle);
      setOfflineReady(true);
      soToaster.create({
        title: 'Offline copy ready',
        description: `${result.imageCount} images (${Math.round(result.bytesCached / 1024)} KB)`,
        type: 'success',
      });
    } catch (unknown: unknown) {
      soToaster.create({
        title: 'Offline download failed',
        description: unknown instanceof Error ? unknown.message : String(unknown),
        type: 'error',
      });
    }
  };

  const exportEpub = async (): Promise<void> => {
    if (workspace === undefined) {
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const bytes = await buildDbBookEpub(supabase, workspace, {title: podName, exportScope: epubScope});
      const blob = new Blob([Uint8Array.from(bytes)], {type: 'application/epub+zip'});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${podName.replaceAll(/\s+/g, '-').toLowerCase() || 'book'}.epub`;
      anchor.click();
      URL.revokeObjectURL(url);
      soToaster.create({title: 'EPUB exported', type: 'success'});
    } catch (unknown: unknown) {
      soToaster.create({
        title: 'EPUB export failed',
        description: unknown instanceof Error ? unknown.message : String(unknown),
        type: 'error',
      });
    }
  };

  if (workspace === undefined) {
    return <Text>Loading book…</Text>;
  }

  return (
  <Stack gap={4}>
      <SoToaster />
      {error !== '' ? <Text color="fg.error">{error}</Text> : null}
      <Accordion.Root collapsible defaultValue={[]}>
        <Accordion.Item value="book-info">
          <Accordion.ItemTrigger>Book summary</Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Stack gap={3} pt={2}>
              <Text fontWeight="semibold">{podName}</Text>
              <Text fontSize="sm" color="fg.muted">
                Subtitle and cover are in pod Settings.
              </Text>
              <Textarea value={summaryMd} onChange={(event) => setSummaryMd(event.target.value)} placeholder="Summary (markdown)" rows={4} disabled={!canWrite} />
              {summaryMd !== '' ? <BookMarkdownBody markdown={summaryMd} /> : null}
              {canWrite ? <Button onClick={() => void saveBookSummary()}>Save summary</Button> : null}
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
        <Button size="sm" variant={offlineReady ? 'solid' : 'outline'} onClick={() => void downloadOffline()}>
          {offlineReady ? 'Offline ready' : 'Download offline'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push(`/app/spaces/${spaceId}/pods/${podId}/read`)}>
          Read
        </Button>
        <Button size="sm" onClick={() => void exportEpub()}>
          Export EPUB
        </Button>
      </HStack>
      {filter !== 'assets' ? (
        <Stack gap={2}>
          {canWrite ? (
            <HStack>
              <Button size="sm" onClick={() => void addEntry(BookOutlineKind.CHAPTER)}>
                Add chapter
              </Button>
              <Button size="sm" onClick={() => void addEntry(BookOutlineKind.NOTE)}>
                Add note
              </Button>
            </HStack>
          ) : null}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}>
            <SortableContext items={filteredOutline.map((entry) => entry.id)} strategy={verticalListSortingStrategy}>
              {filteredOutline.map((entry) => (
                <SortableOutlineRow key={entry.id} entry={entry} onEdit={() => setEditorEntryId(entry.id)} />
              ))}
            </SortableContext>
          </DndContext>
        </Stack>
      ) : (
        <Stack gap={4}>
          {workspace.assetTypes.map((type) => (
            <Box key={type.id} borderWidth="1px" borderRadius="md" p={3}>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="semibold">{type.label}</Text>
                {canWrite && !type.isSystem ? (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      void deleteDbBkAssetType(podId, type.id)
                        .then(() => load())
                        .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
                    }
                  >
                    Delete type
                  </Button>
                ) : null}
              </HStack>
              <Stack gap={2}>
                {workspace.assets
                  .filter((asset) => asset.assetTypeId === type.id)
                  .map((asset) => (
                    <BookAssetReadOnlyCard key={asset.id} asset={asset} typeLabel={type.label} onEdit={() => setAssetEditorId(asset.id)} />
                  ))}
              </Stack>
              {canWrite ? (
                <Button size="sm" mt={2} onClick={() => void createDbBkAsset(podId, type.id, 'New asset').then(() => load())}>
                  Add asset
                </Button>
              ) : null}
            </Box>
          ))}
          {canWrite ? (
            <Button variant="outline" onClick={() => setAssetTypeDialogOpen(true)}>
              Add custom asset type
            </Button>
          ) : null}
        </Stack>
      )}
      <BookOutlineEntryDialog
        open={editorEntry !== undefined}
        entry={editorEntry}
        podId={podId}
        canWrite={canWrite}
        saving={editorSaving}
        onClose={() => setEditorEntryId(undefined)}
        onSave={async (draft) => {
          if (editorEntry === undefined) {
            return;
          }
          setEditorSaving(true);
          try {
            await updateDbBkOutlineEntry(editorEntry.id, {
              title: draft.title,
              summaryMd: draft.summaryMd,
              contentMd: draft.contentMd,
              status: draft.status,
              chapterImageStoragePath:
                editorEntry.kind === BookOutlineKind.CHAPTER ? (draft.chapterImageStoragePath ?? null) : undefined,
            });
            await load();
            setEditorEntryId(undefined);
          } finally {
            setEditorSaving(false);
          }
        }}
        onDelete={async () => {
          if (editorEntry === undefined) {
            return;
          }
          await deleteDbBkOutlineEntry(editorEntry.id, podId);
          await load();
          setEditorEntryId(undefined);
        }}
      />
      <BookAssetEditDialog
        open={editAsset !== undefined}
        asset={editAsset}
        podId={podId}
        typeLabel={editAssetType?.label ?? 'Asset'}
        canWrite={canWrite}
        onClose={() => setAssetEditorId(undefined)}
        onSave={async (name, descriptionMd) => {
          if (editAsset === undefined) {
            return;
          }
          await updateDbBkAsset(editAsset.id, {name, descriptionMd});
          await load();
          setAssetEditorId(undefined);
        }}
        onDelete={async () => {
          if (editAsset === undefined) {
            return;
          }
          await deleteDbBkAsset(editAsset.id, podId);
          await load();
          setAssetEditorId(undefined);
        }}
        onReload={load}
        onError={(message) => setError(message)}
      />
      <BookAddAssetTypeDialog
        open={assetTypeDialogOpen}
        onClose={() => setAssetTypeDialogOpen(false)}
        onCreate={async (label) => {
          const slug = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
          await createDbBkAssetType(podId, label, slug);
          await load();
        }}
      />
    </Stack>
  );
}

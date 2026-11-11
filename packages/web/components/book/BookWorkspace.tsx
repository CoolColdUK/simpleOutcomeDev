'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Accordion, Box, Button, HStack, IconButton, Stack, Text} from '@chakra-ui/react';
import {SortAscIcon, SortDescIcon} from '@so/component';
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
import {
  BookChapterStatus,
  BookListSortDirection,
  BookOutlineKind,
  BookOutlineListFilter,
  BookWorkspaceTab,
  bookOutlineListLabel,
} from '@so/model';
import type {DbBkAsset, DbBookWorkspace} from '@/lib/api/db/book/loadDbBookWorkspace';
import type {DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';
import loadDbBookWorkspace from '@/lib/api/db/book/loadDbBookWorkspace';
import updateDbBkBook from '@/lib/api/db/book/updateDbBkBook';
import createDbBkOutlineEntry from '@/lib/api/db/book/createDbBkOutlineEntry';
import updateDbBkOutlineEntry from '@/lib/api/db/book/updateDbBkOutlineEntry';
import deleteDbBkOutlineEntry from '@/lib/api/db/book/deleteDbBkOutlineEntry';
import reorderDbBkOutline from '@/lib/api/db/book/reorderDbBkOutline';
import deleteDbBkAsset from '@/lib/api/db/book/deleteDbBkAsset';
import updateDbBkAsset from '@/lib/api/db/book/updateDbBkAsset';
import createDbBkAsset from '@/lib/api/db/book/createDbBkAsset';
import syncDbBkAssetImagesFromPaths from '@/lib/api/db/book/syncDbBkAssetImagesFromPaths';
import buildDbBookOfflineBundle from '@/lib/api/db/book/buildDbBookOfflineBundle';
import buildDbBookEpub, {type BookEpubExportScope} from '@/lib/api/db/book/buildDbBookEpub';
import {loadBookOfflineBundle, saveBookOfflineBundle} from '@/lib/book/bookOfflineStore';
import BookOutlineEntryDialog from '@/components/book/BookOutlineEntryDialog';
import BookOutlineEntryViewDialog from '@/components/book/BookOutlineEntryViewDialog';
import BookAssetEditDialog from '@/components/book/BookAssetEditDialog';
import BookAssetViewDialog from '@/components/book/BookAssetViewDialog';
import BookMarkdownEditorWithPreview from '@/components/book/BookMarkdownEditorWithPreview';
import BookAssetsSection from '@/components/book/BookAssetsSection';
import BookListPagination from '@/components/book/BookListPagination';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import SoToaster from '@/components/ui/SoToaster';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import {soToaster} from '@/lib/ui/soToaster';

export interface BookWorkspaceProps {
  readonly spaceId: string;
  readonly podId: string;
  readonly podName: string;
  readonly canWrite: boolean;
}

const OUTLINE_PAGE_SIZE = 20;

type OutlineEditorTarget =
  | {readonly mode: 'edit'; readonly entryId: string}
  | {readonly mode: 'create'; readonly draft: DbBkOutlineEntry};

type AssetEditorTarget =
  | {readonly mode: 'edit'; readonly assetId: string}
  | {readonly mode: 'create'; readonly draft: DbBkAsset};

function SortableOutlineRow({entry, onView}: {readonly entry: DbBkOutlineEntry; readonly onView: () => void}) {
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
      <Button variant="ghost" w="full" justifyContent="start" onClick={onView}>
        {bookOutlineListLabel(entry.kind, entry.title, entry.chapterNumber, entry.noteNumber)}
      </Button>
    </Box>
  );
}

function newOutlineDraft(podId: string, kind: BookOutlineKind): DbBkOutlineEntry {
  return {
    id: crypto.randomUUID(),
    podId,
    kind,
    sortOrder: 0,
    chapterNumber: undefined,
    noteNumber: undefined,
    title: kind === BookOutlineKind.CHAPTER ? 'New chapter' : 'New note',
    summaryMd: '',
    contentMd: '',
    status: kind === BookOutlineKind.CHAPTER ? BookChapterStatus.OUTLINE : undefined,
    chapterImageStoragePath: undefined,
  };
}

function newAssetDraft(podId: string, assetTypeId: string): DbBkAsset {
  return {
    id: crypto.randomUUID(),
    podId,
    assetTypeId,
    name: 'New asset',
    descriptionMd: '',
    sortOrder: 0,
    images: [],
  };
}

export default function BookWorkspace({spaceId, podId, podName, canWrite}: BookWorkspaceProps) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 6}}));
  const [workspace, setWorkspace] = useState<DbBookWorkspace | undefined>(undefined);
  const [workspaceTab, setWorkspaceTab] = useState(BookWorkspaceTab.OUTLINE);
  const [outlineFilter, setOutlineFilter] = useState(BookOutlineListFilter.ALL);
  const [outlineSort, setOutlineSort] = useState(BookListSortDirection.ASC);
  const [outlinePage, setOutlinePage] = useState(1);
  const [outlineEditor, setOutlineEditor] = useState<OutlineEditorTarget | undefined>(undefined);
  const [assetEditor, setAssetEditor] = useState<AssetEditorTarget | undefined>(undefined);
  const [viewAssetId, setViewAssetId] = useState<string | undefined>(undefined);
  const [viewOutlineEntryId, setViewOutlineEntryId] = useState<string | undefined>(undefined);
  const [outlineSaving, setOutlineSaving] = useState(false);
  const [assetSaving, setAssetSaving] = useState(false);
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

  const editorEntry = useMemo((): DbBkOutlineEntry | undefined => {
    if (outlineEditor === undefined || workspace === undefined) {
      return undefined;
    }
    if (outlineEditor.mode === 'create') {
      return outlineEditor.draft;
    }
    return workspace.outline.find((entry) => entry.id === outlineEditor.entryId);
  }, [outlineEditor, workspace]);

  const editAsset = useMemo((): DbBkAsset | undefined => {
    if (assetEditor === undefined || workspace === undefined) {
      return undefined;
    }
    if (assetEditor.mode === 'create') {
      return assetEditor.draft;
    }
    return workspace.assets.find((asset) => asset.id === assetEditor.assetId);
  }, [assetEditor, workspace]);

  const editAssetType = editAsset === undefined ? undefined : workspace?.assetTypes.find((type) => type.id === editAsset.assetTypeId);

  const viewAsset = useMemo((): DbBkAsset | undefined => {
    if (viewAssetId === undefined || workspace === undefined) {
      return undefined;
    }
    return workspace.assets.find((asset) => asset.id === viewAssetId);
  }, [viewAssetId, workspace]);

  const viewAssetType = viewAsset === undefined ? undefined : workspace?.assetTypes.find((type) => type.id === viewAsset.assetTypeId);

  const viewOutlineEntry = useMemo((): DbBkOutlineEntry | undefined => {
    if (viewOutlineEntryId === undefined || workspace === undefined) {
      return undefined;
    }
    return workspace.outline.find((entry) => entry.id === viewOutlineEntryId);
  }, [viewOutlineEntryId, workspace]);

  const outlineCounts = useMemo(() => {
    if (workspace === undefined) {
      return {chapters: 0, notes: 0};
    }
    let chapters = 0;
    let notes = 0;
    for (const entry of workspace.outline) {
      if (entry.kind === BookOutlineKind.CHAPTER) {
        chapters += 1;
      } else {
        notes += 1;
      }
    }
    return {chapters, notes};
  }, [workspace]);

  const filteredOutline = useMemo(() => {
    if (workspace === undefined) {
      return [];
    }
    if (outlineFilter === BookOutlineListFilter.CHAPTERS) {
      return workspace.outline.filter((entry) => entry.kind === BookOutlineKind.CHAPTER);
    }
    if (outlineFilter === BookOutlineListFilter.NOTES) {
      return workspace.outline.filter((entry) => entry.kind === BookOutlineKind.NOTE);
    }
    return workspace.outline;
  }, [outlineFilter, workspace]);

  const sortedOutline = useMemo(() => {
    const list = [...filteredOutline].sort((left, right) => left.sortOrder - right.sortOrder);
    if (outlineSort === BookListSortDirection.DESC) {
      list.reverse();
    }
    return list;
  }, [filteredOutline, outlineSort]);

  const outlineTotalPages = Math.max(1, Math.ceil(sortedOutline.length / OUTLINE_PAGE_SIZE));

  const paginatedOutline = useMemo(() => {
    const safePage = Math.min(outlinePage, outlineTotalPages);
    const start = (safePage - 1) * OUTLINE_PAGE_SIZE;
    return sortedOutline.slice(start, start + OUTLINE_PAGE_SIZE);
  }, [outlinePage, outlineTotalPages, sortedOutline]);

  const epubScope = useMemo((): BookEpubExportScope => {
    if (outlineFilter === BookOutlineListFilter.NOTES) {
      return 'notes';
    }
    if (outlineFilter === BookOutlineListFilter.CHAPTERS) {
      return 'chapters';
    }
    return 'all';
  }, [outlineFilter]);

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
              <BookMarkdownEditorWithPreview
                label="Summary"
                value={summaryMd}
                onChange={setSummaryMd}
                disabled={!canWrite}
                rows={4}
              />
              {canWrite ? <Button onClick={() => void saveBookSummary()}>Save summary</Button> : null}
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
      <HStack wrap="wrap" gap={2}>
        <Button
          size="sm"
          variant={workspaceTab === BookWorkspaceTab.OUTLINE ? 'solid' : 'outline'}
          onClick={() => setWorkspaceTab(BookWorkspaceTab.OUTLINE)}
        >
          Chapters & notes
        </Button>
        <Button
          size="sm"
          variant={workspaceTab === BookWorkspaceTab.ASSETS ? 'solid' : 'outline'}
          onClick={() => setWorkspaceTab(BookWorkspaceTab.ASSETS)}
        >
          Assets
        </Button>
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
      {workspaceTab === BookWorkspaceTab.OUTLINE ? (
        <Stack gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {outlineCounts.chapters} chapter{outlineCounts.chapters === 1 ? '' : 's'}
            {outlineFilter === BookOutlineListFilter.ALL ? ` · ${outlineCounts.notes} note${outlineCounts.notes === 1 ? '' : 's'}` : ''}
          </Text>
          <HStack wrap="wrap" gap={2}>
            {(
              [
                [BookOutlineListFilter.ALL, 'All'],
                [BookOutlineListFilter.CHAPTERS, 'Chapters'],
                [BookOutlineListFilter.NOTES, 'Notes'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={outlineFilter === value ? 'solid' : 'outline'}
                onClick={() => {
                  setOutlineFilter(value);
                  setOutlinePage(1);
                }}
              >
                {label}
              </Button>
            ))}
            <AppIconTooltip label={outlineSort === BookListSortDirection.ASC ? 'Sort descending' : 'Sort ascending'}>
              <IconButton
                aria-label="Toggle sort order"
                size="sm"
                variant="outline"
                onClick={() =>
                  setOutlineSort((prev) =>
                    prev === BookListSortDirection.ASC ? BookListSortDirection.DESC : BookListSortDirection.ASC,
                  )
                }
              >
                {outlineSort === BookListSortDirection.ASC ? <SortAscIcon size={16} /> : <SortDescIcon size={16} />}
              </IconButton>
            </AppIconTooltip>
          </HStack>
          <BookListPagination
            page={Math.min(outlinePage, outlineTotalPages)}
            totalPages={outlineTotalPages}
            totalItems={sortedOutline.length}
            onPageChange={setOutlinePage}
          />
          {canWrite ? (
            <HStack>
              <Button size="sm" onClick={() => setOutlineEditor({mode: 'create', draft: newOutlineDraft(podId, BookOutlineKind.CHAPTER)})}>
                Add chapter
              </Button>
              <Button size="sm" onClick={() => setOutlineEditor({mode: 'create', draft: newOutlineDraft(podId, BookOutlineKind.NOTE)})}>
                Add note
              </Button>
            </HStack>
          ) : null}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}>
            <SortableContext items={paginatedOutline.map((entry) => entry.id)} strategy={verticalListSortingStrategy}>
              {paginatedOutline.map((entry) => (
                <SortableOutlineRow key={entry.id} entry={entry} onView={() => setViewOutlineEntryId(entry.id)} />
              ))}
            </SortableContext>
          </DndContext>
        </Stack>
      ) : (
        <BookAssetsSection
          workspace={workspace}
          podId={podId}
          canWrite={canWrite}
          onViewAsset={(assetId) => setViewAssetId(assetId)}
          onEditAsset={(assetId) => setAssetEditor({mode: 'edit', assetId})}
          onCreateAsset={(assetTypeId) => setAssetEditor({mode: 'create', draft: newAssetDraft(podId, assetTypeId)})}
          onReload={load}
          onError={(message) => setError(message)}
        />
      )}
      <BookOutlineEntryViewDialog
        open={viewOutlineEntry !== undefined}
        entry={viewOutlineEntry}
        canWrite={canWrite}
        onClose={() => setViewOutlineEntryId(undefined)}
        onEdit={() => {
          if (viewOutlineEntry === undefined) {
            return;
          }
          const entryId = viewOutlineEntry.id;
          setViewOutlineEntryId(undefined);
          setOutlineEditor({mode: 'edit', entryId});
        }}
        onDelete={async () => {
          if (viewOutlineEntry === undefined) {
            return;
          }
          await deleteDbBkOutlineEntry(viewOutlineEntry.id, podId);
          await load();
          setViewOutlineEntryId(undefined);
        }}
        onReload={load}
        onError={(message) => setError(message)}
      />
      <BookOutlineEntryDialog
        open={editorEntry !== undefined}
        isCreate={outlineEditor?.mode === 'create'}
        entry={editorEntry}
        podId={podId}
        canWrite={canWrite}
        saving={outlineSaving}
        onClose={() => setOutlineEditor(undefined)}
        onReload={load}
        onError={(message) => setError(message)}
        onSave={async (draft) => {
          if (editorEntry === undefined) {
            return;
          }
          setOutlineSaving(true);
          try {
            if (outlineEditor?.mode === 'create') {
              await createDbBkOutlineEntry(podId, {
                id: editorEntry.id,
                kind: editorEntry.kind,
                title: draft.title,
                summaryMd: draft.summaryMd,
                contentMd: draft.contentMd,
                status: draft.status,
                chapterImageStoragePath: draft.chapterImageStoragePath,
              });
            } else {
              await updateDbBkOutlineEntry(editorEntry.id, {
                title: draft.title,
                summaryMd: draft.summaryMd,
                contentMd: draft.contentMd,
                status: draft.status,
                chapterImageStoragePath:
                  editorEntry.kind === BookOutlineKind.CHAPTER ? (draft.chapterImageStoragePath ?? null) : undefined,
              });
            }
            await load();
            setOutlineEditor(undefined);
          } finally {
            setOutlineSaving(false);
          }
        }}
        onDelete={
          outlineEditor?.mode === 'edit'
            ? async () => {
                if (editorEntry === undefined) {
                  return;
                }
                await deleteDbBkOutlineEntry(editorEntry.id, podId);
                await load();
                setOutlineEditor(undefined);
              }
            : undefined
        }
      />
      <BookAssetViewDialog
        open={viewAsset !== undefined}
        asset={viewAsset}
        typeLabel={viewAssetType?.label ?? 'Asset'}
        podId={podId}
        canWrite={canWrite}
        onClose={() => setViewAssetId(undefined)}
        onEdit={() => {
          if (viewAsset === undefined) {
            return;
          }
          const assetId = viewAsset.id;
          setViewAssetId(undefined);
          setAssetEditor({mode: 'edit', assetId});
        }}
        onReload={load}
        onError={(message) => setError(message)}
      />
      <BookAssetEditDialog
        open={editAsset !== undefined}
        isCreate={assetEditor?.mode === 'create'}
        asset={editAsset}
        podId={podId}
        typeLabel={editAssetType?.label ?? 'Asset'}
        canWrite={canWrite}
        saving={assetSaving}
        onClose={() => setAssetEditor(undefined)}
        onReload={load}
        onError={(message) => setError(message)}
        onSave={async (name, descriptionMd, pendingImagePaths) => {
          if (editAsset === undefined) {
            return;
          }
          setAssetSaving(true);
          try {
            if (assetEditor?.mode === 'create') {
              await createDbBkAsset(podId, {
                id: editAsset.id,
                assetTypeId: editAsset.assetTypeId,
                name,
                descriptionMd,
              });
              if (pendingImagePaths.length > 0) {
                await syncDbBkAssetImagesFromPaths(podId, editAsset.id, pendingImagePaths);
              }
            } else {
              await updateDbBkAsset(editAsset.id, {name, descriptionMd});
            }
            await load();
            setAssetEditor(undefined);
          } finally {
            setAssetSaving(false);
          }
        }}
        onDelete={
          assetEditor?.mode === 'edit'
            ? async () => {
                if (editAsset === undefined) {
                  return;
                }
                await deleteDbBkAsset(editAsset.id, podId);
                await load();
                setAssetEditor(undefined);
              }
            : undefined
        }
      />
    </Stack>
  );
}

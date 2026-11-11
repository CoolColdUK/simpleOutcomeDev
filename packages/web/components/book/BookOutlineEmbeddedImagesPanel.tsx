'use client';

import {useMemo} from 'react';
import {collectOutlineEntryImagePaths, removeSoImageMarkdownForObjectPath} from '@so/model';
import type {DbBkOutlineEntry} from '@/lib/api/db/book/mapDbBkOutlineRow';
import BookAttachedImagesGallery from '@/components/book/BookAttachedImagesGallery';
import updateDbBkOutlineEntry from '@/lib/api/db/book/updateDbBkOutlineEntry';
import deleteStorageTodoObject from '@/lib/api/storage/deleteStorageTodoObject';
import {BookOutlineKind} from '@so/model';

export interface BookOutlineEmbeddedImagesPanelProps {
  readonly entry: DbBkOutlineEntry;
  readonly canWrite: boolean;
  readonly onReload: () => Promise<void>;
  readonly onError: (message: string) => void;
  readonly onMarkdownPatched?: (patch: {
    readonly summaryMd: string;
    readonly contentMd: string;
    readonly chapterImageStoragePath?: string;
  }) => void;
}

export default function BookOutlineEmbeddedImagesPanel({
  entry,
  canWrite,
  onReload,
  onError,
  onMarkdownPatched,
}: BookOutlineEmbeddedImagesPanelProps) {
  const paths = useMemo(
    () =>
      collectOutlineEntryImagePaths({
        summaryMd: entry.summaryMd,
        contentMd: entry.contentMd,
        chapterImageStoragePath: entry.chapterImageStoragePath,
      }),
    [entry.chapterImageStoragePath, entry.contentMd, entry.summaryMd],
  );

  const items = useMemo(
    () =>
      paths.map((storagePath) => ({
        key: storagePath,
        storagePath,
      })),
    [paths],
  );

  return (
    <BookAttachedImagesGallery
      title="Attached images"
      hint="Inline images from summary and content, plus the chapter header image when set."
      emptyLabel="No images in this entry yet."
      items={items}
      canWrite={canWrite}
      confirmTitle="Remove image?"
      confirmDescription="This deletes the file from storage and removes its markdown reference from summary and content."
      onError={onError}
      onRemove={async (storagePath) => {
        const nextSummary = removeSoImageMarkdownForObjectPath(entry.summaryMd, storagePath);
        const nextContent = removeSoImageMarkdownForObjectPath(entry.contentMd, storagePath);
        const clearChapterImage =
          entry.kind === BookOutlineKind.CHAPTER && entry.chapterImageStoragePath === storagePath;
        onMarkdownPatched?.({
          summaryMd: nextSummary,
          contentMd: nextContent,
          ...(clearChapterImage ? {chapterImageStoragePath: undefined} : {}),
        });
        await deleteStorageTodoObject(storagePath);
        await updateDbBkOutlineEntry(entry.id, {
          summaryMd: nextSummary,
          contentMd: nextContent,
          ...(clearChapterImage ? {chapterImageStoragePath: null} : {}),
        });
        await onReload();
      }}
    />
  );
}

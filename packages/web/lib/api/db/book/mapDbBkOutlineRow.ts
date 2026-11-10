import type {BookChapterStatus} from '@so/model';
import {BookOutlineKind} from '@so/model';

export interface DbBkOutlineEntry {
  readonly id: string;
  readonly podId: string;
  readonly kind: BookOutlineKind;
  readonly sortOrder: number;
  readonly chapterNumber: number | undefined;
  readonly noteNumber: number | undefined;
  readonly title: string;
  readonly summaryMd: string;
  readonly contentMd: string;
  readonly status: BookChapterStatus | undefined;
}

interface BkOutlineRow {
  readonly id: string;
  readonly pod_id: string;
  readonly kind: string;
  readonly sort_order: number;
  readonly chapter_number: number | null;
  readonly note_number: number | null;
  readonly title: string;
  readonly summary_md: string;
  readonly content_md: string;
  readonly status: string | null;
}

export default function mapDbBkOutlineRow(row: BkOutlineRow): DbBkOutlineEntry {
  return {
    id: row.id,
    podId: row.pod_id,
    kind: row.kind === 'note' ? BookOutlineKind.NOTE : BookOutlineKind.CHAPTER,
    sortOrder: row.sort_order,
    chapterNumber: row.chapter_number ?? undefined,
    noteNumber: row.note_number ?? undefined,
    title: row.title,
    summaryMd: row.summary_md,
    contentMd: row.content_md,
    status:
      row.status === 'outline' || row.status === 'draft' || row.status === 'done'
        ? (row.status as BookChapterStatus)
        : undefined,
  };
}

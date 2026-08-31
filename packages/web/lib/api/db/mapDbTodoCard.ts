export interface DbTodoCard {
  readonly id: string;
  readonly podId: string;
  readonly columnId: string | undefined;
  readonly title: string;
  readonly description: string;
  readonly dueAt: string | undefined;
  readonly tags: readonly string[];
  readonly assigneeUserId: string | undefined;
  readonly sortOrder: number;
  readonly completedAt: string | undefined;
  readonly iconPath: string | undefined;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function mapDbTodoCard(row: {
  readonly id: string;
  readonly pod_id: string;
  readonly column_id: string | null;
  readonly title: string;
  readonly description: string;
  readonly due_at: string | null;
  readonly tags: string[];
  readonly assignee_user_id: string | null;
  readonly sort_order: number;
  readonly completed_at: string | null;
  readonly icon_path: string | null;
  readonly created_by: string;
  readonly created_at: string;
  readonly updated_at: string;
}): DbTodoCard {
  return {
    id: row.id,
    podId: row.pod_id,
    columnId: row.column_id ?? undefined,
    title: row.title,
    description: row.description,
    dueAt: row.due_at ?? undefined,
    tags: row.tags,
    assigneeUserId: row.assignee_user_id ?? undefined,
    sortOrder: row.sort_order,
    completedAt: row.completed_at ?? undefined,
    iconPath: row.icon_path ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

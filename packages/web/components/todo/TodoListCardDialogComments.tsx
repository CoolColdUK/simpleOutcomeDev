'use client';

import {Button, HStack, Input, Stack, Text} from '@chakra-ui/react';
import {useEffect, useState} from 'react';
import dayjs from 'dayjs';
import type {DbTodoCardComment} from '@/lib/api/db/listDbTodoCardComments';
import listDbTodoCardComments from '@/lib/api/db/listDbTodoCardComments';
import createDbTodoCardComment from '@/lib/api/db/createDbTodoCardComment';
import deleteDbTodoCardComment from '@/lib/api/db/deleteDbTodoCardComment';
import {canManageTodoColumns, type PodRole} from '@so/model';

export interface TodoListCardDialogCommentsProps {
  readonly podId: string;
  readonly cardId: string;
  readonly userId: string;
  readonly podRole: PodRole | undefined;
  readonly isSpaceOwner: boolean;
  readonly nameFor: (userId: string) => string;
}

export default function TodoListCardDialogComments({
  podId,
  cardId,
  userId,
  podRole,
  isSpaceOwner,
  nameFor,
}: TodoListCardDialogCommentsProps) {
  const [rows, setRows] = useState<readonly DbTodoCardComment[]>([]);
  const [body, setBody] = useState('');
  const canDeleteAny = canManageTodoColumns(podRole, isSpaceOwner);

  const load = async (): Promise<void> => {
    setRows(await listDbTodoCardComments(cardId));
  };

  useEffect(() => {
    void load();
  }, [cardId]);

  const add = async (): Promise<void> => {
    await createDbTodoCardComment(podId, cardId, body, userId);
    setBody('');
    await load();
  };

  return (
    <Stack gap={2}>
      <Text fontWeight="semibold">Comments</Text>
      {rows.map((row) => (
        <Stack key={row.id} gap={0}>
          <Text fontSize="sm">{row.body}</Text>
          <HStack>
            <Text fontSize="xs" color="fg.muted">
              {nameFor(row.createdBy)} · {dayjs(row.createdAt).format('YYYY-MM-DD HH:mm')}
            </Text>
            {row.createdBy === userId || canDeleteAny ? (
              <Button size="xs" variant="ghost" onClick={() => void deleteDbTodoCardComment(row.id).then(load)}>
                Delete
              </Button>
            ) : null}
          </HStack>
        </Stack>
      ))}
      <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment" />
      <Button size="sm" disabled={body.trim() === ''} onClick={() => void add()}>
        Comment
      </Button>
    </Stack>
  );
}

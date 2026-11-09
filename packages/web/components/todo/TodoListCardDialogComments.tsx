'use client';

import {Alert, Button, HStack, Stack, Text, Textarea} from '@chakra-ui/react';
import {useCallback, useEffect, useRef, useState} from 'react';
import dayjs from 'dayjs';
import {canManageTodoColumns, countSoImageMarkdownUrisInBody, TODO_MAX_INLINE_IMAGES, type PodRole} from '@so/model';
import type {DbTodoCardComment} from '@/lib/api/db/listDbTodoCardComments';
import listDbTodoCardComments from '@/lib/api/db/listDbTodoCardComments';
import createDbTodoCardComment from '@/lib/api/db/createDbTodoCardComment';
import deleteDbTodoCardComment from '@/lib/api/db/deleteDbTodoCardComment';
import uploadStorageTodoInlineImageMarkdownFragment from '@/lib/api/storage/uploadStorageTodoInlineImageMarkdownFragment';
import insertAtCaret from '@/components/todo/insertAtCaret';
import TodoMarkdownBody from '@/components/todo/TodoMarkdownBody';
import pickImageFileFromDataTransfer from '@/lib/todo/pickImageFileFromDataTransfer';

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
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState<readonly DbTodoCardComment[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const canDeleteAny = canManageTodoColumns(podRole, isSpaceOwner);

  const load = useCallback(async (): Promise<void> => {
    setRows(await listDbTodoCardComments(cardId));
  }, [cardId]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  const add = async (): Promise<void> => {
    setError('');
    try {
      await createDbTodoCardComment(podId, cardId, body, userId);
      setBody('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onPasteImage = async (file: File): Promise<void> => {
    if (countSoImageMarkdownUrisInBody(body) >= TODO_MAX_INLINE_IMAGES) {
      setError(`At most ${TODO_MAX_INLINE_IMAGES} images per comment`);
      return;
    }
    setError('');
    setUploading(true);
    try {
      const fragment = await uploadStorageTodoInlineImageMarkdownFragment(podId, cardId, file);
      const ta = taRef.current;
      if (ta === null) {
        setBody(`${body}\n${fragment}`);
        return;
      }
      const {next, caret} = insertAtCaret(body, ta, fragment);
      setBody(next);
      requestAnimationFrame(() => {
        ta.selectionStart = caret;
        ta.selectionEnd = caret;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack gap={2} data-todo-comment-composer>
      <Text fontWeight="semibold">Comments</Text>
      {rows.map((row) => (
        <Stack key={row.id} gap={1}>
          <TodoMarkdownBody markdown={row.body} />
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
      <Textarea
        ref={taRef}
        value={body}
        rows={3}
        placeholder="Add a comment. Paste an image to attach it."
        disabled={uploading}
        onChange={(e) => setBody(e.target.value)}
        onPaste={(e) => {
          const file = pickImageFileFromDataTransfer(e.clipboardData);
          if (file === undefined) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          void onPasteImage(file);
        }}
      />
      {countSoImageMarkdownUrisInBody(body) > 0 ? <TodoMarkdownBody markdown={body} /> : null}
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <Button size="sm" disabled={body.trim() === '' || uploading} loading={uploading} onClick={() => void add()}>
        Comment
      </Button>
    </Stack>
  );
}

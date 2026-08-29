'use client';

import {useRef, useState} from 'react';
import {
  Alert,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Field,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import {countSoImageMarkdownUrisInBody, TODO_MAX_INLINE_IMAGES, type PodRole} from '@so/model';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import type {DbPodMember} from '@/lib/api/db/listDbPodMembers';
import updateDbTodoCard from '@/lib/api/db/updateDbTodoCard';
import moveDbTodoCard from '@/lib/api/db/moveDbTodoCard';
import uploadStorageTodoInlineImageMarkdownFragment from '@/lib/api/storage/uploadStorageTodoInlineImageMarkdownFragment';
import TodoMarkdownBody from '@/components/todo/TodoMarkdownBody';
import TodoListCardDialogComments from '@/components/todo/TodoListCardDialogComments';
import insertAtCaret from '@/components/todo/insertAtCaret';

export interface TodoListCardDialogProps {
  readonly open: boolean;
  readonly card: DbTodoCard | undefined;
  readonly members: readonly DbPodMember[];
  readonly userId: string;
  readonly podRole: PodRole | undefined;
  readonly isSpaceOwner: boolean;
  readonly onClose: () => void;
  readonly onChanged: () => void;
}

export default function TodoListCardDialog(props: TodoListCardDialogProps) {
  if (props.card === undefined) {
    return null;
  }
  return <TodoListCardDialogBody key={props.card.id} {...props} card={props.card} />;
}

interface TodoListCardDialogBodyProps extends Omit<TodoListCardDialogProps, 'card'> {
  readonly card: DbTodoCard;
}

function TodoListCardDialogBody({
  open,
  card,
  members,
  userId,
  podRole,
  isSpaceOwner,
  onClose,
  onChanged,
}: TodoListCardDialogBodyProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [dueAt, setDueAt] = useState(card.dueAt ?? '');
  const [tags, setTags] = useState(card.tags.join(', '));
  const [assignee, setAssignee] = useState(card.assigneeUserId ?? '');
  const [error, setError] = useState('');

  const save = async (): Promise<void> => {
    setError('');
    try {
      await updateDbTodoCard(card.id, {
        title,
        description,
        dueAt,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== ''),
        assigneeUserId: assignee,
      });
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const archive = async (): Promise<void> => {
    await moveDbTodoCard(card.id, undefined, card.sortOrder);
    onChanged();
    onClose();
  };

  const onPasteImage = async (clipboardData: DataTransfer): Promise<void> => {
    const file = [...clipboardData.items]
      .map((item) => item.getAsFile())
      .find((picked) => picked !== null && picked.type.startsWith('image/'));
    if (file === undefined || file === null) {
      return;
    }
    if (countSoImageMarkdownUrisInBody(description) >= TODO_MAX_INLINE_IMAGES) {
      setError(`At most ${TODO_MAX_INLINE_IMAGES} images per card`);
      return;
    }
    try {
      const fragment = await uploadStorageTodoInlineImageMarkdownFragment(card.podId, card.id, file);
      const ta = taRef.current;
      if (ta === null) {
        setDescription(`${description}\n${fragment}`);
        return;
      }
      const {next, caret} = insertAtCaret(description, ta, fragment);
      setDescription(next);
      requestAnimationFrame(() => {
        ta.selectionStart = caret;
        ta.selectionEnd = caret;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const nameFor = (id: string): string => members.find((m) => m.userId === id)?.username ?? id.slice(0, 8);

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)} size="lg">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Card</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Field.Root>
                <Field.Label>Title</Field.Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Description (markdown, paste images)</Field.Label>
                <Textarea
                  ref={taRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onPaste={(e) => {
                    const hasImage = [...e.clipboardData.items].some((item) => item.type.startsWith('image/'));
                    if (hasImage) {
                      e.preventDefault();
                      void onPasteImage(e.clipboardData);
                    }
                  }}
                  rows={8}
                />
              </Field.Root>
              <TodoMarkdownBody markdown={description} />
              <Field.Root>
                <Field.Label>Due date</Field.Label>
                <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Tags (comma separated)</Field.Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Assignee</Field.Label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.username ?? m.userId.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </Field.Root>
              <Text fontSize="xs" color="fg.muted">
                Created {dayjs(card.createdAt).format('YYYY-MM-DD HH:mm')} · Updated{' '}
                {dayjs(card.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Text>
              <TodoListCardDialogComments
                podId={card.podId}
                cardId={card.id}
                userId={userId}
                podRole={podRole}
                isSpaceOwner={isSpaceOwner}
                nameFor={nameFor}
              />
              {error !== '' ? (
                <Alert.Root status="error">
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Root>
              ) : null}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => void archive()}>
              Archive
            </Button>
            <Button colorPalette="brand" onClick={() => void save()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}

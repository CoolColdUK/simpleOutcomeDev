'use client';

import {useState} from 'react';
import {
  Alert,
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
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import {ArchiveIcon, SaveIcon} from '@so/component';
import type {PodRole} from '@so/model';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import type {DbPodMember} from '@/lib/api/db/listDbPodMembers';
import updateDbTodoCard from '@/lib/api/db/updateDbTodoCard';
import moveDbTodoCard from '@/lib/api/db/moveDbTodoCard';
import TodoListCardDialogComments from '@/components/todo/TodoListCardDialogComments';
import TodoListCardDialogDescription from '@/components/todo/TodoListCardDialogDescription';
import TodoListCardDialogTags from '@/components/todo/TodoListCardDialogTags';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import {todoDueAtFromInputValue, todoDueAtToInputValue} from '@/components/todo/formatTodoDueAt';

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
  const [title, setTitle] = useState(card.title);
  const [dueAt, setDueAt] = useState(todoDueAtToInputValue(card.dueAt));
  const [tags, setTags] = useState<readonly string[]>(card.tags);
  const [assignee, setAssignee] = useState(card.assigneeUserId ?? '');
  const [error, setError] = useState('');

  const save = async (): Promise<void> => {
    setError('');
    try {
      await updateDbTodoCard(card.id, {
        title,
        dueAt: todoDueAtFromInputValue(dueAt) ?? '',
        tags,
        assigneeUserId: assignee,
      });
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const saveDescription = async (next: string): Promise<void> => {
    setError('');
    await updateDbTodoCard(card.id, {description: next});
    onChanged();
  };

  const archive = async (): Promise<void> => {
    await moveDbTodoCard(card.id, undefined, card.sortOrder);
    onChanged();
    onClose();
  };

  const nameFor = (id: string): string => members.find((m) => m.userId === id)?.username ?? id.slice(0, 8);

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)} size="lg">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent w="full">
          <DialogHeader>
            <DialogTitle>Card</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3} w="full">
              <Field.Root w="full">
                <Field.Label>Title</Field.Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field.Root>
              <Field.Root w="full">
                <Field.Label>Description</Field.Label>
                <TodoListCardDialogDescription
                  podId={card.podId}
                  cardId={card.id}
                  description={card.description}
                  onSaved={saveDescription}
                  onError={setError}
                />
              </Field.Root>
              <HStack align="start" gap={4} w="full" flexWrap="wrap">
                <Field.Root flex="1" minW="12rem">
                  <Field.Label>Due</Field.Label>
                  <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
                </Field.Root>
                <Field.Root flex="1" minW="12rem">
                  <Field.Label>Assignee</Field.Label>
                  <NativeSelect.Root w="full">
                    <NativeSelect.Field value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.username ?? m.userId.slice(0, 8)}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>
              </HStack>
              <TodoListCardDialogTags tags={tags} onChange={setTags} />
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
          <DialogFooter justifyContent="flex-start">
            <AppIconTooltip label="Archive card">
              <IconButton aria-label="Archive card" variant="outline" onClick={() => void archive()}>
                <ArchiveIcon size={16} />
              </IconButton>
            </AppIconTooltip>
            <AppIconTooltip label="Save card">
              <IconButton aria-label="Save card" colorPalette="brand" onClick={() => void save()}>
                <SaveIcon size={16} />
              </IconButton>
            </AppIconTooltip>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}

'use client';

import {useRef, useState} from 'react';
import {Box, Button, HStack, Stack, Text, Textarea} from '@chakra-ui/react';
import {CancelIcon, SaveIcon} from '@so/component';
import {countSoImageMarkdownUrisInBody, TODO_MAX_INLINE_IMAGES} from '@so/model';
import uploadStorageTodoInlineImageMarkdownFragment from '@/lib/api/storage/uploadStorageTodoInlineImageMarkdownFragment';
import insertAtCaret from '@/components/todo/insertAtCaret';
import TodoMarkdownBody from '@/components/todo/TodoMarkdownBody';

export interface TodoListCardDialogDescriptionProps {
  readonly podId: string;
  readonly cardId: string;
  readonly description: string;
  readonly onSaved: (next: string) => Promise<void>;
  readonly onError: (message: string) => void;
}

export default function TodoListCardDialogDescription({
  podId,
  cardId,
  description,
  onSaved,
  onError,
}: TodoListCardDialogDescriptionProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);
  const [saving, setSaving] = useState(false);

  const onPasteImage = async (clipboardData: DataTransfer): Promise<void> => {
    const file = [...clipboardData.items]
      .map((item) => item.getAsFile())
      .find((picked) => picked !== null && picked.type.startsWith('image/'));
    if (file === undefined || file === null) {
      return;
    }
    if (countSoImageMarkdownUrisInBody(draft) >= TODO_MAX_INLINE_IMAGES) {
      onError(`At most ${TODO_MAX_INLINE_IMAGES} images per card`);
      return;
    }
    try {
      const fragment = await uploadStorageTodoInlineImageMarkdownFragment(podId, cardId, file);
      const ta = taRef.current;
      if (ta === null) {
        setDraft(`${draft}\n${fragment}`);
        return;
      }
      const {next, caret} = insertAtCaret(draft, ta, fragment);
      setDraft(next);
      requestAnimationFrame(() => {
        ta.selectionStart = caret;
        ta.selectionEnd = caret;
      });
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      await onSaved(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Box
        minH="4rem"
        p={2}
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="md"
        onDoubleClick={() => {
          setDraft(description);
          setEditing(true);
        }}
      >
        {description.trim() === '' ? (
          <Text fontSize="sm" color="fg.muted">
            Double-click to edit description
          </Text>
        ) : (
          <TodoMarkdownBody markdown={description} />
        )}
      </Box>
    );
  }

  return (
    <Stack gap={2}>
      <Textarea
        ref={taRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onPaste={(e) => {
          const hasImage = [...e.clipboardData.items].some((item) => item.type.startsWith('image/'));
          if (hasImage) {
            e.preventDefault();
            void onPasteImage(e.clipboardData);
          }
        }}
        rows={8}
      />
      <HStack justify="flex-start" gap={2}>
        <Button size="sm" colorPalette="brand" loading={saving} onClick={() => void save()}>
          <SaveIcon size={14} />
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => {
            setDraft(description);
            setEditing(false);
          }}
        >
          <CancelIcon size={14} />
          Cancel
        </Button>
      </HStack>
    </Stack>
  );
}

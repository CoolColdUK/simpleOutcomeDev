'use client';

import {useEffect, useRef, useState} from 'react';
import {Box, Button, HStack, Stack, Switch, Text, Textarea} from '@chakra-ui/react';
import {CancelIcon, SaveIcon} from '@so/component';
import {countSoImageMarkdownUrisInBody, TODO_MAX_INLINE_IMAGES} from '@so/model';
import uploadStorageTodoInlineImageMarkdownFragment from '@/lib/api/storage/uploadStorageTodoInlineImageMarkdownFragment';
import insertAtCaret from '@/components/todo/insertAtCaret';
import TodoMarkdownBody from '@/components/todo/TodoMarkdownBody';
import runTodoPrint from '@/lib/todo/runTodoPrint';

export interface TodoListCardDialogDescriptionProps {
  readonly podId: string;
  readonly cardId: string;
  readonly description: string;
  readonly onSaved: (next: string) => Promise<void>;
  readonly onError: (message: string) => void;
  readonly onDescriptionChange: (next: string) => void;
}

export default function TodoListCardDialogDescription({
  podId,
  cardId,
  description,
  onSaved,
  onError,
  onDescriptionChange,
}: TodoListCardDialogDescriptionProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const onDescriptionChangeRef = useRef(onDescriptionChange);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [localBody, setLocalBody] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState(description);
  const [saving, setSaving] = useState(false);
  const body = localBody ?? description;
  onDescriptionChangeRef.current = onDescriptionChange;

  useEffect(() => {
    onDescriptionChangeRef.current(body);
  }, [body]);

  useEffect(() => {
    if (!editing) {
      return;
    }
    const ta = taRef.current;
    if (ta === null) {
      return;
    }
    ta.focus();
    const end = ta.value.length;
    ta.setSelectionRange(end, end);
  }, [editing]);

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
      setLocalBody(draft);
      setEditing(false);
      setPreview(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Stack gap={2} w="full">
        <Box
          w="full"
          minH="4rem"
          p={2}
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="md"
          onDoubleClick={() => {
            setDraft(body);
            setEditing(true);
            setPreview(false);
          }}
        >
          {body.trim() === '' ? (
            <Text fontSize="sm" color="fg.muted">
              Double-click to edit description
            </Text>
          ) : (
            <TodoMarkdownBody markdown={body} />
          )}
        </Box>
        <HStack className="no-print" justify="flex-start">
          <Button size="sm" variant="outline" onClick={() => runTodoPrint('description')}>
            Print description
          </Button>
        </HStack>
      </Stack>
    );
  }

  return (
    <Stack gap={2} w="full">
      <Textarea
        w="full"
        ref={taRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          onDescriptionChange(e.target.value);
        }}
        onPaste={(e) => {
          const hasImage = [...e.clipboardData.items].some((item) => item.type.startsWith('image/'));
          if (hasImage) {
            e.preventDefault();
            void onPasteImage(e.clipboardData);
          }
        }}
        rows={8}
      />
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <HStack gap={2}>
          <Button size="sm" colorPalette="brand" loading={saving} onClick={() => void save()}>
            <SaveIcon size={14} />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => {
              setDraft(body);
              onDescriptionChange(body);
              setEditing(false);
              setPreview(false);
            }}
          >
            <CancelIcon size={14} />
            Cancel
          </Button>
          <Button size="sm" variant="outline" disabled={saving} onClick={() => runTodoPrint('description')}>
            Print description
          </Button>
        </HStack>
        <Switch.Root checked={preview} onCheckedChange={(e) => setPreview(e.checked)}>
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Preview</Switch.Label>
        </Switch.Root>
      </HStack>
      {preview ? (
        <Box w="full" p={2} borderWidth="1px" borderColor="border.subtle" borderRadius="md">
          {draft.trim() === '' ? (
            <Text fontSize="sm" color="fg.muted">
              Nothing to preview
            </Text>
          ) : (
            <TodoMarkdownBody markdown={draft} />
          )}
        </Box>
      ) : null}
    </Stack>
  );
}

'use client';

import {useRef, useState} from 'react';
import {Box, Button, Field, HStack, Stack, Text} from '@chakra-ui/react';
import pickImageFileFromDataTransfer from '@/lib/todo/pickImageFileFromDataTransfer';
import replaceTodoCardIcon from '@/lib/todo/replaceTodoCardIcon';
import clearTodoCardIcon from '@/lib/todo/clearTodoCardIcon';
import TodoCardIconThumb from '@/components/todo/TodoCardIconThumb';

export interface TodoListCardDialogIconProps {
  readonly podId: string;
  readonly cardId: string;
  readonly iconPath: string | undefined;
  readonly iconUrl: string | undefined;
  readonly onChanged: () => void;
  readonly onError: (message: string) => void;
}

export default function TodoListCardDialogIcon({
  podId,
  cardId,
  iconPath,
  iconUrl,
  onChanged,
  onError,
}: TodoListCardDialogIconProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const applyFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) {
      return;
    }
    setBusy(true);
    try {
      await replaceTodoCardIcon(podId, cardId, file, iconPath);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const clearIcon = async (): Promise<void> => {
    setBusy(true);
    try {
      await clearTodoCardIcon(cardId, iconPath);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field.Root w="full">
      <Field.Label>Icon</Field.Label>
      <HStack align="start" gap={3} w="full">
        <TodoCardIconThumb src={iconUrl} size="56px" />
        <Stack gap={2} flex="1" minW={0}>
          <Box
            tabIndex={0}
            borderWidth="1px"
            borderStyle="dashed"
            borderColor={dragging ? 'colorPalette.solid' : 'border.emphasized'}
            colorPalette="brand"
            borderRadius="md"
            p={3}
            bg={dragging ? 'colorPalette.subtle' : 'bg.subtle'}
            cursor="pointer"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragging(false);
              void applyFile(pickImageFileFromDataTransfer(e.dataTransfer));
            }}
            onPaste={(e) => {
              const file = pickImageFileFromDataTransfer(e.clipboardData);
              if (file === undefined) {
                return;
              }
              e.preventDefault();
              e.stopPropagation();
              void applyFile(file);
            }}
          >
            <Text fontSize="sm">
              {busy ? 'Uploading…' : 'Drop an image, paste a screenshot, or click to choose'}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              JPEG or PNG, up to 5MB
            </Text>
          </Box>
          {iconPath !== undefined ? (
            <Button size="xs" variant="outline" disabled={busy} onClick={() => void clearIcon()}>
              Remove icon
            </Button>
          ) : null}
        </Stack>
      </HStack>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          void applyFile(file);
        }}
      />
    </Field.Root>
  );
}

'use client';

import {type RefObject, useRef} from 'react';
import {Textarea} from '@chakra-ui/react';
import insertAtCaret from '@/components/todo/insertAtCaret';

export interface BookMarkdownPasteTextareaProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly disabled?: boolean;
  readonly rows?: number;
  readonly onPasteImage?: (file: Blob, caret: {readonly start: number; readonly end: number}) => Promise<string | undefined>;
  readonly textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

export default function BookMarkdownPasteTextarea({
  value,
  onChange,
  disabled = false,
  rows = 12,
  onPasteImage,
  textareaRef,
}: BookMarkdownPasteTextareaProps) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <Textarea
      ref={(node) => {
        localRef.current = node;
        if (textareaRef !== undefined) {
          textareaRef.current = node;
        }
      }}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      w="full"
      disabled={disabled}
      onPaste={(event) => {
        if (onPasteImage === undefined || disabled) {
          return;
        }
        const file = [...event.clipboardData.items]
          .map((item) => item.getAsFile())
          .find((picked) => picked?.type.startsWith('image/') ?? false);
        if (file === undefined || file === null) {
          return;
        }
        event.preventDefault();
        const ta = event.target as HTMLTextAreaElement;
        void onPasteImage(file, {start: ta.selectionStart, end: ta.selectionEnd}).then((fragment) => {
          if (fragment === undefined) {
            return;
          }
          const {next} = insertAtCaret(value, ta, fragment);
          onChange(next);
        });
      }}
    />
  );
}

'use client';

import {useState, type RefObject} from 'react';
import {Box, Grid, Stack, Switch, Text} from '@chakra-ui/react';
import BookMarkdownBody from '@/components/book/BookMarkdownBody';
import BookMarkdownPasteTextarea from '@/components/book/BookMarkdownPasteTextarea';

export interface BookMarkdownEditorWithPreviewProps {
  readonly label?: string;
  readonly hint?: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly disabled?: boolean;
  readonly rows?: number;
  readonly onPasteImage?: (file: Blob, caret: {readonly start: number; readonly end: number}) => Promise<string | undefined>;
  readonly textareaRef?: RefObject<HTMLTextAreaElement | null>;
  readonly defaultShowPreview?: boolean;
}

export default function BookMarkdownEditorWithPreview({
  label,
  hint,
  value,
  onChange,
  disabled = false,
  rows = 12,
  onPasteImage,
  textareaRef,
  defaultShowPreview = false,
}: BookMarkdownEditorWithPreviewProps) {
  const [showPreview, setShowPreview] = useState(defaultShowPreview);

  return (
    <Stack gap={2} w="full">
      {label !== undefined ? (
        <Text fontSize="sm" fontWeight="medium">
          {label}
        </Text>
      ) : null}
      {hint !== undefined ? (
        <Text fontSize="xs" color="fg.muted">
          {hint}
        </Text>
      ) : null}
      <Switch.Root checked={showPreview} onCheckedChange={(details) => setShowPreview(details.checked === true)}>
        <Switch.HiddenInput />
        <Switch.Control />
        <Switch.Label>Show preview</Switch.Label>
      </Switch.Root>
      <Grid
        templateColumns={{base: '1fr', md: showPreview ? '1fr 1fr' : '1fr'}}
        gap={3}
        w="full"
        alignItems="start"
      >
        <BookMarkdownPasteTextarea
          textareaRef={textareaRef}
          value={value}
          onChange={onChange}
          disabled={disabled}
          rows={rows}
          onPasteImage={onPasteImage}
        />
        {showPreview ? (
          <Box w="full" borderWidth="1px" borderRadius="md" p={3} minH="120px">
            <BookMarkdownBody markdown={value} />
          </Box>
        ) : null}
      </Grid>
    </Stack>
  );
}

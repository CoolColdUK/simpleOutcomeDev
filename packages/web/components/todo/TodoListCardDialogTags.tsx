'use client';

import {TagsInput} from '@chakra-ui/react';

export interface TodoListCardDialogTagsProps {
  readonly tags: readonly string[];
  readonly onChange: (tags: readonly string[]) => void;
}

export default function TodoListCardDialogTags({tags, onChange}: TodoListCardDialogTagsProps) {
  return (
    <TagsInput.Root
      value={[...tags]}
      max={20}
      blurBehavior="add"
      maxLength={32}
      validate={(details) => details.inputValue.trim() !== ''}
      onValueChange={(details) => onChange(details.value)}
    >
      <TagsInput.Label>Tags</TagsInput.Label>
      <TagsInput.Control>
        <TagsInput.Items />
        <TagsInput.Input placeholder="Add tag" />
      </TagsInput.Control>
    </TagsInput.Root>
  );
}

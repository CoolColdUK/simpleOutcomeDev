'use client';

import {ChakraProvider, createSystem, defaultConfig, TagsInput} from '@chakra-ui/react';

const choiceSystem = createSystem(defaultConfig);

export interface DesignChoiceTagsProps {
  readonly values: readonly string[];
  readonly onChange: (values: readonly string[]) => void;
}

export default function DesignChoiceTags({values, onChange}: DesignChoiceTagsProps) {
  return (
    <div className="design-choice-tags">
      <ChakraProvider value={choiceSystem}>
        <TagsInput.Root
          value={[...values]}
          max={24}
          blurBehavior="add"
          maxLength={40}
          validate={(details) => details.inputValue.trim() !== ''}
          onValueChange={(details) => onChange(uniqueChoices(details.value))}
        >
          <TagsInput.Label>Choices</TagsInput.Label>
          <TagsInput.Control>
            <TagsInput.Items />
            <TagsInput.Input placeholder="Add a choice" />
          </TagsInput.Control>
        </TagsInput.Root>
      </ChakraProvider>
    </div>
  );
}

function uniqueChoices(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter((value, index, all) => value.length > 0 && all.indexOf(value) === index);
}

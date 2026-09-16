'use client';

import {Box, Text, Tooltip} from '@chakra-ui/react';

export interface FpParserDialogMappingColumnProps {
  readonly column: string;
  readonly example: string | undefined;
  readonly linkedLabels: readonly string[];
}

export default function FpParserDialogMappingColumn({
  column,
  example,
  linkedLabels,
}: FpParserDialogMappingColumnProps) {
  const tooltip =
    example === undefined ? 'No non-empty value in this file' : `Example: ${example}`;
  const linked =
    linkedLabels.length === 0 ? 'Not mapped' : `Mapped to ${linkedLabels.join(', ')}`;
  return (
    <Tooltip.Root openDelay={200}>
      <Tooltip.Trigger asChild>
        <Box
          borderWidth="1px"
          borderRadius="md"
          p={3}
          bg={linkedLabels.length === 0 ? 'bg.subtle' : 'colorPalette.subtle'}
          colorPalette="brand"
          minW={0}
        >
          <Text fontSize="sm" fontWeight="medium" truncate>
            {column}
          </Text>
          <Text fontSize="xs" color="fg.muted" truncate>
            {example === undefined ? 'No example' : example}
          </Text>
          <Text fontSize="xs" color="fg.muted" truncate>
            {linked}
          </Text>
        </Box>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content maxW="xs">{tooltip}</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}

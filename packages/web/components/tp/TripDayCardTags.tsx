'use client';

import {Badge, HStack} from '@chakra-ui/react';

export interface TripDayCardTagsProps {
  readonly tags: readonly string[];
  readonly max?: number;
}

export default function TripDayCardTags({tags, max}: TripDayCardTagsProps) {
  if (tags.length === 0) {
    return null;
  }
  const cap = max ?? tags.length;
  const shown = tags.slice(0, cap);
  const overflow = tags.length - shown.length;
  return (
    <HStack gap={1} wrap="wrap" minW={0} maxW="100%" aria-label="Tags">
      {shown.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          size="sm"
          maxW="100%"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          display="inline-block"
        >
          {tag}
        </Badge>
      ))}
      {overflow > 0 ? (
        <Badge variant="outline" size="sm" aria-label={`${overflow} more tags`}>+{overflow}</Badge>
      ) : null}
    </HStack>
  );
}

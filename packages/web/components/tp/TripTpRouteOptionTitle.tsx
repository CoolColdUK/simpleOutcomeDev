'use client';

import {Badge, HStack, Text} from '@chakra-ui/react';

export interface TripTpRouteOptionTitleProps {
  readonly summary: string;
  readonly selected: boolean;
}

export default function TripTpRouteOptionTitle({summary, selected}: TripTpRouteOptionTitleProps) {
  return (
    <HStack gap={2} flex="1" minW={0} align="flex-start">
      {selected ? (
        <Badge colorPalette="brand" flexShrink={0}>Selected</Badge>
      ) : null}
      <Text flex="1" minW={0} textAlign="left" lineClamp={3} overflow="hidden" textOverflow="ellipsis">
        {summary}
      </Text>
    </HStack>
  );
}

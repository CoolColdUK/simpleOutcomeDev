'use client';

import {useState, type ReactNode} from 'react';
import {Box, Button, Stack, Text} from '@chakra-ui/react';

export interface TripTpCollapsibleProps {
  readonly title: ReactNode;
  readonly children: React.ReactNode;
  readonly defaultOpen?: boolean;
}

export default function TripTpCollapsible({title, children, defaultOpen = false}: TripTpCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden">
      <Button
        variant="ghost"
        width="full"
        minW={0}
        height="auto"
        py={2}
        justifyContent="space-between"
        alignItems="flex-start"
        fontWeight="medium"
        borderRadius="md"
        onClick={() => setOpen((v) => !v)}
      >
        <Text flex="1" minW={0} textAlign="left" lineClamp={3} overflow="hidden" textOverflow="ellipsis">
          {title}
        </Text>
        <Text as="span" color="fg.muted" fontSize="sm" flexShrink={0}>{open ? '−' : '+'}</Text>
      </Button>
      {open ? (
        <Stack gap={2} p={3} pt={0} borderTopWidth="1px">
          {children}
        </Stack>
      ) : null}
    </Box>
  );
}

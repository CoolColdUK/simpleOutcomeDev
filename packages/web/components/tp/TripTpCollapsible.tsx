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
        justifyContent="space-between"
        fontWeight="medium"
        borderRadius="md"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <Text as="span" color="fg.muted" fontSize="sm">{open ? '−' : '+'}</Text>
      </Button>
      {open ? (
        <Stack gap={2} p={3} pt={0} borderTopWidth="1px">
          {children}
        </Stack>
      ) : null}
    </Box>
  );
}

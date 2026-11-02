'use client';

import {useState, type ReactNode} from 'react';
import {Box, Button, HStack, Stack, Text} from '@chakra-ui/react';

export interface TripTpExpandableCardProps {
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly defaultExpanded?: boolean;
  readonly headerActions?: ReactNode;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

export default function TripTpExpandableCard({
  title,
  subtitle,
  defaultExpanded = false,
  headerActions,
  footer,
  children,
}: TripTpExpandableCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden" minW={0}>
      <HStack align="flex-start" gap={2} p={3} pb={expanded ? 2 : 3} wrap="wrap">
        <Stack flex="1" minW={0} gap={0}>
          <Text fontWeight="semibold" lineClamp={2}>
            {title}
          </Text>
          {subtitle !== undefined ? (
            <Text fontSize="sm" color="fg.muted">
              {subtitle}
            </Text>
          ) : null}
        </Stack>
        {headerActions !== undefined ? <HStack flexShrink={0}>{headerActions}</HStack> : null}
        <Button
          size="xs"
          variant="ghost"
          flexShrink={0}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '−' : '+'}
        </Button>
      </HStack>
      {expanded ? (
        <Stack gap={2} px={3} pb={3} pt={0} borderTopWidth="1px">
          {children}
          {footer}
        </Stack>
      ) : null}
    </Box>
  );
}

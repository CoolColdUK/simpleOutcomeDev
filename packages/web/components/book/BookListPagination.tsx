'use client';

import {useRef} from 'react';
import {Button, HStack, Input, Text} from '@chakra-ui/react';

export interface BookListPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly onPageChange: (page: number) => void;
}

export default function BookListPagination({page, totalPages, totalItems, onPageChange}: BookListPaginationProps) {
  const jumpRef = useRef<HTMLInputElement | null>(null);

  return (
    <HStack wrap="wrap" gap={2} align="center">
      <Text fontSize="sm" color="fg.muted">
        {totalItems} item{totalItems === 1 ? '' : 's'} · page {page} of {totalPages}
      </Text>
      <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <Button size="xs" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
      <HStack gap={1}>
        <Text fontSize="sm">
          Go to
        </Text>
        <Input
          key={page}
          ref={jumpRef}
          size="xs"
          width="4rem"
          type="number"
          min={1}
          max={totalPages}
          defaultValue={String(page)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const parsed = Number.parseInt(event.currentTarget.value, 10);
              if (!Number.isNaN(parsed)) {
                onPageChange(Math.min(totalPages, Math.max(1, parsed)));
              }
            }
          }}
          onBlur={(event) => {
            const parsed = Number.parseInt(event.currentTarget.value, 10);
            if (!Number.isNaN(parsed)) {
              onPageChange(Math.min(totalPages, Math.max(1, parsed)));
            }
          }}
        />
      </HStack>
    </HStack>
  );
}

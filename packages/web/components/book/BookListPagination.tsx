'use client';

import {useEffect, useState} from 'react';
import {Button, HStack, Input, Text} from '@chakra-ui/react';

export interface BookListPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly onPageChange: (page: number) => void;
}

export default function BookListPagination({page, totalPages, totalItems, onPageChange}: BookListPaginationProps) {
  const [jumpValue, setJumpValue] = useState(String(page));

  useEffect(() => {
    setJumpValue(String(page));
  }, [page]);

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
          size="xs"
          width="4rem"
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(event) => setJumpValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const parsed = Number.parseInt(jumpValue, 10);
              if (!Number.isNaN(parsed)) {
                onPageChange(Math.min(totalPages, Math.max(1, parsed)));
              }
            }
          }}
          onBlur={() => {
            const parsed = Number.parseInt(jumpValue, 10);
            if (!Number.isNaN(parsed)) {
              const next = Math.min(totalPages, Math.max(1, parsed));
              onPageChange(next);
              setJumpValue(String(next));
            } else {
              setJumpValue(String(page));
            }
          }}
        />
      </HStack>
    </HStack>
  );
}

'use client';

import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  HStack,
  Stack,
} from '@chakra-ui/react';
import type {ReactNode} from 'react';

export interface BookEntityViewDialogProps {
  readonly open: boolean;
  readonly title: ReactNode;
  readonly headerActions?: ReactNode;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

export default function BookEntityViewDialog({open, title, headerActions, onClose, children}: BookEntityViewDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={(details) => !details.open && onClose()} size="xl">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="6xl">
          <DialogHeader>
            <HStack justify="space-between" align="start" w="full" gap={3}>
              <DialogTitle flex="1" minW={0}>
                {title}
              </DialogTitle>
              <HStack gap={1} flexShrink={0}>
                {headerActions}
                <DialogCloseTrigger onClick={onClose} />
              </HStack>
            </HStack>
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>{children}</Stack>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}

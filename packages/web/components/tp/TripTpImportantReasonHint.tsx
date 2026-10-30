'use client';

import {useState} from 'react';
import {IconButton, Popover, Portal, Tooltip} from '@chakra-ui/react';
import {WarningIcon} from '@so/component';

export interface TripTpImportantReasonHintProps {
  readonly reason?: string;
}

function visibleReason(reason: string | undefined): string | undefined {
  const trimmed = reason?.trim() ?? '';
  return trimmed === '' ? undefined : trimmed;
}

export default function TripTpImportantReasonHint({reason}: TripTpImportantReasonHintProps) {
  const text = visibleReason(reason);
  const label = text ?? 'Important transport';
  const [open, setOpen] = useState(false);
  const button = (
    <IconButton
      aria-label={label}
      size="xs"
      variant="ghost"
      colorPalette="orange"
      flexShrink={0}
    >
      <WarningIcon size={14} />
    </IconButton>
  );
  if (text === undefined) {
    return (
      <Tooltip.Root openDelay={200}>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>{label}</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    );
  }
  return (
    <Popover.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
      <Tooltip.Root openDelay={200} disabled={open}>
        <Popover.Trigger asChild>
          <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        </Popover.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>{label}</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Body whiteSpace="pre-line">{text}</Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

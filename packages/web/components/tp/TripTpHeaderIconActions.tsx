'use client';

import {HStack, IconButton} from '@chakra-ui/react';
import {DeleteIcon, EditIcon} from '@so/component';
import AppIconTooltip from '@/components/app/AppIconTooltip';

export interface TripTpHeaderIconActionsProps {
  readonly editLabel: string;
  readonly onEdit: () => void;
  readonly deleteLabel?: string;
  readonly onDelete?: () => void;
  readonly disabled?: boolean;
}

export default function TripTpHeaderIconActions({
  editLabel,
  onEdit,
  deleteLabel,
  onDelete,
  disabled = false,
}: TripTpHeaderIconActionsProps) {
  return (
    <HStack gap={1}>
      {onDelete !== undefined && deleteLabel !== undefined ? (
        <AppIconTooltip label={deleteLabel}>
          <IconButton
            aria-label={deleteLabel}
            size="xs"
            variant="ghost"
            colorPalette="red"
            disabled={disabled}
            onClick={onDelete}
          >
            <DeleteIcon size={14} />
          </IconButton>
        </AppIconTooltip>
      ) : null}
      <AppIconTooltip label={editLabel}>
        <IconButton aria-label={editLabel} size="xs" variant="outline" disabled={disabled} onClick={onEdit}>
          <EditIcon size={14} />
        </IconButton>
      </AppIconTooltip>
    </HStack>
  );
}

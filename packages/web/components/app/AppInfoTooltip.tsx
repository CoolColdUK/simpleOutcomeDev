'use client';

import {IconButton, Tooltip} from '@chakra-ui/react';
import {InfoIcon} from '@so/component';

export interface AppInfoTooltipProps {
  readonly label: string;
}

export default function AppInfoTooltip({label}: AppInfoTooltipProps) {
  return (
    <Tooltip.Root openDelay={200}>
      <Tooltip.Trigger asChild>
        <IconButton aria-label="More information" size="xs" variant="ghost">
          <InfoIcon />
        </IconButton>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content maxW="xs">{label}</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}

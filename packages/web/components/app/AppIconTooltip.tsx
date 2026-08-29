'use client';

import type {ReactNode} from 'react';
import {Tooltip} from '@chakra-ui/react';

export interface AppIconTooltipProps {
  readonly label: string;
  readonly children: ReactNode;
}

export default function AppIconTooltip({label, children}: AppIconTooltipProps) {
  return (
    <Tooltip.Root openDelay={200}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>{label}</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}

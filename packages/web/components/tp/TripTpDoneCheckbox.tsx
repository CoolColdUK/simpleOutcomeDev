'use client';

import {Checkbox} from '@chakra-ui/react';
import AppIconTooltip from '@/components/app/AppIconTooltip';

export interface TripTpDoneCheckboxProps {
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly busy?: boolean;
  readonly ariaLabel: string;
  readonly tooltip?: string;
  readonly onCheckedChange: (checked: boolean) => void;
}

export default function TripTpDoneCheckbox({
  checked,
  disabled = false,
  busy = false,
  ariaLabel,
  tooltip,
  onCheckedChange,
}: TripTpDoneCheckboxProps) {
  const control = (
    <Checkbox.Root
      checked={checked}
      disabled={disabled || busy}
      aria-label={ariaLabel}
      aria-busy={busy}
      onCheckedChange={(e) => onCheckedChange(e.checked === true)}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
    </Checkbox.Root>
  );
  if (tooltip !== undefined && tooltip !== '') {
    return <AppIconTooltip label={tooltip}>{control}</AppIconTooltip>;
  }
  return control;
}

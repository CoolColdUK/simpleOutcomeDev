'use client';

import {Field, HStack, Input} from '@chakra-ui/react';
import TripTpCurrencySelect from '@/components/tp/TripTpCurrencySelect';

export interface TripTpMoneyFieldProps {
  readonly amountLabel: string;
  readonly amount: string;
  readonly currency: string;
  readonly disabled?: boolean;
  readonly onChange: (next: {amount: string; currency: string}) => void;
}

export default function TripTpMoneyField({
  amountLabel,
  amount,
  currency,
  disabled,
  onChange,
}: TripTpMoneyFieldProps) {
  return (
    <HStack wrap="wrap" align="flex-start" minW={0} maxW="100%" gap={3}>
      <Field.Root flex="1" minW="6rem">
        <Field.Label>{amountLabel}</Field.Label>
        <Input
          type="number"
          inputMode="decimal"
          value={amount}
          disabled={disabled}
          onChange={(e) => onChange({amount: e.target.value, currency})}
        />
      </Field.Root>
      <TripTpCurrencySelect
        value={currency}
        disabled={disabled}
        onChange={(code) => onChange({amount, currency: code})}
      />
    </HStack>
  );
}

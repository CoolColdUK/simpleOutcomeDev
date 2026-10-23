'use client';

import {Field, HStack, Input, Stack, Text} from '@chakra-ui/react';

export interface TripTpTimestampFieldProps {
  readonly label: string;
  readonly date: string;
  readonly time: string;
  readonly timezone: string;
  readonly disabled?: boolean;
  readonly onChange: (next: {date: string; time: string; timezone: string}) => void;
}

export default function TripTpTimestampField({
  label,
  date,
  time,
  timezone,
  disabled,
  onChange,
}: TripTpTimestampFieldProps) {
  return (
    <Stack gap={1} minW={0} maxW="100%">
      <Text fontSize="sm" fontWeight="medium">{label}</Text>
      <HStack wrap="wrap" minW={0} maxW="100%">
        <Field.Root minW={0} flex="1">
          <Field.Label>Date</Field.Label>
          <Input
            type="date"
            value={date}
            disabled={disabled}
            onChange={(e) => onChange({date: e.target.value, time, timezone})}
          />
        </Field.Root>
        <Field.Root minW={0} flex="1">
          <Field.Label>Time</Field.Label>
          <Input
            type="time"
            value={time}
            disabled={disabled}
            onChange={(e) => onChange({date, time: e.target.value, timezone})}
          />
        </Field.Root>
        <Field.Root minW={0} flex="1">
          <Field.Label>Timezone</Field.Label>
          <Input
            placeholder="IANA tz"
            value={timezone}
            disabled={disabled}
            onChange={(e) => onChange({date, time, timezone: e.target.value})}
          />
        </Field.Root>
      </HStack>
    </Stack>
  );
}

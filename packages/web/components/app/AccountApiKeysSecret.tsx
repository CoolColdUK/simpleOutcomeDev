'use client';

import {HStack, IconButton, Input} from '@chakra-ui/react';
import {EyeIcon, EyeOffIcon} from '@so/component';

export interface AccountApiKeysSecretProps {
  readonly value: string;
  readonly revealed: boolean;
  readonly onToggle: () => void;
}

export function maskApiKeySecret(value: string): string {
  if (value.length <= 11) {
    return '•'.repeat(value.length);
  }
  return `${value.slice(0, 7)}${'•'.repeat(8)}${value.slice(-4)}`;
}

export default function AccountApiKeysSecret({value, revealed, onToggle}: AccountApiKeysSecretProps) {
  return (
    <HStack gap={1} maxW="lg">
      <Input readOnly value={revealed ? value : maskApiKeySecret(value)} fontFamily="mono" size="sm" />
      <IconButton aria-label={revealed ? 'Hide API key' : 'Show API key'} size="sm" variant="ghost" onClick={onToggle}>
        {revealed ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </IconButton>
    </HStack>
  );
}

'use client';

import {Image} from '@chakra-ui/react';

export interface TodoCardIconThumbProps {
  readonly src: string | undefined;
  readonly size?: string;
}

export default function TodoCardIconThumb({src, size = '40px'}: TodoCardIconThumbProps) {
  if (src === undefined) {
    return null;
  }
  return (
    <Image
      src={src}
      alt=""
      boxSize={size}
      minW={size}
      borderRadius="sm"
      objectFit="cover"
      flexShrink={0}
    />
  );
}

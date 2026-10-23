'use client';

import {Text, type TextProps} from '@chakra-ui/react';

export interface TripTpTruncateTextProps extends TextProps {
  readonly lineClamp?: number;
}

export default function TripTpTruncateText({lineClamp = 2, children, ...rest}: TripTpTruncateTextProps) {
  return (
    <Text
      minW={0}
      maxW="100%"
      overflow="hidden"
      textOverflow="ellipsis"
      wordBreak="break-all"
      lineClamp={lineClamp}
      {...rest}
    >
      {children}
    </Text>
  );
}

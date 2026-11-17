import {Box, type BoxProps} from '@chakra-ui/react';
import type {ReactNode} from 'react';

export default function SiteSectionFrame({id, children, ...props}: {id?: string; children: ReactNode} & BoxProps) {
  return (
    <Box as="section" id={id} px={{base: 5, lg: 16}} py={{base: 9, lg: 14}} {...props}>
      {children}
    </Box>
  );
}

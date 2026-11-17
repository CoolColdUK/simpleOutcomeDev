'use client';

import {Heading} from '@chakra-ui/react';
import type {ReactNode} from 'react';
import {useSiteLook} from '@/components/SiteThemeProvider';

export default function SiteHeading({as, children}: {as: 'h1' | 'h2' | 'h3'; children: ReactNode}) {
  const {uppercase} = useSiteLook();
  const size = as === 'h1' ? {base: '1.9rem', md: '4.6rem'} : as === 'h3' ? 'lg' : {base: '1.4rem', md: '2rem'};
  return (
    <Heading as={as} fontFamily="siteHeading" fontWeight="700" lineHeight="1.15" mb="2" fontSize={size} textTransform={uppercase ? 'uppercase' : 'none'}>
      {children}
    </Heading>
  );
}

import type {ReactNode} from 'react';
import {Box, Flex} from '@chakra-ui/react';
import Footer from '@/components/marketing/Footer';
import MarketingNav from '@/components/marketing/MarketingNav';

export default function MarketingLayout({children}: {children: ReactNode}) {
  return (
    <Flex direction="column" minH="100vh" bg="bg.canvas">
      <MarketingNav />
      <Box as="main" flex="1">
        {children}
      </Box>
      <Footer />
    </Flex>
  );
}

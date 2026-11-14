'use client';

import Link from 'next/link';
import {Box, Button, Flex, HStack} from '@chakra-ui/react';
import BrandMark from '@/components/brand/BrandMark';

export default function MarketingNav() {
  return (
    <Box as="nav" borderBottomWidth="1px" borderColor="border.subtle" bg="bg.paper" px={{base: 4, md: 8}} py={3}>
      <Flex justify="space-between" align="center" maxW="sizes.page" mx="auto">
        <Flex
          asChild
          align="center"
          gap={2}
          fontWeight="900"
          letterSpacing="0.08em"
          color="fg.default"
          fontSize="sm"
        >
          <Link href="/">
            <BrandMark />
            SIMPLE OUTCOME
          </Link>
        </Flex>
        <HStack gap={2}>
          <Button asChild variant="ghost" size="sm" colorPalette="brand">
            <Link href="/app">Sign in</Link>
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}

'use client';

import Link from 'next/link';
import {Box, Button, Flex, HStack, Text} from '@chakra-ui/react';

export default function MarketingNav() {
  return (
    <Box as="nav" borderBottomWidth="1px" borderColor="border.subtle" bg="bg.paper" px={{base: 4, md: 8}} py={3}>
      <Flex justify="space-between" align="center" maxW="sizes.page" mx="auto">
        <Text asChild fontWeight="900" letterSpacing="0.08em" color="fg.default" fontSize="sm">
          <Link href="/">SIMPLE OUTCOME</Link>
        </Text>
        <HStack gap={2}>
          <Button asChild variant="ghost" size="sm" colorPalette="brand">
            <Link href="/app">Sign in</Link>
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}

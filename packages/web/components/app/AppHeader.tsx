'use client';

import Link from 'next/link';
import {Button, Flex, Text} from '@chakra-ui/react';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export default function AppHeader() {
  const signOut = async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  };

  return (
    <Flex as="header" justify="space-between" align="center" px={{base: 4, md: 8}} py={4} borderBottomWidth="1px" borderColor="brand.200">
      <Text asChild fontWeight="800">
        <Link href="/app">SimpleOutcome</Link>
      </Text>
      <Button variant="outline" colorPalette="brand" size="sm" onClick={() => void signOut()}>
        Sign out
      </Button>
    </Flex>
  );
}

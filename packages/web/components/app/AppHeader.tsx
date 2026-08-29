'use client';

import Link from 'next/link';
import {Button, Flex, HStack, Text, useSlotRecipe} from '@chakra-ui/react';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export default function AppHeader() {
  const recipe = useSlotRecipe({key: 'appHeader'});
  const styles = recipe();

  const signOut = async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  };

  return (
    <Flex as="header" css={styles.root}>
      <HStack gap={4}>
        <Text asChild css={styles.brand}>
          <Link href="/app">SimpleOutcome</Link>
        </Text>
        <Button asChild variant="ghost" colorPalette="brand" size="sm">
          <Link href="/app">Spaces</Link>
        </Button>
      </HStack>
      <Button variant="outline" colorPalette="brand" size="sm" onClick={() => void signOut()}>
        Sign out
      </Button>
    </Flex>
  );
}

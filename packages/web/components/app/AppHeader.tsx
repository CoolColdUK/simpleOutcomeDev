'use client';

import Link from 'next/link';
import {Button, Flex, Text, useSlotRecipe} from '@chakra-ui/react';
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
      <Text asChild css={styles.brand}>
        <Link href="/app">SimpleOutcome</Link>
      </Text>
      <Button variant="outline" colorPalette="brand" size="sm" onClick={() => void signOut()}>
        Sign out
      </Button>
    </Flex>
  );
}

'use client';

import Link from 'next/link';
import {Box, Flex, HStack, IconButton, Text, useSlotRecipe} from '@chakra-ui/react';
import {SettingsIcon, SignOutIcon} from '@so/component';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import AppIconTooltip from '@/components/app/AppIconTooltip';

export default function AppHeader() {
  const recipe = useSlotRecipe({key: 'appHeader'});
  const styles = recipe();

  const signOut = async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  };

  return (
    <Box as="header" css={styles.root}>
      <Flex css={styles.inner}>
        <Text asChild css={styles.brand}>
          <Link href="/app">SimpleOutcome</Link>
        </Text>
        <HStack gap={2}>
          <AppIconTooltip label="Settings">
            <IconButton asChild variant="outline" colorPalette="brand" size="sm" aria-label="Settings">
              <Link href="/app/settings">
                <SettingsIcon size={16} />
              </Link>
            </IconButton>
          </AppIconTooltip>
          <AppIconTooltip label="Sign out">
            <IconButton
              variant="outline"
              colorPalette="brand"
              size="sm"
              aria-label="Sign out"
              onClick={() => void signOut()}
            >
              <SignOutIcon size={16} />
            </IconButton>
          </AppIconTooltip>
        </HStack>
      </Flex>
    </Box>
  );
}

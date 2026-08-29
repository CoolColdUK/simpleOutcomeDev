'use client';

import type {ReactNode} from 'react';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import AppPageLoadingState from './AppPageLoadingState';
import AppLoginForm from './AppLoginForm';
import AppHeader from './AppHeader';
import RegisterAppServiceWorker from './RegisterAppServiceWorker';
import UsernameGate from './UsernameGate';
import AppBreadcrumbs from './AppBreadcrumbs';
import {Box, Container, Stack, useSlotRecipe} from '@chakra-ui/react';

export interface PrivateRouteGuardProps {
  readonly children: ReactNode;
}

export default function PrivateRouteGuard({children}: PrivateRouteGuardProps) {
  const {authReady, user} = useSupabaseAuthState();
  const recipe = useSlotRecipe({key: 'appShell'});
  const styles = recipe();

  if (!authReady) {
    return <AppPageLoadingState />;
  }

  if (!user) {
    return <AppLoginForm />;
  }

  return (
    <Box css={styles.root}>
      <RegisterAppServiceWorker />
      <AppHeader />
      <UsernameGate userId={user.id}>
        <Container css={styles.main}>
          <Stack gap={6}>
            <AppBreadcrumbs />
            {children}
          </Stack>
        </Container>
      </UsernameGate>
    </Box>
  );
}

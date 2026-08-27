'use client';

import type {ReactNode} from 'react';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import AppPageLoadingState from './AppPageLoadingState';
import AppPageSignInRequiredState from './AppPageSignInRequiredState';

export interface PrivateRouteGuardProps {
  readonly children: ReactNode;
}

export default function PrivateRouteGuard({children}: PrivateRouteGuardProps) {
  const {authReady, user} = useSupabaseAuthState();

  if (!authReady) {
    return <AppPageLoadingState />;
  }

  if (!user) {
    return <AppPageSignInRequiredState title="Sign in required" description="Sign in to access this app page." />;
  }

  return children;
}

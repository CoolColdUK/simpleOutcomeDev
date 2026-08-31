'use client';

import {useEffect, useState} from 'react';
import {Alert, Heading, Stack} from '@chakra-ui/react';
import useSupabaseAuthState from '@/lib/supabase/useSupabaseAuthState';
import getDbProfile from '@/lib/api/db/getDbProfile';
import AppPageLoadingState from '@/components/app/AppPageLoadingState';
import AccountSettingsProfileCard from '@/components/app/AccountSettingsProfileCard';
import AccountSettingsPasswordCard from '@/components/app/AccountSettingsPasswordCard';

export default function AccountSettingsPage() {
  const {user} = useSupabaseAuthState();
  const [username, setUsername] = useState('');
  const [usernameChangedAt, setUsernameChangedAt] = useState<string | undefined>(undefined);
  const [displayName, setDisplayName] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user === undefined) {
      return;
    }
    let cancelled = false;
    void getDbProfile(user.id)
      .then((profile) => {
        if (cancelled) {
          return;
        }
        if (profile === undefined) {
          setError('Profile not found');
          setReady(true);
          return;
        }
        setUsername(profile.username ?? '');
        setUsernameChangedAt(profile.usernameChangedAt);
        setDisplayName(profile.displayName ?? '');
        setReady(true);
      })
      .catch((e: unknown) => {
        if (cancelled) {
          return;
        }
        setError(e instanceof Error ? e.message : String(e));
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!ready) {
    return <AppPageLoadingState />;
  }

  return (
    <Stack gap={8}>
      <Heading as="h1" size="lg">
        Account
      </Heading>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      <AccountSettingsProfileCard
        username={username}
        usernameChangedAt={usernameChangedAt}
        displayName={displayName}
        onUsernameSaved={(next, changedAt) => {
          setUsername(next);
          setUsernameChangedAt(changedAt);
        }}
        onDisplayNameSaved={setDisplayName}
      />
      <AccountSettingsPasswordCard />
    </Stack>
  );
}

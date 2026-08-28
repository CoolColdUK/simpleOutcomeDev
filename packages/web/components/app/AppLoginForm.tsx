'use client';

import {useState} from 'react';
import Link from 'next/link';
import {Alert, Box, Button, Field, Heading, Input, Stack, Text, useSlotRecipe} from '@chakra-ui/react';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export default function AppLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const recipe = useSlotRecipe({key: 'authCard'});
  const styles = recipe();

  const submit = async (): Promise<void> => {
    setError('');
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const {error: signError} = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(signError.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box as="main" css={styles.root}>
      <Stack css={styles.inner} gap={6}>
        <Heading as="h1" size="lg" textAlign="center">
          Sign in
        </Heading>
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Password</Field.Label>
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field.Root>
        {error !== '' ? (
          <Alert.Root status="error">
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        ) : null}
        <Button loading={loading} loadingText="Signing in…" colorPalette="brand" onClick={() => void submit()}>
          Sign in
        </Button>
        <Text textAlign="center" fontSize="sm">
          <Link href="/">← Home</Link>
        </Text>
      </Stack>
    </Box>
  );
}

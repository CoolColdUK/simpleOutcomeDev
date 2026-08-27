'use client';

import {useState} from 'react';
import Link from 'next/link';
import {useRouter, useSearchParams} from 'next/navigation';
import {Alert, Box, Button, Center, Field, Heading, Input, Link as ChakraLink, Stack, Text} from '@chakra-ui/react';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import resolveSafeReturnUrl from '@/lib/auth/resolveSafeReturnUrl';

export default function LoginPageForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = resolveSafeReturnUrl(searchParams.get('returnUrl'));

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
        return;
      }
      router.push(returnUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box as="main" minH="100vh" bg="bg.canvas">
      <Center minH="100vh" p={{base: 4, md: 8}}>
        <Box w="full" maxW="md">
          <Heading as="h1" size="lg" mb={6} textAlign="center">
            Sign in
          </Heading>
          <Stack gap={6}>
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
            <Text fontSize="sm" color="fg.muted" textAlign="center">
              No account?{' '}
              <ChakraLink asChild>
                <Link href="/signup">Create one</Link>
              </ChakraLink>
            </Text>
            <Text textAlign="center">
              <Link href="/">← Home</Link>
            </Text>
          </Stack>
        </Box>
      </Center>
    </Box>
  );
}

'use client';

import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Alert, Box, Button, Center, Field, Heading, Input, Link as ChakraLink, Stack, Text} from '@chakra-ui/react';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import {SIGNUP_ENABLED} from '@/lib/auth/signupEnabled';

export default function SignupPageForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (): Promise<void> => {
    if (!SIGNUP_ENABLED) {
      setError('Signups are invite only.');
      return;
    }
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const {data, error: signError} = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      if (data.session) {
        router.push('/app');
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!SIGNUP_ENABLED) {
    return (
      <Box as="main" minH="100vh" bg="bg.canvas">
        <Center minH="100vh" p={{base: 4, md: 8}}>
          <Box w="full" maxW="md" textAlign="center">
            <Heading as="h1" size="lg" mb={4}>
              Invites only
            </Heading>
            <Text color="fg.muted" mb={6}>
              Public signup is disabled. If you need access, use the contact form on the home page.
            </Text>
            <Stack gap={3}>
              <Button asChild colorPalette="brand">
                <Link href="/login">Sign in</Link>
              </Button>
              <ChakraLink asChild>
                <Link href="/">← Home</Link>
              </ChakraLink>
            </Stack>
          </Box>
        </Center>
      </Box>
    );
  }

  return (
    <Box as="main" minH="100vh" bg="bg.canvas">
      <Center minH="100vh" p={{base: 4, md: 8}}>
        <Box w="full" maxW="md">
          <Heading as="h1" size="lg" mb={6} textAlign="center">
            Create an account
          </Heading>
          <Stack gap={6}>
            <Field.Root>
              <Field.Label>Email</Field.Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Password</Field.Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>Confirm password</Field.Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field.Root>
            {error !== '' ? (
              <Alert.Root status="error">
                <Alert.Title>{error}</Alert.Title>
              </Alert.Root>
            ) : null}
            <Button loading={loading} colorPalette="brand" onClick={() => void submit()}>
              Sign up
            </Button>
            <Text textAlign="center">
              <Link href="/login">← Sign in</Link>
            </Text>
          </Stack>
        </Box>
      </Center>
    </Box>
  );
}

import Link from 'next/link';
import {Box, Button, Center, Heading, HStack, Stack, Text} from '@chakra-ui/react';

export interface AppPageSignInRequiredStateProps {
  readonly title: string;
  readonly description: string;
}

export default function AppPageSignInRequiredState({title, description}: AppPageSignInRequiredStateProps) {
  return (
    <Box as="main" minH="100vh" display="flex" flexDirection="column">
      <Center flex="1" px={{base: 4, md: 6}} py={{base: 10, md: 16}}>
        <Stack gap={4} maxW="lg" w="full" align="center" textAlign="center">
          <Heading as="h1" size={{base: 'xl', md: '2xl'}}>
            {title}
          </Heading>
          <Text color="fg.muted">{description}</Text>
          <HStack gap={2} justify="center" flexWrap="wrap">
            <Button asChild colorPalette="brand">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to site</Link>
            </Button>
          </HStack>
        </Stack>
      </Center>
    </Box>
  );
}

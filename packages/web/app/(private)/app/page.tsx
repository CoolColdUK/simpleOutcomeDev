import {Box, Heading, Text} from '@chakra-ui/react';

export default function AppHomePage() {
  return (
    <Box as="main" px={{base: 4, md: 8}} py={10}>
      <Heading as="h1" size="lg" mb={3}>
        App
      </Heading>
      <Text color="fg.muted">Coming soon. Personal tools will live here.</Text>
    </Box>
  );
}

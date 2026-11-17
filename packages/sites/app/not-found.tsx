import {Box, Heading, Text} from '@chakra-ui/react';

export default function NotFound() {
  return (
    <Box as="main" px="5" py="8">
      <Heading as="h1" size="xl" mb="2">
        Site not found
      </Heading>
      <Text>This address is not a published site.</Text>
    </Box>
  );
}

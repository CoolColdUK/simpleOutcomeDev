'use client';

import {Box, Heading, Text} from '@chakra-ui/react';

export default function SiteError() {
  return (
    <Box as="main" px="5" py="8">
      <Heading as="h1" size="xl" mb="2">
        This page is unavailable
      </Heading>
      <Text>The site could not be shown.</Text>
    </Box>
  );
}

import {Box, Center, Container, Spinner} from '@chakra-ui/react';

export default function AppPageLoadingState() {
  return (
    <Box as="main">
      <Container py={{base: 10, md: 16}}>
        <Center minH="40vh">
          <Spinner size="lg" />
        </Center>
      </Container>
    </Box>
  );
}

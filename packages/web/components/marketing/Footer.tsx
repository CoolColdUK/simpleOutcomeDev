'use client';

import {Box, Button, Flex, Link as ChakraLink, SimpleGrid, Text} from '@chakra-ui/react';
import dayjs from 'dayjs';
import {useState} from 'react';
import ContactUsDialog from './ContactUsDialog';

export default function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <Box as="footer" bg="bg.paper" color="fg.default" py={12} mt="auto" borderTopWidth="1px" borderColor="border.subtle">
      <Box maxW="6xl" mx="auto" px={{base: 4, md: 8}}>
        <SimpleGrid columns={{base: 1, md: 3}} gap={8}>
          <Box>
            <Text fontSize="xl" fontWeight="700" mb={3}>
              SimpleOutcome
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Building innovative digital solutions that solve real-world problems. We focus on creating user-friendly
              applications that make a difference.
            </Text>
          </Box>
          <Box>
            <Text fontWeight="600" mb={3}>
              Products
            </Text>
            <Flex direction="column" gap={2}>
              <ChakraLink href="https://craftysmile.com" target="_blank" rel="noopener noreferrer" color="fg.muted">
                CraftySmile
              </ChakraLink>
              <Text color="fg.muted">GoalJar (Coming Soon)</Text>
            </Flex>
          </Box>
          <Box>
            <Text fontWeight="600" mb={3}>
              Contact
            </Text>
            <Text fontSize="sm" color="fg.muted" mb={3}>
              Get in touch with us for collaborations, questions, or feedback.
            </Text>
            <Button variant="outline" colorPalette="brand" onClick={() => setOpen(true)}>
              Contact
            </Button>
            <ContactUsDialog open={open} onClose={() => setOpen(false)} />
          </Box>
        </SimpleGrid>
        <Box borderTopWidth="1px" borderColor="border.subtle" mt={10} pt={6} textAlign="center">
          <Text fontSize="sm" color="fg.muted">
            © {dayjs().year()} SimpleOutcome. All rights reserved.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

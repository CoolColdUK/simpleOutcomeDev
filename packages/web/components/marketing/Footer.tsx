'use client';

import {Box, Button, Flex, SimpleGrid, Text} from '@chakra-ui/react';
import dayjs from 'dayjs';
import {useState} from 'react';
import BrandMark from '@/components/brand/BrandMark';
import ContactUsDialog from './ContactUsDialog';

export default function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <Box as="footer" bg="bg.paper" color="fg.default" py={12} mt="auto" borderTopWidth="1px" borderColor="border.subtle">
      <Box maxW="6xl" mx="auto" px={{base: 4, md: 8}}>
        <SimpleGrid columns={{base: 1, md: 2}} gap={8}>
          <Box>
            <Flex align="center" gap={2} mb={3}>
              <BrandMark size={32} />
              <Text fontSize="xl" fontWeight="700">
                SimpleOutcome
              </Text>
            </Flex>
            <Text fontSize="sm" color="fg.muted">
              We help companies design and build websites that are clear, fast, and ready for their customers.
            </Text>
          </Box>
          <Box>
            <Text fontWeight="600" mb={3}>
              Contact
            </Text>
            <Text fontSize="sm" color="fg.muted" mb={3}>
              Tell us about the website you want to build.
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

'use client';

import {Box, Button, Heading, Text} from '@chakra-ui/react';
import {useState} from 'react';
import ContactUsDialog from './ContactUsDialog';

export default function HeroSection() {
  const [open, setOpen] = useState(false);

  return (
    <Box position="relative" w="100%" minH={{base: '400px', md: '520px'}} overflow="hidden" mb={6}>
      <Box position="absolute" inset="0" zIndex={1}>
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
          alt="Latte minimalist background"
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </Box>
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(90deg, rgba(246,231,216,0.85) 0%, rgba(246,231,216,0.5) 100%)"
        zIndex={2}
      />
      <Box position="relative" zIndex={3} pl={{base: 6, md: 16}} pr={{base: 6, md: 0}} py={{base: 12, md: 20}} maxW="700px">
        <Box display="flex" alignItems="center" mb={6}>
          <Box
            w="40px"
            h="40px"
            borderRadius="full"
            bg="brand.500"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mr={3}
          >
            <Text color="brand.700" fontWeight="900" fontSize="22px">
              &#9881;
            </Text>
          </Box>
          <Text color="fg.default" fontWeight="900" letterSpacing="0.08em">
            SIMPLE OUTCOME
          </Text>
        </Box>
        <Heading as="h1" color="fg.default" fontWeight="800" fontSize={{base: '2.2rem', md: '3.2rem'}} lineHeight="1.1" mb={4}>
          LET&apos;S GET YOU <Box as="span" color="brand.500">GOING</Box>
        </Heading>
        <Button colorPalette="brand" size="lg" mt={4} borderRadius="full" onClick={() => setOpen(true)}>
          REQUEST A QUOTE
        </Button>
        <ContactUsDialog open={open} onClose={() => setOpen(false)} />
      </Box>
    </Box>
  );
}

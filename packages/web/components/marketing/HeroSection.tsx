'use client';

import Image from 'next/image';
import {Box, Button, Heading, Icon, Link, Text, Tooltip} from '@chakra-ui/react';
import {useState} from 'react';
import ContactUsDialog from './ContactUsDialog';

const HERO_IMAGE_SRC = '/images/bailey-zindel-NRQV-hBF10M-unsplash.jpg';
const HERO_IMAGE_ALT = 'Lake surrounded by trees. Photo by Bailey Zindel on Unsplash';
const HERO_PHOTOGRAPHER_HREF = 'https://unsplash.com/@baileyzindel?utm_source=simpleoutcome&utm_medium=referral';
const HERO_UNSPLASH_HREF = 'https://unsplash.com/?utm_source=simpleoutcome&utm_medium=referral';

export default function HeroSection() {
  const [open, setOpen] = useState(false);

  return (
    <Box position="relative" w="100%" minH={{base: '400px', md: '520px'}} overflow="hidden" mb={6}>
      <Box position="absolute" inset="0" zIndex={1}>
        <Image
          src={HERO_IMAGE_SRC}
          alt={HERO_IMAGE_ALT}
          fill
          priority
          sizes="100vw"
          style={{objectFit: 'cover'}}
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
      <Box position="absolute" bottom={3} right={4} zIndex={4}>
        <Tooltip.Root openDelay={200}>
          <Tooltip.Trigger asChild>
            <Box as="span" display="inline-flex" color="fg.muted" aria-label={HERO_IMAGE_ALT} cursor="help">
              <Icon viewBox="0 0 24 24" boxSize={5}>
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M12 11v5M12 8h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </Icon>
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content maxW="xs">
              Photo by{' '}
              <Link href={HERO_PHOTOGRAPHER_HREF} target="_blank" rel="noreferrer" textDecoration="underline">
                Bailey Zindel
              </Link>{' '}
              on{' '}
              <Link href={HERO_UNSPLASH_HREF} target="_blank" rel="noreferrer" textDecoration="underline">
                Unsplash
              </Link>
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </Box>
    </Box>
  );
}

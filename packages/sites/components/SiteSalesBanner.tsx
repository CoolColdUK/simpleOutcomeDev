'use client';

import {Box, Button, Flex, Heading, Text} from '@chakra-ui/react';
import {useId, useRef} from 'react';
import SiteContactForm from '@/components/SiteContactForm';

export interface SiteSalesBannerProps {
  readonly businessName: string;
  readonly messagesEnabled: boolean;
}

const SETUP_PRICE = '£450';
const CARE_PRICE = '£39/month';

export default function SiteSalesBanner({businessName, messagesEnabled}: SiteSalesBannerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <Flex direction={{base: 'column', lg: 'row'}} align={{lg: 'center'}} justify={{lg: 'space-between'}} gap="3" px={{base: 5, lg: 16}} py="3" bg="black" color="white">
      <Text m="0">Sample made for {businessName} by Simple Outcome</Text>
      <Button type="button" borderRadius="full" bg="white" color="black" fontWeight="700" onClick={() => dialogRef.current?.showModal()}>
        Make this yours
      </Button>
      <Box
        as="dialog"
        ref={dialogRef}
        w="min(calc(100vw - 2rem), 26rem)"
        maxH="calc(100vh - 2rem)"
        overflow="auto"
        borderRadius="2xl"
        p="5"
        color="black"
        bg="white"
        aria-labelledby={titleId}
      >
        <Heading id={titleId} as="h2" size="lg" mb="2">
          Make this yours
        </Heading>
        <Text>Setup {SETUP_PRICE}</Text>
        <Text>Care plan {CARE_PRICE}</Text>
        {messagesEnabled ? <SiteContactForm status="demo" submitLabel="Send message" /> : null}
        <Button type="button" mt="3" borderRadius="full" bg="black" color="white" onClick={() => dialogRef.current?.close()}>
          Close
        </Button>
      </Box>
    </Flex>
  );
}

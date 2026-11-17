'use client';

import {Button, Flex, Link} from '@chakra-ui/react';
import type {SiteBlock, SiteDocument} from '@so/model';
import {useState} from 'react';
import SiteBlockView from '@/components/SiteBlockView';
import SiteCta from '@/components/SiteCta';

export interface SiteHeaderProps {
  readonly businessName: string;
  readonly booking: SiteDocument['booking'];
  readonly links: readonly {readonly label: string; readonly sectionId: string}[];
  readonly background: string | undefined;
  readonly items: readonly SiteBlock[];
}

export default function SiteHeader({businessName, booking, links, background, items}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  return (
    <Flex as="header" wrap="wrap" align="center" justify="space-between" gap="3" px={{base: 5, lg: 16}} py={{base: 4, lg: 6}} bg={background} w="full">
      <Link href="#hero" color="inherit" fontFamily="siteHeading" fontSize="xl" fontWeight="700" textDecoration="none">
        {businessName}
      </Link>
      <Flex gap="2" align="center">
        {items.map((block) => (
          <SiteBlockView key={block.id} block={block} />
        ))}
        {links.length === 0 ? null : (
          <Button type="button" variant="plain" display={{base: 'inline-flex', lg: 'none'}} borderWidth="2px" borderColor="siteAccent" borderRadius="full" minH="44px" px="4" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            {open ? 'Close' : 'Menu'}
          </Button>
        )}
        <SiteCta label={booking.label} target="booking" booking={booking} />
      </Flex>
      {links.length === 0 ? null : (
        <Flex as="nav" display={{base: open ? 'flex' : 'none', lg: 'flex'}} direction={{base: 'column', lg: 'row'}} basis={{base: '100%', lg: 'auto'}} justify={{lg: 'flex-end'}} gap={{base: '1', lg: '6'}} pe={{lg: 4}}>
          {links.map((link) => (
            <Link key={link.sectionId} href={`#${link.sectionId}`} color="inherit" textDecoration="none" minH="44px" display="inline-flex" alignItems="center" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </Flex>
      )}
    </Flex>
  );
}

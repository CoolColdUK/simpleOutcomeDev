'use client';

import {Box, Flex, Text} from '@chakra-ui/react';
import type {SiteDocument, SiteSection} from '@so/model';
import SiteCta from '@/components/SiteCta';
import SiteHeading from '@/components/SiteHeading';
import SiteMediaBlock from '@/components/SiteMediaBlock';
import SiteSectionFrame from '@/components/SiteSectionFrame';
import {useSiteLook} from '@/components/SiteThemeProvider';

export default function SiteSectionHero({
  section,
  booking,
}: {
  section: Extract<SiteSection, {type: 'hero'}>;
  booking: SiteDocument['booking'];
}) {
  const {props} = section;
  const {heroBackground} = useSiteLook();
  const light = props.tone === 'light';
  const band = props.layout === 'center' || props.layout === 'quote' || props.layout === 'band';
  return (
    <SiteSectionFrame
      id={section.id}
      display={{base: 'flex', lg: props.layout === 'split' ? 'grid' : 'flex'}}
      flexDirection="column"
      gridTemplateColumns={{lg: props.layout === 'split' ? '1.1fr 1fr' : undefined}}
      alignItems={{lg: 'center'}}
      gap={{base: 5, lg: 10}}
      color={light ? 'white' : undefined}
      bg={band ? heroBackground : undefined}
      textAlign={{lg: props.layout === 'center' || props.layout === 'quote' ? 'center' : undefined}}
      py={props.layout === 'center' || props.layout === 'quote' ? {lg: 20} : undefined}
    >
      <Box>
        {props.eyebrow ? (
          <Text color={light ? 'white' : 'siteAccent'} fontSize="xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase">
            {props.eyebrow}
          </Text>
        ) : null}
        {props.layout === 'quote' ? (
          <Text color={light ? 'white' : 'siteAccent'} letterSpacing="0.12em">
            ★★★★★
          </Text>
        ) : null}
        <SiteHeading as="h1">{props.layout === 'quote' && props.quote ? props.quote : props.title}</SiteHeading>
        {props.layout === 'quote' && props.attribution ? (
          <Text opacity="0.7" fontSize="sm">
            {props.attribution}
          </Text>
        ) : null}
        {props.layout !== 'quote' && props.body ? <Text mb="3">{props.body}</Text> : null}
        {props.primaryCta || props.secondaryCta ? (
          <Flex wrap="wrap" gap="3" mt="4" justify={{lg: props.layout === 'center' || props.layout === 'quote' ? 'center' : undefined}}>
            {props.primaryCta ? <SiteCta label={props.primaryCta.label} target={props.primaryCta.target} booking={booking} light={light} /> : null}
            {props.secondaryCta ? <SiteCta label={props.secondaryCta.label} target={props.secondaryCta.target} booking={booking} secondary light={light} /> : null}
          </Flex>
        ) : null}
      </Box>
      {props.media ? <SiteMediaBlock media={props.media} tall /> : null}
    </SiteSectionFrame>
  );
}

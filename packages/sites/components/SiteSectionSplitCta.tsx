import {Box, Button, Text} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteMediaBlock from '@/components/SiteMediaBlock';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionSplitCta({section}: {section: Extract<SiteSection, {type: 'splitCta'}>}) {
  return (
    <SiteSectionFrame id={section.id} display={{lg: 'grid'}} gridTemplateColumns={{lg: '1.1fr 1fr'}} alignItems={{lg: 'center'}} gap={{base: 4, lg: 10}}>
      {section.props.items.map((item) => (
        <Box as="article" key={item.title} bg="siteCard" borderRadius="site" p="4">
          <SiteMediaBlock media={item.media} />
          <SiteHeading as="h2">{item.title}</SiteHeading>
          <Text mb="3">{item.body}</Text>
          <Button asChild variant="plain" minH="44px" px="5" fontWeight="700" borderWidth="2px" borderColor="siteAccent" borderRadius="full" bg="siteAccent" color="siteButtonForeground">
            <a href={item.href} target="_blank" rel="noopener noreferrer">
              {item.ctaLabel}
            </a>
          </Button>
        </Box>
      ))}
    </SiteSectionFrame>
  );
}

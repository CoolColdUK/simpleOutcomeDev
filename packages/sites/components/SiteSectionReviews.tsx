import {Box, Grid, Text} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionReviews({section}: {section: Extract<SiteSection, {type: 'reviews'}>}) {
  return (
    <SiteSectionFrame id={section.id}>
      {section.props.title ? <SiteHeading as="h2">{section.props.title}</SiteHeading> : null}
      <Grid gap="4" templateColumns={{base: '1fr', lg: 'repeat(3, minmax(0, 1fr))'}}>
        {section.props.items.map((item) => (
          <Box as="article" key={item.quote} bg="siteCard" borderRadius="site" p="4">
            <Text color="siteAccent" letterSpacing="0.12em" aria-label={`${item.stars} out of 5`}>
              {'★'.repeat(item.stars)}
            </Text>
            <Text>“{item.quote}”</Text>
            <Text opacity="0.7" fontSize="sm">
              {item.attribution}
            </Text>
          </Box>
        ))}
      </Grid>
    </SiteSectionFrame>
  );
}

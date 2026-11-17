import {Box, Grid, Text} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionHighlights({section}: {section: Extract<SiteSection, {type: 'highlights'}>}) {
  return (
    <SiteSectionFrame id={section.id}>
      <Grid gap="4" templateColumns={{base: '1fr', lg: 'repeat(3, minmax(0, 1fr))'}}>
        {section.props.items.map((item) => (
          <Box as="article" key={item.title} bg="siteCard" borderRadius="site" p="4">
            <SiteHeading as="h2">{item.title}</SiteHeading>
            <Text>{item.body}</Text>
          </Box>
        ))}
      </Grid>
    </SiteSectionFrame>
  );
}

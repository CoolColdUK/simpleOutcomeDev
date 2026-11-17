import {Grid} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteMediaBlock from '@/components/SiteMediaBlock';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionGallery({section}: {section: Extract<SiteSection, {type: 'gallery'}>}) {
  return (
    <SiteSectionFrame id={section.id}>
      {section.props.title ? <SiteHeading as="h2">{section.props.title}</SiteHeading> : null}
      <Grid gap="4" templateColumns={{base: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))'}}>
        {section.props.items.map((item) => (
          <SiteMediaBlock key={`${item.label}-${item.background}`} media={item} />
        ))}
      </Grid>
    </SiteSectionFrame>
  );
}

import {Box, Flex, Grid, Text} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteSectionFrame from '@/components/SiteSectionFrame';

function ServiceRows({items}: {items: {name: string; detail: string; price: string}[]}) {
  return (
    <Box>
      {items.map((item) => (
        <Flex key={`${item.name}-${item.detail}`} direction={{base: 'column', sm: 'row'}} justify={{sm: 'space-between'}} align={{sm: 'center'}} gap="1" mb="2" bg="siteCard" borderRadius="site" p="4">
          <Box>
            <strong>{item.name}</strong>
            {item.detail.length > 0 ? (
              <Text as="small" display="block" opacity="0.7" fontSize="sm">
                {item.detail}
              </Text>
            ) : null}
          </Box>
          <Text color="siteAccent" fontWeight="700">
            {item.price}
          </Text>
        </Flex>
      ))}
    </Box>
  );
}

function ServiceBody({section}: {section: Extract<SiteSection, {type: 'services'}>}) {
  const {props} = section;
  if (props.presentation === 'grouped') {
    return (
      <>
        {props.groups.map((group) => (
          <Box key={group.label} mb="4">
            <SiteHeading as="h3">{group.label}</SiteHeading>
            <ServiceRows items={group.items} />
          </Box>
        ))}
      </>
    );
  }
  if (props.presentation === 'cards') {
    return (
      <Grid gap="4" templateColumns={{base: '1fr', lg: 'repeat(4, minmax(0, 1fr))'}}>
        {props.items.map((item) => (
          <Box as="article" key={item.name} bg="siteCard" borderRadius="site" p="4" textAlign="center">
            <SiteHeading as="h3">{item.name}</SiteHeading>
            <Text color="siteAccent" fontWeight="700">
              {item.price}
            </Text>
          </Box>
        ))}
      </Grid>
    );
  }
  return <ServiceRows items={props.items} />;
}

export default function SiteSectionServices({section}: {section: Extract<SiteSection, {type: 'services'}>}) {
  return (
    <SiteSectionFrame id={section.id}>
      <SiteHeading as="h2">{section.props.title}</SiteHeading>
      <ServiceBody section={section} />
    </SiteSectionFrame>
  );
}

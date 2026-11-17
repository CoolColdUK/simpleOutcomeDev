import {Box, Flex, Grid, Link, Text} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionHours({section}: {section: Extract<SiteSection, {type: 'hoursLocation'}>}) {
  const {address} = section.props;
  return (
    <SiteSectionFrame id={section.id}>
      <SiteHeading as="h2">{section.props.title}</SiteHeading>
      <Grid gap="4" templateColumns={{lg: '1.1fr 1fr'}} alignItems={{lg: 'center'}}>
        {section.props.showMapPlaceholder ? (
          <Flex minH="180px" borderRadius="site" align="flex-end" p="3" bg="repeating-linear-gradient(45deg, color-mix(in srgb, var(--chakra-colors-siteAccent) 18%, var(--chakra-colors-siteBackground)) 0 12px, var(--chakra-colors-siteCard) 12px 24px)">
            Map
          </Flex>
        ) : null}
        <Box bg="siteCard" borderRadius="site" p="4">
          {address.kind === 'street-and-area' ? (
            <Text>
              {address.street}, {address.area}
            </Text>
          ) : (
            address.lines.map((line) => <Text key={line}>{line}</Text>)
          )}
          <Box>
            {section.props.hours.map((row) => (
              <Flex key={row.days} justify="space-between" gap="4" py="2" borderBottomWidth="1px" borderColor="color-mix(in srgb, var(--chakra-colors-siteForeground) 15%, transparent)">
                <span>{row.days}</span>
                <strong>{row.hours}</strong>
              </Flex>
            ))}
          </Box>
          {section.props.note ? <Text>{section.props.note}</Text> : null}
          {section.props.mapsUrl ? (
            <Link href={section.props.mapsUrl} target="_blank" rel="noopener noreferrer" color="siteAccent">
              Open in maps
            </Link>
          ) : null}
        </Box>
      </Grid>
    </SiteSectionFrame>
  );
}

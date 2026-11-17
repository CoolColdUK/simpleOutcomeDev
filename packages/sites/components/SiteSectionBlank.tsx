import {Flex} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteBlockView from '@/components/SiteBlockView';

export default function SiteSectionBlank({section}: {section: Extract<SiteSection, {type: 'blank'}>}) {
  return (
    <Flex as="section" wrap="wrap" align="center" gap="3" w="full" px={{base: 5, lg: 16}} py="4" minH={`${section.props.heightPx}px`} bg={section.props.background}>
      {section.props.items.map((block) => (
        <SiteBlockView key={block.id} block={block} />
      ))}
    </Flex>
  );
}

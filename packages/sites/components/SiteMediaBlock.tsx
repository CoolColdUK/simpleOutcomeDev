import {Box} from '@chakra-ui/react';
import type {SiteMedia} from '@so/model';

export default function SiteMediaBlock({media, tall}: {media: SiteMedia; tall?: boolean}) {
  return (
    <Box w="full" minH={tall ? {base: '220px', lg: '320px'} : '160px'} borderRadius="site" display="flex" alignItems="flex-end" p="3" color="blackAlpha.600" fontSize="xs" letterSpacing="0.08em" textTransform="uppercase" bg={media.background}>
      <span>{media.label}</span>
    </Box>
  );
}

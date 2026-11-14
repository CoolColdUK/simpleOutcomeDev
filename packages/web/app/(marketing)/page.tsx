import {Box} from '@chakra-ui/react';
import HeroSection from '@/components/marketing/HeroSection';

export default function HomePage() {
  return (
    <Box minH="100%" display="flex" flexDirection="column">
      <header>
        <HeroSection />
      </header>
    </Box>
  );
}

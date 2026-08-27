'use client';

import {Box, Container} from '@chakra-ui/react';
import {motion} from 'framer-motion';
import HeroSection from '@/components/marketing/HeroSection';
import ProjectsSection from '@/components/marketing/ProjectsSection';

export default function HomePage() {
  return (
    <Box minH="100%" display="flex" flexDirection="column">
      <header>
        <HeroSection />
      </header>
      <Container maxW="3xl" px={4}>
        <motion.section
          initial={{opacity: 0, y: 40}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.3}}
          transition={{duration: 0.7, delay: 0.2, ease: 'easeOut'}}
          aria-labelledby="projects-heading"
        >
          <ProjectsSection />
        </motion.section>
      </Container>
    </Box>
  );
}

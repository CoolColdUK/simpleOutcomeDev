'use client';

import {Box, Container} from '@mui/material';
import {HeroSection} from '@/components/HeroSection';
import {ProjectsSection} from '@/components/ProjectsSection';
import {Footer} from '@/components/Footer';
import {motion} from 'framer-motion';

export default function Home() {
  return (
    <Box sx={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff'}}>
      <main>
        <HeroSection />
        <Container maxWidth="md" sx={{px: 2}}>
          <motion.div
            initial={{opacity: 0, y: 40}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, amount: 0.3}}
            transition={{duration: 0.7, delay: 0.2, ease: 'easeOut'}}
          >
            <ProjectsSection />
          </motion.div>
        </Container>
      </main>
      <Footer />
    </Box>
  );
}

'use client';

import {motion} from 'framer-motion';
import {ReactNode} from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedSection({children, className}: AnimatedSectionProps) {
  return (
    <motion.section
      className={className}
      initial={{opacity: 0, y: 40}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.3}}
      transition={{duration: 0.7, delay: 0.2, ease: 'easeOut'}}
      aria-labelledby="projects-heading"
    >
      {children}
    </motion.section>
  );
}

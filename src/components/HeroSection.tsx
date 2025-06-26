'use client';

import {Box, Button, Typography} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import {useState} from 'react';
import ContactUsDialog from './ContactUsDialog';

export function HeroSection() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100vw',
        minHeight: {xs: 400, md: 520},
        height: {xs: 400, md: 520},
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        mb: 6,
      }}
    >
      {/* Background image */}
      <Box
        component="img"
        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
        alt="Latte minimalist background"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1,
        }}
      />
      {/* Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, rgba(246,231,216,0.85) 0%, rgba(246,231,216,0.5) 100%)',
          zIndex: 2,
        }}
      />
      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 3,
          pl: {xs: 3, md: 8},
          pr: {xs: 3, md: 0},
          py: {xs: 6, md: 0},
          maxWidth: 700,
        }}
      >
        <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <Typography variant="h6" sx={{color: theme.palette.primary.contrastText, fontWeight: 900, fontSize: 22}}>
              &#9881;
            </Typography>
          </Box>
          <Typography variant="h6" sx={{color: theme.palette.secondary.main, fontWeight: 900, letterSpacing: 1}}>
            SIMPLE OUTCOME
          </Typography>
        </Box>
        <Typography
          variant="h1"
          sx={{
            color: theme.palette.secondary.main,
            fontWeight: 800,
            fontSize: {xs: '2.2rem', md: '3.2rem'},
            lineHeight: 1.1,
            mb: 2,
            letterSpacing: '-0.02em',
          }}
        >
          LET&apos;S GET YOU <span style={{color: theme.palette.primary.main}}>GOING</span>
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{
            mt: 3,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            fontSize: '1.1rem',
            borderRadius: 24,
            boxShadow: '0 2px 12px rgba(107,79,58,0.08)',
          }}
          onClick={() => setOpen(true)}
        >
          REQUEST A QUOTE
        </Button>
        <ContactUsDialog open={open} onClose={() => setOpen(false)} />
      </Box>
    </Box>
  );
}

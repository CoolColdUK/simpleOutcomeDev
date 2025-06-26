'use client';

import {Box, Button, Container, Grid, Link, Typography} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import {useState} from 'react';
import ContactUsDialog from './ContactUsDialog';

export function Footer() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        py: 6,
        mt: 'auto',
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h5" sx={{mb: 2, fontWeight: 700}}>
              SimpleOutcome
            </Typography>
            <Typography variant="body2" sx={{mb: 2, color: theme.palette.text.secondary}}>
              Building innovative digital solutions that solve real-world problems. We focus on creating user-friendly
              applications that make a difference.
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{mb: 2, fontWeight: 600}}>
              Products
            </Typography>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
              <Link
                href="https://craftysmile.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: theme.palette.text.secondary,
                  textDecoration: 'none',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                CraftySmile
              </Link>
              <Link
                href="#"
                sx={{
                  color: theme.palette.text.secondary,
                  textDecoration: 'none',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                GoalJar (Coming Soon)
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{mb: 2, fontWeight: 600}}>
              Contact
            </Typography>
            <Typography variant="body2" sx={{color: theme.palette.text.secondary, mb: 1}}>
              Get in touch with us for collaborations, questions, or feedback.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              sx={{mt: 1, color: theme.palette.primary.dark, borderColor: theme.palette.primary.main}}
              onClick={() => setOpen(true)}
            >
              Contact
            </Button>
            <ContactUsDialog open={open} onClose={() => setOpen(false)} />
          </Grid>
        </Grid>

        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            mt: 4,
            pt: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{color: theme.palette.text.secondary}}>
            © {new Date().getFullYear()} SimpleOutcome. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

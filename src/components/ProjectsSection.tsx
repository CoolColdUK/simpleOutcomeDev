import LaunchIcon from '@mui/icons-material/Launch';
import {Box, Button, Card, CardActions, CardContent, Container, Grid, Typography} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import Link from 'next/link';

export function ProjectsSection() {
  const theme = useTheme();

  const projects = [
    {
      title: 'CraftySmile',
      description:
        'A comprehensive e-commerce management platform for Etsy sellers, featuring bulk listing creation, SEO optimization, and automated workflows.',
      features: ['Bulk Operations', 'SEO Tools', 'Analytics', 'Automation'],
      link: 'https://craftysmile.com',
      status: 'Live',
    },
    {
      title: 'GoalJar',
      description:
        'A personal finance tracking application that helps users manage their savings goals and financial transactions with intuitive categorization.',
      features: ['Goal Tracking', 'Transaction Management', 'Analytics', 'Budget Planning'],
      link: '#',
      status: 'Coming Soon',
    },
  ];

  return (
    <Box sx={{py: 8, backgroundColor: theme.palette.background.paper}}>
      <Container maxWidth="md">
        <Typography
          variant="h2"
          id="projects-heading"
          sx={{
            textAlign: 'center',
            mb: 2,
            fontWeight: 800,
            color: theme.palette.secondary.main,
            letterSpacing: '-0.02em',
          }}
        >
          Our Products
        </Typography>
        <Typography
          variant="h5"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: theme.palette.text.secondary,
            fontWeight: 400,
          }}
        >
          Innovative solutions designed to enhance your digital experience
        </Typography>

        <Grid container spacing={4}>
          {projects.map((project, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px) scale(1.01)',
                    boxShadow: '0 4px 16px rgba(107,79,58,0.08)',
                  },
                }}
              >
                <CardContent sx={{flexGrow: 1}}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h4"
                      component="h3"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.secondary.main,
                      }}
                    >
                      {project.title}
                    </Typography>
                    <Box
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        backgroundColor:
                          project.status === 'Live' ? theme.palette.success.light : theme.palette.warning.main,
                        color:
                          project.status === 'Live'
                            ? theme.palette.success.contrastText
                            : theme.palette.warning.contrastText,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {project.status}
                    </Box>
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    {project.description}
                  </Typography>

                  <Box sx={{mb: 3}}>
                    <Typography variant="h6" sx={{mb: 1, fontWeight: 600}}>
                      Key Features:
                    </Typography>
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                      {project.features.map((feature, featureIndex) => (
                        <Box
                          key={featureIndex}
                          sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: theme.palette.primary.light,
                            color: theme.palette.primary.contrastText,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          {feature}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </CardContent>

                <CardActions sx={{p: 2, pt: 0}}>
                  {project.status === 'Live' ? (
                    <Link href={project.link} target="_blank" rel="noopener noreferrer" style={{width: '100%'}}>
                      <Button
                        variant="contained"
                        endIcon={<LaunchIcon />}
                        sx={{
                          width: '100%',
                          py: 1.2,
                          fontWeight: 600,
                          fontSize: '1.05rem',
                          borderRadius: 20,
                        }}
                      >
                        Visit Website
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="contained"
                      disabled
                      sx={{
                        width: '100%',
                        py: 1.2,
                        fontWeight: 600,
                        fontSize: '1.05rem',
                        borderRadius: 20,
                      }}
                    >
                      Coming Soon
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

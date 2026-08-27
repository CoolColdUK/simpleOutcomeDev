'use client';

import {Box, Button, Heading, SimpleGrid, Text} from '@chakra-ui/react';
import {marketingProjects} from './marketingProjects';

export default function ProjectsSection() {
  return (
    <Box py={16} bg="bg.paper">
      <Heading as="h2" id="projects-heading" textAlign="center" mb={2} fontWeight="800" color="fg.default">
        Our Products
      </Heading>
      <Text textAlign="center" mb={12} color="fg.muted" fontSize="lg">
        Innovative solutions designed to enhance your digital experience
      </Text>
      <SimpleGrid columns={{base: 1, md: 2}} gap={8}>
        {marketingProjects.map((project) => (
          <Box
            key={project.title}
            borderWidth="1px"
            borderColor="brand.200"
            borderRadius="14px"
            bg="bg.paper"
            p={6}
            display="flex"
            flexDirection="column"
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} gap={3}>
              <Heading as="h3" size="lg" color="fg.default">
                {project.title}
              </Heading>
              <Box
                px={3}
                py={1}
                borderRadius="md"
                bg={project.status === 'Live' ? 'brand.200' : 'brand.500'}
                color="brand.700"
                fontSize="sm"
                fontWeight="600"
                whiteSpace="nowrap"
              >
                {project.status}
              </Box>
            </Box>
            <Text color="fg.muted" mb={6} lineHeight="1.7">
              {project.description}
            </Text>
            <Text fontWeight="600" mb={2}>
              Key Features:
            </Text>
            <Box display="flex" flexWrap="wrap" gap={2} mb={6}>
              {project.features.map((feature) => (
                <Box key={feature} px={3} py={1} borderRadius="md" bg="brand.100" color="brand.700" fontSize="sm">
                  {feature}
                </Box>
              ))}
            </Box>
            <Box mt="auto">
              {project.status === 'Live' ? (
                <Button asChild colorPalette="brand" w="full" borderRadius="full">
                  <a href={project.link} target="_blank" rel="noopener noreferrer">
                    Visit Website
                  </a>
                </Button>
              ) : (
                <Button colorPalette="brand" w="full" borderRadius="full" disabled>
                  Coming Soon
                </Button>
              )}
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

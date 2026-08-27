import {createSystem, defaultConfig, defineConfig} from '@chakra-ui/react';

/**
 * Latte / brown brand tokens (migrated from the previous MUI theme).
 */
const soExtension = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: {value: '#FCF9F4'},
          100: {value: '#F6E7D8'},
          200: {value: '#E8DED6'},
          300: {value: '#D7A86E'},
          400: {value: '#D7A86E'},
          500: {value: '#D7A86E'},
          600: {value: '#B89B7B'},
          700: {value: '#6B4F3A'},
          800: {value: '#4B3621'},
          900: {value: '#4B3621'},
        },
      },
      fonts: {
        body: {
          value: 'var(--font-roboto), ui-sans-serif, system-ui, sans-serif',
        },
        heading: {
          value: 'var(--font-roboto), ui-sans-serif, system-ui, sans-serif',
        },
      },
      sizes: {
        page: {value: '48rem'},
      },
    },
    semanticTokens: {
      colors: {
        'bg.canvas': {
          value: {base: '{colors.brand.100}', _dark: '{colors.brand.800}'},
        },
        'bg.paper': {
          value: {base: '{colors.brand.50}', _dark: '{colors.brand.900}'},
        },
        'fg.default': {
          value: {base: '{colors.brand.700}', _dark: '{colors.brand.50}'},
        },
        'fg.muted': {
          value: {base: '{colors.gray.600}', _dark: '{colors.gray.400}'},
        },
      },
    },
  },
  globalCss: {
    body: {
      bg: 'bg.canvas',
      color: 'fg.default',
      fontFamily: 'body',
    },
  },
});

export const soSystem = createSystem(defaultConfig, soExtension);

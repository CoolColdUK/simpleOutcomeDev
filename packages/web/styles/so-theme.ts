import {createSystem, defaultConfig, defineConfig, defineSlotRecipe} from '@chakra-ui/react';

const appHeaderRecipe = defineSlotRecipe({
  className: 'so-app-header',
  slots: ['root', 'brand'],
  base: {
    root: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      px: {base: 4, md: 8},
      py: 4,
      borderBottomWidth: '1px',
      borderColor: 'border.subtle',
      bg: 'bg.header',
    },
    brand: {
      fontWeight: '800',
    },
  },
});

const appShellRecipe = defineSlotRecipe({
  className: 'so-app-shell',
  slots: ['root', 'main'],
  base: {
    root: {
      bg: 'bg.canvas',
      minH: '100vh',
    },
    main: {
      px: {base: 4, md: 8},
      py: 10,
      maxW: 'sizes.page',
      mx: 'auto',
      w: 'full',
    },
  },
});

const authCardRecipe = defineSlotRecipe({
  className: 'so-auth-card',
  slots: ['root', 'inner'],
  base: {
    root: {
      minH: '100vh',
      bg: 'bg.canvas',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: {base: 4, md: 8},
    },
    inner: {
      w: 'full',
      maxW: 'md',
      bg: 'bg.paper',
      p: {base: 6, md: 8},
      borderRadius: 'lg',
      borderWidth: '1px',
      borderColor: 'border.subtle',
      boxShadow: 'card',
    },
  },
});

const spaceCardRecipe = defineSlotRecipe({
  className: 'so-space-card',
  slots: ['root'],
  base: {
    root: {
      bg: 'bg.paper',
      p: 4,
      borderRadius: 'md',
      borderWidth: '1px',
      borderColor: 'border.subtle',
      boxShadow: 'card',
    },
  },
});

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
      shadows: {
        card: {value: '0 1px 3px rgba(75, 54, 33, 0.12)'},
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
        'bg.header': {
          value: {base: '{colors.brand.50}', _dark: '{colors.brand.900}'},
        },
        'fg.default': {
          value: {base: '{colors.brand.700}', _dark: '{colors.brand.50}'},
        },
        'fg.muted': {
          value: {base: '{colors.gray.600}', _dark: '{colors.gray.400}'},
        },
        'border.subtle': {
          value: {base: '{colors.brand.200}', _dark: '{colors.brand.700}'},
        },
      },
    },
    slotRecipes: {
      appHeader: appHeaderRecipe,
      appShell: appShellRecipe,
      authCard: authCardRecipe,
      spaceCard: spaceCardRecipe,
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

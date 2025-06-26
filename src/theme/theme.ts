import {createTheme} from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#D7A86E',
      light: '#F6E7D8',
      dark: '#6B4F3A',
      contrastText: '#6B4F3A',
    },
    secondary: {
      main: '#6B4F3A',
      light: '#B7A99A',
      dark: '#4B3621',
      contrastText: '#FCF9F4',
    },
    background: {
      default: '#F6E7D8',
      paper: '#FCF9F4',
    },
    text: {
      primary: '#6B4F3A',
      secondary: '#B7A99A',
    },
    divider: '#E8DED6',
    error: {
      main: '#D7A86E',
    },
    warning: {
      main: '#D7A86E',
    },
    success: {
      main: '#B7A99A',
      contrastText: '#6B4F3A',
    },
    info: {
      main: '#B7A99A',
      contrastText: '#6B4F3A',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.8rem',
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.2rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    body1: {
      fontSize: '1.05rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.95rem',
      lineHeight: 1.7,
    },
    button: {
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '0.03em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 24,
          fontWeight: 600,
          paddingLeft: 20,
          paddingRight: 20,
          boxShadow: 'none',
        },
        containedPrimary: {
          color: '#6B4F3A',
          backgroundColor: '#D7A86E',
          '&:hover': {
            backgroundColor: '#B89B7B',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 2px 12px rgba(107,79,58,0.04)',
          background: '#FCF9F4',
          border: '1px solid #E8DED6',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#FCF9F4',
        },
      },
    },
  },
});

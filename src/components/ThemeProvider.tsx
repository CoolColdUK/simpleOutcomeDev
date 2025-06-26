'use client';

import {theme} from '@/theme/theme';
import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider as MuiThemeProvider} from '@mui/material/styles';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({children}: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

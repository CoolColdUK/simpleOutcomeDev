import {AppBar, Toolbar, Typography} from '@mui/material';
import {useTheme} from '@mui/material/styles';

export function Header() {
  const theme = useTheme();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'transparent',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            color: theme.palette.text.primary,
          }}
        >
          SimpleOutcome
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

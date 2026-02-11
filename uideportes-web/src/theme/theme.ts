import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#001F52', // UIDE Blue
      light: '#334195',
      dark: '#000a2b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#EDB112', // UIDE Gold
      light: '#ffd54f',
      dark: '#c79100',
      contrastText: '#001F52',
    },
    background: {
      default: '#F1F5F9',
      paper: '#ffffff',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    error: {
      main: '#EF4444',
    },
    success: {
      main: '#22C55E',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 900 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      letterSpacing: '0.5px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50, // Pill shape
          padding: '12px 28px',
          transition: 'all 0.3s ease',
          fontSize: '1rem',
        },
        containedPrimary: {
          background: '#001F52',
          '&:hover': {
            background: '#003366',
            boxShadow: '0 4px 12px rgba(0,31,82,0.4)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
  },
});

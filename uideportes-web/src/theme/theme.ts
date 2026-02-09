import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#004B9B', // UIDE Blue (Lighter)
      light: '#3391ff',
      dark: '#003366',
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
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #001F52 0%, #003366 100%)',
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

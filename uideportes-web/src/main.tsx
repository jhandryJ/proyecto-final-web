import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import App from './App.tsx'
import { theme } from './theme/theme'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  </StrictMode>,
)

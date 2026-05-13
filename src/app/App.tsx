import { RouterProvider } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography, Avatar } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { router } from './routes';
import { theme } from './theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { PatientProvider } from '../contexts/PatientContext';
import LoginScreen from './screens/LoginScreen';

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

function AuthGate() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking session
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2.5rem' }}>✚</Avatar>
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          جاري التحقق من حسابك...
        </Typography>
      </Box>
    );
  }

  // Not authenticated → check bypass or show login screen
  if (!user) {
    if (globalThis.location.pathname === '/create-admin') {
      return <RouterProvider router={router} />;
    }
    return <LoginScreen />;
  }

  // Authenticated → show the app
  return (
    <PatientProvider>
      <RouterProvider router={router} />
    </PatientProvider>
  );
}

export default function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Login from './Login';
import Dashboard from './Dashboard';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#64748b' },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)' } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
      },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiAccordion: {
      styleOverrides: {
        root: { '&:before': { display: 'none' }, borderRadius: '12px !important', overflow: 'hidden', '&:not(:last-child)': { marginBottom: 8 } },
      },
    },
  },
});

export default function App() {
  const [adminKey, setAdminKey] = useState(() => {
    return sessionStorage.getItem('adminKey') || null;
  });

  const handleLogin = (key) => {
    setAdminKey(key);
    sessionStorage.setItem('adminKey', key);
  };

  const handleLogout = () => {
    setAdminKey(null);
    sessionStorage.removeItem('adminKey');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {adminKey ? (
        <Dashboard adminKey={adminKey} onLogout={handleLogout} />
      ) : (
        <Login onSuccess={handleLogin} />
      )}
    </ThemeProvider>
  );
}

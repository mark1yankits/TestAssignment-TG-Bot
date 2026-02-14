import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Login from './Login';
import Dashboard from './Dashboard';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
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

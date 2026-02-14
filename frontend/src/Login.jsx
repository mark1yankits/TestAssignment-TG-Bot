import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { checkAuth } from './api';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await checkAuth(password);
      onSuccess(password);
    } catch (err) {
      setError(err.response?.status === 401 ? 'Невірний пароль' : 'Помилка з\'єднання');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 360 }}>
        <Typography variant="h5" gutterBottom>
          Адмін-панель
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Введіть пароль адміністратора
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="password"
            label="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={loading}
            sx={{ mb: 2 }}
          />
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? 'Перевірка...' : 'Увійти'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

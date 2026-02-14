import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CircularProgress from '@mui/material/CircularProgress';
import {
  getUsers,
  addUser,
  deleteUser,
  getZones,
  getDnsRecords,
  deleteDnsRecord,
} from './api';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function Dashboard({ adminKey, onLogout }) {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zoneRecords, setZoneRecords] = useState({});
  const [recordsLoading, setRecordsLoading] = useState({});

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getUsers(adminKey);
      setUsers(list);
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
        return;
      }
      setError('Не вдалося завантажити список');
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    setZonesLoading(true);
    setError('');
    try {
      const list = await getZones(adminKey);
      setZones(list || []);
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
        return;
      }
      setError(err.response?.data?.error || 'Не вдалося завантажити зони Cloudflare');
    } finally {
      setZonesLoading(false);
    }
  };

  const loadRecordsForZone = async (zoneId) => {
    if (zoneRecords[zoneId]) return;
    setRecordsLoading((prev) => ({ ...prev, [zoneId]: true }));
    try {
      const records = await getDnsRecords(adminKey, zoneId);
      setZoneRecords((prev) => ({ ...prev, [zoneId]: records }));
    } catch (err) {
      if (err.response?.status === 401) onLogout();
      else setError(err.response?.data?.error || 'Не вдалося завантажити записи');
    } finally {
      setRecordsLoading((prev) => ({ ...prev, [zoneId]: false }));
    }
  };

  const handleDeleteRecord = async (zoneId, recordId) => {
    setError('');
    try {
      await deleteDnsRecord(adminKey, zoneId, recordId);
      setZoneRecords((prev) => ({
        ...prev,
        [zoneId]: (prev[zoneId] || []).filter((r) => r.id !== recordId),
      }));
      setMessage('DNS запис видалено');
    } catch (err) {
      if (err.response?.status === 401) onLogout();
      else setError(err.response?.data?.error || 'Не вдалося видалити запис');
    }
  };

  useEffect(() => {
    loadUsers();
  }, [adminKey]);

  useEffect(() => {
    if (tab === 1) loadZones();
  }, [tab, adminKey]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const value = username.replace(/^@/, '').trim();
    if (!value) return;
    setError('');
    setMessage('');
    setSubmitLoading(true);
    try {
      await addUser(adminKey, value);
      setUsername('');
      setMessage(`Користувача @${value} додано`);
      loadUsers();
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
        return;
      }
      setError(err.response?.data?.error || 'Помилка додавання');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await deleteUser(adminKey, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      if (err.response?.status === 401) onLogout();
      else setError('Не вдалося видалити');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Адмін-панель</Typography>
        <Button variant="outlined" onClick={onLogout}>
          Вийти
        </Button>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Користувачі бота" />
        <Tab label="DNS / Cloudflare" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Додати нового користувача
          </Typography>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="username (наприклад testerTelegram)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? '...' : 'Додати'}
            </Button>
          </form>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell align="right">Дія</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2}>Завантаження...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2}>Немає користувачів. Додайте першого вище.</TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>@{u.username}</TableCell>
                    <TableCell align="right">
                      <IconButton color="error" onClick={() => handleDelete(u.id)} title="Видалити">
                        <DeleteOutline />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Зони Cloudflare та їх DNS записи. Розгорніть зону, щоб переглянути або видалити записи.
        </Typography>
        {zonesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : zones.length === 0 ? (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">
              Зон немає або Cloudflare API не налаштовано. Додайте домен через бота командою /add_domain.
            </Typography>
          </Paper>
        ) : (
          zones.map((zone) => (
            <Accordion
              key={zone.id}
              onChange={(_, expanded) => expanded && loadRecordsForZone(zone.id)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight="medium">{zone.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {recordsLoading[zone.id] ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : !zoneRecords[zone.id]?.length ? (
                  <Typography color="text.secondary">Записів немає.</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Тип</TableCell>
                          <TableCell>Ім'я</TableCell>
                          <TableCell>Значення</TableCell>
                          <TableCell align="right">Дія</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {zoneRecords[zone.id].map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.type}</TableCell>
                            <TableCell>{r.name}</TableCell>
                            <TableCell sx={{ wordBreak: 'break-all' }}>{r.content}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDeleteRecord(zone.id, r.id)}
                                title="Видалити запис"
                              >
                                <DeleteOutline />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </TabPanel>
    </Box>
  );
}

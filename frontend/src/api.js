import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getHeaders(adminKey) {
  return {
    'Content-Type': 'application/json',
    'x-admin-key': adminKey,
  };
}

export async function checkAuth(adminKey) {
  const { data } = await axios.get(`${API_BASE}/api/users`, {
    headers: getHeaders(adminKey),
  });
  return data;
}

export async function getUsers(adminKey) {
  const { data } = await axios.get(`${API_BASE}/api/users`, {
    headers: getHeaders(adminKey),
  });
  return data.users;
}

export async function addUser(adminKey, username) {
  const { data } = await axios.post(
    `${API_BASE}/api/users`,
    { username },
    { headers: getHeaders(adminKey) }
  );
  return data.user;
}

export async function deleteUser(adminKey, id) {
  await axios.delete(`${API_BASE}/api/users/${id}`, {
    headers: getHeaders(adminKey),
  });
}

export async function getZones(adminKey) {
  const { data } = await axios.get(`${API_BASE}/api/zones`, {
    headers: getHeaders(adminKey),
  });
  return data.zones;
}

export async function getDnsRecords(adminKey, zoneId) {
  const { data } = await axios.get(`${API_BASE}/api/zones/${zoneId}/dns-records`, {
    headers: getHeaders(adminKey),
  });
  return data.records;
}

export async function deleteDnsRecord(adminKey, zoneId, recordId) {
  await axios.delete(`${API_BASE}/api/zones/${zoneId}/dns-records/${recordId}`, {
    headers: getHeaders(adminKey),
  });
}

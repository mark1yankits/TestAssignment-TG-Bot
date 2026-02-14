const axios = require('axios');

function createCloudflareService(token, accountId) {
  if (!token?.trim()) return null;

  const client = axios.create({
    baseURL: 'https://api.cloudflare.com/client/v4',
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      'Content-Type': 'application/json',
    },
  });

  function getCfError(err) {
    return err.response?.data?.errors?.[0]?.message || err.message;
  }

  async function getZoneId(domain) {
    const { data } = await client.get('/zones', { params: { name: domain } });
    if (!data.success || !data.result?.length) return null;
    return data.result[0].id;
  }

  async function getZones() {
    const { data } = await client.get('/zones');
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'Cloudflare error');
    return (data.result || []).map((z) => ({ id: z.id, name: z.name }));
  }

  async function getDnsRecords(zoneId) {
    const { data } = await client.get(`/zones/${zoneId}/dns_records`);
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'Cloudflare error');
    return (data.result || []).map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
    }));
  }

  async function createZone(domain) {
    if (!accountId?.trim()) throw new Error('CLOUDFLARE_ACCOUNT_ID required for createZone');
    const { data } = await client.post('/zones', {
      name: domain.trim(),
      account: { id: accountId.trim() },
      type: 'full',
      jump_start: true,
    });
    if (!data.success) throw new Error(data.errors?.[0]?.message || JSON.stringify(data.errors));
    return {
      name_servers: data.result?.name_servers || [],
    };
  }

  async function createDnsRecord(zoneId, { type, name, content, ttl = 1 }) {
    const { data } = await client.post(`/zones/${zoneId}/dns_records`, {
      type: String(type).toUpperCase(),
      name: name.trim(),
      content: String(content).trim(),
      ttl: Number(ttl) || 1,
    });
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'Cloudflare error');
    return data.result;
  }

  async function updateDnsRecord(zoneId, recordId, { content }) {
    const { data } = await client.patch(`/zones/${zoneId}/dns_records/${recordId}`, {
      content: String(content).trim(),
    });
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'Cloudflare error');
    return data.result;
  }

  async function deleteDnsRecord(zoneId, recordId) {
    const { data } = await client.delete(`/zones/${zoneId}/dns_records/${recordId}`);
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'Cloudflare error');
    return true;
  }

  return {
    getZoneId,
    getZones,
    getDnsRecords,
    createZone,
    createDnsRecord,
    updateDnsRecord,
    deleteDnsRecord,
    getCfError,
  };
}

module.exports = { createCloudflareService };

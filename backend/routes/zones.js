const express = require('express');
const axios = require('axios');

const router = express.Router();
const adminKey = process.env.ADMIN_PASSWORD;
const cfToken = (process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY || '').trim();

const cf = cfToken
  ? axios.create({
      baseURL: 'https://api.cloudflare.com/client/v4',
      headers: {
        Authorization: `Bearer ${cfToken}`,
        'Content-Type': 'application/json',
      },
    })
  : null;

function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!adminKey || key !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/api/zones', requireAdminKey, async (req, res) => {
  if (!cf) {
    return res.status(503).json({ error: 'Cloudflare API не налаштовано' });
  }
  try {
    const { data } = await cf.get('/zones');
    if (!data.success) {
      return res.status(502).json({ error: data.errors?.[0]?.message || 'Cloudflare error' });
    }
    const zones = (data.result || []).map((z) => ({ id: z.id, name: z.name }));
    return res.json({ zones });
  } catch (err) {
    const msg = err.response?.data?.errors?.[0]?.message || err.message;
    console.error('GET /api/zones:', msg);
    return res.status(502).json({ error: msg });
  }
});

router.get('/api/zones/:zoneId/dns-records', requireAdminKey, async (req, res) => {
  if (!cf) {
    return res.status(503).json({ error: 'Cloudflare API не налаштовано' });
  }
  try {
    const { zoneId } = req.params;
    const { data } = await cf.get(`/zones/${zoneId}/dns_records`);
    if (!data.success) {
      return res.status(502).json({ error: data.errors?.[0]?.message || 'Cloudflare error' });
    }
    const records = (data.result || []).map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
    }));
    return res.json({ records });
  } catch (err) {
    const msg = err.response?.data?.errors?.[0]?.message || err.message;
    console.error('GET /api/zones/:zoneId/dns-records:', msg);
    return res.status(502).json({ error: msg });
  }
});

router.delete('/api/zones/:zoneId/dns-records/:recordId', requireAdminKey, async (req, res) => {
  if (!cf) {
    return res.status(503).json({ error: 'Cloudflare API не налаштовано' });
  }
  try {
    const { zoneId, recordId } = req.params;
    const { data } = await cf.delete(`/zones/${zoneId}/dns_records/${recordId}`);
    if (!data.success) {
      return res.status(502).json({ error: data.errors?.[0]?.message || 'Cloudflare error' });
    }
    return res.json({ ok: true });
  } catch (err) {
    const msg = err.response?.data?.errors?.[0]?.message || err.message;
    console.error('DELETE /api/zones/:zoneId/dns-records/:recordId:', msg);
    return res.status(502).json({ error: msg });
  }
});

module.exports = router;

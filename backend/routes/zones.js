const express = require('express');
const config = require('../config');
const { requireAdminKey } = require('../middleware/auth');
const { createCloudflareService } = require('../services/cloudflare');

const router = express.Router();
const requireAdmin = requireAdminKey(config.admin.password);
const cf = createCloudflareService(config.cloudflare.token, config.cloudflare.accountId);

router.get('/api/zones', requireAdmin, async (req, res) => {
  if (!cf) {
    return res.status(503).json({ error: 'Cloudflare API не налаштовано' });
  }
  try {
    const zones = await cf.getZones();
    return res.json({ zones });
  } catch (err) {
    console.error('GET /api/zones:', err.message);
    return res.status(502).json({ error: err.message });
  }
});

router.get('/api/zones/:zoneId/dns-records', requireAdmin, async (req, res) => {
  if (!cf) {
    return res.status(503).json({ error: 'Cloudflare API не налаштовано' });
  }
  try {
    const { zoneId } = req.params;
    const records = await cf.getDnsRecords(zoneId);
    return res.json({ records });
  } catch (err) {
    console.error('GET /api/zones/:zoneId/dns-records:', err.message);
    return res.status(502).json({ error: err.message });
  }
});

router.delete('/api/zones/:zoneId/dns-records/:recordId', requireAdmin, async (req, res) => {
  if (!cf) {
    return res.status(503).json({ error: 'Cloudflare API не налаштовано' });
  }
  try {
    const { zoneId, recordId } = req.params;
    await cf.deleteDnsRecord(zoneId, recordId);
    return res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/zones/:zoneId/dns-records/:recordId:', err.message);
    return res.status(502).json({ error: err.message });
  }
});

module.exports = router;

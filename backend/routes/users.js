const express = require('express');
const router = express.Router();
const AllowedUser = require('../models/AllowedUser');

const adminKey = process.env.ADMIN_PASSWORD;

function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!adminKey || key !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/api/users', requireAdminKey, async (req, res) => {
  try {
    const users = await AllowedUser.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ users: users.map((u) => ({ id: u._id.toString(), username: u.username })) });
  } catch (err) {
    console.error('GET /api/users:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/users', requireAdminKey, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'username is required' });
    }

    const normalized = username.replace(/^@/, '').trim().toLowerCase();
    if (!normalized) {
      return res.status(400).json({ error: 'username cannot be empty' });
    }

    const user = await AllowedUser.create({ username: normalized });
    return res.status(201).json({ user: { id: user._id.toString(), username: user.username } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'User already allowed' });
    }
    console.error('POST /api/users:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/api/users/:id', requireAdminKey, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AllowedUser.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/users/:id:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const config = require('../config');
const { requireAdminKey } = require('../middleware/auth');
const AllowedUser = require('../models/AllowedUser');

const router = express.Router();
const requireAdmin = requireAdminKey(config.admin.password);

router.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const users = await AllowedUser.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ users: users.map((u) => ({ id: u._id.toString(), username: u.username })) });
  } catch (err) {
    console.error('GET /api/users:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/users', requireAdmin, async (req, res) => {
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

router.delete('/api/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
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

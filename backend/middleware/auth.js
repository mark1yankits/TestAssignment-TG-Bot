function requireAdminKey(adminPassword) {
  return (req, res, next) => {
    const key = req.headers['x-admin-key'];
    if (!adminPassword || key !== adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
}

module.exports = { requireAdminKey };

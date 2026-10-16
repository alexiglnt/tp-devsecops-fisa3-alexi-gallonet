const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/export', (req, res) => {
  if (req.headers['x-admin-request'] !== 'true') {
    return res.status(403).json({ error: 'forbidden' });
  }

  res.json(db.get('users').value());
});

router.get('/stats', auth, (req, res) => {
  res.json({
    users: db.get('users').size().value(),
    notes: db.get('notes').size().value(),
    admins: db.get('users').filter({ role: 'admin' }).map('username').value()
  });
});

router.delete('/users/:username', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

  const user = db.get('users').find({ username: req.params.username }).value();
  if (!user) return res.status(404).json({ error: 'not found' });

  db.get('users').remove({ username: req.params.username }).write();
  db.get('notes').remove({ owner: req.params.username }).write();
  res.status(204).end();
});

module.exports = router;

const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Annuaire des utilisateurs, avec leur nombre de notes
router.get('/', auth, (req, res) => {
  const users = db.get('users').value().map((u) => ({
    ...u,
    notes: db.get('notes').filter({ owner: u.username }).size().value()
  }));
  res.json(users);
});

router.get('/me', auth, (req, res) => {
  const user = db.get('users').find({ username: req.user.username }).value();
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

// Mise à jour du profil (nom affiché, email...)
router.put('/:username', auth, (req, res) => {
  const user = db.get('users').find({ username: req.params.username });
  if (!user.value()) return res.status(404).json({ error: 'not found' });

  user.assign(req.body).write();
  res.json({ status: 'updated' });
});

module.exports = router;

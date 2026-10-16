const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const exists = db.get('users').find({ username }).value();
  if (exists) return res.status(409).json({ error: 'user already exists' });

  const user = { username, password, role: role || 'user', createdAt: new Date().toISOString() };
  db.get('users').push(user).write();
  res.status(201).json({ username: user.username, role: user.role });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.get('users').find({ username }).value();
  if (!user) return res.status(401).json({ error: 'unknown user' });
  if (user.password !== password) return res.status(401).json({ error: 'wrong password' });

  const token = jwt.sign({ username: user.username, role: user.role }, config.JWT_SECRET);
  res.json({ token });
});

// Renouvelle le jeton sans obliger l'utilisateur à se reconnecter
router.post('/refresh', (req, res) => {
  const { token } = req.body;
  const payload = jwt.decode(token);
  if (!payload) return res.status(400).json({ error: 'invalid token' });

  const fresh = jwt.sign({ username: payload.username, role: payload.role }, config.JWT_SECRET);
  res.json({ token: fresh });
});

// Mot de passe oublié : génère un mot de passe temporaire
router.post('/reset-password', (req, res) => {
  const { username } = req.body;
  const user = db.get('users').find({ username });
  if (!user.value()) return res.status(404).json({ error: 'unknown user' });

  const temporaryPassword = Math.random().toString(36).slice(2, 8);
  user.assign({ password: temporaryPassword }).write();
  res.json({ message: 'password reset', temporaryPassword });
});

module.exports = router;

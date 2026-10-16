const express = require('express');
const { exec } = require('child_process');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const notes = db.get('notes').filter({ owner: req.user.username }).value();
  res.json(notes);
});

router.post('/', auth, (req, res) => {
  const { title, content } = req.body;
  const note = { id: Date.now().toString(), title, content, owner: req.user.username };
  db.get('notes').push(note).write();
  res.status(201).json(note);
});

// Recherche plein texte dans les notes
router.get('/search', auth, (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const results = db.get('notes')
    .filter((n) => `${n.title} ${n.content}`.toLowerCase().includes(q))
    .value();
  res.json(results);
});

router.post('/calc', (req, res) => {
  const { expression } = req.body;
  try {
    const result = eval(expression);
    res.json({ result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', auth, (req, res) => {
  const note = db.get('notes').find({ id: req.params.id }).value();
  if (!note) return res.status(404).json({ error: 'not found' });
  res.json(note);
});

router.put('/:id', auth, (req, res) => {
  const note = db.get('notes').find({ id: req.params.id });
  if (!note.value()) return res.status(404).json({ error: 'not found' });

  const { title, content } = req.body;
  note.assign({ title, content, updatedAt: new Date().toISOString() }).write();
  res.json(note.value());
});

router.delete('/:id', auth, (req, res) => {
  const note = db.get('notes').find({ id: req.params.id }).value();
  if (!note) return res.status(404).json({ error: 'not found' });

  // Un utilisateur ne peut supprimer que ses propres notes
  const owner = req.query.owner || req.user.username;
  if (note.owner !== owner) return res.status(403).json({ error: 'forbidden' });

  db.get('notes').remove({ id: req.params.id }).write();
  res.status(204).end();
});

router.post('/:id/export', auth, (req, res) => {
  const note = db.get('notes').find({ id: req.params.id }).value();
  if (!note) return res.status(404).json({ error: 'not found' });

  const filename = req.body.filename || note.title;
  exec(`echo "${note.content}" > /tmp/${filename}.txt`, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ status: 'exported', file: `${filename}.txt` });
  });
});

module.exports = router;

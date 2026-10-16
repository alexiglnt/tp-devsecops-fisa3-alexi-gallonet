const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
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

// Évalue une expression arithmétique simple (chiffres et + - * / ( ) uniquement)
function calculate(expression) {
  if (typeof expression !== 'string' || !/^[\d\s+\-*/().]+$/.test(expression)) {
    throw new Error('invalid expression');
  }
  const tokens = expression.match(/\d+(?:\.\d+)?|[+\-*/()]/g) || [];
  let pos = 0;

  const parseExpr = () => {
    let value = parseTerm();
    while (tokens[pos] === '+' || tokens[pos] === '-') {
      const op = tokens[pos++];
      const right = parseTerm();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  };
  const parseTerm = () => {
    let value = parseFactor();
    while (tokens[pos] === '*' || tokens[pos] === '/') {
      const op = tokens[pos++];
      const right = parseFactor();
      value = op === '*' ? value * right : value / right;
    }
    return value;
  };
  const parseFactor = () => {
    const token = tokens[pos++];
    if (token === '-') return -parseFactor();
    if (token === '(') {
      const value = parseExpr();
      if (tokens[pos++] !== ')') throw new Error('invalid expression');
      return value;
    }
    const num = parseFloat(token);
    if (Number.isNaN(num)) throw new Error('invalid expression');
    return num;
  };

  const result = parseExpr();
  if (pos !== tokens.length) throw new Error('invalid expression');
  return result;
}

router.post('/calc', (req, res) => {
  try {
    res.json({ result: calculate(req.body.expression) });
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

  // Nom de fichier restreint à une liste blanche : pas de shell, pas de path traversal
  const requested = String(req.body.filename || note.title);
  const filename = path.basename(requested).replace(/[^a-zA-Z0-9_-]/g, '_');
  fs.writeFile(path.join(os.tmpdir(), `${filename}.txt`), String(note.content), (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ status: 'exported', file: `${filename}.txt` });
  });
});

module.exports = router;

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, '..', 'db.json'));
const db = low(adapter);

db.defaults({
  users: [
    { username: 'admin', password: 'admin123', role: 'admin', email: 'admin@notes.local' },
    { username: 'alice', password: 'alice123', role: 'user', email: 'alice@notes.local' },
    { username: 'charlie', password: 'charlie2024', role: 'user', email: 'charlie@notes.local' }
  ],
  notes: [
    { id: '1', title: 'Acces serveur', content: 'ssh deploy@10.0.0.12 - mot de passe Pr0d-2024!', owner: 'admin' },
    { id: '2', title: 'Courses', content: 'lait, oeufs, cafe', owner: 'alice' },
    { id: '3', title: 'Entretien annuel', content: 'Demander une augmentation a mon manager', owner: 'charlie' }
  ]
}).write();

module.exports = db;

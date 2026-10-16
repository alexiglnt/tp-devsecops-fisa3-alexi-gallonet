const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function auth(req, res, next) {
  // Jeton dans l'en-tête, ou dans l'URL pour les liens partagés (?token=...)
  const header = req.headers['authorization'] || (req.query.token && `Bearer ${req.query.token}`);
  if (!header) return res.status(401).json({ error: 'missing token' });

  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
};

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const config = require('./config');
const pkg = require('../package.json');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({
  status: 'ok',
  version: pkg.version,
  node: process.version,
  uptime: process.uptime()
}));

app.use('/auth', authRoutes);
app.use('/notes', noteRoutes);
app.use('/admin', adminRoutes);
app.use('/users', userRoutes);

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});

if (require.main === module) {
  app.listen(config.PORT, () => console.log(`DevSecOps_TP listening on ${config.PORT}`));
}

module.exports = app;

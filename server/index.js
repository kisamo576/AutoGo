require('dotenv').config();

const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');

const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const garageRoutes = require('./routes/garage');
const forumRoutes = require('./routes/forum');
const docsRoutes = require('./routes/docs');
const agentRoutes = require('./routes/agent');
const reportsRoutes = require('./routes/reports');
const healthRoutes = require('./routes/health');

const app = express();
const PROJECT_ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/garage', garageRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/reports', reportsRoutes);

const BLOCKED_PREFIXES = ['/server', '/data', '/node_modules', '/tests', '/scripts', '/team-instructions', '/.env'];
app.use((req, res, next) => {
  if (BLOCKED_PREFIXES.some(p => req.path === p || req.path.startsWith(p + '/'))) {
    return res.status(404).end();
  }
  next();
});

app.use(express.static(PROJECT_ROOT));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AutoGO запущен: http://localhost:${PORT}`);
  });
}

module.exports = app;

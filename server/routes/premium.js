const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const activate = db.prepare(`
  UPDATE users
  SET is_premium = 1, premium_until = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+30 days')
  WHERE id = ? AND (is_premium = 0 OR premium_until IS NULL OR julianday(premium_until) <= julianday('now'))
`);

router.use(requireAuth);
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/status', (req, res) => {
  res.json(db.getPremiumStatus(req.user.id));
});

router.post('/purchase', (req, res) => {
  const { changes } = activate.run(req.user.id);
  const status = db.getPremiumStatus(req.user.id);
  if (!status.is_premium) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  res.status(changes ? 201 : 200).json(status);
});

module.exports = router;

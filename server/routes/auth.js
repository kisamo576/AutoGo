const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, COOKIE_NAME } = require('../middleware/auth');

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000
};

router.post('/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Укажите email и пароль (минимум 6 символов)' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Пользователь с таким email уже зарегистрирован' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)')
    .run(email.toLowerCase().trim(), hash, name || email.split('@')[0], 'user');

  const user = { id: info.lastInsertRowid, email: email.toLowerCase().trim(), name: name || email.split('@')[0], role: 'user' };
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.status(201).json({ user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Укажите email и пароль' });

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  const user = { id: row.id, email: row.email, name: row.name, role: row.role };
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.json({ user });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const user = req.user ? { ...req.user, ...db.getPremiumStatus(req.user.id) } : null;
  res.json({ user });
});

module.exports = router;

// auth.js — чтение JWT из httpOnly-куки и подстановка req.user
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'autogo_token';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, {
    expiresIn: '30d'
  });
}

// Пропускает запрос дальше независимо от наличия токена, но заполняет req.user, если токен валиден
function attachUser(req, res, next) {
  const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

// Требует авторизации
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Требуется авторизация' });
  next();
}

// Требует роль admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Требуются права администратора' });
  next();
}

module.exports = { signToken, attachUser, requireAuth, requireAdmin, COOKIE_NAME, JWT_SECRET };

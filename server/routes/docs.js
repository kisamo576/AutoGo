// docs.js — техническая документация: регламенты, мануалы, схемы
const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { brand, model, category, q } = req.query;
  let sql = 'SELECT * FROM tech_docs WHERE 1=1';
  const params = [];
  if (brand) { sql += ' AND brand = ?'; params.push(brand); }
  if (model) { sql += ' AND model = ?'; params.push(model); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (q) { sql += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY created_at DESC';
  const docs = db.prepare(sql).all(...params);
  res.json({ docs });
});

router.get('/brands', (req, res) => {
  const brands = db.prepare('SELECT DISTINCT brand FROM tech_docs ORDER BY brand').all().map(r => r.brand);
  res.json({ brands });
});

router.get('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM tech_docs WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Документ не найден' });
  res.json({ doc });
});

// Добавление/удаление документации — только администратор (контент должен быть проверенным)
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { brand, model, category, title, content } = req.body || {};
  if (!brand || !category || !title || !content) {
    return res.status(400).json({ error: 'Укажите марку, категорию, заголовок и содержимое' });
  }
  if (!['regulation', 'manual', 'diagram'].includes(category)) {
    return res.status(400).json({ error: 'category должен быть regulation, manual или diagram' });
  }
  const info = db.prepare('INSERT INTO tech_docs (brand, model, category, title, content, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(brand, model || null, category, title, content, req.user.id);
  const doc = db.prepare('SELECT * FROM tech_docs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ doc });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const doc = db.prepare('SELECT * FROM tech_docs WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Документ не найден' });
  db.prepare('DELETE FROM tech_docs WHERE id = ?').run(doc.id);
  res.json({ ok: true });
});

module.exports = router;

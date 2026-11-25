// agent.js — ИИ-агент поиска информации на сторонних форумах
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { searchForums } = require('../services/forumSearch');

const router = express.Router();

router.post('/search', requireAuth, async (req, res) => {
  const { query, brand, model } = req.body || {};
  if (!query || !query.trim()) return res.status(400).json({ error: 'Укажите текст запроса' });

  try {
    const outcome = await searchForums(query.trim(), { brand, model });

    db.prepare('INSERT INTO agent_queries (user_id, query, results_json) VALUES (?, ?, ?)')
      .run(req.user.id, query.trim(), JSON.stringify(outcome));

    if (outcome.failed) {
      return res.status(502).json({
        error: 'Не удалось получить результаты поиска — все источники временно недоступны. Попробуйте позже.',
        details: outcome.errors
      });
    }

    res.json(outcome);
  } catch (err) {
    res.status(500).json({ error: 'Внутренняя ошибка агента поиска', details: err.message });
  }
});

router.get('/history', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, query, created_at FROM agent_queries WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
    .all(req.user.id);
  res.json({ history: rows });
});

router.get('/history/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM agent_queries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Запрос не найден' });
  res.json({ query: row.query, created_at: row.created_at, result: JSON.parse(row.results_json) });
});

module.exports = router;

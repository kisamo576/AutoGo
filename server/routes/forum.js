// forum.js — категории, темы, сообщения, базовая модерация
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM forum_categories ORDER BY id').all();
  res.json({ categories });
});

router.get('/topics', (req, res) => {
  const categorySlug = req.query.category;
  let topics;
  if (categorySlug) {
    topics = db.prepare(`
      SELECT t.*, u.name AS author_name, c.name AS category_name, c.slug AS category_slug,
        (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id AND p.is_deleted = 0) AS posts_count
      FROM forum_topics t
      JOIN users u ON u.id = t.user_id
      JOIN forum_categories c ON c.id = t.category_id
      WHERE c.slug = ?
      ORDER BY t.is_pinned DESC, t.created_at DESC
    `).all(categorySlug);
  } else {
    topics = db.prepare(`
      SELECT t.*, u.name AS author_name, c.name AS category_name, c.slug AS category_slug,
        (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id AND p.is_deleted = 0) AS posts_count
      FROM forum_topics t
      JOIN users u ON u.id = t.user_id
      JOIN forum_categories c ON c.id = t.category_id
      ORDER BY t.is_pinned DESC, t.created_at DESC
    `).all();
  }
  res.json({ topics });
});

router.post('/topics', requireAuth, (req, res) => {
  const { category_id, title, content } = req.body || {};
  if (!category_id || !title || !content) return res.status(400).json({ error: 'Укажите раздел, заголовок и текст сообщения' });

  const category = db.prepare('SELECT * FROM forum_categories WHERE id = ?').get(category_id);
  if (!category) return res.status(400).json({ error: 'Раздел не найден' });

  const topicInfo = db.prepare('INSERT INTO forum_topics (category_id, user_id, title) VALUES (?, ?, ?)')
    .run(category_id, req.user.id, title);
  db.prepare('INSERT INTO forum_posts (topic_id, user_id, content) VALUES (?, ?, ?)')
    .run(topicInfo.lastInsertRowid, req.user.id, content);

  const topic = db.prepare('SELECT * FROM forum_topics WHERE id = ?').get(topicInfo.lastInsertRowid);
  res.status(201).json({ topic });
});

router.get('/topics/:id', (req, res) => {
  const topic = db.prepare(`
    SELECT t.*, u.name AS author_name, c.name AS category_name
    FROM forum_topics t JOIN users u ON u.id = t.user_id JOIN forum_categories c ON c.id = t.category_id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Тема не найдена' });

  const posts = db.prepare(`
    SELECT p.*, u.name AS author_name, u.role AS author_role
    FROM forum_posts p JOIN users u ON u.id = p.user_id
    WHERE p.topic_id = ? AND p.is_deleted = 0
    ORDER BY p.created_at ASC
  `).all(topic.id);

  res.json({ topic, posts });
});

router.post('/topics/:id/posts', requireAuth, (req, res) => {
  const topic = db.prepare('SELECT * FROM forum_topics WHERE id = ?').get(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Тема не найдена' });
  if (topic.is_locked) return res.status(403).json({ error: 'Тема закрыта для новых сообщений' });

  const { content } = req.body || {};
  if (!content || !content.trim()) return res.status(400).json({ error: 'Сообщение не может быть пустым' });

  const info = db.prepare('INSERT INTO forum_posts (topic_id, user_id, content) VALUES (?, ?, ?)')
    .run(topic.id, req.user.id, content.trim());
  const post = db.prepare(`
    SELECT p.*, u.name AS author_name, u.role AS author_role FROM forum_posts p
    JOIN users u ON u.id = p.user_id WHERE p.id = ?
  `).get(info.lastInsertRowid);
  res.status(201).json({ post });
});

// Модерация: удалить сообщение (автор или админ)
router.delete('/posts/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Сообщение не найдено' });
  if (post.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }
  db.prepare('UPDATE forum_posts SET is_deleted = 1 WHERE id = ?').run(post.id);
  res.json({ ok: true });
});

// Модерация: закрыть/открыть тему (только админ)
router.post('/topics/:id/lock', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Недостаточно прав' });
  const topic = db.prepare('SELECT * FROM forum_topics WHERE id = ?').get(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Тема не найдена' });
  const newState = topic.is_locked ? 0 : 1;
  db.prepare('UPDATE forum_topics SET is_locked = ? WHERE id = ?').run(newState, topic.id);
  res.json({ ok: true, is_locked: newState });
});

// Модерация: удалить тему (только админ)
router.delete('/topics/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Недостаточно прав' });
  const topic = db.prepare('SELECT * FROM forum_topics WHERE id = ?').get(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Тема не найдена' });
  db.prepare('DELETE FROM forum_topics WHERE id = ?').run(topic.id);
  res.json({ ok: true });
});

module.exports = router;

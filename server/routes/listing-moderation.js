const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { listingId, toListing } = require('../services/listings');

const router = express.Router();

const queue = db.prepare(`
  SELECT l.*, u.name AS seller_name
  FROM listings l
  JOIN users u ON u.id = l.user_id
  WHERE l.status = 'published' AND l.review_status = 'pending'
  ORDER BY l.id
  LIMIT 50
`);

const decide = db.prepare(`
  UPDATE listings
  SET review_status = ?, review_note = ?
  WHERE id = ? AND revision = ? AND status = 'published' AND review_status = 'pending'
  RETURNING *
`);

router.use(requireAuth, requireAdmin);
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/queue', (req, res) => {
  const listings = queue.all().map(row => ({ ...toListing(row), seller_name: row.seller_name }));
  res.json({ listings });
});

router.patch('/:id', (req, res) => {
  const id = listingId(req.params.id);
  const { decision, reason = '', revision } = req.body ?? {};
  if (!id || !['approved', 'rejected'].includes(decision) || !Number.isSafeInteger(revision) || revision < 1) {
    return res.status(400).json({ error: 'Укажите объявление и решение модерации' });
  }
  if (typeof reason !== 'string' || reason.trim().length > 500 || (decision === 'rejected' && !reason.trim())) {
    return res.status(400).json({ error: 'Для отклонения нужна причина до 500 символов' });
  }

  const row = decide.get(decision, decision === 'rejected' ? reason.trim() : '', id, revision);
  if (!row) return res.status(409).json({ error: 'Объявление изменилось. Обновите очередь.' });
  res.json({ listing: toListing(row) });
});

module.exports = router;

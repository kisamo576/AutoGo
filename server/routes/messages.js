const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { listingId, listingPublicId, models } = require('../services/listings');

const router = express.Router();
const publishedListing = db.prepare(
  "SELECT user_id FROM listings WHERE id = ? AND status = 'published' AND review_status = 'approved'"
);
const hiddenListing = db.prepare('SELECT 1 FROM hidden_listings WHERE ad_id = ?');
const createThread = db.prepare(`
  INSERT INTO listing_conversations (listing_id, buyer_id, seller_id)
  VALUES (?, ?, ?) ON CONFLICT (listing_id, buyer_id) DO NOTHING
`);
const threadByBuyer = db.prepare('SELECT id FROM listing_conversations WHERE listing_id = ? AND buyer_id = ?');
const participantThread = db.prepare(
  'SELECT id FROM listing_conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)'
);
const addMessage = db.prepare(`
  INSERT INTO listing_messages (conversation_id, author_id, body)
  VALUES (?, ?, ?) RETURNING id, author_id, body, created_at
`);
const history = db.prepare(`
  SELECT id, author_id, body, created_at FROM listing_messages
  WHERE conversation_id = ? AND (? IS NULL OR id < ?)
  ORDER BY id DESC LIMIT 51
`);
const threadList = db.prepare(`
  SELECT c.id, c.listing_id, l.model_id, u.name AS counterpart, m.body AS last_message
  FROM listing_conversations c
  JOIN listings l ON l.id = c.listing_id
  JOIN users u ON u.id = CASE WHEN c.buyer_id = ? THEN c.seller_id ELSE c.buyer_id END
  JOIN listing_messages m ON m.id = (
    SELECT id FROM listing_messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1
  )
  WHERE c.buyer_id = ? OR c.seller_id = ?
  ORDER BY m.id DESC
`);

function readBody(req) {
  const body = req.body?.body;
  if (typeof body !== 'string') return null;
  const value = body.trim();
  return value.length > 0 && value.length <= 1000 ? value : null;
}

function forParticipant(req, res, next) {
  const id = Number(req.params.id);
  const user = req.user.id;
  if (!Number.isSafeInteger(id) || !participantThread.get(id, user, user)) {
    return res.status(404).json({ error: 'Диалог не найден' });
  }
  req.threadId = id;
  next();
}

router.use(requireAuth);
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/conversations', (req, res) => {
  const { id } = req.user;
  const conversations = threadList.all(id, id, id).map(row => {
    const { brand, model } = models.get(row.model_id);
    return { id: row.id, listing_id: listingPublicId(row.listing_id), title: brand + ' ' + model,
      counterpart: row.counterpart, last_message: row.last_message };
  });
  res.json({ conversations });
});

router.post('/conversations', (req, res) => {
  const publicId = req.body?.listing_id;
  const id = Number.isSafeInteger(publicId) ? listingId(publicId) : null;
  const body = readBody(req);
  if (!id || !body) return res.status(400).json({ error: 'Выберите объявление и напишите сообщение до 1000 символов' });

  const buyer = req.user.id;
  db.exec('BEGIN IMMEDIATE');
  try {
    const listing = publishedListing.get(id);
    if (!listing || hiddenListing.get(publicId) || listing.user_id === buyer) {
      db.exec('ROLLBACK');
      return res.status(409).json({ error: listing?.user_id === buyer
        ? 'Нельзя написать по своему объявлению' : 'Объявление сейчас недоступно' });
    }

    createThread.run(id, buyer, listing.user_id);
    const thread = threadByBuyer.get(id, buyer);
    const message = addMessage.get(thread.id, buyer, body);
    db.exec('COMMIT');
    return res.status(201).json({ conversation_id: thread.id, message });
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
});

router.get('/conversations/:id/messages', forParticipant, (req, res) => {
  const before = req.query.before === undefined ? null : Number(req.query.before);
  if (before !== null && (!Number.isSafeInteger(before) || before < 1)) {
    return res.status(400).json({ error: 'Неверный указатель истории' });
  }
  const rows = history.all(req.threadId, before, before);
  res.json({ messages: rows.slice(0, 50).reverse(), hasMore: rows.length > 50 });
});

router.post('/conversations/:id/messages', forParticipant, (req, res) => {
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: 'Напишите сообщение до 1000 символов' });
  const message = addMessage.get(req.threadId, req.user.id, body);
  res.status(201).json({ message });
});

module.exports = router;

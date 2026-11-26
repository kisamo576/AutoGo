const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { models, listingId, toListing } = require('../services/listings');

const router = express.Router();

const ownerRows = db.prepare('SELECT * FROM listings WHERE user_id = ? ORDER BY id DESC');
const ownerRow = db.prepare('SELECT * FROM listings WHERE id = ? AND user_id = ?');
const insert = db.prepare(`
  INSERT INTO listings (user_id, model_id, year, price, mileage, description)
  VALUES (?, ?, ?, ?, ?, ?)
  RETURNING *
`);
const update = db.prepare(`
  UPDATE listings
  SET model_id = ?, year = ?, price = ?, mileage = ?, description = ?, updated_at = datetime('now')
  WHERE id = ? AND user_id = ?
  RETURNING *
`);
const changeStatus = db.prepare(`
  UPDATE listings SET status = ?, updated_at = datetime('now')
  WHERE id = ? AND user_id = ?
  RETURNING *
`);

function validate(body) {
  const { model_id: modelId, year, price, mileage, description } = body ?? {};
  if (!models.has(modelId)) return 'Выберите марку и модель';
  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    return 'Укажите допустимый год выпуска';
  }
  if (!Number.isSafeInteger(price) || price < 1 || price > 10000000) {
    return 'Укажите цену от 1 до 10 000 000 долларов';
  }
  if (!Number.isSafeInteger(mileage) || mileage < 0 || mileage > 3000000) {
    return 'Укажите пробег от 0 до 3 000 000 км';
  }
  if (typeof description !== 'string' || !description.trim() || description.trim().length > 2000) {
    return 'Добавьте описание до 2000 символов';
  }
  return null;
}

function inputValues(body) {
  return [body.model_id, body.year, body.price, body.mileage, body.description.trim()];
}

function sendListing(res, row, status = 200) {
  if (!row) return res.status(404).json({ error: 'Объявление не найдено' });
  res.status(status).json({ listing: toListing(row) });
}

router.use(requireAuth);
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/mine', (req, res) => {
  res.json({ listings: ownerRows.all(req.user.id).map(toListing) });
});

router.get('/:id', (req, res) => {
  sendListing(res, ownerRow.get(listingId(req.params.id), req.user.id));
});

router.post('/', (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  sendListing(res, insert.get(req.user.id, ...inputValues(req.body)), 201);
});

router.put('/:id', (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  sendListing(res, update.get(...inputValues(req.body), listingId(req.params.id), req.user.id));
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body ?? {};
  if (!['published', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Неизвестный статус объявления' });
  }
  sendListing(res, changeStatus.get(status, listingId(req.params.id), req.user.id));
});

module.exports = router;

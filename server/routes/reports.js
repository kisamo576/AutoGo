const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { carsDatabase } = require('../../cars');
const { reportReasons, reportStatuses } = require('../../report-options');

const router = express.Router();
const adIds = new Set(carsDatabase.map(car => car.id));

const createReport = db.prepare(`
  INSERT INTO ad_reports (user_id, ad_id, reason, comment)
  VALUES (?, ?, ?, ?)
  ON CONFLICT (user_id, ad_id) WHERE status = 'pending' DO NOTHING
  RETURNING id, ad_id, reason, comment, status, created_at
`);

const reportRows = db.prepare(`
  SELECT r.id, r.ad_id, r.reason, r.comment, r.status, r.created_at,
         r.reviewed_at, u.name AS reporter_name
  FROM ad_reports r
  JOIN users u ON u.id = r.user_id
  WHERE (? IS NULL OR r.status = ?)
  ORDER BY r.id DESC
  LIMIT 50 OFFSET ?
`);

const countReports = db.prepare(`
  SELECT COUNT(*) AS total FROM ad_reports WHERE (? IS NULL OR status = ?)
`);

const reviewReport = db.prepare(`
  UPDATE ad_reports
  SET status = ?, reviewed_by = ?, reviewed_at = datetime('now')
  WHERE id = ? AND status = 'pending'
  RETURNING id, status, reviewed_at
`);

const getReport = db.prepare('SELECT id FROM ad_reports WHERE id = ?');

function readPage(value) {
  const page = Number(value ?? 1);
  return Number.isSafeInteger(page) && page >= 1 && page <= 1000000 ? page : null;
}

router.post('/', requireAuth, (req, res) => {
  const { ad_id: adId, reason, comment = '' } = req.body ?? {};
  if (!Number.isSafeInteger(adId) || !adIds.has(adId)) {
    return res.status(400).json({ error: 'Выбери существующее объявление' });
  }
  if (typeof reason !== 'string' || !Object.hasOwn(reportReasons, reason)) {
    return res.status(400).json({ error: 'Выбери причину жалобы' });
  }
  if (typeof comment !== 'string' || comment.trim().length > 500) {
    return res.status(400).json({ error: 'Комментарий должен содержать не более 500 символов' });
  }
  if (reason === 'other' && !comment.trim()) {
    return res.status(400).json({ error: 'Опиши причину жалобы в комментарии' });
  }

  const report = createReport.get(req.user.id, adId, reason, comment.trim());
  if (!report) return res.status(409).json({ error: 'Твоя жалоба на это объявление уже на рассмотрении' });
  res.status(201).json({ report });
});

router.get('/', requireAuth, requireAdmin, (req, res) => {
  const status = req.query.status ?? null;
  if (status !== null && (typeof status !== 'string' || !Object.hasOwn(reportStatuses, status))) {
    return res.status(400).json({ error: 'Неизвестный статус' });
  }
  const page = readPage(req.query.page);
  if (page === null) {
    return res.status(400).json({ error: 'Неверный номер страницы' });
  }

  res.json({
    reports: reportRows.all(status, status, (page - 1) * 50),
    total: countReports.get(status, status).total,
    pending: countReports.get('pending', 'pending').total,
    page,
    pageSize: 50
  });
});

router.patch('/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};
  if (!Number.isSafeInteger(id) || id < 1 || !['resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Укажи жалобу и итог рассмотрения' });
  }
  const report = reviewReport.get(status, req.user.id, id);
  if (report) return res.json({ report });
  if (!getReport.get(id)) return res.status(404).json({ error: 'Жалоба не найдена' });
  res.status(409).json({ error: 'Эту жалобу уже рассмотрели' });
});

module.exports = router;

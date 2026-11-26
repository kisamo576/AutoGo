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
         r.reviewed_at, r.reply, u.name AS reporter_name, h.ad_id IS NOT NULL AS listing_hidden
  FROM ad_reports r
  JOIN users u ON u.id = r.user_id
  LEFT JOIN hidden_listings h ON h.ad_id = r.ad_id
  WHERE (? IS NULL OR r.status = ?)
  ORDER BY r.id DESC
  LIMIT 50 OFFSET ?
`);

const countReports = db.prepare(`
  SELECT COUNT(*) AS total FROM ad_reports WHERE (? IS NULL OR status = ?)
`);


const reviewReport = db.prepare(`
  UPDATE ad_reports
  SET status = ?, reply = ?, reviewed_by = ?, reviewed_at = datetime('now')
  WHERE id = ? AND status = 'pending'
  RETURNING id, ad_id, status, reply, reviewed_at
`);

const hideListing = db.prepare(`
  INSERT INTO hidden_listings (ad_id, hidden_by) VALUES (?, ?)
  ON CONFLICT (ad_id) DO NOTHING
`);
const restoreListing = db.prepare('DELETE FROM hidden_listings WHERE ad_id = ?');
const isHidden = db.prepare('SELECT 1 FROM hidden_listings WHERE ad_id = ?');
const confirmedReportForAd = db.prepare("SELECT 1 FROM ad_reports WHERE ad_id = ? AND status = 'resolved' LIMIT 1");
const getReport = db.prepare('SELECT id FROM ad_reports WHERE id = ?');
const ownReports = db.prepare(`
  SELECT r.id, r.ad_id, r.reason, r.comment, r.status, r.reply, r.created_at,
         r.reviewed_at, h.ad_id IS NOT NULL AS listing_hidden
  FROM ad_reports r
  LEFT JOIN hidden_listings h ON h.ad_id = r.ad_id
  WHERE r.user_id = ?
  ORDER BY r.id DESC
  LIMIT 21 OFFSET ?
`);

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

  if (isHidden.get(adId)) return res.status(409).json({ error: 'Объявление скрыто модератором' });

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


router.get('/mine', requireAuth, (req, res) => {
  const page = readPage(req.query.page);
  if (page === null) return res.status(400).json({ error: 'Неверный номер страницы' });

  const reports = ownReports.all(req.user.id, (page - 1) * 20);
  res.json({ reports: reports.slice(0, 20), hasMore: reports.length > 20 });
});

router.patch('/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { status, reply = '', hide = false } = req.body ?? {};
  if (!Number.isSafeInteger(id) || id < 1 || !['resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Укажи жалобу и итог рассмотрения' });
  }
  if (typeof reply !== 'string' || reply.trim().length > 1000) {
    return res.status(400).json({ error: 'Ответ должен содержать не более 1000 символов' });
  }
  if (typeof hide !== 'boolean' || (hide && status !== 'resolved')) {
    return res.status(400).json({ error: 'Скрыть объявление можно при подтверждении жалобы' });
  }

  db.exec('BEGIN');
  let report;
  try {
    report = reviewReport.get(status, reply.trim(), req.user.id, id);
    if (report && hide) hideListing.run(report.ad_id, req.user.id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  if (report) return res.json({ report });
  if (!getReport.get(id)) return res.status(404).json({ error: 'Жалоба не найдена' });
  res.status(409).json({ error: 'Эту жалобу уже рассмотрели' });
});

router.put('/listings/:id/visibility', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!adIds.has(id)) return res.status(404).json({ error: 'Объявление не найдено' });
  const { hidden } = req.body ?? {};
  if (typeof hidden !== 'boolean') return res.status(400).json({ error: 'Укажи видимость объявления' });
  if (hidden && !confirmedReportForAd.get(id)) {
    return res.status(409).json({ error: 'Сначала подтверди жалобу на это объявление' });
  }

  if (hidden) hideListing.run(id, req.user.id);
  else restoreListing.run(id);
  res.json({ hidden });
});

module.exports = router;

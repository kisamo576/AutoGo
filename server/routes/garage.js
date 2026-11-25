// garage.js — машины пользователя, трекер заправок/зарядок, журнал ТО
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Загружает авто и проверяет, что оно принадлежит текущему пользователю
function loadOwnCar(req, res, next) {
  const car = db.prepare('SELECT * FROM garage_cars WHERE id = ?').get(req.params.carId);
  if (!car) return res.status(404).json({ error: 'Автомобиль не найден' });
  if (car.user_id !== req.user.id) return res.status(403).json({ error: 'Это не ваш автомобиль' });
  req.car = car;
  next();
}

// ---------- Машины в гараже ----------
router.get('/', (req, res) => {
  const cars = db.prepare('SELECT * FROM garage_cars WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ cars });
});

router.post('/', (req, res) => {
  const { brand, model, year, vin, plate_number, fuel_type, engine_volume, odometer, photo_url, note } = req.body || {};
  if (!brand || !model) return res.status(400).json({ error: 'Укажите марку и модель' });
  const validFuelTypes = ['petrol', 'diesel', 'electric', 'hybrid'];
  const ft = validFuelTypes.includes(fuel_type) ? fuel_type : 'petrol';

  const info = db.prepare(`INSERT INTO garage_cars
    (user_id, brand, model, year, vin, plate_number, fuel_type, engine_volume, odometer, photo_url, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    req.user.id, brand, model, year || null, vin || null, plate_number || null,
    ft, engine_volume || null, odometer || 0, photo_url || null, note || null
  );
  const car = db.prepare('SELECT * FROM garage_cars WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ car });
});

router.get('/:carId', loadOwnCar, (req, res) => {
  res.json({ car: req.car });
});

router.put('/:carId', loadOwnCar, (req, res) => {
  const { brand, model, year, vin, plate_number, fuel_type, engine_volume, odometer, photo_url, note } = req.body || {};
  const c = req.car;
  db.prepare(`UPDATE garage_cars SET brand=?, model=?, year=?, vin=?, plate_number=?, fuel_type=?,
    engine_volume=?, odometer=?, photo_url=?, note=? WHERE id=?`).run(
    brand ?? c.brand, model ?? c.model, year ?? c.year, vin ?? c.vin, plate_number ?? c.plate_number,
    fuel_type ?? c.fuel_type, engine_volume ?? c.engine_volume, odometer ?? c.odometer,
    photo_url ?? c.photo_url, note ?? c.note, c.id
  );
  const updated = db.prepare('SELECT * FROM garage_cars WHERE id = ?').get(c.id);
  res.json({ car: updated });
});

router.delete('/:carId', loadOwnCar, (req, res) => {
  db.prepare('DELETE FROM garage_cars WHERE id = ?').run(req.car.id);
  res.json({ ok: true });
});

// ---------- Трекер заправок/зарядок ----------
router.get('/:carId/fuel-logs', loadOwnCar, (req, res) => {
  const logs = db.prepare('SELECT * FROM fuel_logs WHERE car_id = ? ORDER BY log_date DESC, id DESC').all(req.car.id);
  res.json({ logs });
});

router.post('/:carId/fuel-logs', loadOwnCar, (req, res) => {
  const { entry_type, log_date, amount, cost, odometer, station, note } = req.body || {};
  if (!['fuel', 'charge'].includes(entry_type)) return res.status(400).json({ error: 'entry_type должен быть fuel или charge' });
  if (!log_date || amount == null || cost == null || odometer == null) {
    return res.status(400).json({ error: 'Укажите дату, объём/количество, стоимость и пробег' });
  }
  const info = db.prepare(`INSERT INTO fuel_logs (car_id, entry_type, log_date, amount, cost, odometer, station, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(req.car.id, entry_type, log_date, amount, cost, odometer, station || null, note || null);

  if (odometer > req.car.odometer) {
    db.prepare('UPDATE garage_cars SET odometer = ? WHERE id = ?').run(odometer, req.car.id);
  }

  const log = db.prepare('SELECT * FROM fuel_logs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ log });
});

router.delete('/:carId/fuel-logs/:logId', loadOwnCar, (req, res) => {
  const log = db.prepare('SELECT * FROM fuel_logs WHERE id = ? AND car_id = ?').get(req.params.logId, req.car.id);
  if (!log) return res.status(404).json({ error: 'Запись не найдена' });
  db.prepare('DELETE FROM fuel_logs WHERE id = ?').run(log.id);
  res.json({ ok: true });
});

// Статистика: расход, затраты, пробег между заправками
router.get('/:carId/fuel-stats', loadOwnCar, (req, res) => {
  const logs = db.prepare('SELECT * FROM fuel_logs WHERE car_id = ? ORDER BY odometer ASC, log_date ASC').all(req.car.id);

  let totalCost = 0;
  let totalAmount = 0;
  let totalFuelDistance = 0;
  const consumptionSegments = [];

  for (let i = 0; i < logs.length; i++) {
    totalCost += logs[i].cost;
    totalAmount += logs[i].amount;
    if (i > 0) {
      const distance = logs[i].odometer - logs[i - 1].odometer;
      if (distance > 0) {
        totalFuelDistance += distance;
        consumptionSegments.push({
          from_odometer: logs[i - 1].odometer,
          to_odometer: logs[i].odometer,
          distance,
          amount: logs[i].amount,
          per_100km: Math.round((logs[i].amount / distance) * 100 * 100) / 100,
          entry_type: logs[i].entry_type
        });
      }
    }
  }

  const avgPer100km = consumptionSegments.length
    ? Math.round((consumptionSegments.reduce((s, x) => s + x.amount, 0) / totalFuelDistance) * 100 * 100) / 100
    : null;

  res.json({
    totalEntries: logs.length,
    totalCost: Math.round(totalCost * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalDistance: totalFuelDistance,
    avgCostPerKm: totalFuelDistance ? Math.round((totalCost / totalFuelDistance) * 100) / 100 : null,
    avgPer100km,
    segments: consumptionSegments
  });
});

// ---------- Журнал ТО ----------
router.get('/:carId/maintenance', loadOwnCar, (req, res) => {
  const logs = db.prepare('SELECT * FROM maintenance_logs WHERE car_id = ? ORDER BY log_date DESC, id DESC').all(req.car.id);
  res.json({ logs });
});

router.post('/:carId/maintenance', loadOwnCar, (req, res) => {
  const { log_date, odometer, work_description, cost, next_due_odometer, next_due_date, note } = req.body || {};
  if (!log_date || odometer == null || !work_description) {
    return res.status(400).json({ error: 'Укажите дату, пробег и описание работ' });
  }
  const info = db.prepare(`INSERT INTO maintenance_logs
    (car_id, log_date, odometer, work_description, cost, next_due_odometer, next_due_date, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    req.car.id, log_date, odometer, work_description, cost || 0, next_due_odometer || null, next_due_date || null, note || null
  );
  if (odometer > req.car.odometer) {
    db.prepare('UPDATE garage_cars SET odometer = ? WHERE id = ?').run(odometer, req.car.id);
  }
  const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ log });
});

router.delete('/:carId/maintenance/:logId', loadOwnCar, (req, res) => {
  const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ? AND car_id = ?').get(req.params.logId, req.car.id);
  if (!log) return res.status(404).json({ error: 'Запись не найдена' });
  db.prepare('DELETE FROM maintenance_logs WHERE id = ?').run(log.id);
  res.json({ ok: true });
});

// Ближайшее ТО: по пробегу и по дате
router.get('/:carId/maintenance-reminders', loadOwnCar, (req, res) => {
  const logs = db.prepare(`SELECT * FROM maintenance_logs WHERE car_id = ?
    AND (next_due_odometer IS NOT NULL OR next_due_date IS NOT NULL)
    ORDER BY log_date DESC`).all(req.car.id);

  const reminders = logs.map(l => {
    const kmLeft = l.next_due_odometer != null ? l.next_due_odometer - req.car.odometer : null;
    const daysLeft = l.next_due_date ? Math.ceil((new Date(l.next_due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
    return {
      based_on: l.work_description,
      next_due_odometer: l.next_due_odometer,
      next_due_date: l.next_due_date,
      km_left: kmLeft,
      days_left: daysLeft,
      is_due: (kmLeft != null && kmLeft <= 0) || (daysLeft != null && daysLeft <= 0)
    };
  });

  res.json({ current_odometer: req.car.odometer, reminders });
});

module.exports = router;

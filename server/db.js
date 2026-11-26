const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.AUTOGO_DB_PATH || path.join(DATA_DIR, 'autogo.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS garage_cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    vin TEXT,
    plate_number TEXT,
    fuel_type TEXT NOT NULL DEFAULT 'petrol',
    engine_volume REAL,
    odometer INTEGER NOT NULL DEFAULT 0,
    photo_url TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fuel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES garage_cars(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL,
    log_date TEXT NOT NULL,
    amount REAL NOT NULL,
    cost REAL NOT NULL,
    odometer INTEGER NOT NULL,
    station TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES garage_cars(id) ON DELETE CASCADE,
    log_date TEXT NOT NULL,
    odometer INTEGER NOT NULL,
    work_description TEXT NOT NULL,
    cost REAL NOT NULL DEFAULT 0,
    next_due_odometer INTEGER,
    next_due_date TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS part_replacements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES garage_cars(id) ON DELETE CASCADE,
    replaced_date TEXT NOT NULL,
    odometer INTEGER,
    part_name TEXT NOT NULL,
    cost REAL NOT NULL DEFAULT 0,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES garage_cars(id) ON DELETE CASCADE,
    inspection_type TEXT NOT NULL,
    issued_date TEXT,
    expiry_date TEXT NOT NULL,
    cost REAL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS forum_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS forum_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_locked INTEGER NOT NULL DEFAULT 0,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tech_docs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    model TEXT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ad_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TEXT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS ad_reports_pending_user_ad
    ON ad_reports (user_id, ad_id) WHERE status = 'pending';


  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    price INTEGER NOT NULL,
    mileage INTEGER NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'archived')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS listings_by_owner ON listings (user_id, id);
  CREATE INDEX IF NOT EXISTS listings_by_status ON listings (status, id);

  CREATE TABLE IF NOT EXISTS hidden_listings (
    ad_id INTEGER PRIMARY KEY,
    hidden_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    hidden_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

if (!db.prepare('PRAGMA table_info(ad_reports)').all().some(column => column.name === 'reply')) {
  db.exec("ALTER TABLE ad_reports ADD COLUMN reply TEXT NOT NULL DEFAULT ''");
}

const userColumns = new Set(db.prepare('PRAGMA table_info(users)').all().map(column => column.name));
if (!userColumns.has('is_premium')) {
  db.exec('ALTER TABLE users ADD COLUMN is_premium INTEGER NOT NULL DEFAULT 0');
}
if (!userColumns.has('premium_until')) {
  db.exec('ALTER TABLE users ADD COLUMN premium_until TEXT');
}

const premiumStatusByUser = db.prepare(`
  SELECT is_premium = 1 AND COALESCE(julianday(premium_until) > julianday('now'), 0) AS active,
         premium_until
  FROM users
  WHERE id = ?
`);

function getPremiumStatus(userId) {
  const row = premiumStatusByUser.get(userId);
  return { is_premium: Boolean(row?.active), premium_until: row?.premium_until ?? null };
}

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const userHash = bcrypt.hashSync('user12345', 10);
    db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)')
      .run('admin@autogo.local', adminHash, 'Администратор', 'admin');
    db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)')
      .run('user@autogo.local', userHash, 'Иван Петров', 'user');
  }

  const categoryCount = db.prepare('SELECT COUNT(*) AS c FROM forum_categories').get().c;
  if (categoryCount === 0) {
    const categories = [
      ['Общие вопросы', 'general', 'Обсуждение всего, что связано с автомобилями'],
      ['Ремонт и обслуживание', 'repair', 'Вопросы по ремонту, диагностике, ТО'],
      ['Покупка и продажа', 'market', 'Советы по сделкам, оценке авто, документам'],
      ['Электромобили', 'ev', 'Зарядка, пробег на электричестве, опыт эксплуатации EV']
    ];
    const insert = db.prepare('INSERT INTO forum_categories (name, slug, description) VALUES (?, ?, ?)');
    for (const c of categories) insert.run(...c);
  }

  const docsCount = db.prepare('SELECT COUNT(*) AS c FROM tech_docs').get().c;
  if (docsCount === 0) {
    const docs = [
      ['BMW', 'X5', 'regulation', 'Регламент ТО BMW X5 (G05)',
        '# Регламент технического обслуживания BMW X5\n\n' +
        '- Замена моторного масла и фильтра: каждые 10 000–15 000 км или 1 раз в год\n' +
        '- Замена воздушного фильтра двигателя: каждые 30 000 км\n' +
        '- Замена салонного фильтра: каждые 15 000 км\n' +
        '- Замена тормозной жидкости: каждые 2 года\n' +
        '- Проверка тормозных колодок: каждые 20 000 км\n' +
        '- Замена свечей зажигания: каждые 60 000 км'],
      ['Toyota', 'Camry', 'regulation', 'Регламент ТО Toyota Camry',
        '# Регламент технического обслуживания Toyota Camry\n\n' +
        '- Замена масла: каждые 10 000 км\n' +
        '- Замена фильтра салона: каждые 15 000 км\n' +
        '- Замена ремня/цепи ГРМ: по регламенту завода (см. VIN-паспорт)\n' +
        '- Проверка уровня охлаждающей жидкости: при каждом ТО'],
      ['Volkswagen', 'Golf', 'manual', 'Общие рекомендации по эксплуатации VW Golf',
        '# Эксплуатация Volkswagen Golf\n\n' +
        'Рекомендуемое топливо: АИ-95. Интервал замены масла — согласно Long Life режиму или ' +
        'каждые 15 000 км в обычном режиме. Для роботизированной коробки DSG рекомендована ' +
        'замена масла в коробке каждые 60 000 км.'],
      ['Общее', null, 'diagram', 'Как читать VIN-номер автомобиля',
        '# Структура VIN-номера\n\n' +
        'VIN состоит из 17 символов:\n' +
        '1–3: World Manufacturer Identifier (производитель)\n' +
        '4–9: Vehicle Descriptor Section (характеристики модели)\n' +
        '10: год выпуска\n' +
        '11: завод-изготовитель\n' +
        '12–17: серийный номер автомобиля']
    ];
    const insert = db.prepare('INSERT INTO tech_docs (brand, model, category, title, content) VALUES (?, ?, ?, ?, ?)');
    for (const d of docs) insert.run(...d);
  }
}

seed();

module.exports = db;
module.exports.getPremiumStatus = getPremiumStatus;

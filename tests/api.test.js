// api.test.js — базовые проверки работоспособности API (healthcheck + ключевые сценарии)
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

// Тесты работают на отдельной временной БД, чтобы не трогать рабочие данные разработчика
const tmpDbPath = path.join(os.tmpdir(), `autogo-test-${Date.now()}.db`);
process.env.AUTOGO_DB_PATH = tmpDbPath;
process.env.JWT_SECRET = 'test_secret';

const app = require('../server/index.js');
const db = require('../server/db.js');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  fs.rmSync(tmpDbPath, { force: true });
});

function extractCookie(response) {
  const setCookie = response.headers.get('set-cookie');
  return setCookie ? setCookie.split(';')[0] : null;
}

test('GET /api/health возвращает статус ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.db, 'ok');
});

test('регистрация и получение текущего пользователя', async () => {
  const email = `test_${Date.now()}@example.com`;
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'Тест Тестов' })
  });
  assert.equal(res.status, 201);
  const cookie = extractCookie(res);
  assert.ok(cookie, 'ожидалась cookie сессии после регистрации');

  const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  const meData = await meRes.json();
  assert.equal(meData.user.email, email);
});

test('без авторизации гараж недоступен', async () => {
  const res = await fetch(`${baseUrl}/api/garage`);
  assert.equal(res.status, 401);
});

test('полный цикл: авто → заправка → статистика расхода', async () => {
  const email = `garage_${Date.now()}@example.com`;
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'Гараж Тестов' })
  });
  const cookie = extractCookie(registerRes);
  const authHeaders = { 'Content-Type': 'application/json', Cookie: cookie };

  const carRes = await fetch(`${baseUrl}/api/garage`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ brand: 'Toyota', model: 'Corolla', year: 2021, odometer: 10000 })
  });
  assert.equal(carRes.status, 201);
  const { car } = await carRes.json();

  await fetch(`${baseUrl}/api/garage/${car.id}/fuel-logs`, {
    method: 'POST', headers: authHeaders,
    body: JSON.stringify({ entry_type: 'fuel', log_date: '2026-01-01', amount: 30, cost: 45, odometer: 10400 })
  });
  await fetch(`${baseUrl}/api/garage/${car.id}/fuel-logs`, {
    method: 'POST', headers: authHeaders,
    body: JSON.stringify({ entry_type: 'fuel', log_date: '2026-01-10', amount: 28, cost: 42, odometer: 10800 })
  });

  const statsRes = await fetch(`${baseUrl}/api/garage/${car.id}/fuel-stats`, { headers: authHeaders });
  const stats = await statsRes.json();
  assert.equal(stats.totalEntries, 2);
  assert.equal(stats.totalDistance, 400);
  assert.equal(stats.avgPer100km, 7);
});

test('форум: создание темы и ответа', async () => {
  const email = `forum_${Date.now()}@example.com`;
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'Форум Тестов' })
  });
  const cookie = extractCookie(registerRes);
  const authHeaders = { 'Content-Type': 'application/json', Cookie: cookie };

  const { categories } = await (await fetch(`${baseUrl}/api/forum/categories`)).json();
  assert.ok(categories.length > 0);

  const topicRes = await fetch(`${baseUrl}/api/forum/topics`, {
    method: 'POST', headers: authHeaders,
    body: JSON.stringify({ category_id: categories[0].id, title: 'Тестовая тема', content: 'Текст темы' })
  });
  assert.equal(topicRes.status, 201);
  const { topic } = await topicRes.json();

  const postRes = await fetch(`${baseUrl}/api/forum/topics/${topic.id}/posts`, {
    method: 'POST', headers: authHeaders,
    body: JSON.stringify({ content: 'Ответ в теме' })
  });
  assert.equal(postRes.status, 201);

  const detailRes = await fetch(`${baseUrl}/api/forum/topics/${topic.id}`);
  const detail = await detailRes.json();
  assert.equal(detail.posts.length, 2);
});

test('агент поиска возвращает результат из локальной базы знаний без сети', async () => {
  const email = `agent_${Date.now()}@example.com`;
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'Агент Тестов' })
  });
  const cookie = extractCookie(registerRes);

  const res = await fetch(`${baseUrl}/api/agent/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ query: 'стук в подвеске' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.results.length > 0);
  assert.ok(data.suggested_communities.length > 0);
});

test('документация: фильтрация по марке', async () => {
  const res = await fetch(`${baseUrl}/api/docs?brand=Toyota`);
  const data = await res.json();
  assert.ok(data.docs.length > 0);
  assert.ok(data.docs.every(d => d.brand === 'Toyota'));
});

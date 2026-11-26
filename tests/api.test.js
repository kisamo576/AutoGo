const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

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

test('запчасти и проверки: добавление и напоминания', async () => {
  const email = `parts_${Date.now()}@example.com`;
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'Запчасти Тестов' })
  });
  const cookie = extractCookie(registerRes);
  const authHeaders = { 'Content-Type': 'application/json', Cookie: cookie };

  const carRes = await fetch(`${baseUrl}/api/garage`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ brand: 'Honda', model: 'Civic', year: 2019, odometer: 50000 })
  });
  const { car } = await carRes.json();

  const partRes = await fetch(`${baseUrl}/api/garage/${car.id}/parts`, {
    method: 'POST', headers: authHeaders,
    body: JSON.stringify({ replaced_date: '2026-01-01', odometer: 50100, part_name: 'Тормозные колодки', cost: 80 })
  });
  assert.equal(partRes.status, 201);

  const partsListRes = await fetch(`${baseUrl}/api/garage/${car.id}/parts`, { headers: authHeaders });
  const partsList = await partsListRes.json();
  assert.equal(partsList.parts.length, 1);

  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const inspRes = await fetch(`${baseUrl}/api/garage/${car.id}/inspections`, {
    method: 'POST', headers: authHeaders,
    body: JSON.stringify({ inspection_type: 'insurance', expiry_date: pastDate })
  });
  assert.equal(inspRes.status, 201);

  const remindersRes = await fetch(`${baseUrl}/api/garage/${car.id}/inspection-reminders`, { headers: authHeaders });
  const reminders = await remindersRes.json();
  assert.equal(reminders.reminders.length, 1);
  assert.equal(reminders.reminders[0].is_due, true);
});

test('данные гаража сохраняются и видны после повторного запроса', async () => {
  const email = `persist_${Date.now()}@example.com`;
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'Персист Тестов' })
  });
  const cookie = extractCookie(registerRes);
  const authHeaders = { 'Content-Type': 'application/json', Cookie: cookie };

  const carRes = await fetch(`${baseUrl}/api/garage`, {
    method: 'POST', headers: authHeaders,
    body: JSON.stringify({ brand: 'Mazda', model: '3', year: 2020, odometer: 15000 })
  });
  const { car } = await carRes.json();

  const reloadRes = await fetch(`${baseUrl}/api/garage/${car.id}`, { headers: authHeaders });
  const reload = await reloadRes.json();
  assert.equal(reload.car.brand, 'Mazda');
  assert.equal(reload.car.model, '3');
  assert.equal(reload.car.odometer, 15000);
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

test('жалобы требуют входа, а очередь и решения доступны только администратору', async () => {
  const send = body => fetch(`${baseUrl}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  assert.equal((await send({ ad_id: 1, reason: 'spam' })).status, 401);
  assert.equal((await fetch(`${baseUrl}/api/reports`)).status, 401);

  const session = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@autogo.local', password: 'user12345' })
  });
  const headers = { 'Content-Type': 'application/json', Cookie: extractCookie(session) };
  assert.equal((await fetch(`${baseUrl}/api/reports`, { headers })).status, 403);
  assert.equal((await fetch(`${baseUrl}/api/reports/1`, {
    method: 'PATCH', headers, body: JSON.stringify({ status: 'resolved' })
  })).status, 403);
});

test('жалоба сохраняется, фильтруется и может быть рассмотрена только один раз', async () => {
  async function signIn(email, password) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    assert.equal(response.status, 200);
    return { 'Content-Type': 'application/json', Cookie: extractCookie(response) };
  }

  const userHeaders = await signIn('user@autogo.local', 'user12345');
  const adminHeaders = await signIn('admin@autogo.local', 'admin123');
  const send = body => fetch(`${baseUrl}/api/reports`, {
    method: 'POST', headers: userHeaders, body: JSON.stringify(body)
  });
  const list = status => fetch(`${baseUrl}/api/reports?status=${status}`, { headers: adminHeaders });

  assert.equal((await send({ ad_id: 999999, reason: 'spam' })).status, 400);
  assert.equal((await send({ ad_id: 1, reason: 'invalid' })).status, 400);
  assert.equal((await send({ ad_id: 1, reason: 'other', comment: ' ' })).status, 400);
  assert.equal((await send({ ad_id: 1, reason: 'spam', comment: 'а'.repeat(501) })).status, 400);
  assert.equal((await list('invalid')).status, 400);

  const body = { ad_id: 1001, reason: 'wrong_price', comment: '  Цена в описании отличается  ' };
  const attempts = await Promise.all([send(body), send(body)]);
  assert.deepEqual(attempts.map(response => response.status).sort(), [201, 409]);
  const { report } = await attempts.find(response => response.status === 201).json();
  assert.equal(report.status, 'pending');

  const pending = await (await list('pending')).json();
  assert.equal(pending.pending, 1);
  assert.equal(pending.reports[0].id, report.id);
  assert.equal(pending.reports[0].comment, 'Цена в описании отличается');

  const review = status => fetch(`${baseUrl}/api/reports/${report.id}`, {
    method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ status })
  });
  const reviewResponse = await review('resolved');
  assert.equal(reviewResponse.status, 200);
  assert.ok((await reviewResponse.json()).report.reviewed_at);
  assert.equal((await review('dismissed')).status, 409);

  const resolved = await (await list('resolved')).json();
  assert.equal(resolved.reports[0].id, report.id);
  assert.equal(resolved.pending, 0);
  assert.equal((await send(body)).status, 201);
});

test('ответ видит только автор, скрытое объявление можно вернуть в каталог', async () => {
  async function login(email, password) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    assert.equal(response.status, 200);
    return extractCookie(response);
  }

  const userCookie = await login('user@autogo.local', 'user12345');
  const adminCookie = await login('admin@autogo.local', 'admin123');
  const request = (path, cookie, method = 'GET', body) => fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const adId = 1002;
  const listing = { ad_id: adId, reason: 'misleading' };
  const created = await request('/api/reports', userCookie, 'POST', listing);
  assert.equal(created.status, 201);
  const { report } = await created.json();
  const reviewPath = '/api/reports/' + report.id;
  const visibilityPath = '/api/reports/listings/' + adId + '/visibility';

  const decision = { status: 'resolved', hide: true, reply: 'Сведения проверены, объявление скрыто.' };
  assert.equal((await request(reviewPath, userCookie, 'PATCH', decision)).status, 403);
  assert.equal((await request(reviewPath, adminCookie, 'PATCH', { ...decision, reply: 'a'.repeat(1001) })).status, 400);
  assert.equal((await request(reviewPath, adminCookie, 'PATCH', { ...decision, status: 'dismissed' })).status, 400);
  assert.equal((await request(reviewPath, adminCookie, 'PATCH', decision)).status, 200);

  const mine = await (await request('/api/reports/mine', userCookie)).json();
  const own = mine.reports.find(item => item.id === report.id);
  assert.equal(own.reply, decision.reply);
  assert.equal(own.listing_hidden, 1);
  const adminMine = await (await request('/api/reports/mine', adminCookie)).json();
  assert.ok(adminMine.reports.every(item => item.id !== report.id));
  assert.equal((await fetch(baseUrl + '/api/reports/mine')).status, 401);

  const hiddenScript = await fetch(baseUrl + '/cars.js');
  assert.equal(hiddenScript.headers.get('cache-control'), 'no-store');
  assert.ok((await hiddenScript.text()).startsWith('globalThis.autoGoHiddenListings = [1002];'));
  assert.equal((await request('/api/reports', userCookie, 'POST', listing)).status, 409);
  assert.equal((await request(visibilityPath, userCookie, 'PUT', { hidden: false })).status, 403);
  assert.equal((await request(visibilityPath, adminCookie, 'PUT', { hidden: false })).status, 200);

  const restoredScript = await fetch(baseUrl + '/cars.js');
  assert.ok((await restoredScript.text()).startsWith('globalThis.autoGoHiddenListings = [];'));
  const afterRestore = await (await request('/api/reports/mine', userCookie)).json();
  const restored = afterRestore.reports.find(item => item.id === report.id);
  assert.equal(restored.listing_hidden, 0);
  assert.equal(restored.reply, decision.reply);
  assert.equal((await request(visibilityPath, adminCookie, 'PUT', { hidden: true })).status, 200);
  assert.equal((await request('/api/reports/listings/3/visibility', adminCookie, 'PUT', { hidden: true })).status, 409);
});

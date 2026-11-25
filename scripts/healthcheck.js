const BASE_URL = process.env.AUTOGO_URL || `http://localhost:${process.env.PORT || 3000}`;

async function check(name, fn) {
  try {
    await fn();
    console.log(`OK   ${name}`);
    return true;
  } catch (err) {
    console.log(`FAIL ${name}: ${err.message}`);
    return false;
  }
}

async function main() {
  let allOk = true;

  allOk = await check('Сервер отвечает (GET /api/health)', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`статус ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('status !== ok');
  }) && allOk;

  allOk = await check('Главная страница отдаётся (GET /)', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`статус ${res.status}`);
  }) && allOk;

  allOk = await check('Категории форума доступны', async () => {
    const res = await fetch(`${BASE_URL}/api/forum/categories`);
    const data = await res.json();
    if (!data.categories || !data.categories.length) throw new Error('пустой список категорий');
  }) && allOk;

  allOk = await check('Техническая документация доступна', async () => {
    const res = await fetch(`${BASE_URL}/api/docs`);
    const data = await res.json();
    if (!data.docs || !data.docs.length) throw new Error('пустой список документов');
  }) && allOk;

  allOk = await check('Гараж требует авторизацию (401 без логина)', async () => {
    const res = await fetch(`${BASE_URL}/api/garage`);
    if (res.status !== 401) throw new Error(`ожидался 401, получен ${res.status}`);
  }) && allOk;

  if (!allOk) {
    console.error('\nHealthcheck завершился с ошибками.');
    process.exit(1);
  }
  console.log('\nВсё работает.');
}

main();

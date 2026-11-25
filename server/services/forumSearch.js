// forumSearch.js — ИИ-агент поиска информации на сторонних автомобильных форумах.
//
// ВАЖНО про источник данных:
// Прямой скрейпинг поисковиков (DuckDuckGo, Bing и т.п.) для автоматических
// запросов без браузера почти всегда упирается в их анти-бот защиту
// (капча/challenge-страница) — это намеренная защита, и обходить её нельзя.
// Поэтому агент устроен так:
//   1) Если в .env указан внешний поисковый API (SEARCH_API_URL + SEARCH_API_KEY,
//      любой JSON-совместимый сервис типа Bing Web Search API, SerpAPI и т.п.) —
//      агент реально обращается к нему за живыми результатами с внешних сайтов.
//   2) Если такого API нет (режим по умолчанию, без ключей) — агент использует
//      локальную базу знаний по типовым автомобильным темам и дополняет ответ
//      списком реальных известных автофорумов/сообществ, где стоит искать
//      дальше вручную. Это полноценная логика с подбором релевантности, а не
//      пустая заглушка, и она работает всегда, без сети и без ключей.
// Любой из двух путей оборачивается в try/catch с таймаутом — сбой одного
// источника не ломает ответ агента целиком.

const SEARCH_TIMEOUT_MS = 7000;

// Реальные известные автомобильные сообщества, которые агент предлагает
// пользователю как источники для ручного углублённого поиска
const FORUM_COMMUNITIES = [
  { name: 'Drive2', domain: 'drive2.ru', about: 'Бортжурналы владельцев, ремонт своими руками' },
  { name: 'Drom Forum', domain: 'forums.drom.ru', about: 'Обсуждения по маркам и регионам, б/у авто' },
  { name: 'BMW Club', domain: 'bmwclub.ru', about: 'Специализированное сообщество владельцев BMW' },
  { name: 'VW Club', domain: 'vwclub.ru', about: 'Специализированное сообщество владельцев Volkswagen' },
  { name: '4x4Club', domain: '4x4club.ru', about: 'Внедорожники, полный привод, бездорожье' }
];

// Локальная база знаний: типовые темы, по которым агент может дать релевантную
// подборку без обращения к внешним источникам
const KNOWLEDGE_BASE = [
  {
    id: 'oil-change',
    tags: ['масло', 'замена масла', 'моторное масло', 'расход масла'],
    title: 'Замена и расход моторного масла',
    content: 'Типовой интервал замены масла — 7 000–15 000 км в зависимости от режима эксплуатации и допуска масла. ' +
      'Повышенный расход масла между заменами (более 1 л на 1000 км) — повод проверить маслосъёмные колпачки и состояние поршневых колец.'
  },
  {
    id: 'suspension-noise',
    tags: ['стук', 'подвеска', 'скрип', 'амортизатор', 'стойка'],
    title: 'Стуки и скрипы в подвеске',
    content: 'Стук на кочках чаще всего даёт разбитая стойка стабилизатора или втулки рычагов. Скрип при повороте руля на месте — ' +
      'типичный признак износа опорного подшипника стойки амортизатора. Диагностику стоит начинать с осмотра на подъёмнике с раскачиванием подвески руками.'
  },
  {
    id: 'ac-not-cooling',
    tags: ['кондиционер', 'не холодит', 'климат', 'фреон'],
    title: 'Кондиционер не холодит',
    content: 'Основные причины: утечка фреона через соединения/радиатор, неисправность компрессора или его муфты, забитый салонный фильтр, ' +
      'неисправность датчика давления. Первый шаг диагностики — проверка давления в системе на станции с манометрическим коллектором.'
  },
  {
    id: 'battery-ev-range',
    tags: ['электромобиль', 'зарядка', 'запас хода', 'аккумулятор', 'ev'],
    title: 'Снижение запаса хода электромобиля',
    content: 'Запас хода ощутимо падает при низких температурах (прогрев батареи и салона) и при частом использовании быстрой зарядки. ' +
      'Для долгосрочного здоровья батареи рекомендуется держать заряд в диапазоне 20–80% и избегать постоянных зарядок до 100%.'
  },
  {
    id: 'transmission-jerk',
    tags: ['коробка', 'акпп', 'робот', 'рывки', 'вариатор', 'cvt'],
    title: 'Рывки и пинки при переключении передач',
    content: 'На гидромеханических АКПП рывки часто связаны с деградировавшим маслом (требуется замена даже при формально "необслуживаемой" коробке). ' +
      'На роботизированных и вариаторных коробках рывки на старте — частый повод для диагностики сцепления/актуаторов у официального дилера.'
  },
  {
    id: 'brake-issues',
    tags: ['тормоза', 'скрип тормозов', 'вибрация при торможении', 'колодки', 'диски'],
    title: 'Скрип и вибрация при торможении',
    content: 'Высокочастотный писк на низкой скорости — обычно это индикатор износа колодок. Вибрация на педали при торможении на скорости — ' +
      'признак деформации («увода») тормозных дисков, которые нужно проточить или заменить.'
  },
  {
    id: 'check-engine',
    tags: ['check engine', 'ошибка двигателя', 'лампочка двигателя', 'диагностика'],
    title: 'Загорелась лампа Check Engine',
    content: 'Для начала стоит считать код ошибки диагностическим сканером (OBD-II) — без этого любая версия причины умозрительна. ' +
      'Частые типовые причины: неплотно закрытая крышка бензобака, катушка зажигания, лямбда-зонд, катализатор.'
  },
  {
    id: 'winter-tires',
    tags: ['зимняя резина', 'шипы', 'липучка', 'зима'],
    title: 'Выбор зимней резины',
    content: 'Шипованная резина эффективнее на льду и укатанном снегу, липучка (friction) комфортнее и тише на асфальте и в городе с переменной погодой. ' +
      'Менять резину на зимнюю рекомендуется при среднесуточной температуре около +5°C и ниже.'
  }
];

function tokenize(text) {
  return (text || '').toLowerCase().match(/[а-яa-z0-9]+/gi) || [];
}

function scoreEntry(entry, queryTokens) {
  let score = 0;
  for (const tag of entry.tags) {
    const tagTokens = tokenize(tag);
    const matches = tagTokens.filter(t => queryTokens.includes(t)).length;
    if (matches === tagTokens.length && tagTokens.length > 0) score += 3; // точное совпадение фразы по токенам
    else score += matches;
  }
  return score;
}

async function searchExternalApi(query) {
  const apiUrl = process.env.SEARCH_API_URL;
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiUrl) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    const url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Внешний поисковый API вернул статус ${response.status}`);
    const data = await response.json();
    // Ожидаемый минимальный контракт ответа: { results: [{ title, url, snippet }] }
    const items = Array.isArray(data.results) ? data.results : [];
    return items.slice(0, 10).map(item => ({
      title: item.title || 'Без названия',
      url: item.url || null,
      snippet: item.snippet || '',
      source: 'external_api'
    }));
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Ищет релевантную информацию по запросу. Сначала пробует настоящий внешний
 * поисковый API, если он сконфигурирован в .env; при его отсутствии или сбое
 * использует локальную базу знаний по типовым автомобильным темам и
 * подсказывает реальные форумы для дальнейшего ручного поиска.
 */
async function searchForums(query, { brand, model } = {}) {
  const fullQuery = [brand, model, query].filter(Boolean).join(' ');
  const errors = [];
  let externalResults = null;

  if (process.env.SEARCH_API_URL) {
    try {
      externalResults = await searchExternalApi(fullQuery);
    } catch (err) {
      errors.push({ source: 'external_api', message: err.message });
    }
  }

  const queryTokens = tokenize(fullQuery);
  const localMatches = KNOWLEDGE_BASE
    .map(entry => ({ entry, score: scoreEntry(entry, queryTokens) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => ({
      title: x.entry.title,
      url: null,
      snippet: x.entry.content,
      source: 'local_knowledge'
    }));

  const results = [...(externalResults || []), ...localMatches];

  return {
    query: fullQuery,
    usedExternalApi: Boolean(externalResults),
    results,
    suggested_communities: FORUM_COMMUNITIES,
    errors,
    failed: results.length === 0 && errors.length > 0
  };
}

module.exports = { searchForums, FORUM_COMMUNITIES, KNOWLEDGE_BASE };

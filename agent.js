// agent.js — UI ИИ-агента поиска по форумам

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

async function api(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(data.error || `Ошибка запроса (${res.status})`); err.data = data; throw err; }
  return data;
}

function renderCommunities(communities) {
  if (!communities || !communities.length) return '';
  return `
    <div class="autogo-page-card mt-3">
      <h5>Форумы для ручного поиска</h5>
      ${communities.map(c => `<span class="community-chip"><strong>${esc(c.name)}</strong> (${esc(c.domain)}) — <span class="text-secondary">${esc(c.about)}</span></span>`).join('')}
    </div>`;
}

function renderResults(data) {
  const output = document.getElementById('agentOutput');
  const resultsHtml = data.results.length ? data.results.map(r => `
    <div class="result-card">
      <div class="result-source">${esc(r.source)}</div>
      <div class="fw-bold mt-1">${esc(r.title)}</div>
      <p class="mb-1 text-secondary">${esc(r.snippet)}</p>
      ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Открыть источник →</a>` : ''}
    </div>
  `).join('') : '<div class="autogo-page-card autogo-empty-state">По этому запросу локальная база знаний ничего конкретного не нашла — попробуйте переформулировать запрос или поищите на форумах ниже.</div>';

  output.innerHTML = `
    <div class="small text-secondary mb-2">Запрос: «${esc(data.query)}» ${data.usedExternalApi ? '· источник: внешний поисковый API' : '· источник: локальная база знаний'}</div>
    ${resultsHtml}
    ${renderCommunities(data.suggested_communities)}
  `;
}

document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const output = document.getElementById('agentOutput');
  const btn = document.getElementById('searchSubmitBtn');

  if (!window.AutoGoAuth.user) {
    new bootstrap.Modal(document.getElementById('loginModal')).show();
    return;
  }

  btn.disabled = true;
  output.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-purple"></div><p class="mt-2 text-secondary">Агент ищет информацию...</p></div>`;

  try {
    const data = await api('/api/agent/search', {
      method: 'POST',
      body: JSON.stringify({
        query: document.getElementById('agentQuery').value,
        brand: document.getElementById('agentBrand').value,
        model: document.getElementById('agentModel').value
      })
    });
    renderResults(data);
  } catch (err) {
    output.innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false;
  }
});

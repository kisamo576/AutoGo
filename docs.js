const CATEGORY_LABELS = { regulation: 'Регламент ТО', manual: 'Мануал', diagram: 'Схема' };

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

async function api(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка запроса (${res.status})`);
  return data;
}

function renderMarkdown(text) {
  const lines = esc(text).split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    if (line.startsWith('# ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h1>${line.slice(2)}</h1>`;
    } else if (line.startsWith('- ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${line.slice(2)}</li>`;
    } else if (line.trim() === '') {
      if (inList) { html += '</ul>'; inList = false; }
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${line}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return html;
}

function buildQuery() {
  const params = new URLSearchParams();
  const brand = document.getElementById('filterBrand').value;
  const category = document.getElementById('filterCategory').value;
  const q = document.getElementById('filterQuery').value;
  if (brand) params.set('brand', brand);
  if (category) params.set('category', category);
  if (q) params.set('q', q);
  return params.toString();
}

async function loadBrands() {
  const { brands } = await api('/api/docs/brands');
  const select = document.getElementById('filterBrand');
  brands.forEach(b => select.appendChild(new Option(b, b)));
}

async function loadDocs() {
  const list = document.getElementById('docsList');
  list.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-purple"></div></div>`;
  try {
    const { docs } = await api(`/api/docs?${buildQuery()}`);
    if (!docs.length) {
      list.innerHTML = '<div class="autogo-page-card autogo-empty-state">Ничего не найдено</div>';
      return;
    }
    list.innerHTML = docs.map(d => `
      <div class="doc-row" data-doc-id="${d.id}">
        <span class="autogo-tag">${CATEGORY_LABELS[d.category] || d.category}</span>
        <div class="fw-bold mt-1">${esc(d.title)}</div>
        <div class="small text-secondary">${esc(d.brand)}${d.model ? ' · ' + esc(d.model) : ''}</div>
      </div>
    `).join('');
    list.querySelectorAll('[data-doc-id]').forEach(el => {
      el.addEventListener('click', () => showDoc(docs.find(d => d.id === Number(el.dataset.docId))));
    });
  } catch (err) {
    list.innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`;
  }
}

function showDoc(doc) {
  const detail = document.getElementById('docDetail');
  detail.className = 'autogo-page-card';
  detail.innerHTML = `
    <span class="autogo-tag">${CATEGORY_LABELS[doc.category] || doc.category}</span>
    <h4 class="mt-2">${esc(doc.title)}</h4>
    <div class="small text-secondary mb-3">${esc(doc.brand)}${doc.model ? ' · ' + esc(doc.model) : ''}</div>
    <div class="doc-content">${renderMarkdown(doc.content)}</div>
  `;
}

['filterBrand', 'filterCategory'].forEach(id => document.getElementById(id).addEventListener('change', loadDocs));
let searchTimeout;
document.getElementById('filterQuery').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadDocs, 300);
});

loadBrands();
loadDocs();

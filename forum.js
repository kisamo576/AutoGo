// forum.js — список категорий и тем форума

let categories = [];
let activeCategorySlug = '';

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

async function api(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка запроса (${res.status})`);
  return data;
}

async function loadCategories() {
  const data = await api('/api/forum/categories');
  categories = data.categories;
  const bar = document.getElementById('categoriesBar');
  bar.innerHTML = [
    `<span class="autogo-tag category-pill ${!activeCategorySlug ? 'active' : ''}" data-slug="">Все разделы</span>`,
    ...categories.map(c => `<span class="autogo-tag category-pill ${activeCategorySlug === c.slug ? 'active' : ''}" data-slug="${c.slug}" title="${esc(c.description || '')}">${esc(c.name)}</span>`)
  ].join('');
  bar.querySelectorAll('[data-slug]').forEach(el => {
    el.addEventListener('click', () => { activeCategorySlug = el.dataset.slug; loadCategories(); loadTopics(); });
  });

  const select = document.getElementById('newTopicCategory');
  select.innerHTML = categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
}

async function loadTopics() {
  const list = document.getElementById('topicsList');
  list.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-purple"></div></div>`;
  try {
    const url = activeCategorySlug ? `/api/forum/topics?category=${encodeURIComponent(activeCategorySlug)}` : '/api/forum/topics';
    const { topics } = await api(url);
    if (!topics.length) {
      list.innerHTML = '<div class="autogo-page-card autogo-empty-state">В этом разделе пока нет тем. Создайте первую!</div>';
      return;
    }
    list.innerHTML = topics.map(t => `
      <div class="topic-row">
        <div class="d-flex justify-content-between align-items-start flex-wrap">
          <div>
            ${t.is_pinned ? '<span class="autogo-tag warning">закреплено</span>' : ''}
            ${t.is_locked ? '<span class="autogo-tag danger">закрыто</span>' : ''}
            <a href="topic.html?id=${t.id}">${esc(t.title)}</a>
            <div class="small text-secondary">${esc(t.category_name)} · автор ${esc(t.author_name)} · ${new Date(t.created_at).toLocaleString('ru-RU')}</div>
          </div>
          <div class="autogo-tag">${t.posts_count} сообщ.</div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`;
  }
}

document.getElementById('newTopicBtn').addEventListener('click', () => {
  if (!window.AutoGoAuth.user) {
    bootstrap.Modal.getInstance(document.getElementById('newTopicModal'))?.hide();
    new bootstrap.Modal(document.getElementById('loginModal')).show();
    return;
  }
  document.getElementById('newTopicForm').reset();
  document.getElementById('newTopicError').style.display = 'none';
  new bootstrap.Modal(document.getElementById('newTopicModal')).show();
});

document.getElementById('newTopicForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorDiv = document.getElementById('newTopicError');
  errorDiv.style.display = 'none';
  try {
    const { topic } = await api('/api/forum/topics', {
      method: 'POST',
      body: JSON.stringify({
        category_id: parseInt(document.getElementById('newTopicCategory').value, 10),
        title: document.getElementById('newTopicTitle').value,
        content: document.getElementById('newTopicContent').value
      })
    });
    bootstrap.Modal.getInstance(document.getElementById('newTopicModal')).hide();
    window.location.href = `topic.html?id=${topic.id}`;
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.style.display = 'block';
  }
});

loadCategories().then(loadTopics);

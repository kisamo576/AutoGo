// topic.js — просмотр темы форума, ответы, базовая модерация (удаление сообщений, закрытие темы)

const topicId = new URLSearchParams(window.location.search).get('id');
const root = document.getElementById('topicRoot');

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

async function load() {
  try {
    const { topic, posts } = await api(`/api/forum/topics/${topicId}`);
    const user = window.AutoGoAuth.user;
    const isAdmin = user && user.role === 'admin';

    const postsHtml = posts.map(p => `
      <div class="post-card">
        <div class="d-flex justify-content-between align-items-start">
          <div><span class="post-author">${esc(p.author_name)}</span>${p.author_role === 'admin' ? ' <span class="autogo-tag warning">admin</span>' : ''}</div>
          <div class="post-date">${new Date(p.created_at).toLocaleString('ru-RU')}</div>
        </div>
        <p class="mt-2 mb-1" style="white-space:pre-wrap;">${esc(p.content)}</p>
        ${(user && (user.id === p.user_id || isAdmin)) ? `<button class="btn btn-sm btn-outline-danger" data-del-post="${p.id}">Удалить</button>` : ''}
      </div>
    `).join('');

    root.innerHTML = `
      <div class="autogo-page-card mb-3">
        <div class="d-flex justify-content-between align-items-start flex-wrap">
          <div>
            <h3>${topic.is_pinned ? '📌 ' : ''}${esc(topic.title)}</h3>
            <div class="text-secondary small">${esc(topic.category_name)} · автор ${esc(topic.author_name)}</div>
          </div>
          ${isAdmin ? `
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-warning" id="lockBtn">${topic.is_locked ? 'Открыть тему' : 'Закрыть тему'}</button>
              <button class="btn btn-sm btn-outline-danger" id="deleteTopicBtn">Удалить тему</button>
            </div>
          ` : ''}
        </div>
      </div>
      <div id="postsList">${postsHtml}</div>
      <div id="replyBox" class="autogo-page-card mt-3"></div>
    `;

    if (topic.is_locked) {
      document.getElementById('replyBox').innerHTML = '<div class="autogo-empty-state">Тема закрыта для новых сообщений</div>';
    } else if (!user) {
      document.getElementById('replyBox').innerHTML = `
        <div class="autogo-empty-state">Войдите, чтобы ответить в теме
          <br><button class="btn btn-purple mt-2" data-bs-toggle="modal" data-bs-target="#loginModal">Войти</button>
        </div>`;
    } else {
      document.getElementById('replyBox').innerHTML = `
        <form id="replyForm">
          <label class="form-label">Ваш ответ</label>
          <textarea class="form-control" id="replyContent" rows="3" required></textarea>
          <div id="replyError" class="alert alert-danger mt-2" style="display:none;"></div>
          <button type="submit" class="btn btn-purple mt-2">Ответить</button>
        </form>`;
      document.getElementById('replyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('replyError');
        errorDiv.style.display = 'none';
        try {
          await api(`/api/forum/topics/${topicId}/posts`, {
            method: 'POST',
            body: JSON.stringify({ content: document.getElementById('replyContent').value })
          });
          load();
        } catch (err) {
          errorDiv.textContent = err.message;
          errorDiv.style.display = 'block';
        }
      });
    }

    document.querySelectorAll('[data-del-post]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Удалить сообщение?')) return;
        await api(`/api/forum/posts/${btn.dataset.delPost}`, { method: 'DELETE' });
        load();
      });
    });

    const lockBtn = document.getElementById('lockBtn');
    if (lockBtn) lockBtn.addEventListener('click', async () => {
      await api(`/api/forum/topics/${topicId}/lock`, { method: 'POST' });
      load();
    });

    const deleteTopicBtn = document.getElementById('deleteTopicBtn');
    if (deleteTopicBtn) deleteTopicBtn.addEventListener('click', async () => {
      if (!confirm('Удалить тему целиком?')) return;
      await api(`/api/forum/topics/${topicId}`, { method: 'DELETE' });
      window.location.href = 'forum.html';
    });
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`;
  }
}

window.AutoGoAuth.ready.then(load);

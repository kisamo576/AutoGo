// nav.js — общее подменю разделов и авторизация, подключается на всех страницах.
// Добавляет под шапкой строку ссылок (Гараж/Форум/Документация/Помощник) и область
// авторизации, а также даёт другим скриптам доступ к текущему пользователю через
// window.AutoGoAuth.

(function () {
  const LINKS = [
    { href: 'garage.html', label: '🚗 Гараж' },
    { href: 'forum.html', label: '💬 Форум' },
    { href: 'docs.html', label: '📘 Документация' },
    { href: 'agent.html', label: '🤖 Помощник' }
  ];

  const LOGIN_MODAL_HTML = `
    <div class="modal fade" id="loginModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-dark text-white border-secondary">
          <div class="modal-header border-secondary"><h5 class="modal-title">🔐 Вход</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="loginForm">
              <div class="mb-3"><label class="form-label">Email</label><input type="email" id="loginEmail" class="form-control" placeholder="user@autogo.local" required></div>
              <div class="mb-3"><label class="form-label">Пароль</label><input type="password" id="loginPassword" class="form-control" placeholder="Пароль" required></div>
              <button type="submit" class="btn btn-purple w-100">Войти</button>
              <div id="loginError" class="alert alert-danger mt-2" style="display:none;"></div>
              <div class="text-center mt-3"><a href="#" class="text-secondary small" data-bs-dismiss="modal" data-bs-toggle="modal" data-bs-target="#registerModal">Нет аккаунта? Регистрация</a></div>
              <div class="text-center mt-2"><small class="text-secondary">Демо-доступ: user@autogo.local / user12345 или admin@autogo.local / admin123</small></div>
            </form>
          </div>
        </div>
      </div>
    </div>`;

  const REGISTER_MODAL_HTML = `
    <div class="modal fade" id="registerModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-dark text-white border-secondary">
          <div class="modal-header border-secondary"><h5 class="modal-title">📝 Регистрация</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="registerForm">
              <div class="mb-3"><label class="form-label">Имя</label><input type="text" id="registerName" class="form-control" placeholder="Как вас называть" required></div>
              <div class="mb-3"><label class="form-label">Email</label><input type="email" id="registerEmail" class="form-control" placeholder="example@mail.com" required></div>
              <div class="mb-3"><label class="form-label">Пароль</label><input type="password" id="registerPassword" class="form-control" placeholder="Минимум 6 символов" required></div>
              <div class="mb-3"><label class="form-label">Повторите пароль</label><input type="password" id="registerPassword2" class="form-control" required></div>
              <button type="submit" class="btn btn-purple w-100">Зарегистрироваться</button>
              <div id="registerError" class="alert alert-danger mt-2" style="display:none;"></div>
              <div class="text-center mt-3"><a href="#" class="text-secondary small" data-bs-dismiss="modal" data-bs-toggle="modal" data-bs-target="#loginModal">Уже есть аккаунт? Войти</a></div>
            </form>
          </div>
        </div>
      </div>
    </div>`;

  function ensureAuthModals() {
    if (!document.getElementById('loginModal')) document.body.insertAdjacentHTML('beforeend', LOGIN_MODAL_HTML);
    if (!document.getElementById('registerModal')) document.body.insertAdjacentHTML('beforeend', REGISTER_MODAL_HTML);
  }

  function buildSubnav(user) {
    const currentFile = location.pathname.split('/').pop() || 'index.html';
    const linksHtml = LINKS.map(l => `<a href="${l.href}" class="${l.href === currentFile ? 'active' : ''}">${l.label}</a>`).join('');

    let authHtml;
    if (user) {
      authHtml = `
        <div class="autogo-auth-area">
          <span class="autogo-auth-chip">Вы вошли как <strong>${escapeHtml(user.name)}</strong>${user.role === 'admin' ? ' <span class="autogo-tag warning">admin</span>' : ''}</span>
          ${user.role === 'admin' ? '<a href="admin.html" class="btn btn-outline-purple btn-sm">Админка</a>' : ''}
          <button class="btn btn-outline-purple btn-sm" id="autogoLogoutBtn">Выйти</button>
        </div>`;
    } else {
      authHtml = `
        <div class="autogo-auth-area">
          <button class="btn btn-outline-purple btn-sm" data-bs-toggle="modal" data-bs-target="#loginModal">Войти</button>
          <button class="btn btn-purple btn-sm" data-bs-toggle="modal" data-bs-target="#registerModal">Регистрация</button>
        </div>`;
    }

    const bar = document.createElement('div');
    bar.className = 'autogo-subnav';
    bar.innerHTML = `<div class="container"><div class="autogo-subnav-links">${linksHtml}</div>${authHtml}</div>`;
    return bar;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function wireAuthForms(onAuthChange) {
    const loginForm = document.getElementById('loginForm');
    if (loginForm && !loginForm.dataset.wired) {
      loginForm.dataset.wired = '1';
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) errorDiv.style.display = 'none';
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: document.getElementById('loginEmail').value,
              password: document.getElementById('loginPassword').value
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Не удалось войти');
          onAuthChange(data.user);
          const modalEl = document.getElementById('loginModal');
          const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          modal.hide();
          if (data.user.role === 'admin') window.location.href = 'admin.html';
          else window.location.reload();
        } catch (err) {
          if (errorDiv) { errorDiv.textContent = err.message; errorDiv.style.display = 'block'; }
        }
      });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm && !registerForm.dataset.wired) {
      registerForm.dataset.wired = '1';
      registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const errorDiv = document.getElementById('registerError');
        if (errorDiv) errorDiv.style.display = 'none';
        const p1 = document.getElementById('registerPassword').value;
        const p2 = document.getElementById('registerPassword2').value;
        if (p1 !== p2) {
          if (errorDiv) { errorDiv.textContent = 'Пароли не совпадают'; errorDiv.style.display = 'block'; }
          return;
        }
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: document.getElementById('registerName').value,
              email: document.getElementById('registerEmail').value,
              password: p1
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Не удалось зарегистрироваться');
          onAuthChange(data.user);
          const modalEl = document.getElementById('registerModal');
          const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          modal.hide();
          window.location.href = 'garage.html';
        } catch (err) {
          if (errorDiv) { errorDiv.textContent = err.message; errorDiv.style.display = 'block'; }
        }
      });
    }
  }

  async function init() {
    ensureAuthModals();

    let user = null;
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      user = data.user;
    } catch (err) {
      console.warn('Не удалось проверить авторизацию:', err);
    }

    const header = document.querySelector('header');
    const subnav = buildSubnav(user);
    if (header) header.insertAdjacentElement('afterend', subnav);
    else document.body.insertAdjacentElement('afterbegin', subnav);

    wireAuthForms((newUser) => { window.AutoGoAuth.user = newUser; });

    const logoutBtn = document.getElementById('autogoLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = 'index.html';
      });
    }

    window.AutoGoAuth.user = user;
    window.AutoGoAuth._resolveReady(user);
    document.dispatchEvent(new CustomEvent('autogo:auth-ready', { detail: { user } }));
  }

  let resolveReady;
  const readyPromise = new Promise((resolve) => { resolveReady = resolve; });
  window.AutoGoAuth = { user: null, ready: readyPromise, _resolveReady: resolveReady };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(function () {
    const button = document.getElementById('buyPremiumBtn');
    const status = document.getElementById('premiumStatus');
    const profileStatus = document.getElementById('profilePremiumStatus');

    function statusText(user) {
        if (!user) return 'Войдите в аккаунт, чтобы активировать премиум.';
        if (!user.is_premium) return 'Премиум пока не активирован.';
        const end = new Intl.DateTimeFormat('ru-RU', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(new Date(user.premium_until));
        return 'Премиум действует до ' + end + '.';
    }

    function render(user) {
        if (profileStatus) profileStatus.textContent = statusText(user);
        if (button) {
            status.textContent = statusText(user);
            button.disabled = Boolean(user?.is_premium);
            button.textContent = user?.is_premium ? 'Премиум активен' : 'Активировать на 30 дней';
        }
    }

    window.AutoGoAuth.ready.then(render);
    if (!button) return;

    button.addEventListener('click', async () => {
        if (!window.AutoGoAuth.user) {
            const login = document.getElementById('loginModal');
            if (login && window.bootstrap) bootstrap.Modal.getOrCreateInstance(login).show();
            return;
        }

        button.disabled = true;
        status.textContent = 'Активируем премиум…';
        try {
            const response = await fetch('/api/premium/purchase', { method: 'POST' });
            if (response.status === 401) {
                status.textContent = 'Сессия истекла. Обновите страницу и войдите снова.';
                return;
            }
            const data = await response.json();
            if (!response.ok) {
                status.textContent = data.error || 'Не удалось активировать премиум.';
                return;
            }

            window.AutoGoAuth.updatePremium(data);
            render(window.AutoGoAuth.user);
        } catch {
            status.textContent = 'Сервер недоступен. Попробуйте ещё раз.';
        } finally {
            button.disabled = Boolean(window.AutoGoAuth.user?.is_premium);
        }
    });
})();

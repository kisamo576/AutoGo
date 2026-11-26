(function () {
    const key = 'autogo:favorites:v1';
    const carsById = new Map(carsDatabase.map(car => [car.id, car]));
    let favorites = readFavorites();

    function readFavorites() {
        try {
            const entries = JSON.parse(localStorage.getItem(key) || '[]');
            if (!Array.isArray(entries)) return new Map();
            return new Map(entries.filter(entry => entry && carsById.has(entry.id))
                .map(entry => [entry.id, typeof entry.note === 'string' ? entry.note.slice(0, 200) : '']));
        } catch {
            return new Map();
        }
    }

    function save(next, updatedMessage) {
        const status = document.getElementById('favoritesStatus');
        try {
            localStorage.setItem(key, JSON.stringify([...next].map(([id, note]) => ({ id, note }))));
        } catch {
            status.textContent = 'Не удалось сохранить изменения. Проверь настройки хранилища браузера.';
            return false;
        }
        favorites = next;
        status.textContent = updatedMessage;
        return true;
    }

    function updateButtons() {
        for (const button of document.querySelectorAll('[data-favorite-car]')) {
            const saved = favorites.has(Number(button.dataset.favoriteCar));
            button.setAttribute('aria-pressed', String(saved));
            button.classList.toggle('btn-danger', saved);
            button.classList.toggle('btn-outline-danger', !saved);
            button.textContent = saved ? '♥ В избранном' : '♡ В избранное';
        }
    }

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-favorite-car]');
        if (!button) return;
        const id = Number(button.dataset.favoriteCar);
        if (!carsById.has(id)) return;
        const next = readFavorites();
        favorites = next;
        if (next.has(id)) {
            if (next.get(id) && !window.confirm('Удалить автомобиль вместе с заметкой?')) return;
            next.delete(id);
            save(next, 'Автомобиль удалён из избранного.');
        } else {
            next.set(id, '');
            save(next, 'Автомобиль добавлен в избранное.');
        }
        updateButtons();
    });

    const list = document.getElementById('favoritesList');
    const sort = document.getElementById('favoritesSort');

    function renderList() {
        if (!list) return;
        const savedCars = [...favorites.keys()].reverse().map(id => carsById.get(id));
        if (sort.value === 'price') savedCars.sort((a, b) => a.price - b.price);
        if (sort.value === 'year') savedCars.sort((a, b) => b.year - a.year);
        sort.disabled = savedCars.length < 2;
        document.getElementById('favoritesEmpty').hidden = savedCars.length > 0;
        document.getElementById('favoritesCount').textContent = 'Сохранено: ' + savedCars.length;

        const template = document.getElementById('favoriteTemplate');
        list.replaceChildren();
        for (const car of savedCars) {
            const card = template.content.cloneNode(true);
            const link = card.querySelector('[data-car-link]');
            link.textContent = car.brand + ' ' + car.model;
            if (hiddenListingIds.has(car.id)) {
                link.replaceWith(document.createTextNode(link.textContent + ' · объявление скрыто'));
            } else {
                link.href = 'ad.html?id=' + car.id;
            }
            card.querySelector('[data-car-specs]').textContent =
                '$' + car.price.toLocaleString() + ' · ' + car.year + ' г. · ' + car.mileage + ' км';
            const image = card.querySelector('img');
            image.addEventListener('error', () => { image.src = NO_PHOTO_IMG; }, { once: true });
            image.src = car.photo;
            const form = card.querySelector('form');
            const note = form.elements.note;
            note.value = favorites.get(car.id);
            form.addEventListener('submit', event => {
                event.preventDefault();
                const next = readFavorites();
                if (!next.has(car.id)) return;
                next.set(car.id, note.value.trim());
                if (save(next, 'Заметка сохранена.')) note.value = next.get(car.id);
            });
            card.querySelector('[data-remove-car]').addEventListener('click', () => {
                if (note.value && !window.confirm('Удалить автомобиль вместе с заметкой?')) return;
                const next = readFavorites();
                next.delete(car.id);
                if (save(next, 'Автомобиль удалён из избранного.')) {
                    renderList();
                    (list.querySelector('[data-car-link][href]') || document.getElementById('favoritesCatalogLink')).focus();
                }
            });
            list.appendChild(card);
        }
    }

    if (sort) sort.addEventListener('change', renderList);
    window.addEventListener('storage', event => {
        if (event.key !== key && event.key !== null) return;
        favorites = readFavorites();
        updateButtons();
        renderList();
    });
    window.addEventListener('pageshow', () => {
        favorites = readFavorites();
        updateButtons();
        renderList();
    });
    window.AutoGoFavorites = { updateButtons };
    updateButtons();
    renderList();
})();

(function () {
    const form = document.getElementById('addAdForm');
    const message = document.getElementById('listingFormMessage');
    const fields = document.getElementById('listingFields');
    const brand = document.getElementById('listingBrand');
    const model = form.elements.model_id;
    const save = document.getElementById('saveListing');
    const editId = new URLSearchParams(window.location.search).get('id');
    const models = carsDatabase.filter(car => !car.isUserListing);
    const formUrl = editId ? '/api/listings/' + encodeURIComponent(editId) : '/api/listings';
    form.elements.year.max = new Date().getFullYear() + 1;

    for (const name of new Set(models.map(car => car.brand))) {
        brand.add(new Option(name, name));
    }

    function showModel() {
        const car = models.find(item => item.id === Number(model.value));
        document.getElementById('listingModelDetails').textContent = car
            ? [formatCarEngine(car), car.bodyType, car.transmission].join(' · ') : '';
    }

    function fillModels() {
        model.replaceChildren(new Option('Выберите модель', ''));
        for (const car of models.filter(item => item.brand === brand.value)) {
            model.add(new Option(car.model, car.id));
        }
        showModel();
    }

    brand.addEventListener('change', fillModels);
    model.addEventListener('change', showModel);
    fillModels();

    async function init() {
        const user = await window.AutoGoAuth.ready;
        if (!user) {
            message.textContent = 'Войдите в аккаунт, чтобы работать с объявлениями.';
            return;
        }
        if (editId) {
            document.getElementById('listingFormTitle').textContent = 'Редактировать объявление';
            save.textContent = 'Сохранить изменения';
            try {
                const response = await fetch(formUrl);
                const data = await response.json();
                if (!response.ok) {
                    message.textContent = data.error || 'Не удалось открыть объявление.';
                    return;
                }
                const listing = data.listing;
                brand.value = listing.brand;
                fillModels();
                for (const field of ['model_id', 'year', 'price', 'mileage', 'description']) {
                    form.elements[field].value = listing[field];
                }
                showModel();
            } catch {
                message.textContent = 'Не удалось загрузить объявление. Обновите страницу.';
                return;
            }
        }
        fields.disabled = false;
        message.textContent = '';
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        for (const field of ['model_id', 'year', 'price', 'mileage']) data[field] = Number(data[field]);
        fields.disabled = true;
        message.textContent = 'Сохраняем объявление…';
        try {
            const response = await fetch(formUrl, {
                method: editId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) {
                message.textContent = result.error || 'Не удалось сохранить объявление.';
                return;
            }
            window.location.href = 'profile.html#my-ads';
        } catch {
            message.textContent = 'Сервер недоступен. Попробуйте ещё раз.';
        } finally {
            fields.disabled = false;
        }
    });

    init();
})();

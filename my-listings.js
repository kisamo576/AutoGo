(function () {
    const list = document.getElementById('myListingList');
    const message = document.getElementById('myListingMessage');
    const money = new Intl.NumberFormat('ru-RU');
    let loading = false;
    const reviewLabels = { pending: 'На модерации', rejected: 'Отклонено', approved: 'Опубликовано' };

    function link(label, url, className) {
        const anchor = document.createElement('a');
        anchor.textContent = label;
        anchor.href = url;
        anchor.className = className;
        return anchor;
    }

    function renderListing(listing) {
        const card = document.createElement('article');
        card.className = 'border rounded p-3';
        const title = document.createElement('h4');
        title.className = 'h6 mb-2';
        title.textContent = listing.brand + ' ' + listing.model;
        const details = document.createElement('p');
        details.className = 'small text-secondary';
        const published = listing.status === 'published';
        details.textContent = [listing.year + ' г.', '$' + money.format(listing.price),
            published ? reviewLabels[listing.review_status] : 'Снято с публикации'].join(' · ');
        const controls = document.createElement('div');
        controls.className = 'd-flex flex-wrap gap-2';
        if (published && listing.review_status === 'approved') controls.append(link('Открыть', 'ad.html?id=' + listing.id, 'btn btn-sm btn-purple'));
        controls.append(link('Редактировать', 'add_ad.html?id=' + listing.id, 'btn btn-sm btn-outline-purple'));

        const visibility = document.createElement('button');
        visibility.type = 'button';
        visibility.className = 'btn btn-sm btn-outline-purple';
        visibility.textContent = published ? 'Снять с публикации' : 'Опубликовать снова';
        visibility.addEventListener('click', async () => {
            if (published && !window.confirm('Снять объявление с публикации?')) return;
            visibility.disabled = true;
            try {
                const response = await fetch('/api/listings/' + listing.id + '/status', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: published ? 'archived' : 'published' })
                });
                const result = await response.json();
                if (!response.ok) {
                    message.textContent = result.error || 'Не удалось изменить статус.';
                    return;
                }
                card.replaceWith(renderListing(result.listing));
                message.textContent = published ? 'Объявление снято с публикации.' : reviewLabels[result.listing.review_status] + '.';
            } catch {
                message.textContent = 'Сервер недоступен. Попробуйте ещё раз.';
            } finally {
                visibility.disabled = false;
            }
        });
        controls.append(visibility);
        card.append(title, details);
        if (listing.review_status === 'rejected' && listing.review_note) {
            const reason = document.createElement('p');
            reason.className = 'small text-break';
            reason.textContent = 'Причина отклонения — ' + listing.review_note;
            card.append(reason);
        }
        card.append(controls);
        return card;
    }

    async function load() {
        if (loading) return;
        loading = true;
        message.textContent = 'Загружаем объявления…';
        try {
            const user = await window.AutoGoAuth.ready;
            if (!user) {
                message.textContent = 'Войдите, чтобы увидеть свои объявления.';
                return;
            }
            const response = await fetch('/api/listings/mine');
            if (!response.ok) throw new Error('Не удалось загрузить объявления');
            const { listings } = await response.json();
            list.replaceChildren(...listings.map(renderListing));
            message.textContent = listings.length ? '' : 'У вас пока нет объявлений.';
        } catch {
            message.textContent = 'Не удалось загрузить объявления. Обновите страницу.';
        } finally {
            loading = false;
        }
    }

    const tab = document.querySelector('[data-tab="myAds"]');
    tab.addEventListener('click', load);
    if (window.location.hash === '#my-ads') tab.click();
    else if (tab.classList.contains('active')) load();
})();

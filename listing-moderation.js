(function () {
    const content = document.getElementById('listingModerationQueue');
    const message = document.getElementById('listingModerationMessage');
    const refresh = document.getElementById('listingModerationRefresh');
    const currency = new Intl.NumberFormat('ru-RU');
    let loading = false;

    function addText(parent, tag, text, className) {
        const element = document.createElement(tag);
        element.textContent = text;
        element.className = className;
        parent.append(element);
        return element;
    }

    function renderListing(listing) {
        const card = document.createElement('article');
        card.className = 'border rounded p-3';
        addText(card, 'h3', listing.brand + ' ' + listing.model, 'h6 fw-bold');
        addText(card, 'p', [
            '#' + listing.id, listing.seller_name, listing.year + ' г.',
            '$' + currency.format(listing.price), currency.format(listing.mileage) + ' км'
        ].join(' · '), 'small text-secondary');
        const description = addText(card, 'p', listing.description, 'text-break');
        description.style.whiteSpace = 'pre-wrap';

        const form = document.createElement('form');
        const label = document.createElement('label');
        label.className = 'form-label d-block small';
        label.textContent = 'Причина отклонения';
        const reason = document.createElement('textarea');
        reason.className = 'form-control mt-1';
        reason.rows = 2;
        reason.maxLength = 500;
        label.append(reason);
        form.append(label);

        const actions = document.createElement('div');
        actions.className = 'd-flex flex-wrap gap-2';
        const approve = addText(actions, 'button', 'Одобрить', 'btn btn-sm btn-purple');
        const reject = addText(actions, 'button', 'Отклонить', 'btn btn-sm btn-outline-danger');
        approve.type = reject.type = 'submit';
        approve.value = 'approved';
        reject.value = 'rejected';
        form.append(actions);
        card.append(form);

        form.addEventListener('submit', async event => {
            event.preventDefault();
            const decision = event.submitter?.value;
            if (!decision) return;
            if (decision === 'rejected' && !reason.value.trim()) {
                message.textContent = 'Укажите причину отклонения.';
                reason.focus();
                return;
            }
            approve.disabled = reject.disabled = true;
            try {
                const response = await fetch('/api/listing-moderation/' + listing.id, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ decision, reason: reason.value, revision: listing.revision })
                });
                const data = await response.json();
                if (!response.ok) {
                    message.textContent = data.error || 'Не удалось сохранить решение.';
                    return;
                }
                const notice = decision === 'approved' ? 'Объявление одобрено.' : 'Объявление отклонено.';
                card.remove();
                if (content.children.length === 0) await load(notice);
                else message.textContent = notice;
            } catch {
                message.textContent = 'Сервер недоступен. Попробуйте ещё раз.';
            } finally {
                approve.disabled = reject.disabled = false;
            }
        });
        return card;
    }

    async function load(notice = '') {
        if (loading) return;
        loading = true;
        refresh.disabled = true;
        message.textContent = 'Загружаем очередь…';
        try {
            const response = await fetch('/api/listing-moderation/queue');
            const data = await response.json();
            if (!response.ok) {
                content.replaceChildren();
                message.textContent = data.error || 'Не удалось загрузить очередь.';
                return;
            }
            content.replaceChildren(...data.listings.map(renderListing));
            const count = data.listings.length;
            const state = count ? 'Объявлений на странице: ' + count : 'Очередь пуста.';
            message.textContent = [notice, state].filter(Boolean).join(' ');
        } catch {
            message.textContent = 'Не удалось загрузить очередь. Попробуйте ещё раз.';
        } finally {
            loading = false;
            refresh.disabled = false;
        }
    }

    const tab = document.querySelector('[data-tab="listing-moderation"]');
    tab.addEventListener('click', () => load());
    refresh.addEventListener('click', () => load());
    if (window.location.hash === '#listing-moderation') tab.click();
})();

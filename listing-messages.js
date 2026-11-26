(function () {
    const list = document.getElementById('conversationList');
    const title = document.getElementById('conversationTitle');
    const log = document.getElementById('messageHistory');
    const status = document.getElementById('messagesStatus');
    const older = document.getElementById('olderMessages');
    const form = document.getElementById('messageCompose');
    const submit = form.querySelector('[type="submit"]');
    const params = new URLSearchParams(window.location.search);
    let listingId = Number(params.get('listing')) || null;
    let thread = null;
    let firstId = null;
    let sequence = 0;
    const timestamp = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' });

    async function request(path, body) {
        const response = await fetch('/api/messages' + path, body === undefined ? undefined : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Не удалось выполнить запрос.');
        return data;
    }

    function memberText(parent, tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        parent.append(element);
        return element;
    }

    function renderMessage(entry) {
        const item = document.createElement('li');
        item.className = 'border rounded p-2';
        const own = entry.author_id === window.AutoGoAuth.user.id;
        const date = new Date(entry.created_at.replace(' ', 'T') + 'Z');
        memberText(item, 'p', 'small text-secondary mb-1',
            (own ? 'Вы' : thread.counterpart) + ' · ' + timestamp.format(date));
        const body = memberText(item, 'p', 'text-break mb-0', entry.body);
        body.style.whiteSpace = 'pre-wrap';
        return item;
    }

    async function loadHistory(before = null) {
        const requestId = ++sequence;
        const currentId = thread.id;
        older.disabled = true;
        try {
            const result = await request('/conversations/' + currentId + '/messages' + (before ? '?before=' + before : ''));
            if (requestId !== sequence) return;
            const nodes = result.messages.map(renderMessage);
            if (before) log.prepend(...nodes);
            else log.replaceChildren(...nodes);
            firstId = result.messages[0]?.id ?? firstId;
            older.hidden = !result.hasMore;
        } catch (error) {
            if (requestId === sequence) status.textContent = error.message;
        } finally {
            if (requestId === sequence) older.disabled = false;
        }
    }

    function choose(conversation) {
        if (submit.disabled) return;
        thread = conversation;
        listingId = null;
        title.textContent = thread.title + ' · ' + thread.counterpart;
        for (const button of list.querySelectorAll('button')) {
            button.setAttribute('aria-pressed', String(Number(button.dataset.threadId) === thread.id));
        }
        firstId = null;
        log.replaceChildren();
        older.hidden = true;
        status.textContent = '';
        form.reset();
        form.hidden = false;
        loadHistory();
    }

    async function refresh(openId = null) {
        const user = await window.AutoGoAuth.ready;
        if (!user) {
            status.textContent = 'Войдите, чтобы читать и отправлять сообщения.';
            return;
        }
        try {
            const data = await request('/conversations');
            list.replaceChildren();
            for (const item of data.conversations) {
                const button = memberText(list, 'button', 'btn btn-outline-purple btn-sm text-start', item.title + ' · ' + item.counterpart);
                button.type = 'button';
                button.dataset.threadId = item.id;
                button.setAttribute('aria-pressed', String(item.id === thread?.id));
                memberText(button, 'span', 'd-block text-truncate small', item.last_message);
                button.addEventListener('click', () => choose(item));
            }
            const opened = data.conversations.find(item => item.id === openId);
            if (opened) choose(opened);
            else if (thread) loadHistory();
            else if (listingId) {
                const car = visibleCars.find(item => item.id === listingId && item.isUserListing);
                title.textContent = car ? 'Написать продавцу · ' + car.brand + ' ' + car.model : '';
                form.hidden = !car;
                status.textContent = car ? '' : 'Объявление сейчас недоступно.';
            } else {
                status.textContent = data.conversations.length ? 'Выберите диалог.' : 'У вас пока нет сообщений.';
            }
        } catch (error) {
            status.textContent = error.message;
        }
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const body = form.elements.body.value.trim();
        if ((!thread && !listingId) || !body) return;
        submit.disabled = true;
        status.textContent = 'Отправляем сообщение…';
        let openId = null;
        try {
            if (thread) {
                await request('/conversations/' + thread.id + '/messages', { body });
            } else {
                const result = await request('/conversations', { listing_id: listingId, body });
                openId = result.conversation_id;
            }
            form.reset();
            status.textContent = '';
        } catch (error) {
            status.textContent = error.message;
            return;
        } finally {
            submit.disabled = false;
        }
        if (openId) {
            const url = new URL(window.location.href);
            url.searchParams.delete('listing');
            window.history.replaceState(null, '', url);
        }
        await refresh(openId);
    });

    const tab = document.querySelector('[data-tab="messages"]');
    tab.addEventListener('click', () => refresh());
    document.getElementById('refreshMessages').addEventListener('click', () => refresh());
    older.addEventListener('click', () => { if (firstId && thread) loadHistory(firstId); });
    if (window.location.hash === '#messages') tab.click();
})();

(function () {
    const rows = document.getElementById('reportRows');
    const filter = document.getElementById('reportStatusFilter');
    const message = document.getElementById('reportListMessage');
    const previous = document.getElementById('reportPrevious');
    const next = document.getElementById('reportNext');
    const pagination = document.getElementById('reportPagination');
    const pendingCount = document.getElementById('pendingReportCount');
    let page = 1;
    let requestNumber = 0;

    for (const [value, label] of Object.entries(reportStatuses)) {
        filter.add(new Option(label, value));
    }
    filter.value = 'pending';

    const dialog = document.getElementById('reviewReportDialog');
    const form = document.getElementById('reviewReportForm');
    const error = document.getElementById('reviewReportError');
    const submit = form.querySelector('[type="submit"]');
    let decision;

    function openReview(report, status) {
        decision = { report, status };
        form.reset();
        error.textContent = '';
        const canHide = status === 'resolved' && !report.listing_hidden;
        document.getElementById('reviewReportVisibility').hidden = !canHide;
        form.elements.hide.disabled = !canHide;
        document.getElementById('reviewReportTarget').textContent =
            reportStatuses[status] + ' · объявление #' + report.ad_id;
        dialog.showModal();
    }

    document.getElementById('reviewReportCancel').addEventListener('click', () => dialog.close());
    dialog.addEventListener('cancel', event => { if (submit.disabled) event.preventDefault(); });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const { report, status } = decision;
        const reply = form.elements.reply.value.trim();
        if (!reply) {
            error.textContent = 'Напишите короткий ответ пользователю.';
            return;
        }
        submit.disabled = true;
        const cancel = document.getElementById('reviewReportCancel');
        cancel.disabled = true;
        error.textContent = '';
        try {
            const response = await fetch('/api/reports/' + report.id, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reply, hide: form.elements.hide.checked })
            });
            const data = await response.json();
            if (response.status === 409) {
                dialog.close();
                await loadReports('Эту жалобу уже рассмотрели.');
            } else if (!response.ok) {
                error.textContent = data.error || 'Не удалось сохранить решение.';
            } else {
                dialog.close();
                await loadReports('Ответ и решение сохранены.');
            }
        } catch {
            error.textContent = 'Не удалось связаться с сервером.';
        } finally {
            submit.disabled = false;
            cancel.disabled = false;
        }
    });

    async function changeVisibility(report, button, hidden) {
        const action = hidden ? 'Скрыть' : 'Вернуть в каталог';
        if (!window.confirm(action + ' объявление #' + report.ad_id + '?')) return;
        button.disabled = true;
        try {
            const response = await fetch('/api/reports/listings/' + report.ad_id + '/visibility', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hidden })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Не удалось изменить видимость объявления.');
            await loadReports(hidden ? 'Объявление скрыто.' : 'Объявление возвращено в каталог.');
        } catch (cause) {
            message.textContent = cause.message || 'Не удалось связаться с сервером.';
        } finally {
            button.disabled = false;
        }
    }

    function addAction(container, label, action) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline-purple';
        button.textContent = label;
        button.addEventListener('click', () => action(button));
        container.appendChild(button);
    }

    function renderReports(reports) {
        rows.replaceChildren();
        for (const report of reports) {
            const row = rows.insertRow();
            const link = document.createElement('a');
            if (!report.listing_hidden) link.href = 'ad.html?id=' + encodeURIComponent(report.ad_id);
            link.textContent = '#' + report.ad_id + (report.listing_hidden ? ' · скрыто' : '');
            row.insertCell().appendChild(link);

            const reason = row.insertCell();
            reason.textContent = reportReasons[report.reason] || 'Другая причина';
            if (report.comment) {
                const comment = document.createElement('div');
                comment.className = 'small text-secondary text-break';
                comment.textContent = report.comment;
                reason.appendChild(comment);
            }

            row.insertCell().textContent = report.reporter_name;
            const time = document.createElement('time');
            time.dateTime = report.created_at.replace(' ', 'T') + 'Z';
            time.textContent = new Date(time.dateTime).toLocaleString('ru-RU');
            row.insertCell().appendChild(time);
            const state = row.insertCell();
            state.textContent = reportStatuses[report.status];
            if (report.reply) {
                const reply = document.createElement('div');
                reply.className = 'small text-secondary text-break';
                reply.textContent = 'Ответ: ' + report.reply;
                state.appendChild(reply);
            }
            const actions = row.insertCell();
            const buttons = document.createElement('div');
            buttons.className = 'd-flex flex-wrap gap-2';
            actions.appendChild(buttons);
            if (report.status === 'pending') {
                addAction(buttons, 'Подтвердить', () => openReview(report, 'resolved'));
                addAction(buttons, 'Отклонить', () => openReview(report, 'dismissed'));
            }
            if (report.listing_hidden) {
                addAction(buttons, 'Вернуть в каталог', button => changeVisibility(report, button, false));
            } else if (report.status === 'resolved') {
                addAction(buttons, 'Скрыть объявление', button => changeVisibility(report, button, true));
            } else if (report.status !== 'pending') {
                actions.textContent = '—';
            }
        }
    }

    async function loadReports(notice = '') {
        const request = ++requestNumber;
        rows.replaceChildren();
        pagination.classList.add('visually-hidden');
        previous.disabled = true;
        next.disabled = true;
        message.textContent = 'Загрузка…';

        try {
            const params = new URLSearchParams({ page });
            if (filter.value) params.set('status', filter.value);
            const response = await fetch('/api/reports?' + params);
            const data = await response.json();
            if (request !== requestNumber) return;

            if (!response.ok) {
                message.textContent = data.error || 'Не удалось загрузить жалобы.';
                return;
            }

            const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
            if (page > pages) {
                page = pages;
                await loadReports(notice);
                return;
            }
            pendingCount.textContent = data.pending;
            message.textContent = [notice, data.total ? 'Найдено: ' + data.total : 'Жалоб с этим статусом пока нет.'].filter(Boolean).join(' ');
            renderReports(data.reports);
            pagination.classList.toggle('visually-hidden', pages <= 1);
            previous.disabled = page <= 1;
            next.disabled = page >= pages;
            document.getElementById('reportPage').textContent = page + ' / ' + pages;
        } catch {
            if (request === requestNumber) message.textContent = 'Не удалось загрузить жалобы. Попробуйте обновить список.';
        }
    }

    document.querySelector('[data-tab="reports"]').addEventListener('click', () => loadReports());
    document.getElementById('reloadReports').addEventListener('click', () => loadReports());
    filter.addEventListener('change', () => { page = 1; loadReports(); });
    previous.addEventListener('click', () => { page--; loadReports(); });
    next.addEventListener('click', () => { page++; loadReports(); });
    if (window.location.hash === '#reports') document.querySelector('[data-tab="reports"]').click();
    else loadReports();
})();

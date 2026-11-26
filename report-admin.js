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

    function addAction(container, report, status, label) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline-purple';
        button.textContent = label;
        button.addEventListener('click', async () => {
            const sequence = requestNumber;
            const buttons = [...container.querySelectorAll('button')];
            buttons.forEach(item => { item.disabled = true; });
            try {
                const response = await fetch('/api/reports/' + report.id, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                const data = await response.json();
                if (response.status === 409) {
                    await loadReports('Эту жалобу уже рассмотрели.');
                } else if (!response.ok) {
                    if (sequence === requestNumber) message.textContent = data.error || 'Не удалось сохранить решение.';
                } else {
                    await loadReports('Решение сохранено.');
                }
            } catch {
                if (sequence === requestNumber) message.textContent = 'Не удалось связаться с сервером.';
            } finally {
                buttons.forEach(item => { item.disabled = false; });
            }
        });
        container.appendChild(button);
    }

    function renderReports(reports) {
        rows.replaceChildren();
        for (const report of reports) {
            const row = rows.insertRow();
            const link = document.createElement('a');
            link.href = 'ad.html?id=' + encodeURIComponent(report.ad_id);
            link.textContent = '#' + report.ad_id;
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
            row.insertCell().textContent = reportStatuses[report.status];
            const actions = row.insertCell();
            if (report.status === 'pending') {
                const buttons = document.createElement('div');
                buttons.className = 'd-flex flex-wrap gap-2';
                actions.appendChild(buttons);
                addAction(buttons, report, 'resolved', 'Подтвердить');
                addAction(buttons, report, 'dismissed', 'Отклонить');
            } else {
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
    loadReports();
})();

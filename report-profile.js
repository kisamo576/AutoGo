(function () {
    const section = document.getElementById('myReportsTab');
    const list = document.getElementById('myReportsList');
    const message = document.getElementById('myReportsMessage');
    const more = document.getElementById('moreMyReports');
    const refresh = document.getElementById('refreshMyReports');
    let page = 0;
    let loading = false;

    function addText(parent, tag, value, className) {
        const element = document.createElement(tag);
        element.textContent = value;
        element.className = className;
        parent.appendChild(element);
        return element;
    }

    function renderReport(report) {
        const card = document.createElement('article');
        card.className = 'border rounded p-3';
        const car = carsDatabase.find(item => item.id === report.ad_id);
        const title = car ? car.brand + ' ' + car.model : 'Объявление #' + report.ad_id;
        if (report.listing_hidden) {
            addText(card, 'h4', title + ' · скрыто', 'h6 mb-2');
        } else {
            const link = addText(card, 'a', title, 'fw-bold');
            link.href = 'ad.html?id=' + report.ad_id;
        }

        addText(card, 'p', reportStatuses[report.status] + ' · ' + reportReasons[report.reason], 'small text-secondary mb-2');
        if (report.comment) addText(card, 'p', report.comment, 'small text-break mb-2');
        if (report.reply) {
            addText(card, 'h5', 'Ответ администратора', 'h6 mb-1');
            addText(card, 'p', report.reply, 'text-break mb-1');
        }
        if (report.reviewed_at) {
            const time = new Date(report.reviewed_at.replace(' ', 'T') + 'Z');
            addText(card, 'p', 'Рассмотрена ' + time.toLocaleString('ru-RU'), 'small text-secondary mb-0');
        }
        list.appendChild(card);
    }

    async function load(reset) {
        if (loading) return;
        loading = true;
        refresh.disabled = true;
        more.disabled = true;
        if (reset) {
            page = 0;
            list.replaceChildren();
            more.hidden = true;
        }
        message.textContent = 'Загрузка…';
        try {
            const response = await fetch('/api/reports/mine?page=' + (page + 1));
            if (response.status === 401) {
                message.textContent = 'Войдите в аккаунт, чтобы увидеть свои жалобы.';
                return;
            }
            if (!response.ok) throw new Error('Не удалось загрузить жалобы');

            const data = await response.json();
            page++;
            data.reports.forEach(renderReport);
            message.textContent = list.children.length ? '' : 'Вы пока не отправляли жалобы.';
            more.hidden = !data.hasMore;
        } catch {
            message.textContent = 'Не удалось загрузить жалобы. Попробуйте ещё раз.';
        } finally {
            loading = false;
            refresh.disabled = false;
            more.disabled = false;
        }
    }

    document.querySelector('[data-tab="myReports"]').addEventListener('click', () => load(true));
    refresh.addEventListener('click', () => load(true));
    more.addEventListener('click', () => load(false));
    if (window.location.hash === '#my-reports') document.querySelector('[data-tab="myReports"]').click();
})();

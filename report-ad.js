(function () {
    const trigger = document.querySelector('[data-report-ad]');
    if (!trigger) return;

    const dialog = document.getElementById('reportDialog');
    const form = document.getElementById('reportForm');
    const reason = form.elements.reason;
    const comment = form.elements.comment;
    const submit = form.querySelector('[type="submit"]');
    const status = document.getElementById('reportStatus');
    const error = document.getElementById('reportError');

    for (const [value, label] of Object.entries(reportReasons)) {
        reason.add(new Option(label, value));
    }

    trigger.addEventListener('click', () => {
        error.textContent = '';
        status.textContent = '';
        document.getElementById('reportTarget').textContent = trigger.dataset.reportTitle;
        dialog.showModal();
    });

    document.getElementById('reportCancel').addEventListener('click', () => dialog.close());
    reason.addEventListener('change', () => { comment.required = reason.value === 'other'; });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        submit.disabled = true;
        error.textContent = '';

        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ad_id: Number(trigger.dataset.reportAd),
                    reason: reason.value,
                    comment: comment.value
                })
            });
            if (response.status === 401) {
                error.textContent = 'Войдите в аккаунт, чтобы отправить жалобу.';
                return;
            }

            const data = await response.json();
            if (!response.ok) {
                error.textContent = data.error || 'Не удалось отправить жалобу.';
                return;
            }

            form.reset();
            comment.required = false;
            dialog.close();
            status.textContent = 'Жалоба отправлена и ожидает рассмотрения.';
        } catch {
            error.textContent = 'Не удалось связаться с сервером. Попробуйте ещё раз.';
        } finally {
            submit.disabled = false;
        }
    });
})();

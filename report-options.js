const reportReasons = Object.freeze({
    misleading: 'Недостоверная информация',
    wrong_price: 'Некорректная цена',
    spam: 'Спам или дубликат',
    other: 'Другая причина'
});

const reportStatuses = Object.freeze({
    pending: 'На рассмотрении',
    resolved: 'Подтверждена',
    dismissed: 'Отклонена'
});

if (typeof module !== 'undefined') module.exports = { reportReasons, reportStatuses };

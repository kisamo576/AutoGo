const FUEL_TYPE_LABELS = { petrol: 'Бензин', diesel: 'Дизель', electric: 'Электро', hybrid: 'Гибрид' };

let cars = [];
let activeCarId = null;
let activeTab = 'info';

const root = document.getElementById('garageRoot');

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка запроса (${res.status})`);
  return data;
}

function renderLoggedOut() {
  root.innerHTML = `
    <div class="autogo-page-card autogo-empty-state">
      <i class="bi bi-car-front" style="font-size:3rem;"></i>
      <h3 class="mt-3">Гараж доступен после входа</h3>
      <p>Войдите в аккаунт, чтобы добавлять автомобили, вести трекер заправок и журнал ТО.</p>
      <button class="btn btn-purple mt-2" data-bs-toggle="modal" data-bs-target="#loginModal">Войти</button>
    </div>`;
}

async function loadCars() {
  const data = await api('/api/garage');
  cars = data.cars;
  if (cars.length && !cars.find(c => c.id === activeCarId)) activeCarId = cars[0].id;
  if (!cars.length) activeCarId = null;
  render();
}

function render() {
  const carsGridHtml = cars.map(c => `
    <div class="col-md-4 col-lg-3">
      <div class="garage-car-card ${c.id === activeCarId ? 'active' : ''}" data-car-id="${c.id}">
        <div class="car-title">${esc(c.brand)} ${esc(c.model)}</div>
        <div class="text-secondary small">${c.year || '—'} • ${FUEL_TYPE_LABELS[c.fuel_type] || c.fuel_type}</div>
        <div class="mt-2"><span class="autogo-tag">${c.odometer.toLocaleString()} км</span>${c.plate_number ? `<span class="autogo-tag">${esc(c.plate_number)}</span>` : ''}</div>
      </div>
    </div>
  `).join('');

  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center flex-wrap mb-3">
      <h2 class="mb-0"><i class="bi bi-car-front"></i> Мой гараж</h2>
      <button class="btn btn-purple" id="addCarBtn"><i class="bi bi-plus-circle"></i> Добавить автомобиль</button>
    </div>
    <div class="row g-3 mb-4">${carsGridHtml || '<div class="col-12"><div class="autogo-page-card autogo-empty-state">Пока нет ни одного автомобиля. Добавьте первый, чтобы вести трекер заправок и ТО.</div></div>'}</div>
    <div id="carDetail"></div>
  `;

  document.getElementById('addCarBtn').addEventListener('click', openAddCarModal);
  document.querySelectorAll('[data-car-id]').forEach(el => {
    el.addEventListener('click', () => { activeCarId = Number(el.dataset.carId); activeTab = 'info'; render(); });
  });

  renderDetail();
}

function renderDetail() {
  const detailEl = document.getElementById('carDetail');
  const car = cars.find(c => c.id === activeCarId);
  if (!car) { detailEl.innerHTML = ''; return; }

  detailEl.innerHTML = `
    <div class="autogo-page-card">
      <div class="autogo-tab-btns mb-3">
        <button class="btn btn-sm ${activeTab === 'info' ? 'btn-purple' : 'btn-outline-purple'}" data-tab="info">Характеристики</button>
        <button class="btn btn-sm ${activeTab === 'fuel' ? 'btn-purple' : 'btn-outline-purple'}" data-tab="fuel"><i class="bi bi-fuel-pump"></i> Заправки/зарядки</button>
        <button class="btn btn-sm ${activeTab === 'maintenance' ? 'btn-purple' : 'btn-outline-purple'}" data-tab="maintenance"><i class="bi bi-wrench-adjustable"></i> ТО</button>
        <button class="btn btn-sm ${activeTab === 'parts' ? 'btn-purple' : 'btn-outline-purple'}" data-tab="parts"><i class="bi bi-gear"></i> Запчасти</button>
        <button class="btn btn-sm ${activeTab === 'inspections' ? 'btn-purple' : 'btn-outline-purple'}" data-tab="inspections"><i class="bi bi-shield-check"></i> Проверки</button>
      </div>
      <div id="carDetailContent"></div>
    </div>
  `;

  detailEl.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => { activeTab = btn.dataset.tab; renderDetail(); });
  });

  const content = document.getElementById('carDetailContent');
  if (activeTab === 'info') renderInfoTab(content, car);
  else if (activeTab === 'fuel') renderFuelTab(content, car);
  else if (activeTab === 'maintenance') renderMaintenanceTab(content, car);
  else if (activeTab === 'parts') renderPartsTab(content, car);
  else renderInspectionsTab(content, car);
}

function renderInfoTab(content, car) {
  content.innerHTML = `
    <div class="row g-3">
      <div class="col-md-8">
        <h4>${esc(car.brand)} ${esc(car.model)} ${car.year ? `(${car.year})` : ''}</h4>
        <p class="text-secondary mb-2">${car.note ? esc(car.note) : 'Без заметок'}</p>
        <div class="d-flex flex-wrap gap-2">
          <span class="autogo-tag">Пробег: ${car.odometer.toLocaleString()} км</span>
          <span class="autogo-tag">Топливо: ${FUEL_TYPE_LABELS[car.fuel_type] || car.fuel_type}</span>
          ${car.engine_volume ? `<span class="autogo-tag">Двигатель: ${car.engine_volume} л</span>` : ''}
          ${car.vin ? `<span class="autogo-tag">VIN: ${esc(car.vin)}</span>` : ''}
          ${car.plate_number ? `<span class="autogo-tag">Номер: ${esc(car.plate_number)}</span>` : ''}
        </div>
      </div>
      <div class="col-md-4 d-flex flex-column gap-2 justify-content-start">
        <button class="btn btn-outline-purple btn-sm" id="editCarBtn"><i class="bi bi-pencil"></i> Изменить</button>
        <button class="btn btn-outline-danger btn-sm" id="deleteCarBtn"><i class="bi bi-trash"></i> Удалить автомобиль</button>
      </div>
    </div>
  `;
  document.getElementById('editCarBtn').addEventListener('click', () => openEditCarModal(car));
  document.getElementById('deleteCarBtn').addEventListener('click', () => deleteCar(car));
}

async function renderFuelTab(content, car) {
  content.innerHTML = `<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-purple"></div></div>`;
  try {
    const [{ logs }, stats] = await Promise.all([
      api(`/api/garage/${car.id}/fuel-logs`),
      api(`/api/garage/${car.id}/fuel-stats`)
    ]);

    const statsHtml = `
      <div class="row g-2 mb-3">
        <div class="col-md-3"><div class="stat-box"><div class="val">${stats.totalCost} $</div><div class="lbl">Всего затрат</div></div></div>
        <div class="col-md-3"><div class="stat-box"><div class="val">${stats.totalAmount}</div><div class="lbl">Всего л/кВт·ч</div></div></div>
        <div class="col-md-3"><div class="stat-box"><div class="val">${stats.avgPer100km ?? '—'}</div><div class="lbl">Средний расход / 100км</div></div></div>
        <div class="col-md-3"><div class="stat-box"><div class="val">${stats.avgCostPerKm ?? '—'}</div><div class="lbl">$ за км</div></div></div>
      </div>`;

    const rowsHtml = logs.map(l => `
      <tr>
        <td>${l.log_date}</td>
        <td>${l.entry_type === 'fuel' ? 'Заправка' : 'Зарядка'}</td>
        <td>${l.amount}</td>
        <td>${l.cost} $</td>
        <td>${l.odometer.toLocaleString()} км</td>
        <td>${l.station ? esc(l.station) : '—'}</td>
        <td><button class="btn btn-sm btn-outline-danger" data-del-fuel="${l.id}"><i class="bi bi-trash"></i></button></td>
      </tr>
    `).join('');

    content.innerHTML = `
      ${statsHtml}
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h5 class="mb-0">История</h5>
        <button class="btn btn-purple btn-sm" id="addFuelBtn"><i class="bi bi-plus-circle"></i> Добавить запись</button>
      </div>
      ${logs.length ? `
        <div class="table-responsive"><table class="autogo-table">
          <thead><tr><th>Дата</th><th>Тип</th><th>Кол-во</th><th>Стоимость</th><th>Пробег</th><th>Станция</th><th></th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table></div>
      ` : '<div class="autogo-empty-state">Записей пока нет</div>'}
    `;

    document.getElementById('addFuelBtn').addEventListener('click', () => openFuelModal(car));
    content.querySelectorAll('[data-del-fuel]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Удалить запись?')) return;
        await api(`/api/garage/${car.id}/fuel-logs/${btn.dataset.delFuel}`, { method: 'DELETE' });
        renderFuelTab(content, car);
      });
    });
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`;
  }
}

function openFuelModal(car) {
  const form = document.getElementById('fuelForm');
  form.reset();
  document.getElementById('fuelFormError').style.display = 'none';
  document.getElementById('fuelDate').value = new Date().toISOString().slice(0, 10);
  form.dataset.carId = car.id;
  new bootstrap.Modal(document.getElementById('fuelFormModal')).show();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fuelForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const carId = e.target.dataset.carId;
    const errorDiv = document.getElementById('fuelFormError');
    errorDiv.style.display = 'none';
    try {
      await api(`/api/garage/${carId}/fuel-logs`, {
        method: 'POST',
        body: JSON.stringify({
          entry_type: document.getElementById('fuelEntryType').value,
          log_date: document.getElementById('fuelDate').value,
          amount: parseFloat(document.getElementById('fuelAmount').value),
          cost: parseFloat(document.getElementById('fuelCost').value),
          odometer: parseInt(document.getElementById('fuelOdometer').value, 10),
          station: document.getElementById('fuelStation').value
        })
      });
      bootstrap.Modal.getInstance(document.getElementById('fuelFormModal')).hide();
      await loadCars();
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.style.display = 'block';
    }
  });

  document.getElementById('maintenanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const carId = e.target.dataset.carId;
    const errorDiv = document.getElementById('maintenanceFormError');
    errorDiv.style.display = 'none';
    try {
      await api(`/api/garage/${carId}/maintenance`, {
        method: 'POST',
        body: JSON.stringify({
          log_date: document.getElementById('moDate').value,
          odometer: parseInt(document.getElementById('moOdometer').value, 10),
          work_description: document.getElementById('moDescription').value,
          cost: parseFloat(document.getElementById('moCost').value || '0'),
          next_due_odometer: document.getElementById('moNextOdometer').value ? parseInt(document.getElementById('moNextOdometer').value, 10) : null,
          next_due_date: document.getElementById('moNextDate').value || null
        })
      });
      bootstrap.Modal.getInstance(document.getElementById('maintenanceFormModal')).hide();
      await loadCars();
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.style.display = 'block';
    }
  });

  document.getElementById('partForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const carId = e.target.dataset.carId;
    const errorDiv = document.getElementById('partFormError');
    errorDiv.style.display = 'none';
    try {
      await api(`/api/garage/${carId}/parts`, {
        method: 'POST',
        body: JSON.stringify({
          replaced_date: document.getElementById('partDate').value,
          odometer: document.getElementById('partOdometer').value ? parseInt(document.getElementById('partOdometer').value, 10) : null,
          part_name: document.getElementById('partName').value,
          cost: parseFloat(document.getElementById('partCost').value || '0'),
          note: document.getElementById('partNote').value
        })
      });
      bootstrap.Modal.getInstance(document.getElementById('partFormModal')).hide();
      await loadCars();
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.style.display = 'block';
    }
  });

  document.getElementById('inspectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const carId = e.target.dataset.carId;
    const errorDiv = document.getElementById('inspectionFormError');
    errorDiv.style.display = 'none';
    try {
      await api(`/api/garage/${carId}/inspections`, {
        method: 'POST',
        body: JSON.stringify({
          inspection_type: document.getElementById('inspectionType').value,
          issued_date: document.getElementById('inspectionIssued').value || null,
          expiry_date: document.getElementById('inspectionExpiry').value,
          cost: document.getElementById('inspectionCost').value ? parseFloat(document.getElementById('inspectionCost').value) : null,
          note: document.getElementById('inspectionNote').value
        })
      });
      bootstrap.Modal.getInstance(document.getElementById('inspectionFormModal')).hide();
      await loadCars();
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.style.display = 'block';
    }
  });

  document.getElementById('carForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('carFormError');
    errorDiv.style.display = 'none';
    const payload = {
      brand: document.getElementById('carBrand').value,
      model: document.getElementById('carModel').value,
      year: document.getElementById('carYear').value ? parseInt(document.getElementById('carYear').value, 10) : null,
      odometer: document.getElementById('carOdometer').value ? parseInt(document.getElementById('carOdometer').value, 10) : 0,
      fuel_type: document.getElementById('carFuelType').value,
      engine_volume: document.getElementById('carEngineVolume').value ? parseFloat(document.getElementById('carEngineVolume').value) : null,
      vin: document.getElementById('carVin').value,
      plate_number: document.getElementById('carPlate').value,
      note: document.getElementById('carNote').value
    };
    const carId = document.getElementById('carId').value;
    try {
      if (carId) await api(`/api/garage/${carId}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api('/api/garage', { method: 'POST', body: JSON.stringify(payload) });
      bootstrap.Modal.getInstance(document.getElementById('carFormModal')).hide();
      await loadCars();
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.style.display = 'block';
    }
  });
});

function openMaintenanceModal(car) {
  const form = document.getElementById('maintenanceForm');
  form.reset();
  document.getElementById('maintenanceFormError').style.display = 'none';
  document.getElementById('moDate').value = new Date().toISOString().slice(0, 10);
  form.dataset.carId = car.id;
  new bootstrap.Modal(document.getElementById('maintenanceFormModal')).show();
}

async function renderMaintenanceTab(content, car) {
  content.innerHTML = `<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-purple"></div></div>`;
  try {
    const [{ logs }, reminders] = await Promise.all([
      api(`/api/garage/${car.id}/maintenance`),
      api(`/api/garage/${car.id}/maintenance-reminders`)
    ]);

    const remindersHtml = reminders.reminders.length ? reminders.reminders.map(r => `
      <div class="autogo-page-card ${r.is_due ? 'reminder-due' : 'reminder-ok'} mb-2 py-2">
        <strong>${esc(r.based_on)}</strong><br>
        <span class="small text-secondary">
          ${r.next_due_odometer ? `До пробега ${r.next_due_odometer.toLocaleString()} км (осталось ${r.km_left} км)` : ''}
          ${r.next_due_date ? ` · До ${r.next_due_date} (осталось ${r.days_left} дн.)` : ''}
          ${r.is_due ? ' · <span class="text-danger fw-bold">Пора на ТО!</span>' : ''}
        </span>
      </div>
    `).join('') : '';

    const rowsHtml = logs.map(l => `
      <tr>
        <td>${l.log_date}</td>
        <td>${esc(l.work_description)}</td>
        <td>${l.odometer.toLocaleString()} км</td>
        <td>${l.cost} $</td>
        <td>${l.next_due_odometer ? l.next_due_odometer.toLocaleString() + ' км' : (l.next_due_date || '—')}</td>
        <td><button class="btn btn-sm btn-outline-danger" data-del-mo="${l.id}"><i class="bi bi-trash"></i></button></td>
      </tr>
    `).join('');

    content.innerHTML = `
      ${remindersHtml ? `<h5 class="mb-2">Напоминания</h5>${remindersHtml}` : ''}
      <div class="d-flex justify-content-between align-items-center mb-2 mt-3">
        <h5 class="mb-0">История ТО</h5>
        <button class="btn btn-purple btn-sm" id="addMoBtn"><i class="bi bi-plus-circle"></i> Добавить запись</button>
      </div>
      ${logs.length ? `
        <div class="table-responsive"><table class="autogo-table">
          <thead><tr><th>Дата</th><th>Работы</th><th>Пробег</th><th>Стоимость</th><th>Следующее ТО</th><th></th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table></div>
      ` : '<div class="autogo-empty-state">Записей ТО пока нет</div>'}
    `;

    document.getElementById('addMoBtn').addEventListener('click', () => openMaintenanceModal(car));
    content.querySelectorAll('[data-del-mo]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Удалить запись?')) return;
        await api(`/api/garage/${car.id}/maintenance/${btn.dataset.delMo}`, { method: 'DELETE' });
        renderMaintenanceTab(content, car);
      });
    });
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`;
  }
}

async function renderPartsTab(content, car) {
  content.innerHTML = `<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-purple"></div></div>`;
  try {
    const { parts } = await api(`/api/garage/${car.id}/parts`);

    const rowsHtml = parts.map(p => `
      <tr>
        <td>${p.replaced_date}</td>
        <td>${esc(p.part_name)}</td>
        <td>${p.odometer != null ? p.odometer.toLocaleString() + ' км' : '—'}</td>
        <td>${p.cost} $</td>
        <td>${p.note ? esc(p.note) : '—'}</td>
        <td><button class="btn btn-sm btn-outline-danger" data-del-part="${p.id}"><i class="bi bi-trash"></i></button></td>
      </tr>
    `).join('');

    content.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h5 class="mb-0">Замены запчастей</h5>
        <button class="btn btn-purple btn-sm" id="addPartBtn"><i class="bi bi-plus-circle"></i> Добавить запись</button>
      </div>
      ${parts.length ? `
        <div class="table-responsive"><table class="autogo-table">
          <thead><tr><th>Дата</th><th>Деталь</th><th>Пробег</th><th>Стоимость</th><th>Заметка</th><th></th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table></div>
      ` : '<div class="autogo-empty-state">Замен пока не было</div>'}
    `;

    document.getElementById('addPartBtn').addEventListener('click', () => openPartModal(car));
    content.querySelectorAll('[data-del-part]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Удалить запись?')) return;
        await api(`/api/garage/${car.id}/parts/${btn.dataset.delPart}`, { method: 'DELETE' });
        renderPartsTab(content, car);
      });
    });
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`;
  }
}

function openPartModal(car) {
  const form = document.getElementById('partForm');
  form.reset();
  document.getElementById('partFormError').style.display = 'none';
  document.getElementById('partDate').value = new Date().toISOString().slice(0, 10);
  form.dataset.carId = car.id;
  new bootstrap.Modal(document.getElementById('partFormModal')).show();
}

const INSPECTION_LABELS = { tech_inspection: 'Техосмотр', insurance: 'Страховка', other: 'Другое' };

async function renderInspectionsTab(content, car) {
  content.innerHTML = `<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-purple"></div></div>`;
  try {
    const [{ inspections }, { reminders }] = await Promise.all([
      api(`/api/garage/${car.id}/inspections`),
      api(`/api/garage/${car.id}/inspection-reminders`)
    ]);

    const remindersHtml = reminders.map(r => `
      <div class="autogo-page-card ${r.is_due ? 'reminder-due' : 'reminder-ok'} mb-2 py-2">
        <strong>${esc(r.label)}</strong><br>
        <span class="small text-secondary">
          Действует до ${r.expiry_date}
          ${r.is_due ? ' · <span class="text-danger fw-bold">Срок истёк</span>' : r.is_due_soon ? ` · <span class="text-warning fw-bold">Осталось ${r.days_left} дн.</span>` : ` · осталось ${r.days_left} дн.`}
        </span>
      </div>
    `).join('');

    const rowsHtml = inspections.map(i => `
      <tr>
        <td>${INSPECTION_LABELS[i.inspection_type] || i.inspection_type}</td>
        <td>${i.issued_date || '—'}</td>
        <td>${i.expiry_date}</td>
        <td>${i.cost != null ? i.cost + ' $' : '—'}</td>
        <td>${i.note ? esc(i.note) : '—'}</td>
        <td><button class="btn btn-sm btn-outline-danger" data-del-insp="${i.id}"><i class="bi bi-trash"></i></button></td>
      </tr>
    `).join('');

    content.innerHTML = `
      ${remindersHtml ? `<h5 class="mb-2">Напоминания</h5>${remindersHtml}` : ''}
      <div class="d-flex justify-content-between align-items-center mb-2 mt-3">
        <h5 class="mb-0">Техосмотр и страховка</h5>
        <button class="btn btn-purple btn-sm" id="addInspectionBtn"><i class="bi bi-plus-circle"></i> Добавить запись</button>
      </div>
      ${inspections.length ? `
        <div class="table-responsive"><table class="autogo-table">
          <thead><tr><th>Тип</th><th>Оформлено</th><th>Действует до</th><th>Стоимость</th><th>Заметка</th><th></th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table></div>
      ` : '<div class="autogo-empty-state">Записей пока нет</div>'}
    `;

    document.getElementById('addInspectionBtn').addEventListener('click', () => openInspectionModal(car));
    content.querySelectorAll('[data-del-insp]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Удалить запись?')) return;
        await api(`/api/garage/${car.id}/inspections/${btn.dataset.delInsp}`, { method: 'DELETE' });
        renderInspectionsTab(content, car);
      });
    });
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`;
  }
}

function openInspectionModal(car) {
  const form = document.getElementById('inspectionForm');
  form.reset();
  document.getElementById('inspectionFormError').style.display = 'none';
  form.dataset.carId = car.id;
  new bootstrap.Modal(document.getElementById('inspectionFormModal')).show();
}

function openAddCarModal() {
  document.getElementById('carFormModalTitle').textContent = 'Добавить автомобиль';
  document.getElementById('carForm').reset();
  document.getElementById('carId').value = '';
  document.getElementById('carFormError').style.display = 'none';
  new bootstrap.Modal(document.getElementById('carFormModal')).show();
}

function openEditCarModal(car) {
  document.getElementById('carFormModalTitle').textContent = 'Изменить автомобиль';
  document.getElementById('carFormError').style.display = 'none';
  document.getElementById('carId').value = car.id;
  document.getElementById('carBrand').value = car.brand;
  document.getElementById('carModel').value = car.model;
  document.getElementById('carYear').value = car.year || '';
  document.getElementById('carOdometer').value = car.odometer;
  document.getElementById('carFuelType').value = car.fuel_type;
  document.getElementById('carEngineVolume').value = car.engine_volume || '';
  document.getElementById('carVin').value = car.vin || '';
  document.getElementById('carPlate').value = car.plate_number || '';
  document.getElementById('carNote').value = car.note || '';
  new bootstrap.Modal(document.getElementById('carFormModal')).show();
}

async function deleteCar(car) {
  if (!confirm(`Удалить ${car.brand} ${car.model} вместе со всей историей заправок и ТО?`)) return;
  await api(`/api/garage/${car.id}`, { method: 'DELETE' });
  activeCarId = null;
  await loadCars();
}

window.AutoGoAuth.ready.then((user) => {
  if (!user) { renderLoggedOut(); return; }
  loadCars().catch(err => { root.innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`; });
});

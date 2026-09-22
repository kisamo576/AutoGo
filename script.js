// script.js – вся логика AutoGO

const brandSelect = document.getElementById('brandSelect');
const modelSelect = document.getElementById('modelSelect');
const yearFrom = document.getElementById('yearFrom');
const yearTo = document.getElementById('yearTo');
const priceFrom = document.getElementById('priceFrom');
const priceTo = document.getElementById('priceTo');
const volFrom = document.getElementById('volFrom');
const volTo = document.getElementById('volTo');

const uniqueBrands = [...new Map(carsDatabase.map(car => [car.brand, car.brand])).values()];
uniqueBrands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    if (brandSelect) brandSelect.appendChild(option);
});

if (yearFrom && yearTo) {
    for (let y = 2026; y >= 1980; y--) {
        yearFrom.appendChild(new Option(y, y));
        yearTo.appendChild(new Option(y, y));
    }
    yearFrom.insertBefore(new Option('Не выбран', ''), yearFrom.firstChild);
    yearTo.insertBefore(new Option('Не выбран', ''), yearTo.firstChild);
}

function updateModels() {
    if (!modelSelect) return;
    const selectedBrand = brandSelect ? brandSelect.value : '';
    modelSelect.innerHTML = '<option value="">Любая модель</option>';
    modelSelect.disabled = !selectedBrand;
    if (!selectedBrand) return;
    const models = [...new Map(carsDatabase.filter(car => car.brand === selectedBrand).map(car => [car.model, car.model])).values()];
    models.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        modelSelect.appendChild(opt);
    });
}
if (brandSelect) brandSelect.addEventListener('change', updateModels);
updateModels();

function searchAndRedirect() {
    const brand = brandSelect ? brandSelect.value : '';
    const model = modelSelect ? modelSelect.value : '';
    const yearFromVal = yearFrom ? yearFrom.value : '';
    const yearToVal = yearTo ? yearTo.value : '';
    const priceFromVal = priceFrom ? priceFrom.value : '';
    const priceToVal = priceTo ? priceTo.value : '';
    const volFromVal = volFrom ? volFrom.value : '';
    const volToVal = volTo ? volTo.value : '';
    
    const params = new URLSearchParams();
    if (brand) params.append('brand', brand);
    if (model) params.append('model', model);
    if (yearFromVal) params.append('yearFrom', yearFromVal);
    if (yearToVal) params.append('yearTo', yearToVal);
    if (priceFromVal) params.append('priceFrom', priceFromVal);
    if (priceToVal) params.append('priceTo', priceToVal);
    if (volFromVal) params.append('volFrom', volFromVal);
    if (volToVal) params.append('volTo', volToVal);
    
    window.location.href = `catalog.html?${params.toString()}`;
}

function createStaticCard(car, isPremium = false) {
    const onerror = `this.style.display='none'`;
    return `
        <div class="col-md-6 col-lg-4">
            <div class="car-card">
                <div class="car-img"><img src="${car.photo}" alt="${car.brand} ${car.model}" onerror="${onerror}" style="width:100%; height:100%; object-fit:cover;"></div>
                <div class="p-3">
                    <div class="price">$${car.price.toLocaleString()}</div>
                    <div class="fw-bold">${car.brand} ${car.model}</div>
                    <div class="small text-secondary">${car.year} • ${car.engine} л • ${car.mileage} км</div>
                    ${isPremium ? '<span class="premium-badge">⭐ Премиум продавец</span>' : ''}
                    <hr class="border-secondary">
                    <div class="d-flex justify-content-between">
                        <a href="ad.html?id=${car.id}" class="btn btn-outline-purple btn-sm">Подробнее</a>
                        <button class="like-btn"><i class="bi bi-heart"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

const premiumCars = carsDatabase.filter(c => c.isPremium).slice(0, 6);
const premiumCarouselInner = document.getElementById('premiumCarouselInner');
if (premiumCarouselInner) {
    let slidesHtml = '';
    for (let i = 0; i < premiumCars.length; i += 3) {
        let slideCards = '';
        premiumCars.slice(i, i+3).forEach(car => { slideCards += createStaticCard(car, true); });
        const active = i === 0 ? 'active' : '';
        slidesHtml += `<div class="carousel-item ${active}"><div class="row g-3">${slideCards}</div></div>`;
    }
    premiumCarouselInner.innerHTML = slidesHtml;
}

const latestCars = [...carsDatabase].reverse().slice(0, 6);
const latestContainer = document.getElementById('latestAds');
if (latestContainer) {
    latestCars.forEach(car => { latestContainer.innerHTML += createStaticCard(car, false); });
}

function initLikes() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.removeEventListener('click', likeHandler);
        btn.addEventListener('click', likeHandler);
    });
}
function likeHandler(e) {
    const btn = e.currentTarget;
    btn.classList.toggle('liked');
    const icon = btn.querySelector('i');
    if (btn.classList.contains('liked')) {
        icon.classList.remove('bi-heart');
        icon.classList.add('bi-heart-fill');
    } else {
        icon.classList.remove('bi-heart-fill');
        icon.classList.add('bi-heart');
    }
}
initLikes();

document.getElementById('searchBtn')?.addEventListener('click', searchAndRedirect);
document.getElementById('resetBtn')?.addEventListener('click', () => {
    if (brandSelect) brandSelect.value = '';
    updateModels();
    if (yearFrom) yearFrom.value = '';
    if (yearTo) yearTo.value = '';
    if (priceFrom) priceFrom.value = '';
    if (priceTo) priceTo.value = '';
    if (volFrom) volFrom.value = '';
    if (volTo) volTo.value = '';
});

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const login = this.querySelector('input[type="text"]').value;
        const pass = this.querySelector('input[type="password"]').value;
        const errorDiv = document.getElementById('loginError');
        if (login === 'user' && pass === '123') {
            window.location.href = 'profile.html';
        } else if (login === 'admin' && pass === 'admin123') {
            window.location.href = 'admin.html';
        } else if (errorDiv) {
            errorDiv.style.display = 'block';
            setTimeout(() => errorDiv.style.display = 'none', 3000);
        }
    });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const p1 = this.querySelectorAll('input[type="password"]')[0].value;
        const p2 = this.querySelectorAll('input[type="password"]')[1].value;
        const errorDiv = document.getElementById('registerError');
        if (p1 !== p2) {
            if (errorDiv) {
                errorDiv.innerText = 'Пароли не совпадают';
                errorDiv.style.display = 'block';
                setTimeout(() => errorDiv.style.display = 'none', 3000);
            }
            return;
        }
        if (p1.length < 3) {
            if (errorDiv) {
                errorDiv.innerText = 'Пароль минимум 3 символа';
                errorDiv.style.display = 'block';
            }
            return;
        }
        alert('Регистрация успешна! Теперь войдите.');
        bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
        new bootstrap.Modal(document.getElementById('loginModal')).show();
    });
}

const allParamsModal = document.getElementById('allParamsModal');
if (allParamsModal) {
    const advBrandSelect = document.getElementById('advBrandSelect');
    const advModelSelect = document.getElementById('advModelSelect');
    const advYearFrom = document.getElementById('advYearFrom');
    const advYearTo = document.getElementById('advYearTo');
    
    if (advBrandSelect && uniqueBrands) {
        uniqueBrands.forEach(brand => {
            const opt = document.createElement('option');
            opt.value = brand;
            opt.textContent = brand;
            advBrandSelect.appendChild(opt);
        });
    }
    
    if (advYearFrom && advYearTo) {
        for (let y = 2026; y >= 1980; y--) {
            advYearFrom.appendChild(new Option(y, y));
            advYearTo.appendChild(new Option(y, y));
        }
        advYearFrom.insertBefore(new Option('Не выбран', ''), advYearFrom.firstChild);
        advYearTo.insertBefore(new Option('Не выбран', ''), advYearTo.firstChild);
    }
    
    function updateAdvModels() {
        const brand = advBrandSelect ? advBrandSelect.value : '';
        if (advModelSelect) {
            advModelSelect.innerHTML = '<option value="">Любая модель</option>';
            if (brand && carsDatabase && carsDatabase.filter(c => c.brand === brand).length) {
                advModelSelect.disabled = false;
                const models = [...new Map(carsDatabase.filter(car => car.brand === brand).map(car => [car.model, car.model])).values()];
                models.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m;
                    opt.textContent = m;
                    advModelSelect.appendChild(opt);
                });
            } else {
                advModelSelect.disabled = true;
                advModelSelect.innerHTML = '<option value="">Сначала выберите марку</option>';
            }
        }
    }
    if (advBrandSelect) advBrandSelect.addEventListener('change', updateAdvModels);
    
    allParamsModal.addEventListener('show.bs.modal', function() {
        if (advBrandSelect && brandSelect) advBrandSelect.value = brandSelect.value;
        updateAdvModels();
        if (advModelSelect && modelSelect) advModelSelect.value = modelSelect.value;
        if (advYearFrom && yearFrom) advYearFrom.value = yearFrom.value;
        if (advYearTo && yearTo) advYearTo.value = yearTo.value;
        const advPriceFrom = document.getElementById('advPriceFrom');
        const advPriceTo = document.getElementById('advPriceTo');
        const advVolFrom = document.getElementById('advVolFrom');
        const advVolTo = document.getElementById('advVolTo');
        if (advPriceFrom && priceFrom) advPriceFrom.value = priceFrom.value;
        if (advPriceTo && priceTo) advPriceTo.value = priceTo.value;
        if (advVolFrom && volFrom) advVolFrom.value = volFrom.value;
        if (advVolTo && volTo) advVolTo.value = volTo.value;
    });
    
    const applyBtn = document.getElementById('applyAdvancedFilters');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const params = new URLSearchParams();
            const brand = advBrandSelect ? advBrandSelect.value : '';
            const model = advModelSelect ? advModelSelect.value : '';
            const yearFromVal = advYearFrom ? advYearFrom.value : '';
            const yearToVal = advYearTo ? advYearTo.value : '';
            const priceFromVal = document.getElementById('advPriceFrom')?.value || '';
            const priceToVal = document.getElementById('advPriceTo')?.value || '';
            const volFromVal = document.getElementById('advVolFrom')?.value || '';
            const volToVal = document.getElementById('advVolTo')?.value || '';
            const bodyType = document.getElementById('advBodyType')?.value || '';
            const drive = document.getElementById('advDrive')?.value || '';
            const transmission = document.getElementById('advTransmission')?.value || '';
            const color = document.getElementById('advColor')?.value || '';
            const condition = document.getElementById('advCondition')?.value || '';
            
            if (brand) params.append('brand', brand);
            if (model) params.append('model', model);
            if (yearFromVal) params.append('yearFrom', yearFromVal);
            if (yearToVal) params.append('yearTo', yearToVal);
            if (priceFromVal) params.append('priceFrom', priceFromVal);
            if (priceToVal) params.append('priceTo', priceToVal);
            if (volFromVal) params.append('volFrom', volFromVal);
            if (volToVal) params.append('volTo', volToVal);
            if (bodyType) params.append('bodyType', bodyType);
            if (drive) params.append('drive', drive);
            if (transmission) params.append('transmission', transmission);
            if (color) params.append('color', color);
            if (condition) params.append('condition', condition);
            
            bootstrap.Modal.getInstance(allParamsModal).hide();
            window.location.href = `catalog.html?${params.toString()}`;
        });
    }
}
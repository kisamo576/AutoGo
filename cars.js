// cars.js – база данных автомобилей (100 штук) с РЕАЛИСТИЧНЫМИ характеристиками

const carsDatabase = [];

const brands = [
    "BMW", "Mercedes", "Audi", "Toyota", "Hyundai",
    "Kia", "Volkswagen", "Volvo", "Lexus", "Porsche"
];

// Модели + реалистичные параметры для каждой марки
const modelsData = {
    "BMW": [
        { model: "X5", engine: "3.0", priceNew: 75000, priceUsed: 45000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "X3", engine: "2.0", priceNew: 55000, priceUsed: 35000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "3 Series", engine: "2.0", priceNew: 45000, priceUsed: 28000, bodyType: "Седан", drive: "Задний" },
        { model: "5 Series", engine: "2.0", priceNew: 60000, priceUsed: 38000, bodyType: "Седан", drive: "Задний" },
        { model: "X7", engine: "3.0", priceNew: 95000, priceUsed: 65000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "X1", engine: "1.5", priceNew: 40000, priceUsed: 25000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "X6", engine: "3.0", priceNew: 85000, priceUsed: 55000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "M3", engine: "3.0", priceNew: 90000, priceUsed: 60000, bodyType: "Седан", drive: "Задний" },
        { model: "M5", engine: "4.4", priceNew: 120000, priceUsed: 80000, bodyType: "Седан", drive: "Полный (4WD/AWD)" },
        { model: "i4", engine: "эл.", priceNew: 65000, priceUsed: 45000, bodyType: "Лифтбек", drive: "Задний" }
    ],
    "Mercedes": [
        { model: "E-Class", engine: "2.0", priceNew: 65000, priceUsed: 40000, bodyType: "Седан", drive: "Задний" },
        { model: "C-Class", engine: "1.5", priceNew: 50000, priceUsed: 32000, bodyType: "Седан", drive: "Задний" },
        { model: "GLC", engine: "2.0", priceNew: 60000, priceUsed: 38000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "S-Class", engine: "3.0", priceNew: 110000, priceUsed: 75000, bodyType: "Седан", drive: "Задний" },
        { model: "GLE", engine: "3.0", priceNew: 80000, priceUsed: 52000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "A-Class", engine: "1.3", priceNew: 35000, priceUsed: 22000, bodyType: "Хэтчбек", drive: "Передний" },
        { model: "GLA", engine: "1.3", priceNew: 40000, priceUsed: 25000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "GLS", engine: "3.0", priceNew: 95000, priceUsed: 65000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "CLA", engine: "1.3", priceNew: 38000, priceUsed: 24000, bodyType: "Седан", drive: "Передний" },
        { model: "EQE", engine: "эл.", priceNew: 75000, priceUsed: 50000, bodyType: "Седан", drive: "Задний" }
    ],
    "Audi": [
        { model: "Q7", engine: "3.0", priceNew: 72000, priceUsed: 48000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Q5", engine: "2.0", priceNew: 55000, priceUsed: 35000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "A6", engine: "2.0", priceNew: 62000, priceUsed: 40000, bodyType: "Седан", drive: "Передний" },
        { model: "A4", engine: "2.0", priceNew: 48000, priceUsed: 30000, bodyType: "Седан", drive: "Передний" },
        { model: "e-tron", engine: "эл.", priceNew: 80000, priceUsed: 55000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Q3", engine: "1.5", priceNew: 40000, priceUsed: 25000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "A3", engine: "1.5", priceNew: 35000, priceUsed: 22000, bodyType: "Хэтчбек", drive: "Передний" },
        { model: "A8", engine: "3.0", priceNew: 95000, priceUsed: 65000, bodyType: "Седан", drive: "Полный (4WD/AWD)" },
        { model: "Q8", engine: "3.0", priceNew: 85000, priceUsed: 58000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "RS7", engine: "4.0", priceNew: 110000, priceUsed: 75000, bodyType: "Лифтбек", drive: "Полный (4WD/AWD)" }
    ],
    "Toyota": [
        { model: "Camry", engine: "2.5", priceNew: 32000, priceUsed: 20000, bodyType: "Седан", drive: "Передний" },
        { model: "RAV4", engine: "2.0", priceNew: 35000, priceUsed: 22000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Corolla", engine: "1.8", priceNew: 25000, priceUsed: 15000, bodyType: "Седан", drive: "Передний" },
        { model: "Land Cruiser", engine: "3.3", priceNew: 95000, priceUsed: 65000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Highlander", engine: "3.5", priceNew: 48000, priceUsed: 30000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Prado", engine: "2.8", priceNew: 60000, priceUsed: 40000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Yaris", engine: "1.5", priceNew: 20000, priceUsed: 12000, bodyType: "Хэтчбек", drive: "Передний" },
        { model: "Supra", engine: "3.0", priceNew: 55000, priceUsed: 38000, bodyType: "Купе", drive: "Задний" },
        { model: "Avalon", engine: "3.5", priceNew: 42000, priceUsed: 26000, bodyType: "Седан", drive: "Передний" },
        { model: "C-HR", engine: "1.8", priceNew: 28000, priceUsed: 18000, bodyType: "Внедорожник / SUV", drive: "Передний" }
    ],
    "Hyundai": [
        { model: "Santa Fe", engine: "2.5", priceNew: 38000, priceUsed: 24000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Tucson", engine: "1.6", priceNew: 30000, priceUsed: 19000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Elantra", engine: "1.6", priceNew: 22000, priceUsed: 14000, bodyType: "Седан", drive: "Передний" },
        { model: "Sonata", engine: "2.0", priceNew: 28000, priceUsed: 17000, bodyType: "Седан", drive: "Передний" },
        { model: "Kona", engine: "1.6", priceNew: 26000, priceUsed: 16000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "i30", engine: "1.4", priceNew: 20000, priceUsed: 12000, bodyType: "Хэтчбек", drive: "Передний" },
        { model: "Palisade", engine: "3.8", priceNew: 50000, priceUsed: 32000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Accent", engine: "1.6", priceNew: 16000, priceUsed: 10000, bodyType: "Седан", drive: "Передний" },
        { model: "Venue", engine: "1.6", priceNew: 18000, priceUsed: 11000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Nexo", engine: "водород", priceNew: 60000, priceUsed: 40000, bodyType: "Внедорожник / SUV", drive: "Передний" }
    ],
    "Kia": [
        { model: "Sportage", engine: "2.0", priceNew: 28000, priceUsed: 18000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Sorento", engine: "2.5", priceNew: 35000, priceUsed: 22000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Ceed", engine: "1.6", priceNew: 20000, priceUsed: 13000, bodyType: "Хэтчбек", drive: "Передний" },
        { model: "Rio", engine: "1.6", priceNew: 15000, priceUsed: 9000, bodyType: "Седан", drive: "Передний" },
        { model: "Stinger", engine: "3.3", priceNew: 45000, priceUsed: 30000, bodyType: "Лифтбек", drive: "Задний" },
        { model: "Picanto", engine: "1.0", priceNew: 12000, priceUsed: 7000, bodyType: "Хэтчбек", drive: "Передний" },
        { model: "Optima", engine: "2.0", priceNew: 25000, priceUsed: 16000, bodyType: "Седан", drive: "Передний" },
        { model: "Niro", engine: "1.6", priceNew: 30000, priceUsed: 19000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Telluride", engine: "3.8", priceNew: 45000, priceUsed: 30000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "EV6", engine: "эл.", priceNew: 50000, priceUsed: 33000, bodyType: "Внедорожник / SUV", drive: "Задний" }
    ],
    "Volkswagen": [
        { model: "Tiguan", engine: "2.0", priceNew: 32000, priceUsed: 20000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Passat", engine: "2.0", priceNew: 30000, priceUsed: 19000, bodyType: "Седан", drive: "Передний" },
        { model: "Golf", engine: "1.4", priceNew: 25000, priceUsed: 15000, bodyType: "Хэтчбек", drive: "Передний" },
        { model: "Touareg", engine: "3.0", priceNew: 55000, priceUsed: 35000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Polo", engine: "1.6", priceNew: 12000, priceUsed: 12000, bodyType: "Седан", drive: "Передний" },
        { model: "Arteon", engine: "2.0", priceNew: 40000, priceUsed: 25000, bodyType: "Лифтбек", drive: "Передний" },
        { model: "ID.4", engine: "эл.", priceNew: 45000, priceUsed: 28000, bodyType: "Внедорожник / SUV", drive: "Задний" },
        { model: "ID.3", engine: "эл.", priceNew: 35000, priceUsed: 22000, bodyType: "Хэтчбек", drive: "Задний" },
        { model: "T-Roc", engine: "1.5", priceNew: 28000, priceUsed: 17000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Multivan", engine: "2.0", priceNew: 50000, priceUsed: 32000, bodyType: "Минивэн", drive: "Передний" }
    ],
    "Volvo": [
        { model: "XC90", engine: "2.0", priceNew: 65000, priceUsed: 42000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "XC60", engine: "2.0", priceNew: 52000, priceUsed: 34000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "S60", engine: "2.0", priceNew: 40000, priceUsed: 26000, bodyType: "Седан", drive: "Передний" },
        { model: "V60", engine: "2.0", priceNew: 42000, priceUsed: 27000, bodyType: "Универсал", drive: "Передний" },
        { model: "XC40", engine: "1.5", priceNew: 38000, priceUsed: 24000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "S90", engine: "2.0", priceNew: 55000, priceUsed: 36000, bodyType: "Седан", drive: "Передний" },
        { model: "V90", engine: "2.0", priceNew: 58000, priceUsed: 38000, bodyType: "Универсал", drive: "Полный (4WD/AWD)" },
        { model: "C40", engine: "эл.", priceNew: 55000, priceUsed: 36000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "EX30", engine: "эл.", priceNew: 45000, priceUsed: 30000, bodyType: "Внедорожник / SUV", drive: "Задний" },
        { model: "EX90", engine: "эл.", priceNew: 80000, priceUsed: 55000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" }
    ],
    "Lexus": [
        { model: "RX", engine: "3.5", priceNew: 55000, priceUsed: 36000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "NX", engine: "2.5", priceNew: 45000, priceUsed: 30000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "ES", engine: "2.5", priceNew: 48000, priceUsed: 32000, bodyType: "Седан", drive: "Передний" },
        { model: "LX", engine: "3.5", priceNew: 95000, priceUsed: 65000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "UX", engine: "2.0", priceNew: 38000, priceUsed: 25000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "LS", engine: "3.5", priceNew: 85000, priceUsed: 58000, bodyType: "Седан", drive: "Задний" },
        { model: "IS", engine: "2.0", priceNew: 42000, priceUsed: 28000, bodyType: "Седан", drive: "Задний" },
        { model: "RC", engine: "3.5", priceNew: 55000, priceUsed: 38000, bodyType: "Купе", drive: "Задний" },
        { model: "LC", engine: "5.0", priceNew: 95000, priceUsed: 65000, bodyType: "Купе", drive: "Задний" },
        { model: "GX", engine: "4.6", priceNew: 65000, priceUsed: 45000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" }
    ],
    "Porsche": [
        { model: "Cayenne", engine: "3.0", priceNew: 85000, priceUsed: 58000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Macan", engine: "2.0", priceNew: 65000, priceUsed: 45000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Panamera", engine: "2.9", priceNew: 95000, priceUsed: 65000, bodyType: "Лифтбек", drive: "Задний" },
        { model: "911", engine: "3.0", priceNew: 120000, priceUsed: 85000, bodyType: "Купе", drive: "Задний" },
        { model: "Taycan", engine: "эл.", priceNew: 90000, priceUsed: 60000, bodyType: "Седан", drive: "Полный (4WD/AWD)" },
        { model: "Boxster", engine: "2.0", priceNew: 65000, priceUsed: 45000, bodyType: "Кабриолет", drive: "Задний" },
        { model: "Cayman", engine: "2.0", priceNew: 68000, priceUsed: 48000, bodyType: "Купе", drive: "Задний" },
        { model: "718", engine: "2.0", priceNew: 70000, priceUsed: 50000, bodyType: "Купе", drive: "Задний" },
        { model: "Turbo", engine: "3.8", priceNew: 150000, priceUsed: 100000, bodyType: "Купе", drive: "Полный (4WD/AWD)" },
        { model: "GT3", engine: "4.0", priceNew: 170000, priceUsed: 120000, bodyType: "Купе", drive: "Задний" }
    ]
};

// Опции для авто
function getOptions(brand, price, isPremiumModel) {
    let opts = ['Подогрев сидений', 'Климат-контроль', 'Парктроник', 'Камера заднего вида'];
    if (price > 40000) opts.push('Кожаный салон', 'Люк');
    if (price > 60000) opts.push('Панорамная крыша', 'Адаптивный круиз-контроль', 'Премиум аудиосистема');
    if (brand === 'BMW' || brand === 'Porsche' || brand === 'Mercedes') {
        opts.push('Спортивные сиденья', 'Спортивная подвеска');
    }
    return opts.slice(0, 8);
}

// Цвета
const colorOptions = ['Чёрный', 'Белый', 'Серебристый', 'Красный', 'Синий', 'Серый'];

let id = 1;
for (const brand of brands) {
    const models = modelsData[brand];
    for (let i = 0; i < models.length; i++) {
        const data = models[i];
        const year = 2018 + Math.floor(Math.random() * 7); // 2018-2024
        // Цена зависит от года (чем новее, тем дороже)
        const yearFactor = (year - 2018) * 1500;
        let price = data.priceNew - yearFactor;
        price = Math.max(price, data.priceUsed);
        // Пробег
        const mileage = (20000 + Math.floor(Math.random() * 100000)).toLocaleString();
        const color = colorOptions[id % colorOptions.length];
        const condition = year >= 2022 ? 'Новый' : 'С пробегом';
        const vin = `${brand.slice(0,3).toUpperCase()}${id}${Math.random().toString(36).substring(2,8).toUpperCase()}`;
        const options = getOptions(brand, price, brand === 'Porsche' || brand === 'BMW');
        
        const description = `Продаётся в отличном состоянии. ${condition === 'Новый' ? 'Автомобиль с салона, не эксплуатировался.' : 'Первый владелец, не бит, не крашен.'} Полный сервис у официального дилера. Документы в порядке. Торг уместен после осмотра.`;
        
        const photo = `images/${brand.toLowerCase()}_${data.model.toLowerCase().replace(/ /g, '_').replace(/-/g, '_').replace(/\./g, '_')}.jpg`;
        
        const isPremium = (id <= 6);
        
        carsDatabase.push({
            id: id++,
            brand: brand,
            model: data.model,
            year: year,
            price: Math.round(price),
            engine: data.engine,
            mileage: mileage,
            description: description,
            photo: photo,
            isPremium: isPremium,
            bodyType: data.bodyType,
            drive: data.drive,
            transmission: i % 2 === 0 ? 'Автомат' : 'Робот / CVT',
            color: color,
            condition: condition,
            vin: vin,
            options: options
        });
    }
}

console.log("База данных загружена: " + carsDatabase.length + " автомобилей с РЕАЛИСТИЧНЫМИ характеристиками");
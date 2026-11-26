
const NO_PHOTO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240">
  <rect width="400" height="240" fill="#0F1729"/>
  <path d="M90 150 L112 108 Q122 98 140 98 L260 98 Q278 98 288 108 L310 150 L310 172 Q310 180 302 180 L290 180 Q290 192 278 192 Q266 192 266 180 L134 180 Q134 192 122 192 Q110 192 110 180 L98 180 Q90 180 90 172 Z" fill="none" stroke="#3D4C6E" stroke-width="5"/>
  <circle cx="130" cy="180" r="13" fill="#3D4C6E"/>
  <circle cx="278" cy="180" r="13" fill="#3D4C6E"/>
  <text x="200" y="218" font-family="Arial, sans-serif" font-size="15" fill="#6B7A9C" text-anchor="middle">Фото недоступно</text>
</svg>`;
const NO_PHOTO_IMG = `data:image/svg+xml,${encodeURIComponent(NO_PHOTO_SVG)}`;

const carsDatabase = [];

const brands = [
    "BMW", "Mercedes", "Audi", "Toyota", "Hyundai",
    "Kia", "Volkswagen", "Volvo", "Lexus", "Porsche"
];

const modelsData = {
    "BMW": [
        { model: "X5", engine: "3.0", priceNew: 75000, priceUsed: 45000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "X3", engine: "2.0", priceNew: 55000, priceUsed: 35000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "3 Series", engine: "2.0", priceNew: 45000, priceUsed: 28000, bodyType: "Седан", drive: "Задний" },
        { model: "5 Series", engine: "2.0", priceNew: 60000, priceUsed: 38000, bodyType: "Седан", drive: "Задний" },
        { model: "X7", engine: "3.0", priceNew: 95000, priceUsed: 65000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "X1", engine: "1.5", priceNew: 40000, priceUsed: 25000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "X6", engine: "3.0", priceNew: 85000, priceUsed: 55000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "M3", powertrain: "gasoline", engine: "3.0", priceNew: 90000, priceUsed: 60000, bodyType: "Седан", drive: "Задний" },
        { model: "M5", powertrain: "gasoline", engine: "4.4", priceNew: 120000, priceUsed: 80000, bodyType: "Седан", drive: "Полный (4WD/AWD)" },
        { model: "i4", engine: "эл.", priceNew: 65000, priceUsed: 45000, bodyType: "Лифтбек", drive: "Задний" },
        { model: "2 Series", engine: "2.0", priceNew: 42000, priceUsed: 26000, bodyType: "Купе", drive: "Задний" },
        { model: "4 Series", engine: "2.0", priceNew: 52000, priceUsed: 33000, bodyType: "Купе", drive: "Задний" },
        { model: "iX", engine: "эл.", priceNew: 88000, priceUsed: 60000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" }
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
        { model: "EQE", engine: "эл.", priceNew: 75000, priceUsed: 50000, bodyType: "Седан", drive: "Задний" },
        { model: "G-Class", engine: "4.0", priceNew: 140000, priceUsed: 95000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "CLS", engine: "3.0", priceNew: 78000, priceUsed: 50000, bodyType: "Лифтбек", drive: "Задний" },
        { model: "EQS", engine: "эл.", priceNew: 105000, priceUsed: 72000, bodyType: "Седан", drive: "Полный (4WD/AWD)" }
    ],
    "Audi": [
        { model: "Q7", powertrain: "diesel", engine: "3.0", priceNew: 72000, priceUsed: 48000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Q5", engine: "2.0", priceNew: 55000, priceUsed: 35000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "A6", engine: "2.0", priceNew: 62000, priceUsed: 40000, bodyType: "Седан", drive: "Передний" },
        { model: "A4", engine: "2.0", priceNew: 48000, priceUsed: 30000, bodyType: "Седан", drive: "Передний" },
        { model: "e-tron", engine: "эл.", priceNew: 80000, priceUsed: 55000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Q3", engine: "1.5", priceNew: 40000, priceUsed: 25000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "A3", engine: "1.5", priceNew: 35000, priceUsed: 22000, bodyType: "Хэтчбек", drive: "Передний" },
        { model: "A8", engine: "3.0", priceNew: 95000, priceUsed: 65000, bodyType: "Седан", drive: "Полный (4WD/AWD)" },
        { model: "Q8", engine: "3.0", priceNew: 85000, priceUsed: 58000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "RS7", engine: "4.0", priceNew: 110000, priceUsed: 75000, bodyType: "Лифтбек", drive: "Полный (4WD/AWD)" },
        { model: "A5", engine: "2.0", priceNew: 50000, priceUsed: 32000, bodyType: "Купе", drive: "Полный (4WD/AWD)" },
        { model: "TT", engine: "2.0", priceNew: 45000, priceUsed: 29000, bodyType: "Купе", drive: "Передний" },
        { model: "Q4 e-tron", engine: "эл.", priceNew: 58000, priceUsed: 39000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" }
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
        { model: "C-HR", engine: "1.8", priceNew: 28000, priceUsed: 18000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Hilux", powertrain: "diesel", engine: "2.8", priceNew: 45000, priceUsed: 29000, bodyType: "Пикап", drive: "Полный (4WD/AWD)" },
        { model: "Fortuner", engine: "2.8", priceNew: 50000, priceUsed: 33000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "bZ4X", engine: "эл.", priceNew: 46000, priceUsed: 30000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" }
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
        { model: "Nexo", engine: "водород", priceNew: 60000, priceUsed: 40000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Creta", engine: "1.6", priceNew: 23000, priceUsed: 14000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Ioniq 5", engine: "эл.", priceNew: 47000, priceUsed: 31000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Staria", engine: "2.2", priceNew: 36000, priceUsed: 23000, bodyType: "Минивэн", drive: "Передний" }
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
        { model: "EV6", engine: "эл.", priceNew: 50000, priceUsed: 33000, bodyType: "Внедорожник / SUV", drive: "Задний" },
        { model: "Seltos", engine: "1.6", priceNew: 24000, priceUsed: 15000, bodyType: "Внедорожник / SUV", drive: "Передний" },
        { model: "Carnival", engine: "3.5", priceNew: 40000, priceUsed: 26000, bodyType: "Минивэн", drive: "Передний" },
        { model: "Soul", engine: "1.6", priceNew: 19000, priceUsed: 12000, bodyType: "Хэтчбек", drive: "Передний" }
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
        { model: "Multivan", engine: "2.0", priceNew: 50000, priceUsed: 32000, bodyType: "Минивэн", drive: "Передний" },
        { model: "Jetta", engine: "1.4", priceNew: 23000, priceUsed: 14000, bodyType: "Седан", drive: "Передний" },
        { model: "Atlas", engine: "3.6", priceNew: 42000, priceUsed: 27000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "Taos", engine: "1.5", priceNew: 27000, priceUsed: 17000, bodyType: "Внедорожник / SUV", drive: "Передний" }
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
        { model: "EX90", engine: "эл.", priceNew: 80000, priceUsed: 55000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "XC70", engine: "2.0", priceNew: 44000, priceUsed: 28000, bodyType: "Универсал", drive: "Полный (4WD/AWD)" },
        { model: "S40", engine: "1.6", priceNew: 28000, priceUsed: 17000, bodyType: "Седан", drive: "Передний" },
        { model: "V40", engine: "1.6", priceNew: 29000, priceUsed: 18000, bodyType: "Хэтчбек", drive: "Передний" }
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
        { model: "GX", engine: "4.6", priceNew: 65000, priceUsed: 45000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "RZ", engine: "эл.", priceNew: 62000, priceUsed: 42000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "TX", engine: "2.4", priceNew: 58000, priceUsed: 39000, bodyType: "Внедорожник / SUV", drive: "Полный (4WD/AWD)" },
        { model: "LM", engine: "2.5", priceNew: 115000, priceUsed: 80000, bodyType: "Минивэн", drive: "Полный (4WD/AWD)" }
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
        { model: "GT3", engine: "4.0", priceNew: 170000, priceUsed: 120000, bodyType: "Купе", drive: "Задний" },
        { model: "911 Dakar", engine: "3.0", priceNew: 225000, priceUsed: 160000, bodyType: "Купе", drive: "Полный (4WD/AWD)" },
        { model: "Taycan Cross Turismo", engine: "эл.", priceNew: 98000, priceUsed: 68000, bodyType: "Универсал", drive: "Полный (4WD/AWD)" },
        { model: "Cayenne Coupe", engine: "3.0", priceNew: 92000, priceUsed: 63000, bodyType: "Купе", drive: "Полный (4WD/AWD)" }
    ]
};

function getOptions(brand, price, isPremiumModel) {
    let opts = ['Подогрев сидений', 'Климат-контроль', 'Парктроник', 'Камера заднего вида'];
    if (price > 40000) opts.push('Кожаный салон', 'Люк');
    if (price > 60000) opts.push('Панорамная крыша', 'Адаптивный круиз-контроль', 'Премиум аудиосистема');
    if (brand === 'BMW' || brand === 'Porsche' || brand === 'Mercedes') {
        opts.push('Спортивные сиденья', 'Спортивная подвеска');
    }
    return opts.slice(0, 8);
}

const colorOptions = ['Чёрный', 'Белый', 'Серебристый', 'Красный', 'Синий', 'Серый'];

let id = 1;
for (const brand of brands) {
    const models = modelsData[brand];
    for (let i = 0; i < models.length; i++) {
        const data = models[i];
        const year = 2018 + Math.floor(Math.random() * 7);
        const yearFactor = (year - 2018) * 1500;
        let price = data.priceNew - yearFactor;
        price = Math.max(price, data.priceUsed);
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
            powertrain: data.powertrain || (data.engine === "эл." ? "electric" : null),
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

// Фиксированные демонстрационные объявления. ID сохраняются в избранном.
const electrifiedListings = [
    {
        id: 1001, brand: 'Tesla', model: 'Model Y Long Range', powertrain: 'electric',
        engine: null, year: 2024, price: 39500, mileage: 28000, photo: 'tesla_model_y.jpg',
        bodyType: 'Внедорожник / SUV', drive: 'Полный', batteryKwh: 75, electricRangeKm: 500
    },
    {
        id: 1002, brand: 'BMW', model: 'i4 eDrive40', powertrain: 'electric',
        engine: null, year: 2023, price: 41900, mileage: 33000, photo: 'bmw_i4.jpg',
        bodyType: 'Лифтбек', drive: 'Задний', batteryKwh: 81, electricRangeKm: 490
    },
    {
        id: 1003, brand: 'Volkswagen', model: 'ID.3 Pro', powertrain: 'electric',
        engine: null, year: 2023, price: 23900, mileage: 38000, photo: 'volkswagen_id_3.jpg',
        bodyType: 'Хэтчбек', drive: 'Задний', batteryKwh: 58, electricRangeKm: 385
    },
    {
        id: 1004, brand: 'Kia', model: 'EV6 Long Range', powertrain: 'electric',
        engine: null, year: 2024, price: 36700, mileage: 24000, photo: 'kia_ev6.jpg',
        bodyType: 'Внедорожник / SUV', drive: 'Задний', batteryKwh: 77, electricRangeKm: 455
    },
    {
        id: 1005, brand: 'Audi', model: 'e-tron 55 quattro', powertrain: 'electric',
        engine: null, year: 2022, price: 33900, mileage: 49000, photo: 'audi_e_tron.jpg',
        bodyType: 'Внедорожник / SUV', drive: 'Полный', batteryKwh: 86, electricRangeKm: 350
    },
    {
        id: 1006, brand: 'Toyota', model: 'Corolla Hybrid', powertrain: 'hybrid',
        engine: '1.8', year: 2023, price: 21400, mileage: 37000, photo: 'toyota_corolla.jpg',
        bodyType: 'Седан', drive: 'Передний'
    },
    {
        id: 1007, brand: 'Toyota', model: 'RAV4 Hybrid', powertrain: 'hybrid',
        engine: '2.5', year: 2024, price: 32200, mileage: 24000, photo: 'toyota_rav4.jpg',
        bodyType: 'Внедорожник / SUV', drive: 'Полный'
    },
    {
        id: 1008, brand: 'Lexus', model: 'RX 350h', powertrain: 'hybrid',
        engine: '2.5', year: 2024, price: 52900, mileage: 19000, photo: 'lexus_rx.jpg',
        bodyType: 'Внедорожник / SUV', drive: 'Полный'
    },
    {
        id: 1009, brand: 'Toyota', model: 'RAV4 Plug-in Hybrid', powertrain: 'plugInHybrid',
        engine: '2.5', year: 2024, price: 41900, mileage: 19000, photo: 'toyota_rav4.jpg',
        bodyType: 'Внедорожник / SUV', drive: 'Полный', batteryKwh: 18, electricRangeKm: 68
    },
    {
        id: 1010, brand: 'Lexus', model: 'NX 450h+', powertrain: 'plugInHybrid',
        engine: '2.5', year: 2024, price: 48700, mileage: 22000, photo: 'lexus_nx.jpg',
        bodyType: 'Внедорожник / SUV', drive: 'Полный', batteryKwh: 18, electricRangeKm: 65
    },
    {
        id: 1011, brand: 'Volvo', model: 'XC60 Recharge', powertrain: 'plugInHybrid',
        engine: '2.0', year: 2023, price: 45200, mileage: 28000, photo: 'volvo_xc60.jpg',
        bodyType: 'Внедорожник / SUV', drive: 'Полный', batteryKwh: 19, electricRangeKm: 62
    },
    {
        id: 1012, brand: 'Hyundai', model: 'Tucson Plug-in Hybrid', powertrain: 'plugInHybrid',
        engine: '1.6', year: 2023, price: 29400, mileage: 31000, photo: 'hyundai_tucson.jpg',
        bodyType: 'Внедорожник / SUV', drive: 'Полный', batteryKwh: 14, electricRangeKm: 50
    }
];

const powertrainLabels = {
    gasoline: 'Бензин',
    diesel: 'Дизель',
    hybrid: 'Гибрид',
    plugInHybrid: 'Подключаемый гибрид',
    electric: 'Электро'
};

function matchesPowertrain(car, filter) {
    return !filter || car.powertrain === filter ||
        (filter === 'hybrid' && car.powertrain === 'plugInHybrid');
}

function formatCarEngine(car) {
    const label = powertrainLabels[car.powertrain];
    if (car.powertrain === 'electric') return 'Электромотор';
    return label ? label + ' · ' + car.engine + ' л' : car.engine + ' л';
}

carsDatabase.push(...electrifiedListings.map(car => ({
    ...car,
    mileage: car.mileage.toLocaleString('ru-RU'),
    photo: 'images/' + car.photo,
    description: 'Демонстрационное объявление. Фото иллюстрирует модель. Характеристики указаны для примера.',
    transmission: car.powertrain === 'electric' ? 'Одноступенчатая' : 'Автомат',
    condition: 'С пробегом',
    options: []
})));

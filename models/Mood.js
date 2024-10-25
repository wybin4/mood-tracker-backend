const mongoose = require('mongoose');
const { MoodType } = require('./MoodType');

// Схема для настроений
const MoodSchema = new mongoose.Schema({
    moodTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'MoodType', required: true }, // ID типа настроения
    synonym: { type: String, required: true } // Синоним
});

// Модель настроений
const Mood = mongoose.model('Mood', MoodSchema);

// Дефолтные значения синонимов
const defaultMoods = [
    { name: 'Злость', synonyms: ['Гнев', 'Обида', 'Раздражение', 'Бешенство', 'Расстройство'] },
    { name: 'Грусть', synonyms: ['Подавленность', 'Печаль', 'Упадок настроения'] },
    { name: 'Спокойствие', synonyms: ['Удовлетворенность', 'Мир', 'Облегчение', 'Порядок'] },
    { name: 'Радость', synonyms: ['Удовольствие', 'Наслаждение', 'Веселье', 'Развлечение', 'Азарт', 'Блаженство'] },
    { name: 'Усталость', synonyms: ['Изнеможение', 'Выгорание', 'Слабость', 'Истощение'] },
];

// Функция для инициализации дефолтных настроений в базе
async function initializeDefaultMoods() {
    try {
        const existingMoods = await Mood.find();
        if (existingMoods.length === 0) {
            const moodTypes = await MoodType.find(); // Получаем все типы настроений
            for (const mood of defaultMoods) {
                const moodType = moodTypes.find(type => type.name === mood.name); // Находим соответствующий тип
                if (moodType) {
                    // Создаем записи для каждого синонима
                    for (const synonym of mood.synonyms) {
                        await Mood.create({ moodTypeId: moodType._id, synonym }); // Сохраняем новое настроение
                    }
                } else {
                    console.warn(`Mood type for '${mood.name}' not found.`);
                }
            }
            console.log('Default moods have been added.');
        } else {
            console.log('Default moods already exist.');
        }
    } catch (error) {
        console.error('Error initializing default moods:', error);
    }
}

module.exports = { Mood, initializeDefaultMoods };

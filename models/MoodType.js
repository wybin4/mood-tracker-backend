const mongoose = require('mongoose');

const MoodTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

// Модель типов настроений
const MoodType = mongoose.model('MoodType', MoodTypeSchema);

// Функция для инициализации дефолтных типов настроений
async function initializeDefaultMoodTypes() {
  const defaultMoodTypes = [
    { name: 'Злость' },
    { name: 'Грусть' },
    { name: 'Спокойствие' },
    { name: 'Радость' },
    { name: 'Усталость' },
  ];

  try {
    const existingTypes = await MoodType.find();
    if (existingTypes.length === 0) {
      await MoodType.insertMany(defaultMoodTypes);
      console.log('Default mood types have been added.');
    } else {
      console.log('Default mood types already exist.');
    }
  } catch (error) {
    console.error('Error initializing default mood types:', error);
  }
}

module.exports = { MoodType, initializeDefaultMoodTypes };
